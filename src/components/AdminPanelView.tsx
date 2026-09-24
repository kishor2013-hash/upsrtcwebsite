import React, { useState, useEffect } from 'react';
import { User, ExternalPortalLink, AppSettings, DepotItem, AuditLogItem } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Bus, 
  Link as LinkIcon, 
  Settings, 
  FileText, 
  ArrowLeft, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Lock,
  Globe,
  Phone,
  RefreshCw
} from 'lucide-react';

interface AdminPanelViewProps {
  user: User;
  settings: AppSettings;
  portalLinks: ExternalPortalLink[];
  onNavigate: (view: string) => void;
  onSettingsUpdated: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  user,
  settings,
  portalLinks,
  onNavigate,
  onSettingsUpdated
}) => {
  const isAdmin = user.emp_type === 'ADMIN' || user.emp_type === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'USERS' | 'DEPOTS' | 'PORTALS' | 'SETTINGS' | 'LOGS'>('USERS');

  // Users Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Depots State
  const [depotsList, setDepotsList] = useState<DepotItem[]>([]);
  const [newDepotCode, setNewDepotCode] = useState('');
  const [newDepotName, setNewDepotName] = useState('');
  const [newDepotRegion, setNewDepotRegion] = useState('');
  const [showAddDepot, setShowAddDepot] = useState(false);

  // Portal Links State
  const [urls, setUrls] = useState<Record<string, string>>({
    PAY_SLIP: 'https://payroll.mectoi.in/EmpLogin.aspx',
    PF_PORTAL: 'https://passbook.epfindia.gov.in/MemberPassBook/login',
    CHALLAN: 'https://echallan.parivahan.gov.in/index/challan-print',
    MANAV_SAMPADA: 'https://ehrms.upsdc.gov.in/'
  });

  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({ ...settings });

  // Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  // Notification state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync portal URLs
  useEffect(() => {
    const map: Record<string, string> = {};
    portalLinks.forEach(p => {
      map[p.portal_key] = p.url;
    });
    setUrls(prev => ({ ...prev, ...map }));
  }, [portalLinks]);

  // Sync settings
  useEffect(() => {
    setAppSettings({ ...settings });
  }, [settings]);

  // Load tab data
  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'USERS') {
      setLoadingUsers(true);
      api.getAdminUsers(usersSearch)
        .then(setUsersList)
        .finally(() => setLoadingUsers(false));
    } else if (activeTab === 'DEPOTS') {
      api.getDepots().then(setDepotsList);
    } else if (activeTab === 'LOGS') {
      api.getAuditLogs().then(res => setLogs(res.logs));
    }
  }, [isAdmin, activeTab, usersSearch]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-rose-200 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">
          Access Denied
        </h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          You do not have administrative privileges to access this console. Only designated UPSRCTC Administrators and Depot Super Admins can manage portal settings.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-5 px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleToggleUserStatus = async (targetUser: User) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await api.updateAdminUser(targetUser.id, nextStatus);
    if (res.success) {
      setAlert({ type: 'success', text: `User ${targetUser.emp_id} status updated to ${nextStatus}.` });
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: nextStatus } : u));
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleAddDepot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepotCode || !newDepotName) return;
    const res = await api.addDepot(newDepotCode, newDepotName, newDepotRegion || 'Uttar Pradesh');
    if (res.success) {
      setAlert({ type: 'success', text: 'Depot added successfully.' });
      setNewDepotCode('');
      setNewDepotName('');
      setNewDepotRegion('');
      setShowAddDepot(false);
      api.getDepots().then(setDepotsList);
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleSavePortals = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateSettings(urls, {});
    if (res.success) {
      setAlert({ type: 'success', text: 'External portal links saved successfully.' });
      onSettingsUpdated();
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateSettings({}, appSettings);
    if (res.success) {
      setAlert({ type: 'success', text: 'Partner & Application settings updated.' });
      onSettingsUpdated();
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-900 font-bold rounded-lg text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Authenticated Admin: {user.full_name}</span>
          </span>
        </div>
      </div>

      {/* Main Admin Console Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 border-b-2 border-amber-500">
          <h2 className="text-xl font-black text-amber-400 uppercase tracking-wide">
            UPSRCTC Administrative Control Console
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage system users, master depots, external portal links, and Grofasto partner configuration.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { id: 'USERS', label: 'Employees / Users', icon: Users },
              { id: 'DEPOTS', label: 'Depot Masters', icon: Bus },
              { id: 'PORTALS', label: 'External Portal URLs', icon: LinkIcon },
              { id: 'SETTINGS', label: 'Partner & App Settings', icon: Settings },
              { id: 'LOGS', label: 'Audit Trail', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setAlert(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Notification Alert */}
          {alert && (
            <div
              className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                alert.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {alert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{alert.text}</span>
            </div>
          )}

          {/* TAB 1: USERS */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Employee ID, Name, Mobile, Email..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {usersList.length} Staff Members Registered
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Emp ID / CND</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-blue-950">{u.emp_id}</td>
                          <td className="p-3 font-semibold text-slate-900">{u.full_name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              {u.emp_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{u.depot_name}</td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            <div>{u.mobile}</div>
                            <div>{u.email}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DEPOTS */}
          {activeTab === 'DEPOTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  UPSRCTC Operational Depots
                </h3>
                <button
                  onClick={() => setShowAddDepot(!showAddDepot)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Depot</span>
                </button>
              </div>

              {showAddDepot && (
                <form onSubmit={handleAddDepot} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Depot Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AGRA"
                      value={newDepotCode}
                      onChange={(e) => setNewDepotCode(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">Depot Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Agra Fort Depot"
                      value={newDepotName}
                      onChange={(e) => setNewDepotName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Agra"
                      value={newDepotRegion}
                      onChange={(e) => setNewDepotRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDepot(false)}
                      className="px-3 py-1 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer"
                    >
                      Save Depot
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {depotsList.map((d) => (
                  <div key={d.depot_code} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{d.depot_name}</p>
                      <p className="text-[11px] text-slate-500">Region: {d.region}</p>
                    </div>
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-blue-900 text-[11px]">
                      {d.depot_code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PORTALS */}
          {activeTab === 'PORTALS' && (
            <form onSubmit={handleSavePortals} className="space-y-4 max-w-2xl text-xs">
              <p className="text-slate-500 leading-relaxed">
                Configure official URLs for external portal cards displayed on the employee dashboard (Section 20).
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">1. PAY SLIP Portal URL</label>
                <input
                  type="url"
                  required
                  value={urls.PAY_SLIP || ''}
                  onChange={(e) => setUrls({ ...urls, PAY_SLIP: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">2. PF PORTAL URL (EPFO)</label>
                <input
                  type="url"
                  required
                  value={urls.PF_PORTAL || ''}
                  onChange={(e) => setUrls({ ...urls, PF_PORTAL: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">3. CHALLAN Portal URL (Parivahan)</label>
                <input
                  type="url"
                  required
                  value={urls.CHALLAN || ''}
                  onChange={(e) => setUrls({ ...urls, CHALLAN: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">4. MANAV SAMPADA Portal URL</label>
                <input
                  type="url"
                  required
                  value={urls.MANAV_SAMPADA || ''}
                  onChange={(e) => setUrls({ ...urls, MANAV_SAMPADA: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Portal URLs to Database</span>
              </button>
            </form>
          )}

          {/* TAB 4: SETTINGS & GROFASTO PARTNER */}
          {activeTab === 'SETTINGS' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-3 text-amber-900">
                <p className="font-bold">Grofasto Digital Solutions Technology Partner Setup</p>
                <p className="text-[11px] mt-0.5">
                  As mandated in Section 21 &amp; 31, these values power the footer across all views and can be updated from this panel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Portal Name</label>
                  <input
                    type="text"
                    value={appSettings.app_title}
                    onChange={(e) => setAppSettings({ ...appSettings, app_title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Version / Subtitle</label>
                  <input
                    type="text"
                    value={appSettings.app_subtitle}
                    onChange={(e) => setAppSettings({ ...appSettings, app_subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Partner Organization</label>
                  <input
                    type="text"
                    value={appSettings.partner_name}
                    onChange={(e) => setAppSettings({ ...appSettings, partner_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Partner Tagline</label>
                  <input
                    type="text"
                    value={appSettings.partner_tagline}
                    onChange={(e) => setAppSettings({ ...appSettings, partner_tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Partner Helpline Phone</label>
                  <input
                    type="text"
                    value={appSettings.partner_phone}
                    onChange={(e) => setAppSettings({ ...appSettings, partner_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Partner Website URL</label>
                  <input
                    type="text"
                    value={appSettings.partner_website}
                    onChange={(e) => setAppSettings({ ...appSettings, partner_website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Application Settings</span>
              </button>
            </form>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider">
                  Security &amp; Operational Audit Trail
                </span>
                <span className="text-slate-400 font-mono">{logs.length} Total Log Entries</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5 pl-4">Timestamp</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Emp ID</th>
                      <th className="p-2.5">IP / Device</th>
                      <th className="p-2.5 pr-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      logs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-2.5 pl-4 text-slate-500">{l.created_at}</td>
                          <td className="p-2.5 font-bold text-blue-900">{l.action}</td>
                          <td className="p-2.5 font-bold text-slate-800">{l.emp_id || '-'}</td>
                          <td className="p-2.5 text-slate-500 truncate max-w-xs">{l.ip_address}</td>
                          <td className="p-2.5 pr-4 text-slate-600">{l.record_id || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
