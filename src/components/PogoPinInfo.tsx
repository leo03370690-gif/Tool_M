import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

interface PogoPin {
  id: string;
  facility: string;
  pinPn: string;
  qty: number;
}

export default function PogoPinInfo({ isAdmin }: { isAdmin: boolean }) {
  const [pins, setPins] = useState<PogoPin[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });

  useEffect(() => {
    const q = query(collection(db, 'pogoPins'), orderBy('pinPn'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PogoPin));
      setPins(data);
    }, (error) => {
      console.error("Error fetching pogo pins:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async (id: string, data: Partial<PogoPin>) => {
    await updateDoc(doc(db, 'pogoPins', id), data);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (modal.id) {
      await deleteDoc(doc(db, 'pogoPins', modal.id));
      setModal({ isOpen: false, id: null });
    }
  };

  const filteredPins = pins.filter(p => 
    (p.pinPn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search pins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-[#141414] focus:bg-white focus:outline-none"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={async () => {
              const docRef = await addDoc(collection(db, 'pogoPins'), { pinPn: 'NEW_PIN', qty: 0, facility: '' });
              setEditingId(docRef.id);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            <span>ADD PIN</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPins.map(pin => (
          <div key={pin.id} className="group relative rounded-xl border border-zinc-200 bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-black/5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Facility</p>
                {editingId === pin.id ? (
                  <input
                    type="text"
                    defaultValue={pin.facility || ''}
                    className="w-full border-b border-[#141414] bg-transparent text-sm font-bold focus:outline-none"
                    onBlur={(e) => handleUpdate(pin.id, { facility: e.target.value })}
                  />
                ) : (
                  <h3 className="text-sm font-bold text-zinc-600">{pin.facility || '-'}</h3>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Part Number</p>
                {editingId === pin.id ? (
                  <input
                    type="text"
                    defaultValue={pin.pinPn}
                    className="w-full border-b border-[#141414] bg-transparent text-lg font-bold focus:outline-none"
                    onBlur={(e) => handleUpdate(pin.id, { pinPn: e.target.value })}
                  />
                ) : (
                  <h3 className="text-lg font-bold">{pin.pinPn}</h3>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quantity</p>
                {editingId === pin.id ? (
                  <input
                    type="number"
                    defaultValue={pin.qty}
                    className="w-20 border-b border-[#141414] bg-transparent text-2xl font-bold focus:outline-none"
                    onBlur={(e) => handleUpdate(pin.id, { qty: Number(e.target.value) })}
                  />
                ) : (
                  <p className="text-2xl font-bold text-[#141414]">{pin.qty}</p>
                )}
              </div>
            </div>
            
            {isAdmin && (
              <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setEditingId(pin.id)} className="rounded-lg bg-zinc-100 p-2 text-zinc-500 hover:bg-[#141414] hover:text-white">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setModal({ isOpen: true, id: pin.id })} className="rounded-lg bg-zinc-100 p-2 text-zinc-500 hover:bg-red-600 hover:text-white">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

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
              Are you sure you want to delete this pogo pin? This action cannot be undone.
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
