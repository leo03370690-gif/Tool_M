import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Socket {
  id: string;
  facility: string;
  toolsId: string;
  package: string;
  pinBall: string;
  packageSize: string;
  project: string;
  status: string;
  contactCountPin1: number;
  lifeCountPin1: number;
  contactLimitPin1: number;
  socketGroupPin1: string;
  contactCountOver70Pin1: boolean | string | number;
  pogoPinPnPin1: string;
  socketPnPin1: string;
  usedFag: string;
  contactCountPin2: number;
  lifeCountPin2: number;
  contactLimitPin2: number;
  contactCountOver70Pin2: boolean | string | number;
  pogoPinPnPin2: string;
  contactCountPcb: number;
  lifeCountPcb: number;
  contactLimitPcb: number;
  contactCountOver70Pcb: boolean | string | number;
  pnPcb: string;
}

export default function SocketInfo({ isAdmin }: { isAdmin: boolean }) {
  const [sockets, setSockets] = useState<Socket[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'sockets'), orderBy('toolsId'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Socket));
      setSockets(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sockets:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async (id: string, data: Partial<Socket>) => {
    await updateDoc(doc(db, 'sockets', id), data);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (modal.id) {
      await deleteDoc(doc(db, 'sockets', modal.id));
      setModal({ isOpen: false, id: null });
    }
  };

  const filteredSockets = sockets.filter(s => 
    (s.toolsId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'facility', label: 'Facility' },
    { key: 'toolsId', label: 'Tools ID' },
    { key: 'package', label: 'PACKAGE' },
    { key: 'pinBall', label: 'PIN BALL' },
    { key: 'packageSize', label: 'PACKAGE SIZE' },
    { key: 'project', label: 'PROJECT' },
    { key: 'status', label: 'Status' },
    { key: 'contactCountPin1', label: 'Contact Count - Pin1' },
    { key: 'lifeCountPin1', label: 'Life Count - Pin1' },
    { key: 'contactLimitPin1', label: 'Contact Limit - Pin1' },
    { key: 'socketGroupPin1', label: 'Socket group - Pin1' },
    { key: 'pogoPinPnPin1', label: 'Pogo pin P/N - Pin1' },
    { key: 'socketPnPin1', label: 'Socket P/N - Pin1' },
    { key: 'contactCountOver70Pin1', label: 'Contact count over 70% - Pin1' },
    { key: 'contactCountPin2', label: 'Contact Count - Pin2' },
    { key: 'lifeCountPin2', label: 'Life Count - Pin2' },
    { key: 'contactLimitPin2', label: 'Contact Limit - Pin2' },
    { key: 'pogoPinPnPin2', label: 'Pogo pin P/N - Pin2' },
    { key: 'contactCountOver70Pin2', label: 'Contact count over 70% - Pin2' },
    { key: 'contactCountPcb', label: 'Contact Count - PCB' },
    { key: 'lifeCountPcb', label: 'Life Count - PCB' },
    { key: 'contactLimitPcb', label: 'Contact Limit - PCB' },
    { key: 'pnPcb', label: 'P/N - PCB' },
    { key: 'contactCountOver70Pcb', label: 'Contact count over 70% - PCB' },
    { key: 'usedFag', label: 'Used Fag' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search sockets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-[#141414] focus:bg-white focus:outline-none"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={async () => {
              const docRef = await addDoc(collection(db, 'sockets'), { toolsId: 'NEW_SOCKET' });
              setEditingId(docRef.id);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            <span>ADD SOCKET</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 border-b border-zinc-200 whitespace-nowrap">{col.label}</th>
              ))}
              {isAdmin && <th className="px-4 py-3 border-b border-zinc-200">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredSockets.map(socket => (
              <tr key={socket.id} className="hover:bg-zinc-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                    {editingId === socket.id ? (
                      <input
                        type={typeof socket[col.key as keyof Socket] === 'number' ? 'number' : 'text'}
                        defaultValue={socket[col.key as keyof Socket] as any}
                        className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
                        onBlur={(e) => handleUpdate(socket.id, { [col.key]: typeof socket[col.key as keyof Socket] === 'number' ? Number(e.target.value) : e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {socket[col.key as keyof Socket]}
                        {col.key.includes('Count') && col.key.includes('Limit') && (
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            (socket[col.key as keyof Socket] as number) / (socket[col.key.replace('Count', 'Limit') as keyof Socket] as number) > 0.7 ? "bg-red-500" : "bg-green-500"
                          )} />
                        )}
                      </div>
                    )}
                  </td>
                ))}
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setEditingId(socket.id)} className="text-zinc-400 hover:text-[#141414]"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => setModal({ isOpen: true, id: socket.id })} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Confirm Deletion</h3>
            </div>
            <p className="mb-8 text-sm leading-relaxed text-zinc-600">
              Are you sure you want to delete this socket? This action cannot be undone.
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
