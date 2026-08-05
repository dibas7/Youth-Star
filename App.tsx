import { StatusBar } from 'expo-status-bar';
import React from 'react';
import Navigation from './src/navigation';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Navigation />
    </ThemeProvider>
  );
}
