import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { spacing } from './theme';
import { Profile } from './types';
import { getAllMeals, getAllProfiles, getNotices, createNotice, getDeadlines, upsertDeadline } from './services/supabaseService';
import { useTheme } from './theme/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';

interface AdminDashboardProps {
  profile: Profile;
}

const AdminDashboard = ({ profile }: AdminDashboardProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deadlines, setDeadlines] = useState<{ breakfast: string | null; lunch: string | null; dinner: string | null }>({ breakfast: null, lunch: null, dinner: null });
  const { theme } = useTheme();

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allProfiles, allNotices, allMealsForToday, latestDeadlines] = await Promise.all([getAllProfiles(), getNotices(), getAllMeals(), getDeadlines()]);
        setProfiles(allProfiles);
        setNotices(allNotices);
        setMeals(allMealsForToday.filter((meal) => meal.meal_date === todayKey));
        setDeadlines({ breakfast: latestDeadlines?.breakfast ?? null, lunch: latestDeadlines?.lunch ?? null, dinner: latestDeadlines?.dinner ?? null });
      } catch (error) {
        console.warn('Unable to load admin data', error);
      }
    };

    loadData();
  }, [todayKey]);

  const students = profiles.filter((item) => item.role === 'student');
  const breakfastTaking = meals.filter((meal) => meal.breakfast).length;
  const breakfastNotTaking = students.length - breakfastTaking;
  const lunchTaking = meals.filter((meal) => meal.lunch).length;
  const lunchNotTaking = students.length - lunchTaking;
  const dinnerTaking = meals.filter((meal) => meal.dinner).length;
  const dinnerNotTaking = students.length - dinnerTaking;

  const studentRows = students.map((student) => {
    const meal = meals.find((entry) => entry.user_id === student.id);
    return {
      id: student.id,
      name: student.full_name ?? student.fullName ?? 'Student',
      roomNumber: student.room_number ?? '—',
      breakfast: meal?.breakfast ? 'Taking' : 'Not Taking',
      lunch: meal?.lunch ? 'Taking' : 'Not Taking',
      dinner: meal?.dinner ? 'Taking' : 'Not Taking',
    };
  });

  const handleCreateNotice = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert('Missing details', 'Please enter both a title and description.');
      return;
    }

    try {
      const created = await createNotice(newTitle.trim(), newDescription.trim(), profile.id);
      setNotices((prev) => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
      Alert.alert('Notice published', 'The notice is now visible to students.');
    } catch (error) {
      console.error('[Warden] Create notice failed', error);
      Alert.alert('Unable to publish notice', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>Warden dashboard</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>Today&apos;s meal summary</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Signed in as {profile.fullName}</Text>
          </View>
          <ThemeToggle />
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{students.length}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Total students</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{breakfastTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Breakfast taking</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{breakfastNotTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Not taking breakfast</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{lunchTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Lunch taking</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{lunchNotTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Not taking lunch</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{dinnerTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Dinner taking</Text></View>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.cardValue, { color: theme.colors.primary }]}>{dinnerNotTaking}</Text><Text style={[styles.cardLabel, { color: theme.colors.muted }]}>Not taking dinner</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Student meal list</Text>
          {studentRows.map((student) => (
            <View key={student.id} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.bodyText, { color: theme.colors.text }]}>{student.name}</Text>
                <Text style={[styles.metaText, { color: theme.colors.muted }]}>Room {student.roomNumber}</Text>
              </View>
              <Text style={[styles.statusText, { color: theme.colors.muted }]}>{student.breakfast}</Text>
              <Text style={[styles.statusText, { color: theme.colors.muted }]}>{student.lunch}</Text>
              <Text style={[styles.statusText, { color: theme.colors.muted }]}>{student.dinner}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notices</Text>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <Text style={[styles.bodyText, { color: theme.colors.text }]}>{notice.title}</Text>
              <Text style={[styles.metaText, { color: theme.colors.muted }]}>{notice.description}</Text>
            </View>
          ))}
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 12 }]}>Create notice</Text>
          <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Title" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholderTextColor={theme.colors.muted} />
          <TextInput value={newDescription} onChangeText={setNewDescription} placeholder="Description" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholderTextColor={theme.colors.muted} multiline />
          <TouchableOpacity onPress={handleCreateNotice} style={[styles.submitButton, { backgroundColor: theme.colors.primaryButton }]}> 
            <Text style={{ color: theme.colors.buttonText, fontWeight: '700' }}>Publish notice</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Meal deadlines</Text>
          <Text style={[styles.bodyText, { color: theme.colors.muted }]}>Breakfast</Text>
          <TextInput value={deadlines.breakfast ?? ''} onChangeText={(t) => setDeadlines((d) => ({ ...d, breakfast: t }))} placeholder="HH:MM" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholderTextColor={theme.colors.muted} />
          <Text style={[styles.bodyText, { color: theme.colors.muted }]}>Lunch</Text>
          <TextInput value={deadlines.lunch ?? ''} onChangeText={(t) => setDeadlines((d) => ({ ...d, lunch: t }))} placeholder="HH:MM" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholderTextColor={theme.colors.muted} />
          <Text style={[styles.bodyText, { color: theme.colors.muted }]}>Dinner</Text>
          <TextInput value={deadlines.dinner ?? ''} onChangeText={(t) => setDeadlines((d) => ({ ...d, dinner: t }))} placeholder="HH:MM" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.primaryText, backgroundColor: theme.colors.background }]} placeholderTextColor={theme.colors.muted} />
          <TouchableOpacity onPress={async () => {
            try {
              const saved = await upsertDeadline({ breakfast: deadlines.breakfast, lunch: deadlines.lunch, dinner: deadlines.dinner } as any);
              setDeadlines({ breakfast: saved.breakfast ?? null, lunch: saved.lunch ?? null, dinner: saved.dinner ?? null });
              Alert.alert('Saved', 'Meal deadlines updated.');
            } catch (error) {
              console.error('[Warden] Save deadlines failed', error);
              Alert.alert('Unable to save deadlines', 'Please try again.');
            }
          }} style={[styles.submitButton, { backgroundColor: theme.colors.primaryButton }]}> 
            <Text style={{ color: theme.colors.buttonText, fontWeight: '700' }}>Save deadlines</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  headerCard: { borderRadius: 24, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1 },
  eyebrow: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 6 },
  subtitle: { marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { borderRadius: 18, padding: spacing.md, borderWidth: 1, width: '100%' },
  cardValue: { fontSize: 24, fontWeight: '800' },
  cardLabel: { marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  bodyText: { marginTop: 4 },
  metaText: { marginTop: 2 },
  tableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  statusText: { marginLeft: spacing.sm, minWidth: 70 },
  noticeCard: { marginBottom: spacing.sm },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  submitButton: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: spacing.sm },
});

export default AdminDashboard;
