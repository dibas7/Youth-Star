import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { spacing } from '../theme';
import { Profile } from '../types';
import { getProfile, signInWithEmail, signUpWithEmail } from '../services/supabaseService';
import { useTheme } from '../theme/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';

type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  onAuthenticated: (profile: Profile) => void;
}

const AuthScreen = ({ onAuthenticated }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Profile['role']>('student');
  const { theme } = useTheme();

  const getUserFriendlyMessage = (error: unknown) => {
    const message = typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '';

    if (message.toLowerCase().includes('invalid login')) return 'Invalid email or password. Please try again.';
    if (message.toLowerCase().includes('already registered')) return 'This email is already registered. Please sign in instead.';
    if (message.toLowerCase().includes('email not confirmed')) return 'Please confirm your email address before signing in.';
    if (message.toLowerCase().includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
    if (message.toLowerCase().includes('network')) return 'Network error. Please check your connection and try again.';
    if (message.toLowerCase().includes('profile')) return 'Your account could not be linked to a profile. Please contact support.';
    return message || 'Authentication failed. Please try again.';
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (mode === 'signup' && !fullName.trim())) {
      Alert.alert('Missing details', 'Please complete the required fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password, role, fullName.trim(), roomNumber.trim() || undefined);

      const userId = result.user?.id;
      if (!userId) {
        throw new Error('No account was returned.');
      }

      if (result.requiresEmailConfirmation) {
        Alert.alert('Confirm your email', 'Please confirm your email before signing in.');
        return;
      }

      const profileRecord = result.profile ?? await getProfile(userId);
      if (!profileRecord) {
        throw new Error('The Supabase account was authenticated, but its profile could not be loaded.');
      }

      if (profileRecord.role !== role && mode === 'signin') {
        throw new Error(`This account is registered as a ${profileRecord.role}. Please use the matching sign-in option.`);
      }

      onAuthenticated({
        id: profileRecord.id,
        fullName: profileRecord.full_name ?? 'User',
        email: profileRecord.email ?? email.trim(),
        role: profileRecord.role,
        roomNumber: profileRecord.room_number ?? undefined,
        createdAt: 'created_at' in profileRecord ? profileRecord.created_at ?? new Date().toISOString() : new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error('[Auth] Authentication failed', error);
      Alert.alert('Authentication failed', getUserFriendlyMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Youth-STAR</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Are you signing in or creating an account?</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Choose your role, then sign in or create your account securely.</Text>

            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'student' && styles.roleButtonActive, { borderColor: theme.colors.border, backgroundColor: role === 'student' ? theme.colors.primary : theme.colors.surface }]}
                onPress={() => setRole('student')}
              >
                <Text style={[styles.roleText, role === 'student' && styles.roleTextActive, { color: role === 'student' ? theme.colors.buttonText : theme.colors.muted }]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'warden' && styles.roleButtonActive, { borderColor: theme.colors.border, backgroundColor: role === 'warden' ? theme.colors.primary : theme.colors.surface }]}
                onPress={() => setRole('warden')}
              >
                <Text style={[styles.roleText, role === 'warden' && styles.roleTextActive, { color: role === 'warden' ? theme.colors.buttonText : theme.colors.muted }]}>Warden</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modeRow}>
              <TouchableOpacity style={[styles.modeButton, mode === 'signin' && styles.modeButtonActive, { backgroundColor: mode === 'signin' ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border }]} onPress={() => setMode('signin')}>
                <Text style={[styles.modeButtonText, mode === 'signin' && styles.modeButtonTextActive, { color: mode === 'signin' ? theme.colors.buttonText : theme.colors.text }]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive, { backgroundColor: mode === 'signup' ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border }]} onPress={() => setMode('signup')}>
                <Text style={[styles.modeButtonText, mode === 'signup' && styles.modeButtonTextActive, { color: mode === 'signup' ? theme.colors.buttonText : theme.colors.text }]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {mode === 'signup' ? (
              <>
                <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Full name" placeholderTextColor={theme.colors.muted} value={fullName} onChangeText={setFullName} />
                <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Room number (optional)" placeholderTextColor={theme.colors.muted} value={roomNumber} onChangeText={setRoomNumber} />
              </>
            ) : null}
            <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Email" placeholderTextColor={theme.colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Password" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primaryButton }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.buttonText} /> : <Text style={[styles.submitButtonText, { color: theme.colors.buttonText }]}>{mode === 'signin' ? `Sign in as ${role}` : `Create ${role} account`}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={[styles.switchText, { color: theme.colors.primary }]}> 
                {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.toggleRow}>
              <ThemeToggle />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: 24, padding: spacing.lg, borderWidth: 1 },
  eyebrow: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  subtitle: { marginTop: 8, marginBottom: spacing.md },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  roleButtonActive: { borderColor: '#111111' },
  roleText: { fontWeight: '700' },
  roleTextActive: { color: '#FFFFFF' },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  modeButtonActive: { borderWidth: 0 },
  modeButtonText: { fontWeight: '700' },
  modeButtonTextActive: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.sm },
  submitButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  submitButtonText: { fontWeight: '700' },
  switchText: { marginTop: spacing.md, textAlign: 'center', fontWeight: '700' },
  toggleRow: { marginTop: spacing.md, alignItems: 'center' },
});

export default AuthScreen;
