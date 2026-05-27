import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, ChevronRight, ChevronDown, BookOpen, SlidersHorizontal, 
  Trash2, Trash, Pencil, Check, X, AlertCircle, GripVertical,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chapter } from '../types';

interface SyllabusManagerProps {
  chapters: Chapter[];
  onAddManualChapter: (subj: string, sec: string, name: string, hrs: number, diff: 'easy' | 'medium' | 'hard') => void;
  onSelectChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onRenameSubject?: (oldName: string, newName: string) => void;
  onRenameSection?: (subject: string, oldName: string, newName: string) => void;
  onRenameChapter?: (chapterId: string, newName: string) => void;
  onDeleteSubject?: (subject: string) => void;
  onDeleteSection?: (subject: string, section: string) => void;
  onReorderSubjects?: (newSubjectOrder: string[]) => void;
  onReorderSections?: (subject: string, newSectionOrder: string[]) => void;
  onReorderChapters?: (subject: string, section: string, newChapterIds: string[]) => void;
  currentTheme: any;
}

function SortableItem({ id, children, className, handleClass = "", style: customStyle }: { id: string, children: React.ReactNode, className?: string, handleClass?: string, key?: any, style?: React.CSSProperties }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    ...customStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} group`}>
      <div 
        {...attributes} 
        {...listeners} 
        className={`cursor-grab active:cursor-grabbing z-20 flex items-center justify-center ${handleClass}`}
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      {children}
    </div>
  );
}

export default function SyllabusManager({ 
  chapters, onAddManualChapter, onSelectChapter, onDeleteChapter, 
  onRenameSubject, onRenameSection, onRenameChapter,
  onDeleteSubject, onDeleteSection,
  onReorderSubjects, onReorderSections, onReorderChapters,
  currentTheme 
}: SyllabusManagerProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newChapter, setNewChapter] = useState('');
  const [newHrs, setNewHrs] = useState(2);
  const [newDifficulty, setNewDifficulty] = useState<'easy'|'medium'|'hard'>('medium');

  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempSectionName, setTempSectionName] = useState('');
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [tempChapterName, setTempChapterName] = useState('');

  const [deleteSubjConfirm, setDeleteSubjConfirm] = useState<string | null>(null);
  const [deleteSecConfirm, setDeleteSecConfirm] = useState<{subject: string, section: string} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const synthesizeGameSound = (type: "square" | "success" | "chime") => {};

  const filteredChapters = chapters.filter(c => {
    const matchesSearch = c.chapterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.section.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || c.subject === subjectFilter;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const subjectsList = Array.from(new Set(chapters.map(c => c.subject)));

  const groupedHierarchy = useMemo(() => {
    const hierarchy: Record<string, Record<string, Chapter[]>> = {};
    
    // Sort chapters initially by their order fields
    const sortedChapters = [...filteredChapters].sort((a, b) => {
      if ((a.subjectOrder ?? 0) !== (b.subjectOrder ?? 0)) return (a.subjectOrder ?? 0) - (b.subjectOrder ?? 0);
      if ((a.sectionOrder ?? 0) !== (b.sectionOrder ?? 0)) return (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0);
      return (a.chapterOrder ?? 0) - (b.chapterOrder ?? 0);
    });

    sortedChapters.forEach(c => {
      if (!hierarchy[c.subject]) hierarchy[c.subject] = {};
      if (!hierarchy[c.subject][c.section]) hierarchy[c.subject][c.section] = [];
      hierarchy[c.subject][c.section].push(c);
    });

    return hierarchy;
  }, [filteredChapters]);

  const sortedSubjects = useMemo(() => {
    return Object.keys(groupedHierarchy).sort((a, b) => {
      const aHead = Object.values(groupedHierarchy[a])[0]?.[0];
      const bHead = Object.values(groupedHierarchy[b])[0]?.[0];
      return (aHead?.subjectOrder ?? 0) - (bHead?.subjectOrder ?? 0);
    });
  }, [groupedHierarchy]);

  const toggleSubjectCollapse = (subj: string) => {
    setCollapsedSubjects(prev => ({ ...prev, [subj]: !prev[subj] }));
    synthesizeGameSound("square");
  };

  const toggleSectionCollapse = (secKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
    synthesizeGameSound("square");
  };

  const moveSubject = (subject: string, direction: 'up' | 'down') => {
    const currentIndex = sortedSubjects.indexOf(subject);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < sortedSubjects.length) {
      const newOrder = arrayMove(sortedSubjects, currentIndex, newIndex) as string[];
      if (onReorderSubjects) onReorderSubjects(newOrder);
      synthesizeGameSound("square");
    }
  };

  const moveSection = (subject: string, section: string, direction: 'up' | 'down') => {
    const sectionKeys = Object.keys(groupedHierarchy[subject]);
    const currentIndex = sectionKeys.indexOf(section);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < sectionKeys.length) {
      const newOrder = arrayMove(sectionKeys, currentIndex, newIndex) as string[];
      if (onReorderSections) onReorderSections(subject, newOrder);
      synthesizeGameSound("square");
    }
  };

  const moveChapterItem = (chapter: Chapter, direction: 'up' | 'down') => {
    const sectionChapters = groupedHierarchy[chapter.subject][chapter.section];
    const currentIndex = sectionChapters.findIndex(c => c.id === chapter.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < sectionChapters.length) {
      const newOrder = arrayMove(sectionChapters, currentIndex, newIndex).map((c: any) => c.id);
      if (onReorderChapters) onReorderChapters(chapter.subject, chapter.section, newOrder);
      synthesizeGameSound("square");
    }
  };

  const handleCreateChapterSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject && newSection && newChapter) {
      onAddManualChapter(newSubject, newSection, newChapter, newHrs, newDifficulty);
      setNewChapter('');
      setShowAddModal(false);
      synthesizeGameSound("success");
    }
  };

  const startRenameSubject = (subj: string) => {
    setEditingSubject(subj);
    setTempSubjectName(subj);
    synthesizeGameSound("square");
  };

  const handleSaveSubjectRename = (oldSubj: string) => {
    const trimmed = tempSubjectName.trim();
    if (trimmed && trimmed !== oldSubj) {
      if (onRenameSubject) onRenameSubject(oldSubj, trimmed);
      synthesizeGameSound("success");
    }
    setEditingSubject(null);
  };

  const startRenameSection = (subj: string, sec: string) => {
    setEditingSection(`${subj}_${sec}`);
    setTempSectionName(sec);
    synthesizeGameSound("square");
  };

  const handleSaveSectionRename = (subj: string, oldSec: string) => {
    const trimmed = tempSectionName.trim();
    if (trimmed && trimmed !== oldSec) {
      if (onRenameSection) onRenameSection(subj, oldSec, trimmed);
      synthesizeGameSound("success");
    }
    setEditingSection(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('subj:')) {
      const oldIndex = sortedSubjects.indexOf(activeId.replace('subj:', ''));
      const newIndex = sortedSubjects.indexOf(overId.replace('subj:', ''));
      const newOrder = arrayMove(sortedSubjects, oldIndex, newIndex) as string[];
      if (onReorderSubjects) onReorderSubjects(newOrder);
    } 
    else if (activeId.startsWith('sec:')) {
      const parts = activeId.split('|');
      const subject = parts[1];
      const sectionKeys = Object.keys(groupedHierarchy[subject]);
      const oldIndex = sectionKeys.indexOf(activeId.split('|')[2]);
      const newIndex = sectionKeys.indexOf(overId.split('|')[2]);
      const newOrder = arrayMove(sectionKeys, oldIndex, newIndex);
      if (onReorderSections) onReorderSections(subject, newOrder);
    } 
    else if (activeId.startsWith('ch:')) {
      const chId = activeId.replace('ch:', '');
      const overChId = overId.replace('ch:', '');
      const chapter = chapters.find(c => c.id === chId);
      if (!chapter) return;

      const subject = chapter.subject;
      const section = chapter.section;
      const sectionChapters = groupedHierarchy[subject][section];
      const oldIndex = sectionChapters.findIndex(c => c.id === chId);
      const newIndex = sectionChapters.findIndex(c => c.id === overChId);
      
      const newOrder = arrayMove(sectionChapters, oldIndex, newIndex).map((c: Chapter) => c.id);
      if (onReorderChapters) onReorderChapters(subject, section, newOrder);
    }
    synthesizeGameSound("square");
  };

  const statusFilters = [
    { id: 'all', label: 'All Statuses' },
    { id: 'to study', label: 'To Study' },
    { id: 'in progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
    { id: 'to revise', label: 'To Revise' },
    { id: 'in revision', label: 'In Revision' }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-500/5 border border-slate-500/10 focus:outline-none focus:border-indigo-500 text-inherit"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 space-y-4">
        <div className="space-y-2">
          <p className="text-4xs font-mono font-bold uppercase opacity-50">Filter by Progress</p>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === f.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-slate-500/20 hover:bg-slate-500/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hierarchy */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedSubjects.map(s => `subj:${s}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sortedSubjects.map((subject, sIdx) => (
              <SortableItem 
                 key={subject} 
                 id={`subj:${subject}`} 
                 className={`p-4 rounded-2xl border border-slate-500/10 bg-slate-500/2 space-y-3 relative flex flex-col animate-slide-up`} 
                 style={{ animationDelay: `${sIdx * 0.05}s` }}
                 handleClass="absolute left-4 top-4 w-6 h-6 rounded-md border border-slate-500/20 bg-white/5 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-500/10 pb-3 pl-8 gap-3 sm:gap-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleSubjectCollapse(subject); }} className="p-1 hover:bg-slate-500/10 rounded transition-colors group">
                      {collapsedSubjects[subject] ? <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
                    </button>
                    {editingSubject === subject ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveSubjectRename(subject); }} className="flex items-center gap-2">
                        <input autoFocus value={tempSubjectName} onChange={e => setTempSubjectName(e.target.value)} className="bg-slate-500/10 rounded-lg px-3 py-1 text-sm outline-none border border-indigo-500/50 font-bold max-w-[140px] sm:max-w-none" />
                        <button type="submit" className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-lg transition-colors"><Check className="w-4 h-4"/></button>
                        <button type="button" onClick={() => setEditingSubject(null)} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 group/title">
                        <h3 className="font-display font-black text-sm uppercase tracking-tight break-all">
                          {subject}
                        </h3>
                        <button 
                          onClick={() => startRenameSubject(subject)}
                          className="opacity-40 hover:opacity-100 transition-opacity p-1 bg-slate-500/5 rounded-md border border-slate-500/10"
                          title="Rename Subject"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1 border-l border-slate-500/10 pl-2">
                       <button 
                         disabled={sIdx === 0}
                         onClick={() => moveSubject(subject, 'up')}
                         className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10 transition-colors"
                       >
                         <ArrowUp className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         disabled={sIdx === sortedSubjects.length - 1}
                         onClick={() => moveSubject(subject, 'down')}
                         className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10 transition-colors"
                       >
                         <ArrowDown className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    {deleteSubjConfirm === subject ? (
                      <div className="flex items-center gap-2 animate-scale-in">
                        <span className="text-4xs font-bold text-rose-500 uppercase">Delete?</span>
                        <button onClick={() => { if (onDeleteSubject) onDeleteSubject(subject); setDeleteSubjConfirm(null); }} className="px-2 py-0.5 bg-rose-600 text-white text-4xs rounded font-bold">Yes</button>
                        <button onClick={() => setDeleteSubjConfirm(null)} className="px-2 py-0.5 bg-slate-500/20 text-inherit text-4xs rounded font-bold">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteSubjConfirm(subject)} className="p-1 rounded-lg text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-mono opacity-50 bg-slate-500/10 px-2 py-1 rounded-lg mr-10 leading-none whitespace-nowrap self-start sm:self-auto ml-10 sm:ml-0 mt-2 sm:mt-0">
                    {Object.values(groupedHierarchy[subject]).flat().length} Chapters
                  </span>
                </div>

                <AnimatePresence>
                  {!collapsedSubjects[subject] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pl-1 overflow-hidden"
                    >
                      <SortableContext items={Object.keys(groupedHierarchy[subject]).map(sec => `sec:${subject}|${sec}`)} strategy={verticalListSortingStrategy}>
                        {Object.keys(groupedHierarchy[subject]).map((section, secIdx) => {
                          const secKey = `${subject}_${section}`;
                          const secId = `sec:${subject}|${section}`;
                          const sectionKeys = Object.keys(groupedHierarchy[subject]);
                          return (
                          <SortableItem key={section} id={secId} className="space-y-2 relative flex flex-col group/section" handleClass="absolute left-0 top-1 w-5 h-5 opacity-40 hover:opacity-100 rounded-md border border-slate-500/10 bg-slate-500/5 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pl-7 border-l-2 border-indigo-500/20 group-hover/section:border-indigo-500 transition-colors gap-2 sm:gap-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); toggleSectionCollapse(secKey); }} className="p-0.5 hover:bg-slate-500/10 rounded transition-colors group relative z-10 shrink-0">
                                  {collapsedSections[secKey] ? <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />}
                                </button>
                                {editingSection === secKey ? (
                                  <form onSubmit={(e) => { e.preventDefault(); handleSaveSectionRename(subject, section); }} className="flex items-center gap-2 relative z-10">
                                    <input autoFocus value={tempSectionName} onChange={e => setTempSectionName(e.target.value)} className="bg-slate-500/10 rounded-lg px-2 py-0.5 text-xs outline-none border border-indigo-500/50 font-bold max-w-[120px] sm:max-w-none shrink-0" />
                                    <button type="submit" className="text-emerald-500 shrink-0"><Check className="w-4 h-4"/></button>
                                    <button type="button" onClick={() => setEditingSection(null)} className="text-rose-500 shrink-0"><X className="w-4 h-4"/></button>
                                  </form>
                                ) : (
                                  <div className="flex items-center gap-2 group/sectitle relative z-10">
                                    <h4 className="text-xs font-bold text-indigo-400/80 font-mono tracking-tight break-all">
                                      {section}
                                    </h4>
                                    <button 
                                      onClick={() => startRenameSection(subject, section)}
                                      className="opacity-40 hover:opacity-100 transition-opacity p-1 bg-slate-500/5 rounded-md border border-slate-500/10 shrink-0"
                                      title="Rename Section"
                                    >
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 border-l border-slate-500/10 pl-2 relative z-10">
                                  <button 
                                    disabled={secIdx === 0}
                                    onClick={() => moveSection(subject, section, 'up')}
                                    className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10 transition-colors"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button 
                                    disabled={secIdx === sectionKeys.length - 1}
                                    onClick={() => moveSection(subject, section, 'down')}
                                    className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10 transition-colors"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                                {deleteSecConfirm?.subject === subject && deleteSecConfirm?.section === section ? (
                                  <div className="flex items-center gap-2 relative z-10">
                                    <span className="text-4xs font-bold text-rose-500 shrink-0">Delete?</span>
                                    <button onClick={() => { if (onDeleteSection) onDeleteSection(subject, section); setDeleteSecConfirm(null); }} className="px-1.5 py-0.5 bg-rose-600 text-white text-[8px] rounded shrink-0">Yes</button>
                                    <button onClick={() => setDeleteSecConfirm(null)} className="px-1.5 py-0.5 bg-slate-500/20 text-inherit text-[8px] rounded shrink-0">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteSecConfirm({subject, section})} className="p-1 text-rose-500/30 hover:text-rose-500 transition-colors relative z-10 shrink-0">
                                    <Trash className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <AnimatePresence>
                              {!collapsedSections[secKey] && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <SortableContext items={groupedHierarchy[subject][section].map(c => `ch:${c.id}`)} strategy={verticalListSortingStrategy}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 pt-1 pb-1">
                                      {groupedHierarchy[subject][section].map((chapter, chIdx) => {
                                        const sectionChapters = groupedHierarchy[subject][section];
                                        return (
                                      <SortableItem key={chapter.id} id={`ch:${chapter.id}`} className="flex relative group/chapter" handleClass="absolute left-2 top-1/2 -translate-y-1/2 opacity-40 group-hover/chapter:opacity-100 transition-opacity p-0.5 bg-slate-500/5 rounded border border-slate-500/10 z-10 w-4 h-6">
                                        <div 
                                          onClick={() => onSelectChapter(chapter)}
                                          className="w-full pl-7 p-3 rounded-xl border border-slate-500/10 bg-slate-500/5 hover:border-indigo-500/30 transition-all cursor-pointer flex justify-between items-center group/card shadow-sm hover:shadow-md h-full"
                                        >
                                          <div className="space-y-1 pr-2 flex-1 min-w-0">
                                            <div className="flex items-start gap-1.5 overflow-hidden relative pr-4">
                                              <p className="font-bold text-[11px] leading-tight group-hover/card:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-2">{chapter.chapterName}</p>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); onSelectChapter(chapter); }}
                                                className="opacity-0 group-hover/card:opacity-100 p-0.5 bg-slate-500/10 rounded transition-all shrink-0 absolute right-0 top-0"
                                                title="Rename / Edit Chapter"
                                              >
                                                <Pencil className="w-2 h-2 text-indigo-400" />
                                              </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono opacity-50">
                                              <span className="uppercase font-bold">{chapter.difficulty}</span>
                                              <span>{chapter.estimatedHours}h</span>
                                              {chapter.routineDayIndex && <span className="text-emerald-500 font-bold">D{chapter.routineDayIndex}</span>}
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all">
                                               <button 
                                                 disabled={chIdx === 0}
                                                 onClick={(e) => { e.stopPropagation(); moveChapterItem(chapter, 'up'); }}
                                                 className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10"
                                               >
                                                 <ArrowUp className="w-3 h-3" />
                                               </button>
                                               <button 
                                                 disabled={chIdx === sectionChapters.length - 1}
                                                 onClick={(e) => { e.stopPropagation(); moveChapterItem(chapter, 'down'); }}
                                                 className="p-1 hover:bg-slate-500/10 rounded disabled:opacity-10"
                                               >
                                                 <ArrowDown className="w-3 h-3" />
                                               </button>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-tighter ${
                                              chapter.status === 'done' || chapter.status === 'revised' ? 'bg-emerald-500 text-white' : 
                                              chapter.status.includes('in') ? 'bg-indigo-600 text-white' : 'bg-slate-500/20 opacity-60'
                                            }`}>
                                              {chapter.status}
                                            </span>
                                          </div>
                                        </div>
                                      </SortableItem>
                                    );
                                  })}
                                </div>
                              </SortableContext>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {chapters.length === 0 && (
        <div className="p-20 text-center border-2 border-dashed border-slate-500/10 rounded-3xl space-y-4">
           <BookOpen className="w-12 h-12 opacity-10 mx-auto" />
           <p className="text-sm font-bold opacity-30">No chapters found</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-3xl ${currentTheme.cardColor} border border-slate-500/20 shadow-2xl space-y-4`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black font-display tracking-tight uppercase">New Target Unit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs hover:underline opacity-50">Cancel</button>
            </div>
            <form onSubmit={handleCreateChapterSubmission} className="space-y-4">
              <div className="space-y-1">
                <label className="text-4xs font-mono font-black uppercase opacity-50">Subject</label>
                <input required value={newSubject} onChange={e => setNewSubject(e.target.value)} list="subj-list" className="w-full bg-slate-500/5 border border-slate-500/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500" />
                <datalist id="subj-list">
                   {subjectsList.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-4xs font-mono font-black uppercase opacity-50">Section</label>
                <input required value={newSection} onChange={e => setNewSection(e.target.value)} className="w-full bg-slate-500/5 border border-slate-500/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-4xs font-mono font-black uppercase opacity-50">Unit Title</label>
                <input required value={newChapter} onChange={e => setNewChapter(e.target.value)} className="w-full bg-slate-500/5 border border-slate-500/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-4xs font-mono font-black uppercase opacity-50">Hours</label>
                  <input type="number" min="0.1" step="0.5" value={newHrs} onChange={e => setNewHrs(Number(e.target.value))} className="w-full bg-slate-500/5 border border-slate-500/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-4xs font-mono font-black uppercase opacity-50">Difficulty</label>
                  <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value as any)} className="w-full bg-slate-500/5 border border-slate-500/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95">Confirm Unit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
