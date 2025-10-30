import React, { useEffect, useState } from 'react';
import { Theme, ThemeContext, ThemeProviderProps } from '../theme-context';

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'loki-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  useEffect(() => {
    setTheme(defaultTheme);
  }, [defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}
