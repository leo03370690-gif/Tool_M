import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ commands, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = (cmd: Command) => {
    cmd.action();
    onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIndex]) run(filtered[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, activeIndex]);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-100"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="搜尋功能頁面..."
                  className="flex-1 text-sm text-zinc-900 placeholder-zinc-400 bg-transparent outline-none"
                />
                <kbd className="text-[10px] font-bold text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">ESC</kbd>
              </div>

              <ul ref={listRef} className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-zinc-400">找不到相關功能</li>
                ) : (
                  filtered.map((cmd, i) => (
                    <li key={cmd.id}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          i === activeIndex ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                        )}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => run(cmd)}
                      >
                        {cmd.icon && (
                          <span className="shrink-0 text-zinc-400">{cmd.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-zinc-400 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {i === activeIndex && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="border-t border-zinc-100 px-4 py-2 flex items-center gap-3 text-[11px] text-zinc-400">
                <span><kbd className="border border-zinc-200 rounded px-1">↑↓</kbd> 導覽</span>
                <span><kbd className="border border-zinc-200 rounded px-1">↵</kbd> 前往</span>
                <span><kbd className="border border-zinc-200 rounded px-1">Esc</kbd> 關閉</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
