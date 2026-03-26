import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, BarChart2, List } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChangeKit {
  id: string;
  facility: string;
  kind: string;
  toolsId: string;
  packageSize: string;
  changeKitGroup: string;
  status: string;
  idleTime: string;
}

export default function ChangeKitInfo({ isAdmin }: { isAdmin: boolean }) {
  const [kits, setKits] = useState<ChangeKit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [modal, setModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });

  useEffect(() => {
    const q = query(collection(db, 'changeKits'), orderBy('toolsId'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeKit));
      setKits(data);
    }, (error) => {
      console.error("Error fetching change kits:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async (id: string, data: Partial<ChangeKit>) => {
    await updateDoc(doc(db, 'changeKits', id), data);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (modal.id) {
      await deleteDoc(doc(db, 'changeKits', modal.id));
      setModal({ isOpen: false, id: null });
    }
  };

  const filteredKits = kits.filter(k => 
    (k.toolsId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.kind || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = kits.reduce((acc, kit) => {
    // Only count if Status equals Facility
    const status = (kit.status || '').trim().toUpperCase();
    const facility = (kit.facility || '').trim().toUpperCase();
    
    if (status !== facility || !facility) return acc;

    const displayFacility = kit.facility || 'Unknown';
    const group = kit.changeKitGroup || 'Unknown';
    
    if (!acc[displayFacility]) acc[displayFacility] = {};
    if (!acc[displayFacility][group]) acc[displayFacility][group] = 0;
    acc[displayFacility][group]++;
    
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const columns = [
    { key: 'facility', label: 'Facility' },
    { key: 'kind', label: 'Kind' },
    { key: 'toolsId', label: 'Tools ID' },
    { key: 'packageSize', label: 'PACKAGE SIZE' },
    { key: 'changeKitGroup', label: 'Change kit Group' },
    { key: 'status', label: 'Status' },
    { key: 'idleTime', label: 'Idle Time' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search kits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-[#141414] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                viewMode === 'list' ? "bg-white text-[#141414] shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <List className="h-3.5 w-3.5" />
              LIST
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                viewMode === 'stats' ? "bg-white text-[#141414] shadow-sm" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              STATS
            </button>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={async () => {
              const docRef = await addDoc(collection(db, 'changeKits'), { toolsId: 'NEW_KIT' });
              setEditingId(docRef.id);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            <span>ADD KIT</span>
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 border-b border-zinc-200">{col.label}</th>
                ))}
                {isAdmin && <th className="px-4 py-3 border-b border-zinc-200">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredKits.map(kit => (
                <tr key={kit.id} className="hover:bg-zinc-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-zinc-600">
                      {editingId === kit.id ? (
                        <input
                          type="text"
                          defaultValue={kit[col.key as keyof ChangeKit]}
                          className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
                          onBlur={(e) => handleUpdate(kit.id, { [col.key]: e.target.value })}
                        />
                      ) : (
                        kit[col.key as keyof ChangeKit]
                      )}
                    </td>
                  ))}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => setEditingId(kit.id)} className="text-zinc-400 hover:text-[#141414]"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setModal({ isOpen: true, id: kit.id })} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(stats).map(([facility, groups]) => (
            <div key={facility} className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                <h3 className="font-serif italic text-lg text-zinc-900">{facility}</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {Object.entries(groups).map(([group, count]) => (
                    <div key={group} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600">{group}</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-900">
                        {count}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Total</span>
                    <span className="rounded-full bg-[#141414] px-3 py-1 text-xs font-bold text-white">
                      {Object.values(groups).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(stats).length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No statistics available (Status must equal Facility).
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Confirm Deletion</h3>
            </div>
            <p className="mb-8 text-sm leading-relaxed text-zinc-600">
              Are you sure you want to delete this change kit? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal({ isOpen: false, id: null })}
                className="rounded-lg px-4 py-2 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
