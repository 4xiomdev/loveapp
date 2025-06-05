import { pinkPurpleTheme } from './pinkPurpleTheme';
import bluePurpleTheme from './bluePurpleTheme';

export const THEME_OPTIONS = {
  pinkPurple: pinkPurpleTheme,
  bluePurple: bluePurpleTheme
};

export const createCustomTheme = (themeKey) => {
  return THEME_OPTIONS[themeKey];
}; 