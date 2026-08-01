import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from './theme';
import { mockDeadlines, mockMealSelections, mockNotices, mockProfiles } from './mockData';
import { MealSelection, Notice, Profile } from './types';

const currentUser = mockProfiles[0];

const mealLabels: Array<{ key: keyof Pick<MealSelection, 'breakfast' | 'lunch' | 'dinner'>; label: string; time: string }> = [
  { key: 'breakfast', label: 'Breakfast', time: mockDeadlines.breakfast },
  { key: 'lunch', label: 'Lunch', time: mockDeadlines.lunch },
  { key: 'dinner', label: 'Dinner', time: mockDeadlines.dinner },
];

const AppShell = () => {
  const [selectedProfile] = useState<Profile>(currentUser);
  const [mealState, setMealState] = useState<Record<string, 'taking' | 'not-taking'>>( {
    breakfast: 'taking',
    lunch: 'not-taking',
    dinner: 'taking',
  });
  const [notices] = useState<Notice[]>(mockNotices);

  const todaySelection = useMemo(() => mockMealSelections[0], []);

  const toggleMeal = (meal: keyof typeof mealState) => {
    setMealState((prev) => ({
      ...prev,
      [meal]: prev[meal] === 'taking' ? 'not-taking' : 'taking',
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.eyebrow}>Hostel Meal Management</Text>
            <Text style={styles.title}>Welcome back, {selectedProfile.fullName}</Text>
            <Text style={styles.subtitle}>Plan meals efficiently and cut down on waste.</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>Student</Text></View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today&apos;s meal selection</Text>
          {mealLabels.map((item) => (
            <View key={item.key} style={styles.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealTitle}>{item.label}</Text>
                <Text style={styles.mealMeta}>Deadline {item.time}</Text>
              </View>
              <TouchableOpacity style={styles.choiceButton} onPress={() => toggleMeal(item.key)}>
                <Text style={styles.choiceText}>{mealState[item.key] === 'taking' ? '✅ Taking' : '❌ Skip'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit meal choices</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Meals planned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Notice active</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Latest notices</Text>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeContent}>{notice.content}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today's summary</Text>
          <Text style={styles.summaryText}>Breakfast: {todaySelection.breakfast}</Text>
          <Text style={styles.summaryText}>Lunch: {todaySelection.lunch}</Text>
          <Text style={styles.summaryText}>Dinner: {todaySelection.dinner}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
    maxWidth: 220,
  },
  subtitle: {
    color: '#dbeafe',
    marginTop: 6,
    fontSize: 14,
    maxWidth: 240,
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mealMeta: {
    color: colors.muted,
    marginTop: 2,
  },
  choiceButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceText: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    color: colors.muted,
    marginTop: 4,
  },
  noticeCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  noticeContent: {
    color: colors.muted,
    marginTop: 4,
  },
  summaryText: {
    color: colors.text,
    marginBottom: 4,
  },
});

export default AppShell;
