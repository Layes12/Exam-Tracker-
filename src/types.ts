export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  coins: number;
  experience: number;
  level: number;
  unlockedThemes: string[];
  unlockedSounds: string[];
  currentTheme: string;
  currentSound: string;
  startDate: string;
  examDate: string;
  studyDays: number;
  reviseDays: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'pdf' | 'note' | 'text';
  name: string;
  content: string; // text note, base64 binary payload or source
}

export interface Chapter {
  id: string;
  userId: string;
  subject: string;
  section: string;
  chapterName: string;
  phase: 'study' | 'revision';
  status: 'to study' | 'in progress' | 'done' | 'to revise' | 'in revision' | 'revised';
  studyProgress: number; // 0 to 100
  reviseProgress: number; // 0 to 100
  estimatedHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  coinsReward: number;
  notes?: string;
  todos: TodoItem[];
  attachments: Attachment[];
  routineDayIndex?: number | null; // which day index scheduled on (1 to studyDays)
  subjectOrder?: number;
  sectionOrder?: number;
  chapterOrder?: number;
}

export interface RoutineDay {
  id: string; // e.g. "day_1", "day_2"
  userId: string;
  dayIndex: number; // 1, 2, ...
  date: string; // YYYY-MM-DD
  chapterIds: string[]; // List of chapter IDs assigned to this day
  notes?: string;
  isCompleted: boolean;
}

export interface SessionLog {
  id: string;
  userId: string;
  chapterId: string;
  chapterName: string;
  subjectName: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
}

export interface CustomizeTheme {
  id: string;
  name: string;
  price: number;
  primaryColor: string; // tailwind color class or direct colors
  bgColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  visualVibe: string; // Swiss Modern, Cosmic Slates, Playful Sunset, Warm Editorial, Neo Brutalist
}

export interface CustomizeSound {
  id: string;
  name: string;
  price: number;
  iconName: string;
  soundType: 'sine' | 'square' | 'triangle' | 'chime' | 'success';
}
