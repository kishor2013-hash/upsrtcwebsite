import React, { useState, useEffect } from 'react';
import { User, AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  LogOut, 
  User as UserIcon, 
  Clock, 
  Calendar, 
  Shield, 
  Bus,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  user: User;
  settings: AppSettings;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  currentView,
  onNavigate,
  onLogout
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = user.emp_type === 'ADMIN' || user.emp_type === 'SUPER_ADMIN';

  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xl border-b-2 border-amber-500 sticky top-0 z-40">
      {/* Top Banner: UPSRCTC Branding & Live Clock */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Brand & Emblem */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-blue-950 rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
                  <img 
                    src="/icon.svg" 
                    alt="UPSRCTC Emblem" 
                    className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform" 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-wider text-amber-400 uppercase drop-shadow-xs leading-tight">
                    {settings.app_title || 'UPSRCTC ROADWAYS'}
                  </h1>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded tracking-wider">
                    V4.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium tracking-wide">
                  उत्तर प्रदेश राज्य सड़क परिवहन निगम • Digital Duty Portal
                </p>
              </div>
            </div>

            {/* Mobile PWA Install & Logout quick access */}
            <div className="flex items-center gap-1.5 md:hidden">
              <PWAInstallButton compact={true} />
              <button
                onClick={onLogout}
                aria-label="Logout"
                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center / Right: Live Clock & Date Badge */}
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-3 bg-blue-950/70 border border-blue-800/80 px-3 py-1.5 rounded-xl shadow-inner text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">{dateStr}</span>
              </div>
              <div className="h-3 w-px bg-blue-700/80"></div>
              <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{time}</span>
              </div>
            </div>

            {/* Desktop PWA Install Button */}
            <div className="hidden md:block">
              <PWAInstallButton compact={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Header: Authenticated Employee Credentials Strip */}
      <div className="bg-blue-950/90 border-t border-blue-800/60 px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Employee Identity Badges */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700/70 px-2.5 py-1 rounded-lg">
              <span className="text-slate-400 font-medium">Employee:</span>
              <span className="font-bold text-white tracking-wide">{user.full_name}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700/70 px-2.5 py-1 rounded-lg">
              <span className="text-slate-400 font-medium">CND / ID:</span>
              <span className="font-bold font-mono text-amber-300">{user.emp_id}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700/70 px-2.5 py-1 rounded-lg">
              <span className="text-slate-400 font-medium">Role:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider ${
                user.emp_type === 'DRIVER' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : user.emp_type === 'CONDUCTOR'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {user.emp_type}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-blue-900/80 border border-blue-700/70 px-2.5 py-1 rounded-lg">
              <Bus className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-medium">Depot:</span>
              <span className="font-bold text-slate-200">{user.depot_name}</span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                currentView === 'profile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-rose-300 hover:text-white hover:bg-rose-600/80 transition cursor-pointer border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
