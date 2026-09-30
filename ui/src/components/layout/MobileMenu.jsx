import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  SearchCode,
  FileCheck2,
  CheckCircle2,
  History,
  Settings,
  LogOut,
  X,
  Layers
} from 'lucide-react';

export function MobileMenu({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const mainNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resolve Entity', path: '/resolve', icon: SearchCode },
    { label: 'Results', path: '/results', icon: FileCheck2 },
    { label: 'Validation', path: '/validation', icon: CheckCircle2 },
    { label: 'History', path: '/history', icon: History }
  ];

  const systemNav = [
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  const handleLogout = async () => {
    onClose();
    await logout();
    toast.info('Signed out');
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#252522]/80 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative bg-[#252522] w-72 max-w-full flex flex-col h-full z-10 shadow-2xl animate-fade-in border-r border-[#343430]">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#343430]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#343430] border border-[#4A4A43] text-[#C6A15B] flex items-center justify-center font-bold text-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-[#F1EBDD] text-sm">EntityMatch AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#B8B2A5] hover:text-[#F1EBDD] rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold text-[#B8B2A5] uppercase tracking-wider mb-2">Main</p>
            <nav className="space-y-1">
              {mainNav.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#343430] text-[#F1EBDD] font-bold border border-[#4A4A43]'
                          : 'text-[#E9E2D5] hover:bg-[#343430]/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6A15B]' : 'text-[#B8B2A5]'}`} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#B8B2A5] uppercase tracking-wider mb-2">System</p>
            <nav className="space-y-1">
              {systemNav.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#343430] text-[#F1EBDD] font-bold border border-[#4A4A43]'
                          : 'text-[#E9E2D5] hover:bg-[#343430]/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6A15B]' : 'text-[#B8B2A5]'}`} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-[#343430] shrink-0">
          {user && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-[#4A4A43]" />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#F1EBDD] truncate">{user.name}</p>
                  <p className="text-[10px] text-[#B8B2A5] truncate">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#B8B2A5] hover:text-[#A34B40] rounded-md"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

