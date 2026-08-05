import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const expoExtra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, string>;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || expoExtra.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || expoExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase config: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: AsyncStorage as any,
  },
});

export interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  room_number?: string | null;
  role: 'student' | 'warden';
  created_at?: string;
}

export interface ProfilePayload {
  id: string;
  full_name: string;
  email: string;
  room_number: string | null;
  role: 'student' | 'warden';
}

export interface AuthResult {
  user: any;
  session: any | null;
  profile: ProfileRecord | ProfilePayload;
  requiresEmailConfirmation?: boolean;
}

export interface MealRecord {
  id: string;
  user_id: string;
  meal_date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  created_at?: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  description: string;
  created_by?: string | null;
  created_at?: string;
}

export interface DeadlineRecord {
  id: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

const createSupabaseError = (error: unknown, fallbackMessage: string) => {
  const message = error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : fallbackMessage;

  console.error('[Supabase] Error:', error);
  return new Error(message);
};

const normalizeRole = (role: unknown): 'student' | 'warden' => (role === 'warden' ? 'warden' : 'student');

const extractMetadata = (user: any) => {
  const metadata = user?.user_metadata ?? {};
  return {
    full_name: metadata.full_name ?? metadata.fullName ?? null,
    room_number: metadata.room_number ?? metadata.roomNumber ?? null,
    role: normalizeRole(metadata.role),
  };
};

const ensureProfile = async (
  id: string,
  email: string,
  role: 'student' | 'warden',
  fullName: string,
  roomNumber?: string | null,
): Promise<ProfileRecord> => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw createSupabaseError(error, 'Unable to verify profile existence.');
  }

  if (data) {
    return data as ProfileRecord;
  }

  const payload = {
    id,
    full_name: fullName,
    email,
    room_number: roomNumber ?? null,
    role,
  };

  const { data: inserted, error: insertError } = await supabase.from('profiles').insert(payload).select('*').single();
  if (insertError) {
    throw createSupabaseError(insertError, 'Unable to create the user profile.');
  }

  return inserted as ProfileRecord;
};

const createProfilePayload = (
  id: string,
  email: string,
  role: 'student' | 'warden',
  fullName: string,
  roomNumber?: string | null,
): ProfilePayload => ({
  id,
  full_name: fullName,
  email,
  room_number: roomNumber ?? null,
  role,
});

export const ensureProfileForUser = async (user: any): Promise<ProfileRecord> => {
  const metadata = extractMetadata(user);
  const email = user?.email ?? '';
  const fullName = metadata.full_name ?? email.split('@')[0] ?? 'User';

  return ensureProfile(
    user.id,
    email,
    metadata.role,
    fullName,
    metadata.room_number,
  );
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  console.log('[Supabase] Signing in user', email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const isEmailConfirmationError = (err: any) =>
      err?.code === 'email_not_confirmed' ||
      typeof err?.message === 'string' && err.message.toLowerCase().includes('not confirmed');

    if (isEmailConfirmationError(error)) {
      const user = data.user ?? data.session?.user;
      if (user?.id) {
        const metadata = extractMetadata(user);
        const profile = createProfilePayload(
          user.id,
          user.email ?? email,
          metadata.role,
          metadata.full_name ?? email.split('@')[0],
          metadata.room_number,
        );
        return { user, session: null, profile, requiresEmailConfirmation: true };
      }
      throw new Error('Email is not confirmed. Please check your inbox for a confirmation link.');
    }

    throw createSupabaseError(error, 'Sign-in failed. Please verify your email and password.');
  }

  const user = data.user ?? data.session?.user;
  const session = data.session ?? null;
  if (!user?.id) {
    throw new Error('The Supabase account could not be authenticated. Please verify your email and password.');
  }

  if (!session) {
    const metadata = extractMetadata(user);
    const profile = createProfilePayload(
      user.id,
      user.email ?? email,
      metadata.role,
      metadata.full_name ?? email.split('@')[0],
      metadata.room_number,
    );

    console.warn('[Supabase] Sign-in completed without an active session; email confirmation may be required.');
    return { user, session: null, profile, requiresEmailConfirmation: true };
  }

  const metadata = extractMetadata(user);
  const profile = await ensureProfile(
    user.id,
    user.email ?? email,
    metadata.role,
    metadata.full_name ?? email.split('@')[0],
    metadata.room_number,
  );

  return { user, session, profile };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  role: 'student' | 'warden',
  fullName: string,
  roomNumber?: string,
): Promise<AuthResult> => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  console.log('[Supabase] Creating auth user', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
        room_number: roomNumber ?? null,
      },
    },
  });

  if (error) {
    throw createSupabaseError(error, 'Unable to create the Supabase account.');
  }

  const user = data.user ?? data.session?.user;
  const session = data.session ?? null;
  if (!user?.id) {
    throw new Error('The Supabase account was created but no user ID was returned.');
  }

  if (session) {
    const profile = await ensureProfileForUser(user);
    return { user, session, profile };
  }

  console.warn('[Supabase] Signup completed without an active session; email confirmation may be required.');
  return {
    user,
    session: null,
    profile: createProfilePayload(user.id, email, role, fullName, roomNumber ?? null),
    requiresEmailConfirmation: true,
  };
};

export const getStoredSession = async () => {
  if (!supabase) {
    return null;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw createSupabaseError(error, 'Unable to restore the saved Supabase session.');
  }
  return session;
};

export const signOut = async () => {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
};

export const getProfile = async (userId: string): Promise<ProfileRecord | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    throw createSupabaseError(error, 'Unable to load the user profile.');
  }

  return data as ProfileRecord | null;
};

export const getAllProfiles = async (): Promise<ProfileRecord[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) {
    throw createSupabaseError(error, 'Unable to load all profiles.');
  }

  return (data ?? []) as ProfileRecord[];
};

export const getNotices = async (): Promise<NoticeRecord[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  if (error) {
    throw createSupabaseError(error, 'Unable to load notices.');
  }

  return (data ?? []) as NoticeRecord[];
};

export const createNotice = async (title: string, description: string, createdBy: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.from('notices').insert({ title, description, created_by: createdBy }).select().single();
  if (error) {
    throw createSupabaseError(error, 'Unable to create the notice.');
  }

  return data;
};

export const getDeadlines = async (): Promise<DeadlineRecord | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from('meal_deadlines').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
  if (error) {
    throw createSupabaseError(error, 'Unable to load meal deadlines.');
  }

  return data as DeadlineRecord | null;
};

export const upsertDeadline = async (updates: Partial<DeadlineRecord>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.from('meal_deadlines').upsert(updates).select().single();
  if (error) {
    throw createSupabaseError(error, 'Unable to save meal deadlines.');
  }

  return data;
};

export const getMealForDate = async (userId: string, date: string): Promise<MealRecord | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from('meals').select('*').eq('user_id', userId).eq('meal_date', date).maybeSingle();
  if (error) {
    throw createSupabaseError(error, 'Unable to load the meal selection.');
  }

  return data as MealRecord | null;
};

export const saveMealForDate = async (userId: string, date: string, updates: Partial<MealRecord>) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const existing = await getMealForDate(userId, date);
  if (existing) {
    const { data, error } = await supabase.from('meals').update(updates).eq('id', existing.id).select().single();
    if (error) {
      throw createSupabaseError(error, 'Unable to update the meal selection.');
    }
    return data;
  }

  const { data, error } = await supabase.from('meals').insert({ user_id: userId, meal_date: date, ...updates }).select().single();
  if (error) {
    throw createSupabaseError(error, 'Unable to save the meal selection.');
  }

  return data;
};

export const getAllMeals = async (): Promise<MealRecord[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('meals').select('*').order('meal_date', { ascending: false });
  if (error) {
    throw createSupabaseError(error, 'Unable to load all meal selections.');
  }

  return (data ?? []) as MealRecord[];
};
