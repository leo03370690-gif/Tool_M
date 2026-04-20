import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={cn("relative group", className)}>
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-xs font-bold"
        title="Language"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{i18n.resolvedLanguage || i18n.language}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-2 w-32 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-1 flex flex-col gap-1">
          <button
            onClick={() => changeLanguage('zh')}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
              i18n.resolvedLanguage === 'zh' ? "bg-brand-primary text-white font-bold" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            🇹🇼 繁體中文
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
              i18n.resolvedLanguage === 'en' ? "bg-brand-primary text-white font-bold" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => changeLanguage('ja')}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
              i18n.resolvedLanguage === 'ja' ? "bg-brand-primary text-white font-bold" : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            🇯🇵 日本語
          </button>
        </div>
      </div>
    </div>
  );
}
