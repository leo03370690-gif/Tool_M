import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Clock, User, Activity } from 'lucide-react';

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

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-[#141414]">Audit Logs</h2>
        <div className="text-sm text-zinc-500">Showing last 100 actions</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-4 border-b border-zinc-200">Time</th>
              <th className="px-6 py-4 border-b border-zinc-200">User</th>
              <th className="px-6 py-4 border-b border-zinc-200">Action</th>
              <th className="px-6 py-4 border-b border-zinc-200">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 opacity-50" />
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#141414]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 opacity-50" />
                    {log.userEmail}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800">
                    <Activity className="h-3.5 w-3.5" />
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 max-w-md truncate">
                  {log.details}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
