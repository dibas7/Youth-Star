import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppThemeName, themes } from './theme';

interface ThemeContextValue {
  themeName: AppThemeName;
  theme: typeof themes.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [themeName, setThemeName] = useState<AppThemeName>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme-preference');
        if (saved === 'dark' || saved === 'light') {
          setThemeName(saved);
        }
      } catch (error) {
        console.warn('Unable to load theme preference', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = themeName === 'light' ? 'dark' : 'light';
    setThemeName(nextTheme);
    try {
      await AsyncStorage.setItem('theme-preference', nextTheme);
    } catch (error) {
      console.warn('Unable to save theme preference', error);
    }
  };

  const value = useMemo(() => ({
    themeName,
    theme: themes[themeName],
    toggleTheme,
  }), [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
