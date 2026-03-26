import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Map username to email for Firebase Auth
    // Default user: Leo.Lo / 123456
    const email = username.includes('@') ? username : `${username.toLowerCase()}@tooling.local`;

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If it's the default user and login fails, try to create it (seed)
        if (username.toLowerCase() === 'leo.lo' && password === '123456') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Invalid password');
            }
            throw createErr;
          }
        } else {
          throw err;
        }
      }

      // Ensure Firestore document exists for default admin
      const isDefaultAdmin = username.toLowerCase() === 'leo.lo' && password === '123456';
      if (isDefaultAdmin && userCredential) {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            username: 'Leo.Lo',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err: any) {
      setError('Invalid username or password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E4E3E0] p-4 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="bg-[#141414] p-8 text-center text-white">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-white/10 p-3">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl italic tracking-tight">Tooling Master</h1>
          <p className="mt-2 text-sm text-zinc-400 uppercase tracking-widest">Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 p-8">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm transition-all focus:border-[#141414] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              placeholder="e.g. Leo.Lo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm transition-all focus:border-[#141414] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#141414] py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>SIGN IN</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-zinc-100 bg-zinc-50 p-4 text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
