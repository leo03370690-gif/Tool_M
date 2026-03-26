import React, { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from '../firebase';
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { Plus, Trash2, UserPlus, Shield, User as UserIcon, Users, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { logAuditAction } from '../lib/audit';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(data);
    }, (error) => {
      console.error("Error fetching users:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let secondaryApp;
    try {
      const email = `${newUsername.toLowerCase()}@tooling.local`;
      
      // Initialize a secondary app to create the user without signing out the current admin
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword);
      
      // Sign out the secondary auth just in case
      await signOut(secondaryAuth);
      
      // Use the primary db (admin is still logged in) to create the user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: newUsername,
        role: newRole,
        createdAt: new Date().toISOString()
      });
      
      await logAuditAction('Add User', `Added user ${newUsername} with role ${newRole}`);
      setNewUsername('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('A user with this username already exists.');
      } else {
        alert('Failed to add user: ' + err.message);
      }
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      await updateDoc(doc(db, 'users', userId), { role: editRole });
      await logAuditAction('Update User Role', `Updated role for user ${userToUpdate?.username} to ${editRole}`);
      setEditingUserId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      await deleteDoc(doc(db, 'users', userId));
      await logAuditAction('Delete User', `Deleted user ${userToDelete?.username}`);
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-500">
            <UserPlus className="h-4 w-4" />
            <span>Add New Personnel</span>
          </h3>
          <div className="flex items-center gap-2 rounded-full bg-zinc-200/50 px-3 py-1 text-xs font-bold text-zinc-600">
            <Users className="h-4 w-4" />
            <span>Total: {users.length}</span>
          </div>
        </div>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Username"
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#141414] px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition-all hover:bg-zinc-50">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                user.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
              )}>
                {user.role === 'admin' ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-bold">{user.username}</p>
                {editingUserId === user.id ? (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                    className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">{user.role}</p>
                )}
              </div>
            </div>
            {user.username !== 'Leo.Lo' && user.username !== 'Owner' && (
              <div className="flex items-center gap-2">
                {editingUserId === user.id ? (
                  <>
                    <button 
                      onClick={() => handleUpdateRole(user.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setEditingUserId(null)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setEditingUserId(user.id);
                        setEditRole(user.role);
                      }}
                      className="text-zinc-400 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
