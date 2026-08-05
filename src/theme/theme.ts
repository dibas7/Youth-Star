import { darkColors, lightColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export type AppThemeName = 'light' | 'dark';

export const themes = {
  light: {
    colors: lightColors,
    spacing,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    typography,
  },
};

export const defaultTheme: AppThemeName = 'light';
