import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './theme';
import { Profile } from './types';
import { getAllMeals, getAllProfiles, getNotices } from './services/supabaseService';
import { useTheme } from './theme/ThemeProvider';

interface AdminDashboardProps {
  profile: Profile;
}

const AdminDashboard = ({ profile }: AdminDashboardProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allProfiles, allNotices, allMeals] = await Promise.all([getAllProfiles(), getNotices(), getAllMeals()]);
        setProfiles(allProfiles);
        setNotices(allNotices);
        setMeals(allMeals);
      } catch (error) {
        console.warn('Unable to load admin data', error);
      }
    };

    loadData();
  }, []);

  const breakfastCount = meals.filter((meal) => meal.breakfast).length;
  const lunchCount = meals.filter((meal) => meal.lunch).length;
  const dinnerCount = meals.filter((meal) => meal.dinner).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Warden dashboard</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>Daily hostel overview</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Signed in as {profile.fullName} ({profile.role})</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{profiles.length}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Students</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{breakfastCount}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Breakfast</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{lunchCount}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Lunch</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{dinnerCount}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Dinner</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent notices</Text>{notices.slice(0, 3).map((notice) => <Text key={notice.id} style={[styles.bodyText, { color: theme.colors.muted }]}>{notice.title}</Text>)}</View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Student roster</Text><Text style={[styles.bodyText, { color: theme.colors.muted }]}>Live profile count from Supabase: {profiles.length}</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  header: { marginBottom: spacing.sm },
  eyebrow: { color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 6 },
  subtitle: { color: colors.muted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { borderRadius: 18, padding: spacing.md, borderWidth: 1, width: '100%' },
  cardValue: { fontSize: 24, fontWeight: '800' },
  cardLabel: { marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  bodyText: { marginTop: 4 },
});

export default AdminDashboard;
