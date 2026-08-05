import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppShell from './AppShell';
import AdminDashboard from './adminDashboard';
import { colors, spacing } from './theme';
import AuthScreen from './screens/AuthScreen';
import { getProfile, getStoredSession, signOut, supabase } from './services/supabaseService';
import { Profile } from './types';
import { useTheme } from './theme/ThemeProvider';

export type AppScreen = 'student' | 'admin';

const Navigation = () => {
  const [screen, setScreen] = useState<AppScreen>('student');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const applyProfile = (profileRecord: any, fallbackRole: Profile['role'] = 'student') => {
      const mappedProfile: Profile = {
        id: profileRecord.id,
        fullName: profileRecord.full_name ?? profileRecord.fullName ?? 'User',
        email: profileRecord.email ?? '',
        role: profileRecord.role ?? fallbackRole,
        roomNumber: profileRecord.room_number ?? profileRecord.roomNumber ?? undefined,
        createdAt: profileRecord.created_at ?? profileRecord.createdAt ?? new Date().toISOString(),
      };

      if (isMounted) {
        setProfile(mappedProfile);
        setScreen(mappedProfile.role === 'warden' ? 'admin' : 'student');
      }
    };

    const restoreSession = async () => {
      if (!supabase) {
        if (isMounted) {
          setLoading(false);
          setProfile(null);
        }
        return;
      }

      try {
        const session = await getStoredSession();
        const userId = session?.user?.id;
        if (!userId) {
          if (isMounted) {
            setProfile(null);
            setScreen('student');
          }
          return;
        }

        const profileRecord = await getProfile(userId);
        if (profileRecord) {
          applyProfile(profileRecord);
        } else if (isMounted) {
          setProfile(null);
          setScreen('student');
        }
      } catch (error) {
        console.error('[Navigation] Failed to restore Supabase session', error);
        if (isMounted) {
          setProfile(null);
          setScreen('student');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setScreen('student');
        setLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setProfile(null);
        setScreen('student');
        setLoading(false);
        return;
      }

      void getProfile(session.user.id)
        .then((profileRecord) => {
          if (!profileRecord) {
            setProfile(null);
            setScreen('student');
            return;
          }
          applyProfile(profileRecord);
        })
        .catch((error) => {
          console.error('[Navigation] Failed to sync Supabase profile', error);
          setProfile(null);
          setScreen('student');
        });
    }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

    void restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Loading your account...</Text>
      </View>
    );
  }

  if (!profile) {
    return <AuthScreen onAuthenticated={(nextProfile) => {
      setProfile(nextProfile);
      setScreen(nextProfile.role === 'warden' ? 'admin' : 'student');
    }} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.switcher, { backgroundColor: theme.colors.background }]}> 
        <TouchableOpacity style={[styles.tab, screen === 'student' && styles.activeTab, { backgroundColor: screen === 'student' ? theme.colors.primary : theme.colors.surface }] } onPress={() => setScreen('student')}>
          <Text style={[styles.tabText, screen === 'student' && styles.activeTabText, { color: screen === 'student' ? theme.colors.buttonText : theme.colors.muted }]}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, screen === 'admin' && styles.activeTab, { backgroundColor: screen === 'admin' ? theme.colors.primary : theme.colors.surface }]} onPress={() => setScreen('admin')}>
          <Text style={[styles.tabText, screen === 'admin' && styles.activeTabText, { color: screen === 'admin' ? theme.colors.buttonText : theme.colors.muted }]}>Warden</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.danger }]} onPress={async () => { await signOut(); setProfile(null); setScreen('student'); }}>
          <Text style={[styles.logoutText, { color: theme.colors.buttonText }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      {screen === 'student' ? <AppShell profile={profile} /> : <AdminDashboard profile={profile} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.sm },
  switcher: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, alignItems: 'center', gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700' },
  activeTabText: { color: colors.surface },
  logoutButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  logoutText: { fontWeight: '700' },
});

export default Navigation;
