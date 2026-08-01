import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppShell from './AppShell';
import AdminDashboard from './adminDashboard';
import { colors, spacing } from './theme';

export type AppScreen = 'student' | 'admin';

const Navigation = () => {
  const [screen, setScreen] = useState<AppScreen>('student');

  return (
    <View style={styles.container}>
      <View style={styles.switcher}>
        <TouchableOpacity style={[styles.tab, screen === 'student' && styles.activeTab]} onPress={() => setScreen('student')}>
          <Text style={[styles.tabText, screen === 'student' && styles.activeTabText]}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, screen === 'admin' && styles.activeTab]} onPress={() => setScreen('admin')}>
          <Text style={[styles.tabText, screen === 'admin' && styles.activeTabText]}>Warden</Text>
        </TouchableOpacity>
      </View>
      {screen === 'student' ? <AppShell /> : <AdminDashboard />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  switcher: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.background },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center', marginRight: 8, backgroundColor: colors.surface },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: '700' },
  activeTabText: { color: colors.surface },
});

export default Navigation;
