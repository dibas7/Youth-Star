import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from './theme';
import { Profile } from './types';
import { getDeadlines, getMealForDate, getNotices, saveMealForDate } from './services/supabaseService';
import { useTheme } from './theme/ThemeProvider';

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

  const todaySelection = useMemo(() => ({
    breakfast: mealState.breakfast,
    lunch: mealState.lunch,
    dinner: mealState.dinner,
  }), [mealState]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [selection, latestNotices, latestDeadlines] = await Promise.all([
          getMealForDate(profile.id, new Date().toISOString().slice(0, 10)),
          getNotices(),
          getDeadlines(),
        ]);
        setMealState({
          breakfast: selection?.breakfast ? 'taking' : 'pending',
          lunch: selection?.lunch ? 'taking' : 'pending',
          dinner: selection?.dinner ? 'taking' : 'pending',
        });
        setNotices(latestNotices);
        setDeadlines({
          breakfast: latestDeadlines?.breakfast ?? null,
          lunch: latestDeadlines?.lunch ?? null,
          dinner: latestDeadlines?.dinner ?? null,
        });
      } catch (error) {
        Alert.alert('Unable to load data', 'Please try again shortly.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  const toggleMeal = async (meal: keyof typeof mealState) => {
    const nextValue = mealState[meal] === 'taking' ? 'not-taking' : 'taking';
    setMealState((prev) => ({ ...prev, [meal]: nextValue }));
    try {
      await saveMealForDate(profile.id, new Date().toISOString().slice(0, 10), { [meal]: nextValue === 'taking' });
    } catch (error) {
      Alert.alert('Save failed', 'Your choice could not be saved.');
    }
  };

  const handleSubmit = async () => {
    try {
      await saveMealForDate(profile.id, new Date().toISOString().slice(0, 10), {
        breakfast: mealState.breakfast === 'taking',
        lunch: mealState.lunch === 'taking',
        dinner: mealState.dinner === 'taking',
      });
      Alert.alert('Meal choices saved', 'Your selections are now stored in Supabase.');
    } catch (error) {
      Alert.alert('Save failed', 'Your choices could not be saved.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Hostel Meal Management</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back, {profile.fullName}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Plan meals efficiently and cut down on waste.</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}><Text style={[styles.badgeText, { color: theme.colors.primary }]}>Student</Text></View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today&apos;s meal selection</Text>
          {mealLabels.map((item) => (
            <View key={item.key} style={[styles.mealRow, { borderBottomColor: theme.colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.mealTitle, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.mealMeta, { color: theme.colors.muted }]}>Deadline {deadlines[item.key] ?? '—'}</Text>
              </View>
              <TouchableOpacity style={[styles.choiceButton, { backgroundColor: theme.colors.primarySoft }]} onPress={() => toggleMeal(item.key)}>
                <Text style={[styles.choiceText, { color: theme.colors.primary }]}>{mealState[item.key] === 'taking' ? 'Taking' : 'Skip'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primaryButton }]} onPress={handleSubmit}>
            <Text style={[styles.submitButtonText, { color: theme.colors.buttonText }]}>{loading ? 'Loading...' : 'Submit meal choices'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>3</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Meals planned</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{notices.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Notices active</Text>
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
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's summary</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Breakfast: {todaySelection.breakfast}</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Lunch: {todaySelection.lunch}</Text>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>Dinner: {todaySelection.dinner}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerCard: {
    borderRadius: 24,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    maxWidth: 220,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    maxWidth: 240,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mealMeta: {
    marginTop: 2,
  },
  choiceButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceText: {
    fontWeight: '700',
  },
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
  },
  noticeCard: {
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    fontWeight: '700',
  },
  noticeContent: {
    marginTop: 4,
  },
  summaryText: {
    marginBottom: 4,
  },
});

export default AppShell;
