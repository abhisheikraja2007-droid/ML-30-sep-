import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react';

export function Topbar({ onToggleMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') return [{ label: 'Dashboard', path: '/dashboard' }];
    if (path === '/resolve') return [{ label: 'Resolve Entity', path: '/resolve' }];
    if (path.startsWith('/resolve/')) {
      const parts = path.split('/');
      const s1Id = parts[2];
      const isCompare = parts[3] === 'compare';
      const candId = parts[4];

      const crumbs = [
        { label: 'Resolve Entity', path: '/resolve' },
        { label: s1Id, path: `/resolve/${s1Id}` }
      ];

      if (isCompare && candId) {
        crumbs.push({ label: `Compare ${candId}`, path: location.pathname });
      }
      return crumbs;
    }
    if (path === '/results') return [{ label: 'Results', path: '/results' }];
    if (path.startsWith('/results/')) {
      const s1Id = path.split('/')[2];
      return [
        { label: 'Results', path: '/results' },
        { label: `Result (${s1Id})`, path: path }
      ];
    }
    if (path === '/validation') return [{ label: 'Validation', path: '/validation' }];
    if (path === '/history') return [{ label: 'History', path: '/history' }];
    if (path.startsWith('/settings')) {
      const sub = path.split('/')[2] || 'profile';
      return [
        { label: 'Settings', path: '/settings' },
        { label: sub.charAt(0).toUpperCase() + sub.slice(1), path: path }
      ];
    }
    return [{ label: 'Platform', path: '/dashboard' }];
  };

  const crumbs = getBreadcrumbs();

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const term = globalSearch.trim();
    setGlobalSearch('');
    if (term.toUpperCase().startsWith('S1-')) {
      navigate(`/resolve/${term.toUpperCase()}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(term)}`);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <header className="h-20 bg-[#343430] border-b border-[#4A4A43] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20 font-sans">
      {/* Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-[#F1EBDD] hover:bg-[#4A4A43] rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <nav className="flex items-center gap-2 text-sm text-[#B8B2A5] font-medium overflow-hidden">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-[#8B877C] shrink-0" />}
              {idx === crumbs.length - 1 ? (
                <span className="text-[#F1EBDD] font-bold tracking-tight text-base truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className="hover:text-[#C6A15B] transition-colors truncate">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Global Quick Search & User Dropdown */}
      <div className="flex items-center gap-4">
        {/* Quick Search Field */}
        <form onSubmit={handleGlobalSearch} className="hidden md:block relative">
          <Search className="w-4 h-4 text-[#B8B2A5] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search S1- ID or business name..."
            className="w-72 pl-10 pr-4 py-2 text-sm bg-[#4A4A43] border border-[#8B877C]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] text-[#F1EBDD] placeholder-[#B8B2A5] font-sans"
          />
        </form>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#4A4A43] transition-colors"
          >
            <img
              src={user?.avatar}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-[#8B877C]"
            />
            <span className="hidden sm:inline text-sm font-bold text-[#F1EBDD]">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-3 w-64 bg-[#343430] border border-[#4A4A43] rounded-xl shadow-xl py-2 z-50 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-[#4A4A43]">
                <p className="text-sm font-bold text-[#F1EBDD]">{user?.name}</p>
                <p className="text-xs text-[#B8B2A5] truncate mt-0.5">{user?.email}</p>
              </div>

              <Link
                to="/settings/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#F1EBDD] hover:bg-[#4A4A43] font-semibold"
              >
                <User className="w-4 h-4 text-[#C6A15B]" />
                <span>Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#F1EBDD] hover:bg-[#4A4A43] font-semibold"
              >
                <Settings className="w-4 h-4 text-[#C6A15B]" />
                <span>Settings</span>
              </Link>

              <Link
                to="/history"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#F1EBDD] hover:bg-[#4A4A43] font-semibold"
              >
                <HelpCircle className="w-4 h-4 text-[#C6A15B]" />
                <span>Help & Workflow</span>
              </Link>

              <div className="border-t border-[#4A4A43] my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-[#A34B40] hover:bg-[#4A4A43] text-left font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

