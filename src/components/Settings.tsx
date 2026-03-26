import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('User not found');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect current password');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your password');
      } else {
        setError(err.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <h3 className="mb-6 flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-500">
          <KeyRound className="h-5 w-5" />
          <span>Change Password</span>
        </h3>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>Password successfully updated!</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              placeholder="Enter current password"
            />
          </div>

          <div className="pt-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              placeholder="Enter new password (min. 6 characters)"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              placeholder="Confirm new password"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#141414] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
