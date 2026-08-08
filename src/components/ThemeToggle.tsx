import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const ThemeToggle = () => {
  const { theme, themeName, toggleTheme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: theme.colors.text }]}>☀️</Text>
      <Switch
        value={themeName === 'dark'}
        onValueChange={() => {
          void toggleTheme();
        }}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.buttonText}
      />
      <Text style={[styles.icon, { color: theme.colors.text }]}>🌙</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
});

export default ThemeToggle;
