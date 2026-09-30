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
  Layers,
  Sparkles
} from 'lucide-react';

export function Sidebar({ collapsed = false }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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
    await logout();
    toast.info('Signed out of EntityMatch AI');
    navigate('/login');
  };

  return (
    <aside className={`bg-[#252522] border-r border-[#343430] flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-[260px]'} shrink-0 h-screen sticky top-0 z-30 select-none font-sans`}>
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center gap-3.5 border-b border-[#343430] shrink-0 bg-[#252522]">
        <div className="w-10 h-10 rounded-xl bg-[#343430] border border-[#4A4A43] text-[#C6A15B] flex items-center justify-center font-bold shrink-0 shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-extrabold text-[#F1EBDD] tracking-tight leading-tight truncate">
              EntityMatch AI
            </h1>
            <p className="text-xs font-bold text-[#C6A15B] tracking-wider uppercase truncate">
              Entity Resolution Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
        {/* MAIN NAVIGATION */}
        <div>
          {!collapsed && (
            <p className="px-3 text-xs font-bold text-[#B8B2A5] tracking-wider uppercase mb-3">
              Main
            </p>
          )}
          <nav className="space-y-1.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-[15px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#343430] text-[#F1EBDD] font-bold border border-[#4A4A43]'
                        : 'text-[#E9E2D5] hover:bg-[#343430]/60 hover:text-[#F1EBDD]'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#C6A15B] rounded-r-md" />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#C6A15B]' : 'text-[#B8B2A5]'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* SYSTEM NAVIGATION */}
        <div>
          {!collapsed && (
            <p className="px-3 text-xs font-bold text-[#B8B2A5] tracking-wider uppercase mb-3">
              System
            </p>
          )}
          <nav className="space-y-1.5">
            {systemNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-[15px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#343430] text-[#F1EBDD] font-bold border border-[#4A4A43]'
                        : 'text-[#E9E2D5] hover:bg-[#343430]/60 hover:text-[#F1EBDD]'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#C6A15B] rounded-r-md" />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#C6A15B]' : 'text-[#B8B2A5]'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Multi-Source Resolution Info Card */}
        {!collapsed && (
          <div className="p-4 bg-[#343430] border border-[#4A4A43] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#F1EBDD] text-sm">
              <Sparkles className="w-4 h-4 text-[#C6A15B] shrink-0" />
              <span>Multi-Source Resolution</span>
            </div>
            <p className="text-[#B8B2A5] text-xs leading-relaxed">
              Source 1 reference record matching against Source 2 & Source 3 records.
            </p>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#343430] shrink-0 bg-[#252522]">
        <div className="flex items-center justify-between gap-3">
          {!collapsed && user && (
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-[#4A4A43] shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#F1EBDD] truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-[#B8B2A5] truncate mt-0.5">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-[#B8B2A5] hover:text-[#A34B40] rounded-lg hover:bg-[#343430] transition-colors shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

