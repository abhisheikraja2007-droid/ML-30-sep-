import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { User, Mail, Building, Save } from 'lucide-react';

export function ProfileSettings() {
  const { user } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || 'Sarah Jenkins');
  const [email, setEmail] = useState(user?.email || 'demo@entitymatch.ai');
  const [role, setRole] = useState(user?.role || 'Senior Data Engineer');
  const [org, setOrg] = useState(user?.organization || 'EntityMatch Global Inc.');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 500));
    setIsSaving(false);
    toast.success('Profile preferences updated.');
  };

  return (
    <form onSubmit={handleSave} className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 font-sans">
      <h3 className="text-lg font-bold text-[#252522] border-b border-[#C7C0B4] pb-4">
        User Account Profile Identity
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="block font-semibold text-[#252522] mb-1.5 text-base">Full Name</label>
          <div className="relative">
            <User className="w-5 h-5 text-[#7E796E] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#252522] mb-1.5 text-base">Email Address</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-[#7E796E] absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#252522] mb-1.5 text-base">Professional Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#252522] mb-1.5 text-base">Organization</label>
          <div className="relative">
            <Building className="w-5 h-5 text-[#7E796E] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#E9E2D5] border border-[#B8B2A5] rounded-lg text-base text-[#252522] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] min-h-[46px]"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#C7C0B4] flex justify-end">
        <Button type="submit" variant="primary" size="md" icon={Save} isLoading={isSaving}>
          Save Profile Changes
        </Button>
      </div>
    </form>
  );
}

