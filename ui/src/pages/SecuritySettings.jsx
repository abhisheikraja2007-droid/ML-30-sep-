import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Lock, ShieldCheck, Key, LogOut } from 'lucide-react';

export function SecuritySettings() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 600));
    setIsSubmitting(false);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated successfully (Simulated).');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-[#252522] border-b border-[#C7C0B4] pb-4 flex items-center gap-2.5">
          <Key className="w-5 h-5 text-[#C6A15B]" />
          <span>Security & Password Credentials</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <label className="block font-semibold text-[#252522] mb-2 text-base">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#252522] mb-2 text-base">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#252522] mb-2 text-base">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#C7C0B4] flex justify-end">
          <Button type="submit" variant="primary" size="md" icon={Lock} isLoading={isSubmitting}>
            Update Password
          </Button>
        </div>
      </form>

      {/* Active Session Info Card */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-[#252522] border-b border-[#C7C0B4] pb-4 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#58704F]" />
          <span>Active Authenticated Session</span>
        </h3>

        <div className="text-base text-[#5E5A51] space-y-3">
          <div className="flex items-center justify-between">
            <span>Session Token:</span>
            <code className="font-mono text-[#5E513F] font-bold">mock_jwt_token_entitymatch_2026</code>
          </div>
          <div className="flex items-center justify-between">
            <span>User Identity:</span>
            <span className="font-bold text-[#252522]">{user?.email}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#C7C0B4] flex justify-end">
          <Button variant="danger" size="md" icon={LogOut} onClick={logout}>
            End Current Session & Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

