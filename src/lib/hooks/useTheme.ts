import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'wanderlust-theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return {
    theme,
    setTheme,
    effectiveTheme: mounted ? getEffectiveTheme() : 'light',
    mounted,
  };
};

export default useTheme;
