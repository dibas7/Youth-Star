import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { spacing } from './theme';
import { Profile } from './types';
import { getDeadlines, getMealForDate, getNotices, saveMealForDate, getMealsForUser } from './services/supabaseService';
import { useTheme } from './theme/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';

const mealLabels = [
  { key: 'breakfast' as const, label: 'Breakfast' },
  { key: 'lunch' as const, label: 'Lunch' },
  { key: 'dinner' as const, label: 'Dinner' },
];

interface AppShellProps {
  profile: Profile;
}

const AppShell = ({ profile }: AppShellProps) => {
  const [mealState, setMealState] = useState<Record<string, 'taking' | 'not-taking' | 'pending'>>({
    breakfast: 'pending',
    lunch: 'pending',
    dinner: 'pending',
  });
  const [notices, setNotices] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<{ breakfast: string | null; lunch: string | null; dinner: string | null }>({ breakfast: null, lunch: null, dinner: null });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [selection, latestNotices, latestDeadlines] = await Promise.all([
          getMealForDate(profile.id, todayKey),
          getNotices(),
          getDeadlines(),
        ]);
        setMealState({
          breakfast: selection?.breakfast ? 'taking' : selection ? 'not-taking' : 'pending',
          lunch: selection?.lunch ? 'taking' : selection ? 'not-taking' : 'pending',
          dinner: selection?.dinner ? 'taking' : selection ? 'not-taking' : 'pending',
        });
        setNotices(latestNotices);
        setDeadlines({
          breakfast: latestDeadlines?.breakfast ?? null,
          lunch: latestDeadlines?.lunch ?? null,
          dinner: latestDeadlines?.dinner ?? null,
        });
      } catch (error) {
        console.error('[Student] Unable to load student dashboard data', error);
        Alert.alert('Unable to load data', 'Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile.id, todayKey]);

  const toggleMeal = async (meal: keyof typeof mealState) => {
    const previousValue = mealState[meal];
    const nextValue = previousValue === 'taking' ? 'not-taking' : 'taking';
    setMealState((prev) => ({ ...prev, [meal]: nextValue }));
    try {
      await saveMealForDate(profile.id, todayKey, { [meal]: nextValue === 'taking' });
    } catch (error) {
      setMealState((prev) => ({ ...prev, [meal]: previousValue }));
      console.error('[Student] Unable to save meal update', error);
      Alert.alert('Save failed', 'Your meal choice could not be saved.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Hostel Meal Management</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Good morning, {profile.fullName}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Choose meals for today and review the latest hostel notices.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}><Text style={[styles.badgeText, { color: theme.colors.primary }]}>Student</Text></View>
            <View style={{ marginTop: spacing.sm }}>
              <ThemeToggle />
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today&apos;s meal options</Text>
          {mealLabels.map((item) => (
            <View key={item.key} style={[styles.mealRow, { borderBottomColor: theme.colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealTitle, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.mealMeta, { color: theme.colors.muted }]}>Deadline {deadlines[item.key] ?? '—'}</Text>
              </View>
              <View style={styles.mealChoiceActions}>
                <TouchableOpacity style={[styles.choiceButton, mealState[item.key] === 'taking' ? { backgroundColor: theme.colors.primaryButton } : { backgroundColor: theme.colors.background }, { borderColor: theme.colors.border }] } onPress={() => toggleMeal(item.key)}>
                  <Text style={[styles.choiceText, { color: mealState[item.key] === 'taking' ? theme.colors.buttonText : theme.colors.text }]}>{mealState[item.key] === 'taking' ? 'Taking' : 'Not Taking'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={[styles.helperText, { color: theme.colors.muted }]}>Changes are saved immediately to Supabase for today.</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{notices.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Notices</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <TouchableOpacity onPress={() => Alert.alert('Profile', `Name: ${profile.fullName}\nEmail: ${profile.email}\nRoom: ${profile.roomNumber ?? '—'}`)}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>Profile</Text>
            </TouchableOpacity>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>View details</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Latest notices</Text>
          {notices.map((notice) => (
            <View key={notice.id} style={[styles.noticeCard, { backgroundColor: theme.colors.background }]}> 
              <Text style={[styles.noticeTitle, { color: theme.colors.text }]}>{notice.title}</Text>
              <Text style={[styles.noticeContent, { color: theme.colors.muted }]}>{notice.description}</Text>
            </View>
          ))}
          {notices.length === 0 ? <Text style={[styles.helperText, { color: theme.colors.muted }]}>No notices yet.</Text> : null}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current selections</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Breakfast: {mealState.breakfast === 'taking' ? 'Taking' : mealState.breakfast === 'not-taking' ? 'Not Taking' : 'Pending'}</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Lunch: {mealState.lunch === 'taking' ? 'Taking' : mealState.lunch === 'not-taking' ? 'Not Taking' : 'Pending'}</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Dinner: {mealState.dinner === 'taking' ? 'Taking' : mealState.dinner === 'not-taking' ? 'Not Taking' : 'Pending'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  headerCard: { borderRadius: 24, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1 },
  eyebrow: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', maxWidth: 220 },
  subtitle: { marginTop: 6, fontSize: 14, maxWidth: 240 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontWeight: '700' },
  sectionCard: { borderRadius: 20, padding: spacing.md, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  mealTitle: { fontSize: 16, fontWeight: '700' },
  mealMeta: { marginTop: 2 },
  mealChoiceActions: { flexDirection: 'row', alignItems: 'center' },
  choiceButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  choiceText: { fontWeight: '700' },
  helperText: { marginTop: spacing.sm },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, borderRadius: 18, padding: spacing.md, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { marginTop: 4 },
  noticeCard: { borderRadius: 14, padding: spacing.sm, marginBottom: spacing.sm },
  noticeTitle: { fontWeight: '700' },
  noticeContent: { marginTop: 4 },
  summaryText: { marginBottom: 4 },
});

export default AppShell;
