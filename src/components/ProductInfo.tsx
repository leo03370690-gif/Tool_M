import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  facility: string;
  device: string;
  projectName: string;
  nickname: string;
  tester: string;
  handler: string;
  temperature: string;
  insertion: string;
  siteNumber: string;
  ballCountDevice: string;
  changeKitGroup: string;
  kitName1: string;
  kitName2: string;
  kitName3: string;
  kitName4: string;
  lbGroup: string;
  socketName1: string;
  socketName2: string;
}

export default function ProductInfo({ isAdmin }: { isAdmin: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});

  const [modal, setModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('device'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newProduct.device) return;
    await addDoc(collection(db, 'products'), newProduct);
    setNewProduct({});
    setEditingId(null);
  };

  const handleUpdate = async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(db, 'products', id), data);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (modal.id) {
      await deleteDoc(doc(db, 'products', modal.id));
      setModal({ isOpen: false, id: null });
    }
  };

  const filteredProducts = products.filter(p => 
    (p.device || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nickname || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'facility', label: 'Facility' },
    { key: 'device', label: 'Device' },
    { key: 'projectName', label: 'Project name' },
    { key: 'nickname', label: 'Nickname' },
    { key: 'tester', label: 'Tester' },
    { key: 'handler', label: 'Handler' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'insertion', label: 'Insertion' },
    { key: 'siteNumber', label: 'Site number' },
    { key: 'ballCountDevice', label: 'Ball count(device)' },
    { key: 'changeKitGroup', label: 'Change kit Group' },
    { key: 'kitName1', label: 'Kit Name1' },
    { key: 'kitName2', label: 'Kit Name2' },
    { key: 'kitName3', label: 'Kit Name3' },
    { key: 'kitName4', label: 'Kit Name4' },
    { key: 'lbGroup', label: 'LB Group' },
    { key: 'socketName1', label: 'Socket Name1' },
    { key: 'socketName2', label: 'Socket Name2' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-[#141414] focus:bg-white focus:outline-none"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => setEditingId('new')}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            <span>ADD PRODUCT</span>
          </button>
        )}
      </div>

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
            {editingId === 'new' && (
              <tr className="bg-zinc-50/50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
                      onChange={(e) => setNewProduct({ ...newProduct, [col.key]: e.target.value })}
                    />
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button onClick={handleAdd} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-zinc-400 hover:text-zinc-500"><X className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            )}
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-zinc-600">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        defaultValue={product[col.key as keyof Product] as string}
                        className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
                        onBlur={(e) => handleUpdate(product.id, { [col.key]: e.target.value })}
                      />
                    ) : (
                      product[col.key as keyof Product]
                    )}
                  </td>
                ))}
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setEditingId(product.id)} className="text-zinc-400 hover:text-[#141414]"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => setModal({ isOpen: true, id: product.id })} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
              Are you sure you want to delete this product? This action cannot be undone.
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
