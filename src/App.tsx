import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CursorTracker from './components/CursorTracker';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logoutUser, 
  handleFirestoreError 
} from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Home as HomeIcon, 
  BookOpen, 
  BarChart3, 
  Settings, 
  ShoppingBag, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Flame, 
  CalendarDays, 
  Trophy, 
  Info,
  Clock, 
  Target,
  ArrowRight,
  HelpCircle,
  Activity,
  ChevronRight,
  Compass,
  ShieldAlert,
  X,
  Menu
} from 'lucide-react';
import { Chapter, UserProfile, SessionLog } from './types';
import { VISUAL_THEMES, CUSTOM_SOUNDS, ROTATIVE_STUDY_TIPS, DEFAULT_BANGLA_SYLLABUS, synthesizeGameSound } from './data';

// Modular child layout panels
import StatsPanel from './components/StatsPanel';
import ShopPanel from './components/ShopPanel';
import SyllabusImportPanel from './components/SyllabusImportPanel';
import SyllabusManager from './components/SyllabusManager';
import DetailsModal from './components/DetailsModal';
import RoutinePlan from './components/RoutinePlan';

type PageRoute = 'home' | 'syllabus' | 'stats' | 'routine' | 'shop';

function calculateStreak(logs: SessionLog[]) {
  if (logs.length === 0) return 0;
  const studyDays = Array.from(new Set(logs.map(log => log.date))).sort((a, b) => b.localeCompare(a));
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (studyDays[0] !== todayStr && studyDays[0] !== yesterdayStr) return 0;
  let streak = 0;
  let currentDateStr = studyDays[0];
  for (let i = 0; i < studyDays.length; i++) {
    const logDateStr = studyDays[i];
    const current = new Date(currentDateStr);
    const logDate = new Date(logDateStr);
    const diff = Math.floor((current.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      currentDateStr = logDateStr;
    } else {
      break;
    }
  }
  return streak;
}

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App core states
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: 'demo',
    email: '',
    coins: 100,
    experience: 0,
    level: 1,
    unlockedThemes: ['cosmic-slate', 'swiss-minimal'],
    unlockedSounds: ['synth-chime', 'retro-coin'],
    currentTheme: 'cosmic-slate',
    currentSound: 'synth-chime',
    startDate: new Date().toISOString().split('T')[0],
    examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    studyDays: 25,
    reviseDays: 5
  });
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Motivational rotative tip index
  const [tipIndex, setTipIndex] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // 1. Initial Auth listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        // Setup snapshot listeners for this user
        syncedListenUser(user);
      } else {
        setCurrentUser(null);
        // Fallback to local storage (Demo Mode)
        loadDemoData();
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Synced active database snapshot listeners
  const syncedListenUser = (user: User) => {
    // A. Profile listener
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, async (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Build default initial user profile document
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          coins: 120,
          experience: 15,
          level: 1,
          unlockedThemes: ['cosmic-slate', 'swiss-minimal'],
          unlockedSounds: ['synth-chime', 'retro-coin'],
          currentTheme: 'cosmic-slate',
          currentSound: 'synth-chime',
          startDate: new Date().toISOString().split('T')[0],
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          studyDays: 25,
          reviseDays: 5
        };
        await setDoc(profileRef, initialProfile);
      }
    });

    // B. Chapters collection listeners
    const chaptersRef = collection(db, 'users', user.uid, 'chapters');
    const unsubChapters = onSnapshot(chaptersRef, async (snap) => {
      const list: Chapter[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Chapter);
      });
      setChapters(list);
    });

    // C. Activity session logs collection listeners
    const logsRef = collection(db, 'users', user.uid, 'sessionLogs');
    const unsubLogs = onSnapshot(logsRef, (snap) => {
      const list: SessionLog[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SessionLog);
      });
      setSessionLogs(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      setAuthLoading(false);
    });

    // Keep listeners active
    return () => {
      unsubProfile();
      unsubChapters();
      unsubLogs();
    };
  };

  // Standalone offline-capable demo storage mapping
  const loadDemoData = () => {
    const localProfile = localStorage.getItem('pretest_planner_profile');
    const localChapters = localStorage.getItem('pretest_planner_chapters');
    const localLogs = localStorage.getItem('pretest_planner_logs');

    if (localProfile) {
      setUserProfile(JSON.parse(localProfile));
    } else {
      const initialProfile = {
        uid: 'demo',
        email: '',
        coins: 100,
        experience: 50,
        level: 2,
        unlockedThemes: ['cosmic-slate', 'swiss-minimal'],
        unlockedSounds: ['synth-chime', 'retro-coin'],
        currentTheme: 'cosmic-slate',
        currentSound: 'synth-chime',
        startDate: new Date().toISOString().split('T')[0],
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        studyDays: 25,
        reviseDays: 5
      };
      setUserProfile(initialProfile);
      localStorage.setItem('pretest_planner_profile', JSON.stringify(initialProfile));
    }

    if (localChapters) {
      setChapters(JSON.parse(localChapters));
    } else {
      const initialChapters: Chapter[] = [];
      setChapters(initialChapters);
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(initialChapters));
    }

    if (localLogs) {
      setSessionLogs(JSON.parse(localLogs));
    } else {
      const mockLogs: SessionLog[] = [];
      setSessionLogs(mockLogs);
      localStorage.setItem('pretest_planner_logs', JSON.stringify(mockLogs));
    }
  };

  // 3. Centralized Database write handler abstractions
  const handleUpdateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}`);
      }
    } else {
      localStorage.setItem('pretest_planner_profile', JSON.stringify(updated));
    }
  };

  const handleAddManualChapter = async (subj: string, sec: string, name: string, hrs: number, diff: 'easy' | 'medium' | 'hard') => {
    const targetCh: Partial<Chapter> = {
      subject: subj,
      section: sec,
      chapterName: name,
      estimatedHours: hrs,
      difficulty: diff,
      status: 'to study',
      studyProgress: 0,
      reviseProgress: 0
    };
    // Experience up logic
    let earnedXP = 15;
    let newXP = userProfile.experience + earnedXP;
    let newLevel = userProfile.level;
    if (newXP >= 100) {
      newXP = newXP % 100;
      newLevel += 1;
      synthesizeGameSound("success");
    }

    if (currentUser) {
      try {
        const docRef = doc(collection(db, 'users', currentUser.uid, 'chapters'));
        const fullChapter: Chapter = {
          ...targetCh,
          id: docRef.id,
          userId: currentUser.uid,
          phase: targetCh.phase || 'study',
          todos: targetCh.todos || [],
          attachments: targetCh.attachments || []
        } as Chapter;

        await setDoc(docRef, fullChapter);
        await updateDoc(doc(db, 'users', currentUser.uid), {
          experience: newXP,
          level: newLevel
        });
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters`);
      }
    } else {
      const docId = "demo_ch_" + Date.now();
      const fullChapter: Chapter = {
        ...targetCh,
        id: docId,
        userId: 'demo',
        phase: targetCh.phase || 'study',
        todos: targetCh.todos || [],
        attachments: targetCh.attachments || []
      } as Chapter;

      const updatedChapters = [fullChapter, ...chapters];
      setChapters(updatedChapters);
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updatedChapters));

      const updatedProfile = { ...userProfile, experience: newXP, level: newLevel };
      setUserProfile(updatedProfile);
      localStorage.setItem('pretest_planner_profile', JSON.stringify(updatedProfile));
    }
  };

  const handleUpdateChapter = async (chapterId: string, updates: Partial<Chapter>) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === chapterId) {
        const fullCh = { ...ch, ...updates };
        if (selectedChapter && selectedChapter.id === chapterId) {
          setSelectedChapter(fullCh);
        }
        return fullCh;
      }
      return ch;
    }));

    // If marked done or revised, reward coins
    if (updates.status === 'done' || updates.status === 'revised') {
      const activeCh = chapters.find(c => c.id === chapterId);
      if (activeCh && activeCh.status !== 'done' && activeCh.status !== 'revised') {
        const scaleMultiplier = activeCh.difficulty === 'hard' ? 2.0 : activeCh.difficulty === 'medium' ? 1.5 : 1.0;
        const reward = Math.round(activeCh.estimatedHours * 40 * scaleMultiplier);
        
        let newCoins = userProfile.coins + reward;
        let newXP = userProfile.experience + 25;
        let newLv = userProfile.level;
        if (newXP >= 100) {
          newXP = newXP % 100;
          newLv += 1;
        }
        handleUpdateUserProfile({ coins: newCoins, experience: newXP, level: newLv });
      }
    }

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'chapters', chapterId), updates);
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters/${chapterId}`);
      }
    } else {
      setTimeout(() => {
        const list = chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c);
        localStorage.setItem('pretest_planner_chapters', JSON.stringify(list));
      }, 0);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    setChapters(prev => prev.filter(c => c.id !== chapterId));
    if (selectedChapter?.id === chapterId) {
      setSelectedChapter(null);
    }

    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'chapters', chapterId));
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters/${chapterId}`);
      }
    } else {
      const list = chapters.filter(c => c.id !== chapterId);
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(list));
    }
  };

  const handleDeleteSubject = async (subject: string) => {
    const updated = chapters.filter(c => c.subject !== subject);
    setChapters(updated);
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        chapters.forEach(c => {
          if (c.subject === subject) {
            batch.delete(doc(db, 'users', currentUser.uid, 'chapters', c.id));
          }
        });
        await batch.commit();
      } catch (err) {}
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleDeleteSection = async (subject: string, section: string) => {
    const updated = chapters.filter(c => !(c.subject === subject && c.section === section));
    setChapters(updated);
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        chapters.forEach(c => {
          if (c.subject === subject && c.section === section) {
            batch.delete(doc(db, 'users', currentUser.uid, 'chapters', c.id));
          }
        });
        await batch.commit();
      } catch (err) {}
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleUpdateChaptersRoutine = async (chapterIds: string[], dayIndex: number | null) => {
    // Ensure we only try to update chapters that actually exist in memory to prevent phantom updates (which cause Firestore permission errors)
    const validIds = new Set(chapters.map(c => c.id));
    const safeChapterIds = chapterIds.filter(id => validIds.has(id));

    const updated = chapters.map(c => {
      if (safeChapterIds.includes(c.id)) {
        return { ...c, routineDayIndex: dayIndex };
      }
      return c;
    });
    setChapters(updated);

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        safeChapterIds.forEach(id => {
          batch.update(doc(db, 'users', currentUser.uid, 'chapters', id), { routineDayIndex: dayIndex });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters`);
      }
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleRenameSubject = async (oldSubject: string, newSubject: string) => {
    const updated = chapters.map(c => {
      if (c.subject === oldSubject) {
        return { ...c, subject: newSubject };
      }
      return c;
    });
    setChapters(updated);

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        chapters.forEach(c => {
          if (c.subject === oldSubject) {
            batch.update(doc(db, 'users', currentUser.uid, 'chapters', c.id), { subject: newSubject });
          }
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters`);
      }
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleRenameSection = async (subject: string, oldSection: string, newSection: string) => {
    const updated = chapters.map(c => {
      if (c.subject === subject && c.section === oldSection) {
        return { ...c, section: newSection };
      }
      return c;
    });
    setChapters(updated);

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        chapters.forEach(c => {
          if (c.subject === subject && c.section === oldSection) {
            batch.update(doc(db, 'users', currentUser.uid, 'chapters', c.id), { section: newSection });
          }
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters`);
      }
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleRenameChapter = async (chapterId: string, newName: string) => {
    const updated = chapters.map(c => {
      if (c.id === chapterId) {
        return { ...c, chapterName: newName };
      }
      return c;
    });
    setChapters(updated);
    if (selectedChapter && selectedChapter.id === chapterId) {
      setSelectedChapter({ ...selectedChapter, chapterName: newName });
    }

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'chapters', chapterId), { chapterName: newName });
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters/${chapterId}`);
      }
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleReorderSubjects = async (newSubjectOrder: string[]) => {
    const updated = chapters.map(c => ({
      ...c,
      subjectOrder: newSubjectOrder.indexOf(c.subject)
    }));
    setChapters(updated);
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        updated.forEach(c => {
          batch.update(doc(db, 'users', currentUser.uid, 'chapters', c.id), { subjectOrder: c.subjectOrder });
        });
        await batch.commit();
      } catch (err) {}
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleReorderSections = async (subject: string, newSectionOrder: string[]) => {
    const updated = chapters.map(c => {
      if (c.subject === subject) {
        return { ...c, sectionOrder: newSectionOrder.indexOf(c.section) };
      }
      return c;
    });
    setChapters(updated);
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        updated.forEach(c => {
          if (c.subject === subject) {
            batch.update(doc(db, 'users', currentUser.uid, 'chapters', c.id), { sectionOrder: c.sectionOrder });
          }
        });
        await batch.commit();
      } catch (err) {}
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleReorderChapters = async (subject: string, section: string, newChapterIds: string[]) => {
    const updated = chapters.map(c => {
      if (c.subject === subject && c.section === section) {
        return { ...c, chapterOrder: newChapterIds.indexOf(c.id) };
      }
      return c;
    });
    setChapters(updated);
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        updated.forEach(c => {
          if (c.subject === subject && c.section === section) {
            batch.update(doc(db, 'users', currentUser.uid, 'chapters', c.id), { chapterOrder: c.chapterOrder });
          }
        });
        await batch.commit();
      } catch (err) {}
    } else {
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updated));
    }
  };

  const handleImportBulkSyllabus = async (finalChapters: Partial<Chapter>[]) => {
    if (currentUser) {
      try {
        const batch = writeBatch(db);
         // Filter existing syllabus out of the pool to avoid excess duplication if desired, or wipe them.
         // We will prepend new entries directly.
         finalChapters.forEach(ch => {
           const docRef = doc(collection(db, 'users', currentUser.uid, 'chapters'));
           batch.set(docRef, {
            ...ch,
            id: docRef.id,
            userId: currentUser.uid,
            phase: 'study',
            status: 'to study',
            studyProgress: 0,
            reviseProgress: 0,
            todos: [],
            attachments: []
          });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/chapters`);
      }
    } else {
      const newItems = finalChapters.map((ch, idx) => ({
        ...ch,
        id: "demo_ch_ext_" + Date.now() + "_" + idx,
        userId: 'demo',
        phase: 'study',
        status: 'to study',
        studyProgress: 0,
        reviseProgress: 0,
        todos: [],
        attachments: []
      } as Chapter));

      const updatedChapters = [...newItems, ...chapters];
      setChapters(updatedChapters);
      localStorage.setItem('pretest_planner_chapters', JSON.stringify(updatedChapters));
    }
    setCurrentRoute('syllabus');
  };

  const handleTrackSessionTime = async (chapter: Chapter, durationMinutes: number) => {
    const newLog: SessionLog = {
      id: "log_" + Date.now(),
      userId: currentUser?.uid || 'demo',
      chapterId: chapter.id,
      chapterName: chapter.chapterName,
      subjectName: chapter.subject,
      durationMinutes,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    // Increment experience points by minutes estudied
    const xpReward = Math.min(45, Math.ceil(durationMinutes * 0.7));
    let newXP = userProfile.experience + xpReward;
    let newLv = userProfile.level;
    if (newXP >= 100) {
      newXP = newXP % 100;
      newLv += 1;
    }

    const updatedLogs = [newLog, ...sessionLogs];
    setSessionLogs(updatedLogs);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'sessionLogs', newLog.id), newLog);
        await updateDoc(doc(db, 'users', currentUser.uid), {
          experience: newXP,
          level: newLv
        });
      } catch (err) {
        handleFirestoreError(err, 'write' as any, `users/${currentUser.uid}/sessionLogs/${newLog.id}`);
      }
    } else {
      localStorage.setItem('pretest_planner_logs', JSON.stringify(updatedLogs));
      const updatedProfile = { ...userProfile, experience: newXP, level: newLv };
      setUserProfile(updatedProfile);
      localStorage.setItem('pretest_planner_profile', JSON.stringify(updatedProfile));
    }
  };

  // Gamification triggers
  const handleUnlockTheme = (themeId: string, price: number) => {
    const unlocked = [...userProfile.unlockedThemes, themeId];
    const balance = userProfile.coins - price;
    handleUpdateUserProfile({ unlockedThemes: unlocked, coins: balance, currentTheme: themeId });
  };

  const handleUnlockSound = (soundId: string, price: number) => {
    const unlocked = [...userProfile.unlockedSounds, soundId];
    const balance = userProfile.coins - price;
    handleUpdateUserProfile({ unlockedSounds: unlocked, coins: balance, currentSound: soundId });
  };

  const handlePurchaseShopItem = (goodieId: string, price: number) => {
    const balance = userProfile.coins - price;
    handleUpdateUserProfile({ coins: balance });
  };

  const handleManualReset = async () => {
    if (currentUser) {
      try {
        const batch = writeBatch(db);
        // Delete chapters
        const snapCh = await getDocs(collection(db, 'users', currentUser.uid, 'chapters'));
        snapCh.forEach(d => batch.delete(d.ref));
        await batch.commit();

        await updateDoc(doc(db, 'users', currentUser.uid), {
          coins: 100,
          experience: 0,
          level: 1,
          startDate: new Date().toISOString().split('T')[0]
        });
      } catch(e){}
    } else {
      localStorage.removeItem('pretest_planner_profile');
      localStorage.removeItem('pretest_planner_chapters');
      localStorage.removeItem('pretest_planner_logs');
      loadDemoData();
    }
    synthesizeGameSound("success");
  };

  // Determine current theme configurations
  const activeTheme = VISUAL_THEMES.find(t => t.id === userProfile.currentTheme) || VISUAL_THEMES[0];

  // Weighted progress calculation
  const totalWeight = chapters.reduce((acc, c) => acc + c.estimatedHours, 0) || 1;
  const currentWeight = chapters.reduce((acc, c) => {
    const p = c.phase === 'study' ? (c.studyProgress || 0) : (c.reviseProgress || 0);
    return acc + (c.estimatedHours * (p / 100));
  }, 0);
  const overallProgressPercentage = Math.round((currentWeight / totalWeight) * 100);

  // Calculated Days till exam
  const today = new Date();
  const examDay = new Date(userProfile.examDate);
  const diffTime = examDay.getTime() - today.getTime();
  const daysTillExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine routine day for today
  const startDay = new Date(userProfile.startDate);
  // Reset hours to midnight
  startDay.setHours(0,0,0,0);
  const todayMidnight = new Date();
  todayMidnight.setHours(0,0,0,0);
  const diffStart = todayMidnight.getTime() - startDay.getTime();
  const currentDayIndex = Math.max(1, Math.ceil(diffStart / (1000 * 60 * 60 * 24)) + 1);

  const todayChapters = chapters.filter(c => c.routineDayIndex === currentDayIndex);
  const todayCompletedChapters = todayChapters.filter(c => c.status === 'done' || c.status === 'revised');
  const todayProgressPct = todayChapters.length > 0 
    ? Math.round((todayCompletedChapters.length / todayChapters.length) * 100) 
    : 100;

  // Active study streak based on chapter completions
  const currentStreak = React.useMemo(() => calculateStreak(sessionLogs), [sessionLogs]);


  return (
    <div className={`flex h-screen ${activeTheme.bgColor} ${activeTheme.textColor} font-sans transition-all duration-300 overflow-hidden`}>
      <CursorTracker />
      
      {/* Sidebar Toggle Button (when hidden) */}
      <AnimatePresence>
        {!isSidebarVisible && (
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsSidebarVisible(true)} 
            className="fixed top-4 left-4 z-50 p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 1. Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarVisible && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`flex flex-col border-r border-slate-500/10 ${activeTheme.cardColor} relative z-40 shrink-0 overflow-hidden`}
          >
            {/* Sidebar Header/Logo */}
            <div className="flex items-center justify-between p-6 w-64">
              <div 
                onClick={() => setCurrentRoute('home')} 
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black transition-transform group-hover:rotate-6 shadow-indigo-500/20 shadow-lg shrink-0">
                  📈
                </div>
                <div className="block overflow-hidden whitespace-nowrap">
                  <h1 className="text-sm font-black font-display tracking-tight leading-none uppercase">Pre-Test</h1>
                  <span className="text-4xs font-mono opacity-50 tracking-widest leading-none">Planner Pro</span>
                </div>
              </div>
            </div>

            {/* Sidebar Links */}
            <nav className="flex-1 px-4 space-y-2 mt-4 w-64">
              <button
                onClick={() => { setCurrentRoute('home'); synthesizeGameSound("square"); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-4 transition-all ${
                  currentRoute === 'home' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
                title="Dashboard"
              >
                <HomeIcon className="w-4 h-4 shrink-0" />
                <span className="block">Dashboard</span>
              </button>
              <button
                onClick={() => { setCurrentRoute('syllabus'); synthesizeGameSound("square"); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-4 transition-all ${
                  currentRoute === 'syllabus' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
                title="Syllabus Index"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="block">Syllabus Index</span>
              </button>
              <button
                onClick={() => { setCurrentRoute('stats'); synthesizeGameSound("square"); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-4 transition-all ${
                  currentRoute === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
                title="Analytics"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="block">Analytics</span>
              </button>
              <button
                onClick={() => { setCurrentRoute('routine'); synthesizeGameSound("square"); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-4 transition-all ${
                  currentRoute === 'routine' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
                title="Routine"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="block">Routine</span>
              </button>
              <button
                onClick={() => { setCurrentRoute('shop'); synthesizeGameSound("square"); }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-4 transition-all ${
                  currentRoute === 'shop' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
                title="Gift Shop"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="block">Gift Shop</span>
              </button>
            </nav>

            {/* Sidebar Footer (Profile/Sync) */}
            <div className="p-4 mt-auto w-64">
              <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 space-y-3 block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {currentUser?.email?.substring(0, 1).toUpperCase() || "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate tracking-tight">{currentUser?.email || "Demo User"}</p>
                    <p className="text-4xs opacity-50 font-mono uppercase">Level {userProfile.level}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>


      {/* 2. Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-auto md:h-20 border-b border-slate-500/10 flex flex-wrap items-center justify-between px-4 md:px-8 py-3 bg-slate-500/2 backdrop-blur-md">
          <div className="flex items-center gap-4 md:gap-8 flex-wrap">
             <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-2 -ml-2 mr-2 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
               <Menu className="w-5 h-5 opacity-70" />
             </button>
             <div className="hidden md:flex items-center gap-2 bg-slate-500/5 px-4 py-2 rounded-xl border border-slate-500/10 transition-all hover:bg-slate-500/10">
               <Trophy className="w-4 h-4 text-amber-500" />
               <div className="flex flex-col">
                 <span className="text-4xs font-mono opacity-50 leading-none">Global Rank</span>
                 <span className="text-xs font-bold font-display">Lv.{userProfile.level}</span>
               </div>
             </div>
             <div className="flex items-center gap-3 bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10">
               <span className="text-lg">🪙</span>
               <div className="flex flex-col">
                 <span className="text-4xs font-mono text-amber-500 leading-none">Coins</span>
                 <span className="text-xs font-bold text-amber-500 font-display">{userProfile.coins}</span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold font-display">{currentStreak} Day Streak</span>
             </div>
             <div className="h-10 w-[1px] bg-slate-500/10 mx-2 hidden sm:block"></div>
             <button
               onClick={() => {
                 setShowResetConfirm(true);
                 synthesizeGameSound("square");
               }}
               className="p-2.5 rounded-xl bg-slate-500/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
               title="System Settings"
             >
               <Settings className="w-4 h-4" />
             </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 no-scrollbar scroll-smooth">
          {authLoading ? (
             <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
               <div className="h-40 bg-slate-500/10 rounded-3xl w-full"></div>
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-7 space-y-4">
                   <div className="h-8 bg-slate-500/10 rounded w-1/3"></div>
                   <div className="h-24 bg-slate-500/10 rounded-2xl w-full"></div>
                   <div className="h-24 bg-slate-500/10 rounded-2xl w-full"></div>
                 </div>
                 <div className="lg:col-span-5 space-y-4">
                   <div className="h-64 bg-slate-500/10 rounded-3xl w-full"></div>
                 </div>
               </div>
             </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 relative overflow-visible">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRoute}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3 }}
                >
                  {currentRoute === 'home' && (
                    <div className="space-y-8">
                  {/* Hero Section */}
                  <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-500/10 pb-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black font-display tracking-tight leading-tight">
                         Good Morning! <br />
                         <span className="text-indigo-500">Day {currentDayIndex}</span> is your Study Phase.
                       </h2>
                       <p className="text-sm opacity-60 max-w-lg leading-relaxed">
                         You have {daysTillExam} days left until your Pre-Test exam starts. 
                         Today's focus is on completing {todayChapters.length} revision units to maintain your progress curve.
                       </p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <div className={`p-4 md:p-6 rounded-3xl flex-1 ${activeTheme.cardColor} border border-slate-500/10 flex flex-col items-center gap-2 shadow-sm`}>
                          <p className="text-xl md:text-2xl font-black font-display">{todayProgressPct}%</p>
                          <p className="text-4xs font-mono font-bold uppercase opacity-50 tracking-wider">Today's Goal</p>
                       </div>
                       <div className={`p-4 md:p-6 rounded-3xl flex-1 ${activeTheme.cardColor} border border-slate-500/10 flex flex-col items-center gap-2 shadow-sm`}>
                          <p className="text-xl md:text-2xl font-black font-display text-emerald-500">{chapters.filter(c => c.status === 'done' || c.status === 'revised').length}</p>
                          <p className="text-4xs font-mono font-bold uppercase opacity-50 tracking-wider text-emerald-500/70">Units Done</p>
                       </div>
                    </div>
                  </div>

                  {/* Main Home Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Tasks Column */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-black font-display tracking-tight uppercase flex items-center gap-3">
                           <BookOpen className="w-5 h-5 text-indigo-500" />
                           Daily Targets
                         </h3>
                         <button onClick={() => setCurrentRoute('routine')} className="text-xs font-bold text-indigo-500 hover:underline">Edit Routine</button>
                      </div>

                      <div className="space-y-3">
                        {todayChapters.map((ch, idx) => (
                          <motion.div 
                            key={ch.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedChapter(ch)}
                            className={`p-5 rounded-2xl border border-slate-500/10 ${activeTheme.cardColor} hover:border-indigo-500/50 cursor-pointer flex justify-between items-center group shadow-sm hover:shadow-lg`}
                          >
                            <div className="space-y-1.5 pr-4 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                 <h4 className="font-bold text-sm font-display tracking-tight leading-tight">{ch.chapterName}</h4>
                                 <span className="px-1.5 py-0.5 rounded-md bg-slate-500/10 text-[9px] font-mono font-bold uppercase opacity-60 mt-0.5">{ch.difficulty}</span>
                               </div>
                               <p className="text-xs opacity-50 font-mono tracking-tight">{ch.subject} • {ch.section}</p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                               <div className="text-right">
                                  <p className="text-xs font-bold text-indigo-500 uppercase font-display">{ch.status}</p>
                                  <p className="text-4xs opacity-40 font-mono">{ch.estimatedHours}h Estimated</p>
                               </div>
                               <div className="w-8 h-8 rounded-full bg-slate-500/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ChevronRight className="w-4 h-4" />
                               </div>
                            </div>
                          </motion.div>
                        ))}

                        {todayChapters.length === 0 && (
                          <div className={`p-12 text-center border-2 border-dashed border-slate-500/10 rounded-3xl space-y-4`}>
                             <div className="w-16 h-16 bg-slate-500/5 rounded-full flex items-center justify-center mx-auto">
                               <CalendarDays className="w-8 h-8 opacity-20" />
                             </div>
                             <div className="space-y-1">
                               <p className="font-bold font-display opacity-80">No tasks assigned for today</p>
                               <p className="text-xs opacity-50 max-w-xs mx-auto leading-relaxed">Your routine is currently empty for today. Use the Routine Maker to assign chapters from your syllabus.</p>
                             </div>
                             <button
                               onClick={() => setCurrentRoute('routine')}
                               className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                             >
                               Build My Routine
                             </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Column */}
                    <div className="lg:col-span-5 space-y-8">
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.5, delay: 0.2 }}
                         className={`p-6 rounded-3xl ${activeTheme.cardColor} border border-slate-500/10 space-y-6 shadow-sm`}
                       >
                          <div className="flex items-center justify-between border-b border-slate-500/10 pb-4">
                             <h4 className="font-black text-sm font-display tracking-tight uppercase">Quick Analytics</h4>
                             <Activity className="w-4 h-4 opacity-50" />
                          </div>
                          <div className="space-y-4">
                             <div className="space-y-1.5">
                               <div className="flex justify-between text-4xs font-mono font-bold uppercase opacity-50">
                                 <span>Overall Preparation</span>
                                 <span>{overallProgressPercentage}%</span>
                               </div>
                               <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${overallProgressPercentage}%` }} />
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                                  <p className="text-lg font-black font-display leading-none">{chapters.length}</p>
                                  <p className="text-4xs opacity-50 font-mono uppercase mt-1">Total Units</p>
                               </div>
                               <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                  <p className="text-lg font-black font-display text-emerald-500 leading-none">{chapters.filter(c => c.status === 'done' || c.status === 'revised').length}</p>
                                  <p className="text-4xs opacity-50 font-mono uppercase text-emerald-500/70 mt-1">Units Fixed</p>
                               </div>
                             </div>
                          </div>
                       </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {currentRoute === 'syllabus' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-end border-b border-slate-500/10 pb-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black font-display tracking-tight text-inherit uppercase">Syllabus Index</h2>
                      <p className="text-sm opacity-60 max-w-lg">Central control for all academic disciplines. Use the reorder handles to organize your syllabus.</p>
                    </div>
                  </div>
                  <SyllabusManager
                    chapters={chapters}
                    onAddManualChapter={handleAddManualChapter}
                    onSelectChapter={setSelectedChapter}
                    onDeleteChapter={handleDeleteChapter}
                    onRenameSubject={handleRenameSubject}
                    onRenameSection={handleRenameSection}
                    onRenameChapter={handleRenameChapter}
                    onDeleteSubject={handleDeleteSubject}
                    onDeleteSection={handleDeleteSection}
                    onReorderSubjects={handleReorderSubjects}
                    onReorderSections={handleReorderSections}
                    onReorderChapters={handleReorderChapters}
                    currentTheme={activeTheme}
                  />
                </div>
              )}

              {currentRoute === 'stats' && (
                <div className="space-y-8">
                   <div className="border-b border-slate-500/10 pb-8 space-y-2">
                    <h2 className="text-3xl font-black font-display tracking-tight text-inherit uppercase">Analytics Dashboard</h2>
                    <p className="text-sm opacity-60">Performance mapping and burnup trend analysis based on your weighted preparation speed.</p>
                  </div>
                  <StatsPanel 
                    userProfile={userProfile}
                    chapters={chapters}
                    sessionLogs={sessionLogs}
                    currentTheme={activeTheme}
                  />
                </div>
              )}

              {currentRoute === 'routine' && (
                <div className="space-y-8">
                  <div className="border-b border-slate-500/10 pb-8 space-y-2">
                    <h2 className="text-3xl font-black font-display tracking-tight text-inherit uppercase">Routine Engine</h2>
                    <p className="text-sm opacity-60">Architect your daily mission schedule. Drag and drop units to assign them to specific days in your cycle.</p>
                  </div>
                  <RoutinePlan 
                    userProfile={userProfile}
                    chapters={chapters}
                    onUpdateUserProfile={handleUpdateUserProfile}
                    onUpdateChaptersRoutine={handleUpdateChaptersRoutine}
                    currentTheme={activeTheme}
                  />
                  <div className={`p-8 rounded-3xl ${activeTheme.cardColor} border border-slate-500/10 shadow-lg`} id="syllabus-import-box">
                    <SyllabusImportPanel 
                      onImportConfirmed={handleImportBulkSyllabus}
                      currentTheme={activeTheme}
                    />
                  </div>
                </div>
              )}

              {currentRoute === 'shop' && (
                <div className="space-y-8">
                  <div className="border-b border-slate-500/10 pb-8 space-y-2">
                    <h2 className="text-3xl font-black font-display tracking-tight text-inherit uppercase">Customization Shop</h2>
                    <p className="text-sm opacity-60">Exchange your hard-earned study coins for premium themes, auditory perks, and digital collectibles.</p>
                  </div>
                  <ShopPanel 
                    userProfile={userProfile}
                    onUnlockTheme={handleUnlockTheme}
                    onSetTheme={(themeId) => handleUpdateUserProfile({ currentTheme: themeId })}
                    onUnlockSound={handleUnlockSound}
                    onSetSound={(soundId) => handleUpdateUserProfile({ currentSound: soundId })}
                    onPurchaseShopItem={handlePurchaseShopItem}
                    currentTheme={activeTheme}
                    ownedThemeIds={userProfile.unlockedThemes || ['cosmic-slate']}
                    ownedSoundIds={userProfile.unlockedSounds || ['synth-chime']}
                  />
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* System Settings Portal Overlay */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className={`w-full max-w-sm p-6 rounded-3xl ${activeTheme.cardColor} border border-slate-500/20 shadow-2xl animate-scale-in space-y-6`}>
              
              <div className="flex justify-between items-center border-b border-slate-500/10 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xl font-black font-display uppercase tracking-tight">Settings</h3>
                </div>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="p-2 bg-slate-500/10 hover:bg-slate-500/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="space-y-4">
                {/* Account Section */}
                <div className="p-4 bg-slate-500/5 rounded-2xl text-left space-y-3">
                  <h4 className="font-bold text-xs font-mono uppercase opacity-70">Account</h4>
                  {currentUser ? (
                    <div className="space-y-3">
                      <p className="text-xs truncate font-medium">{currentUser.email}</p>
                      <button 
                        onClick={() => { logoutUser(); setShowResetConfirm(false); }}
                        className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs opacity-60">You are currently in Demo mode.</p>
                      <button 
                        onClick={async () => { await signInWithGoogle(); setShowResetConfirm(false); }}
                        className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Log In
                      </button>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="p-4 bg-slate-500/5 rounded-2xl text-left space-y-3">
                   <div className="flex items-center gap-2 text-rose-500 mb-1">
                     <ShieldAlert className="w-4 h-4" />
                     <h4 className="font-bold text-xs font-mono uppercase">Danger Zone</h4>
                   </div>
                   <p className="text-xs opacity-60 leading-relaxed">This action permanently deletes all subjects, chapters, and progress logs. This cannot be undone.</p>
                   <button
                     onClick={() => {
                       handleManualReset();
                       setShowResetConfirm(false);
                     }}
                     className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 mt-2"
                   >
                     Wipe Everything
                   </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      
      {/* 4. Details Modal */}
      {selectedChapter && (
        <DetailsModal 
          chapter={selectedChapter}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onTrackSessionTime={handleTrackSessionTime}
          currentTheme={activeTheme}
          onClose={() => setSelectedChapter(null)}
        />
      )}
    </div>
  );
}
