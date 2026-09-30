import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ProfileSettings } from './ProfileSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SecuritySettings } from './SecuritySettings';
import { Settings as SettingsIcon, User, Sun, Shield } from 'lucide-react';

export function Settings() {
  const location = useLocation();
  const path = location.pathname;

  let activeTab = 'profile';
  if (path.includes('/appearance')) activeTab = 'appearance';
  else if (path.includes('/security')) activeTab = 'security';

  const navTabs = [
    { id: 'profile', label: 'Profile Identity', path: '/settings/profile', icon: User },
    { id: 'appearance', label: 'Theme & Appearance', path: '/settings/appearance', icon: Sun },
    { id: 'security', label: 'Security & Auth', path: '/settings/security', icon: Shield }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#252522] flex items-center gap-3 tracking-tight">
            <SettingsIcon className="w-8 h-8 text-[#C6A15B] shrink-0" />
            <span>Platform Preferences & Settings</span>
          </h1>
          <p className="text-base text-[#5E5A51] mt-1">
            Manage account profile identity, theme appearance mode (Light/Dark), and security credentials
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#C7C0B4]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#252522] text-[#F1EBDD] border border-[#4A4A43] shadow-xs'
                    : 'bg-[#E9E2D5] text-[#252522] border border-[#C7C0B4] hover:bg-[#E6E0D4]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6A15B]' : 'text-[#7E796E]'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Render Active Settings Sub-Tab */}
      {activeTab === 'profile' && <ProfileSettings />}
      {activeTab === 'appearance' && <AppearanceSettings />}
      {activeTab === 'security' && <SecuritySettings />}
    </div>
  );
}

