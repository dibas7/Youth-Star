export type UserRole = 'student' | 'warden';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  roomNumber?: string;
  phone?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface MealSelection {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  breakfast: 'taking' | 'not-taking' | 'pending';
  lunch: 'taking' | 'not-taking' | 'pending';
  dinner: 'taking' | 'not-taking' | 'pending';
}

export interface DeadlineConfig {
  breakfast: string;
  lunch: string;
  dinner: string;
}
