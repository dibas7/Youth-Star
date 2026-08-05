import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Profile } from '../types';
import { getProfile, signInWithEmail, signUpWithEmail } from '../services/supabaseService';
import { useTheme } from '../theme/ThemeProvider';

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

  const title = useMemo(() => (mode === 'signin' ? 'Welcome back' : 'Create account'), [mode]);

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

      onAuthenticated({
        id: profileRecord.id,
        fullName: profileRecord.full_name,
        email: profileRecord.email,
        role: profileRecord.role,
        roomNumber: profileRecord.room_number ?? undefined,
        createdAt: 'created_at' in profileRecord ? profileRecord.created_at ?? new Date().toISOString() : new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Auth] Authentication failed', error);
      Alert.alert('Authentication failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Hostel Meal Management</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Sign in or create an account to manage meal choices securely.</Text>

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

            {mode === 'signup' ? (
              <>
                <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Full name" placeholderTextColor={theme.colors.muted} value={fullName} onChangeText={setFullName} />
                <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Room number" placeholderTextColor={theme.colors.muted} value={roomNumber} onChangeText={setRoomNumber} />
              </>
            ) : null}
            <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Email" placeholderTextColor={theme.colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholder="Password" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primaryButton }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.buttonText} /> : <Text style={[styles.submitButtonText, { color: theme.colors.buttonText }]}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={[styles.switchText, { color: theme.colors.primary }]}> 
                {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
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
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { marginTop: 8, marginBottom: spacing.md },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  roleButtonActive: { borderColor: colors.primary },
  roleText: { fontWeight: '700' },
  roleTextActive: { color: colors.surface },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.sm },
  submitButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  submitButtonText: { fontWeight: '700' },
  switchText: { marginTop: spacing.md, textAlign: 'center', fontWeight: '700' },
});

export default AuthScreen;
