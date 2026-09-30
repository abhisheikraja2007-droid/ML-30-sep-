import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sun, Moon, Check } from 'lucide-react';

export function AppearanceSettings() {
  const { theme, toggleTheme } = useAuth();
  const toast = useToast();

  const handleThemeSelect = (selectedTheme) => {
    toggleTheme(selectedTheme);
    toast.success(`Theme preference updated to ${selectedTheme.toUpperCase()} mode.`);
  };

  return (
    <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 font-sans">
      <h3 className="text-lg font-bold text-[#252522] border-b border-[#C7C0B4] pb-4">
        Interface Theme & Appearance Preferences
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Warm Stone & Gold Theme Card */}
        <div
          onClick={() => handleThemeSelect('light')}
          className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
            theme === 'light'
              ? 'border-[#C6A15B] ring-2 ring-[#C6A15B]/30 bg-[#E6D9B9]'
              : 'border-[#C7C0B4] bg-[#E9E2D5] hover:border-[#AAA194]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#252522]">
              <Sun className="w-5 h-5 text-[#C6A15B]" />
              <span>Graphite + Gold Workspace (Default)</span>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-[#C6A15B]" />}
          </div>
          <p className="text-sm text-[#5E5A51] leading-relaxed">
            Premium Graphite structure (#252522) with Warm Stone workspace (#D9D3C7), Cream surfaces (#F1EBDD), and Champagne Gold (#C6A15B) accents.
          </p>
        </div>

        {/* Charcoal Dark Theme Card */}
        <div
          onClick={() => handleThemeSelect('dark')}
          className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
            theme === 'dark'
              ? 'border-[#C6A15B] ring-2 ring-[#C6A15B]/30 bg-[#E6D9B9]'
              : 'border-[#C7C0B4] bg-[#E9E2D5] hover:border-[#AAA194]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#252522]">
              <Moon className="w-5 h-5 text-[#8A6545]" />
              <span>Deep Graphite Dark Theme</span>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-[#8A6545]" />}
          </div>
          <p className="text-sm text-[#5E5A51] leading-relaxed">
            Deep graphite/stone dark theme (#252522 background). No neon/glowing visual gimmicks.
          </p>
        </div>
      </div>
    </div>
  );
}

