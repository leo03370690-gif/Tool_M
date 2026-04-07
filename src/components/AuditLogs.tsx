import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Clock, User, Activity, Search, Filter, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DoubleScrollbar } from './ui/DoubleScrollbar';
import { usePersistentState } from '../lib/usePersistentState';
import { MultiSelectDropdown } from './ui/MultiSelectDropdown';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  userEmail: string;
  timestamp: any;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserEmails, setFilterUserEmails] = usePersistentState<string[]>('auditLogs_filterUserEmails', []);
  const [filterActions, setFilterActions] = usePersistentState<string[]>('auditLogs_filterActions', []);
  const [visibleColumns, setVisibleColumns] = usePersistentState<string[]>('auditLogs_visibleColumns', ['timestamp', 'userEmail', 'action', 'details']);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredForUserEmails = React.useMemo(() => {
    return logs.filter(log => {
      const matchAction = filterActions.length === 0 || filterActions.includes(String(log.action || ''));
      return matchAction;
    });
  }, [logs, filterActions]);

  const filteredForActions = React.useMemo(() => {
    return logs.filter(log => {
      const matchUserEmail = filterUserEmails.length === 0 || filterUserEmails.includes(String(log.userEmail || ''));
      return matchUserEmail;
    });
  }, [logs, filterUserEmails]);

  const uniqueUserEmails = React.useMemo(() => Array.from(new Set(filteredForUserEmails.map(log => String(log.userEmail || '')).filter(Boolean))).sort(), [filteredForUserEmails]);
  const uniqueActions = React.useMemo(() => Array.from(new Set(filteredForActions.map(log => String(log.action || '')).filter(Boolean))).sort(), [filteredForActions]);

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const matchSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchUserEmail = filterUserEmails.length === 0 || filterUserEmails.includes(String(log.userEmail || ''));
      const matchAction = filterActions.length === 0 || filterActions.includes(String(log.action || ''));

      return matchSearch && matchUserEmail && matchAction;
    });
  }, [logs, searchTerm, filterUserEmails, filterActions]);

  const columns = [
    { key: 'timestamp', label: 'Time' },
    { key: 'userEmail', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'details', label: 'Details' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">Audit Logs</h2>
          <p className="text-sm text-zinc-500">Monitoring system activity and user actions</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-sm">
            <button
              onClick={() => {
                setFilterUserEmails([]);
                setFilterActions([]);
              }}
              className="px-2 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1"></div>
            <Filter className="h-4 w-4 text-zinc-400 ml-2" />
            <MultiSelectDropdown
              values={filterUserEmails}
              onChange={setFilterUserEmails}
              options={uniqueUserEmails}
              placeholder="All Users"
            />
            <div className="w-px h-4 bg-zinc-200 mx-1"></div>
            <MultiSelectDropdown
              values={filterActions}
              onChange={setFilterActions}
              options={uniqueActions}
              placeholder="All Actions"
            />
            <div className="w-px h-4 bg-zinc-200 mx-1"></div>
            <MultiSelectDropdown
              values={visibleColumns}
              onChange={setVisibleColumns}
              options={columns.map(c => c.key)}
              labels={columns.reduce((acc, c) => ({ ...acc, [c.key]: c.label }), {})}
              placeholder="Columns"
              icon={<List className="h-4 w-4 text-zinc-400" />}
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <DoubleScrollbar>
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                {columns.filter(col => visibleColumns.includes(col.key)).map((col, i) => (
                  <th key={col.key} className={cn("px-6 py-4 border-b border-zinc-100", i === 0 && visibleColumns[0] === col.key && "sticky left-0 bg-zinc-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => (
                  <motion.tr 
                    key={log.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-zinc-50/50 transition-colors group"
                  >
                    {visibleColumns.includes('timestamp') && (
                      <td className={cn("px-6 py-4 whitespace-nowrap text-zinc-500 transition-colors", visibleColumns[0] === 'timestamp' && "sticky left-0 bg-white group-hover:bg-zinc-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 opacity-40" />
                          <span className="font-mono text-[11px]">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('userEmail') && (
                      <td className={cn("px-6 py-4 whitespace-nowrap transition-colors", visibleColumns[0] === 'userEmail' && "sticky left-0 bg-white group-hover:bg-zinc-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                            <User className="h-3 w-3 text-zinc-500" />
                          </div>
                          <span className="font-medium text-zinc-900">{log.userEmail}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('action') && (
                      <td className={cn("px-6 py-4 whitespace-nowrap transition-colors", visibleColumns[0] === 'action' && "sticky left-0 bg-white group-hover:bg-zinc-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                          <Activity className="h-3 w-3" />
                          {log.action}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('details') && (
                      <td className={cn("px-6 py-4 text-zinc-600 max-w-md truncate transition-colors", visibleColumns[0] === 'details' && "sticky left-0 bg-white group-hover:bg-zinc-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")}>
                        {log.details}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="text-sm">No matching logs found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DoubleScrollbar>
      </div>
    </motion.div>
  );
}
