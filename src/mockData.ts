import { DeadlineConfig, MealSelection, Notice, Profile } from './types';

export const mockProfiles: Profile[] = [
  {
    id: '1',
    fullName: 'Asha Khan',
    email: 'asha@example.com',
    role: 'student',
    roomNumber: 'A-12',
    phone: '01700000001',
    createdAt: '2026-07-01',
  },
  {
    id: '2',
    fullName: 'Mr. Rahman',
    email: 'warden@example.com',
    role: 'warden',
    roomNumber: 'Office',
    phone: '01700000002',
    createdAt: '2026-06-20',
  },
];

export const mockNotices: Notice[] = [
  {
    id: 'n1',
    title: 'Water supply maintenance',
    content: 'Water supply will be paused for 30 minutes this evening.',
    createdAt: '2026-07-31T08:00:00Z',
    author: 'Warden',
  },
  {
    id: 'n2',
    title: 'Special dinner tonight',
    content: 'Chicken biryani will be served at dinner today.',
    createdAt: '2026-07-31T07:00:00Z',
    author: 'Warden',
  },
];

export const mockDeadlines: DeadlineConfig = {
  breakfast: '08:30',
  lunch: '11:00',
  dinner: '17:00',
};

export const mockMealSelections: MealSelection[] = [
  {
    id: 'm1',
    studentId: '1',
    studentName: 'Asha Khan',
    date: '2026-07-31',
    breakfast: 'taking',
    lunch: 'pending',
    dinner: 'not-taking',
  },
];
