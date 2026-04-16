import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const themes = [
  { id: 'default', name: 'Noir (Default)', color: '#09090b', bg: '#fafafa' },
  { id: 'ocean', name: 'Ocean Blue', color: '#0284c7', bg: '#f0f9ff' },
  { id: 'forest', name: 'Forest Green', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'sunset', name: 'Sunset Orange', color: '#ea580c', bg: '#fff7ed' },
  { id: 'royal', name: 'Royal Purple', color: '#7c3aed', bg: '#faf5ff' },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="surface-card p-4 sm:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Appearance</h3>
          <p className="text-sm text-zinc-500">Customize the look and feel of your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-2xl p-4 transition-all border-2",
              theme === t.id 
                ? "border-brand-primary bg-zinc-50 shadow-sm" 
                : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"
            )}
          >
            <div 
              className="w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: t.color }}
            >
              {theme === t.id && <Check className="h-5 w-5 text-white" />}
            </div>
            <span className="text-xs font-bold text-zinc-600 text-center">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
