import React, { useState, useEffect } from 'react';
import { User, ExternalPortalLink, DutyStats } from '../types';
import { api } from '../services/api';
import { 
  Bus, 
  FileText, 
  Table, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Settings, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  portalLinks: ExternalPortalLink[];
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  portalLinks,
  onNavigate
}) => {
  const [stats, setStats] = useState<DutyStats>({
    total_duties: 0,
    total_km: 0,
    total_income: 0,
    total_trips: 0,
    avg_km: 0,
    avg_income: 0,
    avg_load_factor: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch employee's real statistics from MySQL database
    api.getDuties(user, { limit: 1 })
      .then(res => {
        setStats(res.summary);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user]);

  const getPortalUrl = (key: string, fallback: string) => {
    const link = portalLinks.find(p => p.portal_key === key);
    return link ? link.url : fallback;
  };

  const isAdmin = user.emp_type === 'ADMIN' || user.emp_type === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-blue-700/60 relative overflow-hidden">
        {/* Background Emblem Accent */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 opacity-10 pointer-events-none">
          <img src="/icon.svg" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wide">
                Active Staff
              </span>
              <span className="text-xs text-blue-200">
                {user.depot_name} {user.depot_code ? `(${user.depot_code})` : ''}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Namaste, <span className="text-amber-400">{user.full_name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              Welcome to the official UPSRCTC Roadways Digital Duty Portal. Record your daily shifts, inspect monthly logs, and connect to official department portals.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <button
              onClick={() => onNavigate('feed-duty')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Bus className="w-4 h-4" />
              <span>FEED DUTY</span>
            </button>
          </div>
        </div>

        {/* Real Dynamic Metrics Strip (Derived strictly from database - Section 17) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-700/60 text-xs">
          <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
            <p className="text-[11px] text-blue-300 font-medium">Total Duties</p>
            <p className="text-lg sm:text-xl font-bold text-white mt-0.5">
              {loadingStats ? '...' : stats.total_duties}
            </p>
          </div>
          <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
            <p className="text-[11px] text-blue-300 font-medium">Total Distance</p>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5">
              {loadingStats ? '...' : `${stats.total_km.toLocaleString('en-IN')} KM`}
            </p>
          </div>
          <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
            <p className="text-[11px] text-blue-300 font-medium">Total Collection</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">
              {loadingStats ? '...' : `₹${stats.total_income.toLocaleString('en-IN')}`}
            </p>
          </div>
          <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
            <p className="text-[11px] text-blue-300 font-medium">Avg Load Factor</p>
            <p className="text-lg sm:text-xl font-bold text-sky-400 mt-0.5">
              {loadingStats ? '...' : `${stats.avg_load_factor}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Modules (Section 9) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Core Duty Operations &amp; External Portals</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">UPSRCTC V4.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. FEED DUTY */}
          <div
            onClick={() => onNavigate('feed-duty')}
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Bus className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md uppercase tracking-wider">
                  Module 01
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                FEED DUTY
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Record your bus number, route, KM, ticket collection, and daily operational metrics with smart previous-data auto-fill.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-amber-600">
              <span>Open Duty Form</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. SHOW DATA */}
          <div
            onClick={() => onNavigate('show-data')}
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-blue-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Table className="w-6 h-6 text-amber-400" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-md uppercase tracking-wider">
                  Module 02
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                SHOW DATA
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review submitted duty logs, search records by bus or date, verify server calculations, and generate PDF reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-blue-700">
              <span>View Logs &amp; Reports</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. PAY SLIP */}
          <a
            href={getPortalUrl('PAY_SLIP', 'https://payroll.mectoi.in/EmpLogin.aspx')}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-emerald-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span>External</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                PAY SLIP
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Access your official monthly salary slip, allowances, deductions, and payment statements on the payroll server.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
              <span>Open Payroll Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 4. PF PORTAL */}
          <a
            href={getPortalUrl('PF_PORTAL', 'https://passbook.epfindia.gov.in/MemberPassBook/login')}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-sky-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span>EPFO</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                PF PORTAL
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                EPFO Unified Member Passbook login for checking provident fund contribution balances and claims.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:text-sky-800">
              <span>Open EPFO Passbook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 5. CHALLAN */}
          <a
            href={getPortalUrl('CHALLAN', 'https://echallan.parivahan.gov.in/index/challan-print')}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-amber-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span>Parivahan</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-orange-700 transition-colors">
                CHALLAN
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                eChallan Parivahan gateway to check bus registration traffic violation notices, online status, and print receipts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-700 group-hover:text-orange-800">
              <span>Check eChallan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 6. MANAV SAMPADA */}
          <a
            href={getPortalUrl('MANAV_SAMPADA', 'https://ehrms.upsdc.gov.in/')}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/90 hover:border-purple-500 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <span>eHRMS UP</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                MANAV SAMPADA
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Uttar Pradesh electronic Human Resource Management System for official leave applications and service records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-800">
              <span>Open Manav Sampada</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 7. ADMIN PANEL (Only if ADMIN or SUPER_ADMIN) */}
          {isAdmin && (
            <div
              onClick={() => onNavigate('admin')}
              className="group bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 shadow-sm hover:shadow-xl border border-amber-500/40 hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Settings className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md uppercase tracking-wider">
                    Administrative
                  </span>
                </div>
                <h4 className="text-base font-black text-amber-400 group-hover:text-white transition-colors">
                  ADMIN PANEL
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Manage registered drivers, conductors, depots, configure external portal URLs, partner branding, and view audit trails.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-white">
                <span>Open Management Console</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
