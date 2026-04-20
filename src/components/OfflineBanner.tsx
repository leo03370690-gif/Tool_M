import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 bg-zinc-900 text-white px-6 py-3 text-sm font-medium shadow-2xl"
        >
          <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
          <span>目前離線 — 顯示的是本地快取資料，異動將在恢復連線後同步</span>
        </motion.div>
      )}
      {!isOffline && showReconnected && (
        <motion.div
          key="reconnected"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-3 text-sm font-medium shadow-2xl"
        >
          <Wifi className="h-4 w-4 shrink-0" />
          <span>已恢復網路連線</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
