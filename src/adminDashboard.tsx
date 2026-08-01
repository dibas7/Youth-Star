import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './theme';

const AdminDashboard = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Warden dashboard</Text>
          <Text style={styles.title}>Daily hostel overview</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.card}><Text style={styles.cardValue}>18</Text><Text style={styles.cardLabel}>Students</Text></View>
          <View style={styles.card}><Text style={styles.cardValue}>12</Text><Text style={styles.cardLabel}>Breakfast</Text></View>
          <View style={styles.card}><Text style={styles.cardValue}>15</Text><Text style={styles.cardLabel}>Lunch</Text></View>
          <View style={styles.card}><Text style={styles.cardValue}>10</Text><Text style={styles.cardLabel}>Dinner</Text></View>
        </View>

        <View style={styles.card}><Text style={styles.sectionTitle}>Pending submissions</Text><Text style={styles.bodyText}>3 students have not submitted their meal choices.</Text></View>
        <View style={styles.card}><Text style={styles.sectionTitle}>Recent notices</Text><Text style={styles.bodyText}>Water maintenance, special dinner, and hostel meeting are listed.</Text></View>
        <View style={styles.card}><Text style={styles.sectionTitle}>Student management</Text><Text style={styles.bodyText}>Add, update, or remove accounts from the student roster.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  header: { marginBottom: spacing.sm },
  eyebrow: { color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderWidth: 1, borderColor: colors.border, width: '100%' },
  cardValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  cardLabel: { color: colors.muted, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  bodyText: { color: colors.muted },
});

export default AdminDashboard;
