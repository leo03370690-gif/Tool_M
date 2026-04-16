import React, { createContext, useContext, useEffect } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

type Theme = 'default' | 'ocean' | 'forest' | 'sunset' | 'royal';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = usePersistentState<Theme>('app_theme', 'default');

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset', 'theme-royal');
    
    // Add the selected theme class if it's not default
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
