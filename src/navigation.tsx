import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppShell from './AppShell';
import AdminDashboard from './adminDashboard';
import { spacing } from './theme';
import AuthScreen from './screens/AuthScreen';
import { getProfile, getStoredSession, signOut, supabase } from './services/supabaseService';
import { Profile } from './types';
import { useTheme } from './theme/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';

export type AppScreen = 'student' | 'warden' | 'auth';

const Navigation = () => {
  const [screen, setScreen] = useState<AppScreen>('auth');
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
        setScreen(mappedProfile.role === 'warden' ? 'warden' : 'student');
      }
    };

    const restoreSession = async () => {
      if (!supabase) {
        if (isMounted) {
          setLoading(false);
          setProfile(null);
          setScreen('auth');
        }
        return;
      }

      try {
        const session = await getStoredSession();
        const userId = session?.user?.id;
        if (!userId) {
          if (isMounted) {
            setProfile(null);
            setScreen('auth');
          }
          return;
        }

        const profileRecord = await getProfile(userId);
        if (profileRecord) {
          applyProfile(profileRecord);
        } else if (isMounted) {
          setProfile(null);
          setScreen('auth');
        }
      } catch (error) {
        console.error('[Navigation] Failed to restore Supabase session', error);
        if (isMounted) {
          setProfile(null);
          setScreen('auth');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const authSubscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setScreen('auth');
        setLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setProfile(null);
        setScreen('auth');
        setLoading(false);
        return;
      }

      void getProfile(session.user.id)
        .then((profileRecord) => {
          if (!profileRecord) {
            setProfile(null);
            setScreen('auth');
            return;
          }
          applyProfile(profileRecord);
        })
        .catch((error) => {
          console.error('[Navigation] Failed to sync Supabase profile', error);
          setProfile(null);
          setScreen('auth');
        });
    });

    void restoreSession();

    return () => {
      isMounted = false;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  const handleAuthenticated = (nextProfile: Profile) => {
    setProfile(nextProfile);
    setScreen(nextProfile.role === 'warden' ? 'warden' : 'student');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[Navigation] Sign-out failed', error);
    } finally {
      setProfile(null);
      setScreen('auth');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Loading your account...</Text>
      </View>
    );
  }

  if (!profile) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Youth-STAR</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Secure hostel meal management</Text>
        </View>
        <View style={styles.topActions}>
          <ThemeToggle />
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.primaryButton }]} onPress={handleSignOut}>
            <Text style={[styles.logoutText, { color: theme.colors.buttonText }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
      {profile.role === 'warden' ? <AdminDashboard profile={profile} /> : <AppShell profile={profile} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.sm },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  logoutText: { fontWeight: '700' },
});

export default Navigation;
