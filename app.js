/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Standalone Vanilla JavaScript Application
 * Technology Partner: Grofasto Digital Solutions (www.grofasto.com)
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const SESSION_KEY = 'upsrctc_active_session_token';
  const STORAGE_KEYS = {
    USERS: 'upsrctc_db_users',
    DUTIES: 'upsrctc_db_duty_records',
    DRAFTS: 'upsrctc_db_duty_drafts',
    SETTINGS: 'upsrctc_db_settings',
    PORTALS: 'upsrctc_db_portals',
    DEPOTS: 'upsrctc_db_depots',
    LOGS: 'upsrctc_db_audit_logs'
  };

  const DEFAULT_SETTINGS = {
    app_title: 'UPSRCTC ROADWAYS',
    app_subtitle: 'DIGITAL DUTY PORTAL V4.0',
    partner_name: 'Grofasto Digital Solutions',
    partner_tagline: 'GROW | CONNECT | SUCCEED.',
    partner_phone: '+91 9457690255',
    partner_website: 'www.grofasto.com',
    allow_registration: '1'
  };

  const DEFAULT_PORTALS = [
    { portal_key: 'PAY_SLIP', portal_name: 'Pay Slip Portal', url: 'https://payroll.mectoi.in/EmpLogin.aspx', icon: 'credit-card', desc: 'UPSRCTC Employee Payroll & Monthly Slip Portal' },
    { portal_key: 'PF_PORTAL', portal_name: 'PF Portal', url: 'https://passbook.epfindia.gov.in/MemberPassBook/login', icon: 'shield-check', desc: 'EPFO Unified Member Passbook & Provident Fund' },
    { portal_key: 'CHALLAN', portal_name: 'Challan Portal', url: 'https://echallan.parivahan.gov.in/index/challan-print', icon: 'alert-triangle', desc: 'eChallan Parivahan Portal for Traffic Status' },
    { portal_key: 'MANAV_SAMPADA', portal_name: 'Manav Sampada', url: 'https://ehrms.upsdc.gov.in/', icon: 'users', desc: 'Uttar Pradesh Electronic Human Resource Management' }
  ];

  const DEFAULT_DEPOTS = [
    { id: 1, depot_code: 'SOHRAB', depot_name: 'Sohrab Gate Depot', region: 'Meerut' },
    { id: 2, depot_code: 'MEERUT', depot_name: 'Meerut Depot', region: 'Meerut' },
    { id: 3, depot_code: 'GZB', depot_name: 'Ghaziabad Depot', region: 'Ghaziabad' },
    { id: 4, depot_code: 'NOIDA', depot_name: 'Noida Depot', region: 'Noida' },
    { id: 5, depot_code: 'AGRA', depot_name: 'Agra Fort Depot', region: 'Agra' },
    { id: 6, depot_code: 'ALIG', depot_name: 'Aligarh Depot', region: 'Aligarh' },
    { id: 7, depot_code: 'MB', depot_name: 'Moradabad Depot', region: 'Moradabad' },
    { id: 8, depot_code: 'BLY', depot_name: 'Bareilly Old Depot', region: 'Bareilly' },
    { id: 9, depot_code: 'LKO_CB', depot_name: 'Charbagh Depot Lucknow', region: 'Lucknow' },
    { id: 10, depot_code: 'KNP', depot_name: 'Kanpur Central Depot', region: 'Kanpur' },
    { id: 11, depot_code: 'VNS', depot_name: 'Varanasi Cantt Depot', region: 'Varanasi' },
    { id: 12, depot_code: 'GKP', depot_name: 'Gorakhpur Depot', region: 'Gorakhpur' },
    { id: 13, depot_code: 'AYD', depot_name: 'Ayodhya Dham Depot', region: 'Ayodhya' }
  ];

  // Helper storage functions
  function getStore(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  }
  function setStore(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }

  function addAudit(userId, empId, action, recordId, details) {
    const list = getStore(STORAGE_KEYS.LOGS, []);
    list.unshift({
      id: Date.now(),
      user_id: userId,
      emp_id: empId,
      action: action || 'ACTION',
      record_id: recordId,
      ip_address: '127.0.0.1 (Web)',
      user_agent: navigator.userAgent.substring(0, 80),
      details: details,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    setStore(STORAGE_KEYS.LOGS, list.slice(0, 200));
  }

  // --- Global Application State ---
  const state = {
    currentUser: null,
    currentView: 'dashboard', // 'dashboard', 'feed-duty', 'show-data', 'profile', 'admin'
    authView: 'LOGIN', // 'LOGIN', 'REGISTER'
    showForgotPassword: false,
    settings: DEFAULT_SETTINGS,
    portals: DEFAULT_PORTALS,
    depots: DEFAULT_DEPOTS,
    duties: [],
    drafts: [],
    stats: { total_duties: 0, total_km: 0, total_income: 0, total_trips: 0, avg_km: 0, avg_income: 0, avg_load_factor: 0 },
    deferredPrompt: null,
    isPWAInstalled: false,
    selectedPdfRecord: null,
    selectedDetailRecord: null
  };

  // Safe API helper (hits PHP backend on Hostinger, falls back to local storage engine)
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
        credentials: 'include'
      });
      const cType = res.headers.get('content-type') || '';
      if (res.status === 404 || cType.includes('text/html')) {
        return { ok: false, fallback: true };
      }
      const data = await res.json();
      return { ok: true, data, fallback: false };
    } catch (e) {
      return { ok: false, fallback: true };
    }
  }

  // --- API Client Methods ---
  const api = {
    async checkSession() {
      const res = await apiFetch('/api/auth/me.php');
      if (res.ok && res.data && res.data.user) {
        return res.data.user;
      }
      const uid = localStorage.getItem(SESSION_KEY);
      if (!uid) return null;
      const users = getStore(STORAGE_KEYS.USERS, []);
      return users.find(u => String(u.id) === String(uid) && u.status === 'ACTIVE') || null;
    },

    async login(loginId, password) {
      const res = await apiFetch('/api/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ login_id: loginId.trim(), password })
      });
      if (!res.fallback) return res.data;

      // Local engine fallback
      const users = getStore(STORAGE_KEYS.USERS, []);
      const clean = loginId.trim().toLowerCase();
      const u = users.find(x => (x.email && x.email.toLowerCase() === clean) || (x.emp_id && x.emp_id.toLowerCase() === clean));
      if (!u || u.password !== password) {
        return { success: false, message: 'Invalid Login ID / Email or Password.' };
      }
      if (u.status !== 'ACTIVE') {
        return { success: false, message: 'Account is ' + u.status.toLowerCase() + '. Contact your depot administrator.' };
      }
      localStorage.setItem(SESSION_KEY, String(u.id));
      addAudit(u.id, u.emp_id, 'LOGIN', String(u.id));
      return { success: true, user: u };
    },

    async register(data) {
      const res = await apiFetch('/api/auth/register.php', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.fallback) return res.data;

      const users = getStore(STORAGE_KEYS.USERS, []);
      const cleanEmail = data.email.trim().toLowerCase();
      const cleanEmpId = data.emp_id.trim().toUpperCase();
      const cleanMobile = data.mobile.replace(/\D/g, '');

      if (users.some(x => x.email && x.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'This email is already registered.' };
      }
      if (users.some(x => x.emp_id && x.emp_id.toUpperCase() === cleanEmpId)) {
        return { success: false, message: 'This Employee ID / CND is already registered.' };
      }

      const newId = users.length ? Math.max(...users.map(u => u.id || 1)) + 1 : 101;
      const newUser = {
        id: newId,
        emp_id: cleanEmpId,
        full_name: data.full_name.trim(),
        email: cleanEmail,
        mobile: cleanMobile,
        password: data.password,
        emp_type: data.emp_type,
        depot_name: data.depot_name.trim(),
        depot_code: data.depot_code || '',
        designation: data.designation || (data.emp_type === 'DRIVER' ? 'Roadways Driver' : 'Roadways Conductor'),
        address: data.address || '',
        dob: data.dob || '',
        joining_date: data.joining_date || '',
        status: 'ACTIVE',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      users.push(newUser);
      setStore(STORAGE_KEYS.USERS, users);
      addAudit(newId, cleanEmpId, 'SIGNUP', String(newId));
      return { success: true, message: 'Account created successfully. Please login to continue.' };
    },

    async logout() {
      try { await apiFetch('/api/auth/logout.php'); } catch (e) {}
      const uid = localStorage.getItem(SESSION_KEY);
      if (uid) addAudit(Number(uid), undefined, 'LOGOUT');
      localStorage.removeItem(SESSION_KEY);
      state.currentUser = null;
      state.authView = 'LOGIN';
    },

    async getLatestDutyForAutoFill(u) {
      const res = await apiFetch('/api/duties/latest.php');
      if (res.ok && res.data) return res.data;

      const duties = getStore(STORAGE_KEYS.DUTIES, []);
      const userDuties = duties.filter(d => d.user_id === u.id && d.status === 'SUBMITTED');
      if (!userDuties.length) return { has_previous: false, previous_duty: null };

      userDuties.sort((a, b) => new Date(b.duty_date) - new Date(a.duty_date) || b.id - a.id);
      const l = userDuties[0];
      return {
        has_previous: true,
        previous_duty: {
          ref_record_id: l.record_id,
          ref_duty_date: l.duty_date,
          duty_number: l.duty_number,
          bus_number: l.bus_number,
          bus_reg_number: l.bus_reg_number,
          route: l.route,
          route_number: l.route_number,
          start_point: l.start_point,
          end_point: l.end_point,
          shift: l.shift
        }
      };
    },

    async submitDuty(u, dutyData) {
      const res = await apiFetch('/api/duties/feed.php', { method: 'POST', body: JSON.stringify(dutyData) });
      if (!res.fallback) return res.data;

      const duties = getStore(STORAGE_KEYS.DUTIES, []);
      const isDup = duties.some(d => d.user_id === u.id && d.duty_date === dutyData.duty_date && d.duty_number === dutyData.duty_number && d.bus_number.toUpperCase() === dutyData.bus_number.toUpperCase());
      if (isDup) return { success: false, message: 'Duplicate submission detected. A duty with this number and bus was already recorded today.' };

      const recId = 'UP-DUTY-' + dutyData.duty_date.replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const newRec = {
        ...dutyData,
        id: duties.length ? Math.max(...duties.map(d => d.id || 1)) + 1 : 1,
        record_id: recId,
        user_id: u.id,
        emp_id: u.emp_id,
        emp_name: u.full_name,
        emp_type: u.emp_type,
        depot_name: u.depot_name,
        status: 'SUBMITTED',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      duties.unshift(newRec);
      setStore(STORAGE_KEYS.DUTIES, duties);
      addAudit(u.id, u.emp_id, 'CREATE_DUTY', recId);
      return { success: true, record_id: recId, message: 'Duty record submitted successfully.' };
    },

    async saveDraft(u, draftData, isLocal = false) {
      const drafts = getStore(STORAGE_KEYS.DRAFTS, []);
      const id = 'DRAFT-' + Date.now();
      drafts.unshift({ draft_id: id, user_id: u.id, emp_id: u.emp_id, duty_date: draftData.duty_date, draft_data: draftData, updated_at: new Date().toISOString() });
      setStore(STORAGE_KEYS.DRAFTS, drafts);
      return { success: true, draft_id: id, message: isLocal ? 'Saved as LOCAL DRAFT (offline).' : 'Duty draft saved to database successfully.' };
    },

    async getDuties(u, params = {}) {
      const allDuties = getStore(STORAGE_KEYS.DUTIES, []);
      const isAdmin = u.emp_type === 'ADMIN' || u.emp_type === 'SUPER_ADMIN';
      let filtered = allDuties.filter(d => (isAdmin && params.all_users) ? true : d.user_id === u.id);

      if (params.month && params.year) {
        filtered = filtered.filter(d => {
          const [yr, m] = d.duty_date.split('-');
          return Number(yr) === Number(params.year) && Number(m) === Number(params.month);
        });
      } else if (params.year) {
        filtered = filtered.filter(d => Number(d.duty_date.split('-')[0]) === Number(params.year));
      }

      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(d => d.record_id.toLowerCase().includes(s) || d.bus_number.toLowerCase().includes(s) || d.route.toLowerCase().includes(s));
      }

      filtered.sort((a, b) => new Date(b.duty_date) - new Date(a.duty_date));

      const totalDuties = filtered.length;
      const totalKm = Math.round(filtered.reduce((acc, c) => acc + (Number(c.total_km) || 0), 0) * 100) / 100;
      const totalIncome = Math.round(filtered.reduce((acc, c) => acc + (Number(c.income) || 0), 0) * 100) / 100;
      const totalTrips = filtered.reduce((acc, c) => acc + (Number(c.trips_count) || 1), 0);
      const avgKm = totalDuties > 0 ? Math.round((totalKm / totalDuties) * 100) / 100 : 0;
      const avgIncome = totalDuties > 0 ? Math.round((totalIncome / totalDuties) * 100) / 100 : 0;
      const avgLoadFactor = totalDuties > 0 ? Math.round((filtered.reduce((acc, c) => acc + (Number(c.load_factor) || 0), 0) / totalDuties) * 100) / 100 : 0;

      return {
        records: filtered,
        summary: { total_duties: totalDuties, total_km: totalKm, total_income: totalIncome, total_trips: totalTrips, avg_km: avgKm, avg_income: avgIncome, avg_load_factor: avgLoadFactor }
      };
    }
  };

  // --- Offline & PWA Setup ---
  function initPWA() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      state.deferredPrompt = e;
      renderApp();
    });

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    state.isPWAInstalled = isStandalone;

    const banner = document.getElementById('offline-banner');
    function updateOnline() {
      if (banner) {
        if (navigator.onLine) banner.classList.add('hidden');
        else banner.classList.remove('hidden');
      }
    }
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    updateOnline();
  }

  // --- Clock Interval ---
  function startClock() {
    setInterval(() => {
      const clockEl = document.getElementById('live-clock-display');
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
    }, 1000);
  }

  // --- HTML Renderers ---
  function renderApp() {
    const root = document.getElementById('app');
    if (!root) return;

    // 1. Not Authenticated: Render Login or Register
    if (!state.currentUser) {
      if (state.authView === 'REGISTER') {
        root.innerHTML = renderRegisterHTML();
        attachRegisterEvents();
      } else {
        root.innerHTML = renderLoginHTML();
        attachLoginEvents();
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 2. Authenticated: Render Header + Current View + Footer
    let contentHTML = '';
    switch (state.currentView) {
      case 'feed-duty':
        contentHTML = renderFeedDutyHTML();
        break;
      case 'show-data':
        contentHTML = renderShowDataHTML();
        break;
      case 'profile':
        contentHTML = renderProfileHTML();
        break;
      case 'admin':
        contentHTML = renderAdminHTML();
        break;
      default:
        contentHTML = renderDashboardHTML();
        break;
    }

    root.innerHTML = `
      ${renderHeaderHTML()}
      <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        ${contentHTML}
      </main>
      ${renderFooterHTML()}
      ${renderModalsHTML()}
    `;

    attachGlobalEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderHeaderHTML() {
    const u = state.currentUser;
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const isAdmin = u.emp_type === 'ADMIN' || u.emp_type === 'SUPER_ADMIN';

    return `
      <header class="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xl border-b-2 border-amber-500 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <div class="flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div class="flex items-center gap-3 cursor-pointer group" onclick="window.upsrctcNav('dashboard')">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
                  <div class="w-full h-full bg-blue-950 rounded-[10px] flex items-center justify-center p-1">
                    <img src="/icon.svg" alt="Emblem" class="w-full h-full object-contain" />
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="text-base sm:text-lg font-black tracking-wider text-amber-400 uppercase leading-tight">${state.settings.app_title}</h1>
                    <span class="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded">V4.0</span>
                  </div>
                  <p class="text-[11px] sm:text-xs text-slate-300 font-medium">उत्तर प्रदेश राज्य सड़क परिवहन निगम • Digital Duty Portal</p>
                </div>
              </div>

              ${state.deferredPrompt && !state.isPWAInstalled ? `
                <button onclick="window.upsrctcInstallPWA()" class="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Install</span>
                </button>
              ` : ''}
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div class="flex items-center gap-3 bg-blue-950/70 border border-blue-800 px-3 py-1.5 rounded-xl text-xs">
                <div class="flex items-center gap-1.5 text-slate-300">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-400"></i>
                  <span>${dateStr}</span>
                </div>
                <div class="h-3 w-px bg-blue-700"></div>
                <div class="flex items-center gap-1.5 text-amber-300 font-mono font-bold">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                  <span id="live-clock-display">${timeStr}</span>
                </div>
              </div>

              ${state.deferredPrompt && !state.isPWAInstalled ? `
                <button onclick="window.upsrctcInstallPWA()" class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-md">
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Install App</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="bg-blue-950/90 border-t border-blue-800/60 px-3 sm:px-6 lg:px-8 py-2">
          <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center flex-wrap gap-2">
              <div class="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700 px-2.5 py-1 rounded-lg">
                <span class="text-slate-400">Employee:</span>
                <span class="font-bold text-white">${u.full_name}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700 px-2.5 py-1 rounded-lg">
                <span class="text-slate-400">CND / ID:</span>
                <span class="font-bold font-mono text-amber-300">${u.emp_id}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-blue-900/80 border border-blue-700 px-2.5 py-1 rounded-lg">
                <span class="font-bold px-1.5 py-0.5 rounded text-[10px] ${u.emp_type === 'DRIVER' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'}">${u.emp_type}</span>
              </div>
              <div class="hidden sm:flex items-center gap-1.5 bg-blue-900/80 border border-blue-700 px-2.5 py-1 rounded-lg">
                <span class="text-slate-400">Depot:</span>
                <span class="font-bold text-slate-200">${u.depot_name}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <button onclick="window.upsrctcNav('dashboard')" class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${state.currentView === 'dashboard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}">
                <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Dashboard</span>
              </button>
              ${isAdmin ? `
                <button onclick="window.upsrctcNav('admin')" class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${state.currentView === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-300 border border-amber-500/30'}">
                  <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                  <span>Admin</span>
                </button>
              ` : ''}
              <button onclick="window.upsrctcNav('profile')" class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${state.currentView === 'profile' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}">
                <i data-lucide="user" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Profile</span>
              </button>
              <button onclick="window.upsrctcLogout()" class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function renderFooterHTML() {
    const s = state.settings;
    return `
      <footer class="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-center md:text-left">
            <div class="flex items-center justify-center md:justify-start gap-2 text-slate-300 font-semibold mb-1">
              <i data-lucide="shield-check" class="w-4 h-4 text-amber-500"></i>
              <span>उत्तर प्रदेश राज्य सड़क परिवहन निगम (UPSRCTC)</span>
            </div>
            <p class="text-slate-500 text-[11px]">Digital Duty Portal V4.0 • Enterprise Cloud Architecture • Hostinger Production</p>
          </div>
          <div class="flex flex-col items-center md:items-end text-center md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            <div class="flex items-center gap-1.5 text-slate-300 font-medium">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Powered by <strong class="text-amber-400 font-bold">${s.partner_name}</strong></span>
            </div>
            <p class="text-[10px] tracking-widest text-slate-400 uppercase font-semibold mt-0.5">${s.partner_tagline}</p>
            <div class="flex items-center gap-3 mt-1.5 text-[11px]">
              <a href="tel:${s.partner_phone.replace(/\s+/g, '')}" class="hover:text-amber-400 transition">${s.partner_phone}</a>
              <span>•</span>
              <a href="https://${s.partner_website.replace(/^https?:\/\//, '')}" target="_blank" class="hover:text-amber-400 transition font-mono">${s.partner_website}</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function renderLoginHTML() {
    return `
      <div class="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100">
        <div class="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-500 p-0.5 flex items-center justify-center">
              <img src="/icon.svg" alt="UPSRCTC" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-bold text-amber-400 tracking-wider">UPSRCTC ROADWAYS</span>
          </div>
        </div>

        <div class="w-full max-w-md mx-auto px-4 py-6">
          <div class="bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-700 p-6 sm:p-8 relative">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-t-2xl"></div>
            
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-1 shadow-lg shadow-amber-500/20 mb-3">
                <div class="w-full h-full bg-blue-950 rounded-[14px] flex items-center justify-center p-2">
                  <img src="/icon.svg" alt="UPSRCTC Emblem" class="w-full h-full object-contain" />
                </div>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-amber-400 tracking-wider uppercase">${state.settings.app_title}</h1>
              <div class="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-900/60 border border-blue-700 text-xs font-bold text-slate-200">
                ${state.settings.app_subtitle}
              </div>
              <p class="text-xs text-slate-400 mt-2 font-medium">Official Duty Portal for Drivers &amp; Conductors</p>
            </div>

            <div class="mb-5 bg-blue-950/60 border border-blue-800 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
              <i data-lucide="info" class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"></i>
              <div>
                <p class="font-semibold text-amber-300">Clean Production Mode</p>
                <p class="text-[11px] text-slate-300 mt-0.5">First time here? Click <button type="button" onclick="window.upsrctcSetAuth('REGISTER')" class="text-amber-400 font-bold underline">Create Account</button> to register your official Driver or Conductor credentials.</p>
              </div>
            </div>

            <div id="login-error-box" class="hidden mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4"></i>
              <span id="login-error-text"></span>
            </div>

            <form id="login-form" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase">Login ID / Email</label>
                <input type="text" id="login-id" required placeholder="Enter CND Number or Email" class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-bold text-slate-300 uppercase">Password</label>
                  <button type="button" onclick="window.upsrctcOpenForgot()" class="text-xs font-semibold text-amber-400 hover:text-amber-300">Forgot Password?</button>
                </div>
                <div class="relative">
                  <input type="password" id="login-password" required placeholder="Enter your password" class="w-full px-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <button type="button" onclick="window.upsrctcTogglePassword('login-password')" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
              <button type="submit" id="login-btn" class="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg transition">LOGIN</button>
            </form>

            <div class="mt-6 pt-5 border-t border-slate-800 text-center">
              <p class="text-xs text-slate-400">
                New Employee? <button type="button" onclick="window.upsrctcSetAuth('REGISTER')" class="font-bold text-amber-400 hover:text-amber-300 underline">SIGN UP (Create Account)</button>
              </p>
            </div>
          </div>
        </div>

        <div class="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
          Powered by <strong class="text-amber-400">${state.settings.partner_name}</strong> • ${state.settings.partner_phone}
        </div>
      </div>
    `;
  }

  function renderRegisterHTML() {
    return `
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 py-8 px-4">
        <div class="max-w-2xl mx-auto">
          <div class="mb-6 flex items-center justify-between">
            <button onclick="window.upsrctcSetAuth('LOGIN')" class="flex items-center gap-2 text-xs font-bold text-amber-400">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Back to Login</span>
            </button>
            <span class="text-xs text-slate-400">UPSRCTC V4.0</span>
          </div>

          <div class="bg-slate-900/95 rounded-2xl shadow-2xl border border-slate-700 p-6 sm:p-8 relative">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl"></div>

            <h2 class="text-xl font-black text-amber-400 uppercase text-center mb-1">Employee Registration</h2>
            <p class="text-xs text-slate-300 text-center mb-6">Create your verified Driver, Conductor or Admin profile</p>

            <div id="reg-msg-box" class="hidden mb-4 p-3 rounded-xl text-xs"></div>

            <form id="reg-form" class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold mb-1">Full Name *</label>
                  <input type="text" id="reg-name" required placeholder="e.g. Kishor Kumar" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Date of Birth</label>
                  <input type="date" id="reg-dob" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Mobile (10 digits) *</label>
                  <input type="tel" id="reg-mobile" maxLength="10" required placeholder="9457690255" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Email Address *</label>
                  <input type="email" id="reg-email" required placeholder="staff@upsrctc.in" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Employee ID / CND *</label>
                  <input type="text" id="reg-empid" required placeholder="e.g. CND-4821" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Employee Role *</label>
                  <select id="reg-role" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
                    <option value="DRIVER">DRIVER</option>
                    <option value="CONDUCTOR">CONDUCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Depot Name *</label>
                  <select id="reg-depot" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
                    ${state.depots.map(d => `<option value="${d.depot_name}" data-code="${d.depot_code}">${d.depot_name} (${d.region})</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Password (Min 6 chars) *</label>
                  <input type="password" id="reg-pwd" minLength="6" required class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block font-semibold mb-1">Confirm Password *</label>
                  <input type="password" id="reg-cpwd" required class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                </div>
              </div>

              <button type="submit" id="reg-btn" class="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider mt-4">
                COMPLETE REGISTRATION
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboardHTML() {
    const u = state.currentUser;
    const st = state.stats;
    const isAdmin = u.emp_type === 'ADMIN' || u.emp_type === 'SUPER_ADMIN';

    return `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-blue-700/60 relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 uppercase">Active Staff</span>
              <h2 class="text-xl sm:text-2xl font-black text-white mt-1">Namaste, <span class="text-amber-400">${u.full_name}</span></h2>
              <p class="text-xs sm:text-sm text-blue-100 mt-1">Welcome to the official UPSRCTC Roadways Digital Duty Portal. Record your daily shifts and connect to official department portals.</p>
            </div>
            <button onclick="window.upsrctcNav('feed-duty')" class="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-2 shadow-lg">
              <i data-lucide="bus" class="w-4 h-4"></i>
              <span>FEED DUTY</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-700/60 text-xs">
            <div class="bg-blue-950/50 p-3 rounded-xl border border-blue-800">
              <p class="text-[11px] text-blue-300">Total Duties</p>
              <p class="text-lg sm:text-xl font-bold text-white mt-0.5">${st.total_duties}</p>
            </div>
            <div class="bg-blue-950/50 p-3 rounded-xl border border-blue-800">
              <p class="text-[11px] text-blue-300">Total Distance</p>
              <p class="text-lg sm:text-xl font-bold text-amber-400 mt-0.5">${st.total_km.toLocaleString('en-IN')} KM</p>
            </div>
            <div class="bg-blue-950/50 p-3 rounded-xl border border-blue-800">
              <p class="text-[11px] text-blue-300">Total Collection</p>
              <p class="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">₹${st.total_income.toLocaleString('en-IN')}</p>
            </div>
            <div class="bg-blue-950/50 p-3 rounded-xl border border-blue-800">
              <p class="text-[11px] text-blue-300">Avg Load Factor</p>
              <p class="text-lg sm:text-xl font-bold text-sky-400 mt-0.5">${st.avg_load_factor}%</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div onclick="window.upsrctcNav('feed-duty')" class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200 transition cursor-pointer flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center mb-3">
                <i data-lucide="bus" class="w-6 h-6"></i>
              </div>
              <h4 class="text-base font-black text-slate-900">FEED DUTY</h4>
              <p class="text-xs text-slate-500 mt-1">Record your bus number, route, KM, ticket collection with smart auto-fill.</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>Open Duty Form</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          </div>

          <div onclick="window.upsrctcNav('show-data')" class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200 transition cursor-pointer flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-center mb-3">
                <i data-lucide="table" class="w-6 h-6 text-amber-400"></i>
              </div>
              <h4 class="text-base font-black text-slate-900">SHOW DATA</h4>
              <p class="text-xs text-slate-500 mt-1">Review submitted duty logs, search records, and generate certified PDF reports.</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>View Logs &amp; Reports</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          </div>

          ${state.portals.map(p => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200 transition cursor-pointer flex flex-col justify-between">
              <div>
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 flex items-center justify-center mb-3">
                  <i data-lucide="${p.icon || 'external-link'}" class="w-6 h-6"></i>
                </div>
                <h4 class="text-base font-black text-slate-900">${p.portal_name}</h4>
                <p class="text-xs text-slate-500 mt-1">${p.desc || 'Official Government Portal Gateway'}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Open Gateway</span>
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </div>
            </a>
          `).join('')}

          ${isAdmin ? `
            <div onclick="window.upsrctcNav('admin')" class="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 text-white shadow-sm hover:shadow-xl border border-amber-500/40 transition cursor-pointer flex flex-col justify-between">
              <div>
                <div class="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-3">
                  <i data-lucide="settings" class="w-6 h-6"></i>
                </div>
                <h4 class="text-base font-black text-amber-400">ADMIN PANEL</h4>
                <p class="text-xs text-slate-300 mt-1">Manage registered drivers, conductors, depots, and configure portal URLs.</p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Open Console</span>
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderFeedDutyHTML() {
    const u = state.currentUser;
    const todayStr = new Date().toISOString().split('T')[0];

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <button onclick="window.upsrctcNav('dashboard')" class="flex items-center gap-2 text-xs font-bold text-slate-700">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>Back to Dashboard</span>
        </button>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-950 to-indigo-950 text-white p-5 border-b-2 border-amber-500">
            <h2 class="text-xl font-black text-amber-400 uppercase">Daily Duty Entry Form</h2>
            <p class="text-xs text-slate-300">UPSRCTC Roadways Official Operational Recording System</p>
          </div>

          <div class="p-6 space-y-6">
            <div id="duty-msg-box" class="hidden p-4 rounded-xl border text-xs"></div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span class="text-xs font-bold text-slate-700 uppercase block mb-2">1. Authenticated Employee Identity (Read-Only)</span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-slate-500 block">Name:</span><strong>${u.full_name}</strong></div>
                <div><span class="text-slate-500 block">CND / ID:</span><strong class="font-mono text-blue-950">${u.emp_id}</strong></div>
                <div><span class="text-slate-500 block">Role:</span><strong>${u.emp_type}</strong></div>
                <div><span class="text-slate-500 block">Depot:</span><strong>${u.depot_name}</strong></div>
              </div>
            </div>

            <form id="feed-duty-form" class="space-y-6 text-xs">
              <div>
                <span class="text-xs font-bold text-blue-950 uppercase block mb-3 border-b pb-1">2. Duty Schedule &amp; Bus Assignment</span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block font-bold mb-1">Duty Date *</label>
                    <input type="date" id="duty-date" required value="${todayStr}" class="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Duty Number *</label>
                    <input type="text" id="duty-number" required value="Duty 1" class="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Shift</label>
                    <select id="duty-shift" class="w-full px-3 py-2 border rounded-xl">
                      <option value="Morning">Morning Shift</option>
                      <option value="Evening">Evening Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Double">Double Shift</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Bus Number *</label>
                    <input type="text" id="duty-bus" required placeholder="e.g. UP 15 AT 1234" class="w-full px-3 py-2 border rounded-xl font-mono uppercase" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Start Point</label>
                    <input type="text" id="duty-start" placeholder="e.g. Meerut Sohrab Gate" class="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">End Point</label>
                    <input type="text" id="duty-end" placeholder="e.g. Anand Vihar ISBT" class="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block font-bold mb-1">Route Name *</label>
                    <input type="text" id="duty-route" required placeholder="e.g. Meerut → Delhi" class="w-full px-3 py-2 border rounded-xl" />
                  </div>
                </div>
              </div>

              <div class="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
                <span class="text-xs font-bold text-amber-950 uppercase block mb-3 border-b border-amber-200 pb-1">3. Daily Operational Actuals (Mandatory Entry)</span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block font-bold mb-1">Total KM *</label>
                    <input type="number" step="0.1" id="duty-km" required placeholder="e.g. 280.5" class="w-full px-3 py-2 bg-white border rounded-xl text-base font-bold" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Income / Collection (₹) *</label>
                    <input type="number" id="duty-income" required placeholder="e.g. 12450" class="w-full px-3 py-2 bg-white border rounded-xl text-base font-bold" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Passenger Count</label>
                    <input type="number" id="duty-passengers" placeholder="e.g. 85" class="w-full px-3 py-2 bg-white border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Load Factor %</label>
                    <input type="number" step="0.1" id="duty-load" placeholder="e.g. 82.5" class="w-full px-3 py-2 bg-white border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Number of Trips</label>
                    <input type="number" id="duty-trips" value="2" class="w-full px-3 py-2 bg-white border rounded-xl" />
                  </div>
                  <div>
                    <label class="block font-bold mb-1">Ticket Machine Collection (₹)</label>
                    <input type="number" id="duty-ticket" placeholder="e.g. 11900" class="w-full px-3 py-2 bg-white border rounded-xl" />
                  </div>
                  <div class="sm:col-span-3">
                    <label class="block font-bold mb-1">Remarks</label>
                    <input type="text" id="duty-remarks" placeholder="Optional notes" class="w-full px-3 py-2 bg-white border rounded-xl" />
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 pt-3 border-t">
                <button type="button" onclick="window.upsrctcSaveDraftBtn()" class="px-5 py-2.5 border-2 border-slate-800 text-slate-900 font-bold rounded-xl uppercase">SAVE DRAFT</button>
                <button type="submit" id="submit-duty-btn" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl uppercase shadow-lg">SUBMIT DUTY</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  function renderShowDataHTML() {
    const st = state.stats;
    const records = state.duties;

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button onclick="window.upsrctcNav('dashboard')" class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Back to Dashboard</span>
          </button>
          <button onclick="window.upsrctcOpenPdfModal()" class="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 text-white font-bold rounded-xl text-xs shadow-md">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Export Certified PDF</span>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Duties</p>
            <p class="text-xl font-black text-slate-900 mt-1">${st.total_duties}</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Distance</p>
            <p class="text-xl font-black text-amber-600 mt-1">${st.total_km.toLocaleString('en-IN')} KM</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Income</p>
            <p class="text-xl font-black text-emerald-600 mt-1">₹${st.total_income.toLocaleString('en-IN')}</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Avg KM</p>
            <p class="text-xl font-black text-blue-900 mt-1">${st.avg_km}</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Avg Income</p>
            <p class="text-xl font-black text-emerald-700 mt-1">₹${st.avg_income}</p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200">
            <p class="text-[11px] text-slate-500 uppercase">Load %</p>
            <p class="text-xl font-black text-sky-600 mt-1">${st.avg_load_factor}%</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-900 uppercase">Duty Records Log</h3>
            <span class="text-xs text-slate-500 font-mono">${records.length} Records</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3 pl-5">Date</th>
                  <th class="p-3">Duty No</th>
                  <th class="p-3">Bus Number</th>
                  <th class="p-3">Route</th>
                  <th class="p-3 text-right">KM</th>
                  <th class="p-3 text-right">Income (₹)</th>
                  <th class="p-3 text-center">Load %</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center pr-5">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${records.length === 0 ? `
                  <tr>
                    <td colSpan="9" class="p-12 text-center text-slate-500">
                      <p class="font-bold text-slate-700">No duty records found.</p>
                      <button onclick="window.upsrctcNav('feed-duty')" class="mt-3 px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">Record First Duty</button>
                    </td>
                  </tr>
                ` : records.map((r, i) => `
                  <tr class="hover:bg-blue-50/40">
                    <td class="p-3 pl-5 font-semibold text-slate-900">${r.duty_date}</td>
                    <td class="p-3 text-slate-700">${r.duty_number}</td>
                    <td class="p-3 font-mono font-bold text-blue-950">${r.bus_number}</td>
                    <td class="p-3 font-medium text-slate-800 max-w-xs truncate">${r.route}</td>
                    <td class="p-3 text-right font-mono font-bold text-slate-900">${r.total_km}</td>
                    <td class="p-3 text-right font-mono font-bold text-emerald-700">₹${r.income.toLocaleString('en-IN')}</td>
                    <td class="p-3 text-center">${r.load_factor ? r.load_factor + '%' : '-'}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">${r.status}</span></td>
                    <td class="p-3 pr-5 text-center">
                      <button onclick="window.upsrctcViewRecord(${i})" class="p-1 text-blue-900 hover:bg-blue-100 rounded"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderProfileHTML() {
    const u = state.currentUser;
    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <button onclick="window.upsrctcNav('dashboard')" class="flex items-center gap-2 text-xs font-bold text-slate-700">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>Back to Dashboard</span>
        </button>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-950 to-indigo-950 p-6 text-white border-b-2 border-amber-500">
            <h2 class="text-xl font-black">${u.full_name}</h2>
            <p class="text-xs text-blue-200 font-mono">CND / Employee ID: ${u.emp_id}</p>
            <p class="text-xs text-slate-300">${u.depot_name} Depot • Role: ${u.emp_type}</p>
          </div>

          <div class="p-6 space-y-4 text-xs">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border">
              <div><span class="text-slate-500 block">Mobile:</span><strong>${u.mobile}</strong></div>
              <div><span class="text-slate-500 block">Email:</span><strong>${u.email}</strong></div>
              <div><span class="text-slate-500 block">Status:</span><strong class="text-emerald-700">${u.status}</strong></div>
              <div><span class="text-slate-500 block">Designation:</span><strong>${u.designation || 'Staff'}</strong></div>
              <div><span class="text-slate-500 block">Registered:</span><strong>${u.created_at || 'Database Record'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminHTML() {
    return `
      <div class="space-y-6">
        <button onclick="window.upsrctcNav('dashboard')" class="flex items-center gap-2 text-xs font-bold text-slate-700">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>Back to Dashboard</span>
        </button>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h2 class="text-xl font-black text-amber-500 uppercase mb-4">UPSRCTC Administrative Console</h2>
          <p class="text-xs text-slate-600 mb-6">Manage master operational depots, external portal links, and Grofasto partner credentials.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-slate-50 rounded-xl border">
              <span class="font-bold block mb-2">Master Depots (${state.depots.length})</span>
              <ul class="space-y-1 text-slate-700 max-h-48 overflow-y-auto">
                ${state.depots.map(d => `<li>• <strong>${d.depot_name}</strong> (${d.depot_code})</li>`).join('')}
              </ul>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border">
              <span class="font-bold block mb-2">Technology Partner Info</span>
              <p><strong>Name:</strong> ${state.settings.partner_name}</p>
              <p><strong>Tagline:</strong> ${state.settings.partner_tagline}</p>
              <p><strong>Phone:</strong> ${state.settings.partner_phone}</p>
              <p><strong>Website:</strong> ${state.settings.partner_website}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderModalsHTML() {
    return `
      <div id="pdf-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
        <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="bg-slate-900 text-white px-5 py-3 flex items-center justify-between no-print">
            <span class="text-xs font-bold">UPSRCTC Certified PDF Duty Statement</span>
            <div class="flex items-center gap-2">
              <button onclick="window.print()" class="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">Print / PDF</button>
              <button onclick="document.getElementById('pdf-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">✕</button>
            </div>
          </div>
          <div class="p-8 text-slate-900" id="printable-duty-report">
            <div class="border-b-2 border-blue-950 pb-4 mb-5 flex justify-between items-center">
              <div>
                <h1 class="text-xl font-black text-blue-950 uppercase">UTTAR PRADESH STATE ROAD TRANSPORT CORPORATION</h1>
                <h2 class="text-sm font-bold text-amber-700">DIGITAL DUTY PORTAL V4.0 • CERTIFIED DUTY LOG</h2>
              </div>
              <div class="text-right text-xs">
                <p class="font-bold">Staff: ${state.currentUser ? state.currentUser.full_name : ''}</p>
                <p class="font-mono text-slate-500">ID: ${state.currentUser ? state.currentUser.emp_id : ''}</p>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border">
                <thead class="bg-blue-950 text-white">
                  <tr>
                    <th class="p-2">Date</th>
                    <th class="p-2">Bus</th>
                    <th class="p-2">Route</th>
                    <th class="p-2 text-right">KM</th>
                    <th class="p-2 text-right">Income</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.duties.map(d => `
                    <tr class="border-b">
                      <td class="p-2">${d.duty_date}</td>
                      <td class="p-2 font-mono font-bold">${d.bus_number}</td>
                      <td class="p-2">${d.route}</td>
                      <td class="p-2 text-right">${d.total_km}</td>
                      <td class="p-2 text-right font-bold text-emerald-700">₹${d.income}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Attach Event Listeners ---
  function attachLoginEvents() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const loginId = document.getElementById('login-id').value;
      const pwd = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const errBox = document.getElementById('login-error-box');
      const errText = document.getElementById('login-error-text');

      btn.disabled = true;
      btn.textContent = 'Authenticating...';
      errBox.classList.add('hidden');

      try {
        const res = await api.login(loginId, pwd);
        if (res.success && res.user) {
          state.currentUser = res.user;
          state.currentView = 'dashboard';
          await refreshDuties();
          renderApp();
        } else {
          errText.textContent = res.message || 'Invalid credentials.';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errText.textContent = 'Connection error.';
        errBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'LOGIN';
      }
    });
  }

  function attachRegisterEvents() {
    const form = document.getElementById('reg-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const pwd = document.getElementById('reg-pwd').value;
      const cpwd = document.getElementById('reg-cpwd').value;
      const msgBox = document.getElementById('reg-msg-box');
      const depotSelect = document.getElementById('reg-depot');
      const selectedOpt = depotSelect.options[depotSelect.selectedIndex];

      if (pwd !== cpwd) {
        msgBox.className = 'mb-4 p-3 rounded-xl text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40';
        msgBox.textContent = 'Passwords do not match.';
        msgBox.classList.remove('hidden');
        return;
      }

      const payload = {
        full_name: document.getElementById('reg-name').value,
        dob: document.getElementById('reg-dob').value,
        mobile: document.getElementById('reg-mobile').value,
        email: document.getElementById('reg-email').value,
        emp_id: document.getElementById('reg-empid').value,
        emp_type: document.getElementById('reg-role').value,
        depot_name: depotSelect.value,
        depot_code: selectedOpt ? selectedOpt.getAttribute('data-code') : '',
        password: pwd
      };

      const res = await api.register(payload);
      if (res.success) {
        msgBox.className = 'mb-4 p-3 rounded-xl text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        msgBox.textContent = res.message;
        msgBox.classList.remove('hidden');
        setTimeout(() => {
          state.authView = 'LOGIN';
          renderApp();
        }, 1500);
      } else {
        msgBox.className = 'mb-4 p-3 rounded-xl text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40';
        msgBox.textContent = res.message;
        msgBox.classList.remove('hidden');
      }
    });
  }

  function attachGlobalEvents() {
    const feedForm = document.getElementById('feed-duty-form');
    if (feedForm) {
      feedForm.addEventListener('submit', async e => {
        e.preventDefault();
        const msgBox = document.getElementById('duty-msg-box');
        const btn = document.getElementById('submit-duty-btn');

        const payload = {
          duty_date: document.getElementById('duty-date').value,
          duty_number: document.getElementById('duty-number').value,
          shift: document.getElementById('duty-shift').value,
          bus_number: document.getElementById('duty-bus').value,
          route: document.getElementById('duty-route').value,
          start_point: document.getElementById('duty-start').value,
          end_point: document.getElementById('duty-end').value,
          total_km: parseFloat(document.getElementById('duty-km').value) || 0,
          income: parseFloat(document.getElementById('duty-income').value) || 0,
          passenger_count: parseInt(document.getElementById('duty-passengers').value) || 0,
          load_factor: parseFloat(document.getElementById('duty-load').value) || 0,
          trips_count: parseInt(document.getElementById('duty-trips').value) || 1,
          ticket_collection: parseFloat(document.getElementById('duty-ticket').value) || 0,
          remarks: document.getElementById('duty-remarks').value
        };

        btn.disabled = true;
        btn.textContent = 'Submitting...';

        const res = await api.submitDuty(state.currentUser, payload);
        if (res.success) {
          msgBox.className = 'p-4 rounded-xl border text-xs bg-emerald-50 border-emerald-300 text-emerald-900';
          msgBox.innerHTML = `<strong>Success!</strong> ${res.message} <br>Record ID: <span class="font-mono font-bold">${res.record_id}</span>`;
          msgBox.classList.remove('hidden');
          await refreshDuties();
          setTimeout(() => {
            state.currentView = 'show-data';
            renderApp();
          }, 1500);
        } else {
          msgBox.className = 'p-4 rounded-xl border text-xs bg-rose-50 border-rose-300 text-rose-900';
          msgBox.textContent = res.message;
          msgBox.classList.remove('hidden');
          btn.disabled = false;
          btn.textContent = 'SUBMIT DUTY';
        }
      });
    }
  }

  async function refreshDuties() {
    if (!state.currentUser) return;
    const res = await api.getDuties(state.currentUser);
    state.duties = res.records;
    state.stats = res.summary;
  }

  // --- Window Global Bridge ---
  window.upsrctcNav = function (v) {
    state.currentView = v;
    renderApp();
    if (v === 'feed-duty') {
      api.getLatestDutyForAutoFill(state.currentUser).then(res => {
        if (res.has_previous && res.previous_duty) {
          const p = res.previous_duty;
          const bus = document.getElementById('duty-bus');
          const route = document.getElementById('duty-route');
          const start = document.getElementById('duty-start');
          const end = document.getElementById('duty-end');
          if (bus) bus.value = p.bus_number || '';
          if (route) route.value = p.route || '';
          if (start) start.value = p.start_point || '';
          if (end) end.value = p.end_point || '';
        }
      });
    }
  };

  window.upsrctcSetAuth = function (v) {
    state.authView = v;
    renderApp();
  };

  window.upsrctcLogout = async function () {
    await api.logout();
    renderApp();
  };

  window.upsrctcInstallPWA = async function () {
    if (state.deferredPrompt) {
      await state.deferredPrompt.prompt();
      state.deferredPrompt = null;
      renderApp();
    }
  };

  window.upsrctcTogglePassword = function (id) {
    const el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
  };

  window.upsrctcOpenPdfModal = function () {
    const m = document.getElementById('pdf-modal');
    if (m) m.classList.remove('hidden');
  };

  window.upsrctcSaveDraftBtn = async function () {
    const payload = {
      duty_date: document.getElementById('duty-date').value,
      duty_number: document.getElementById('duty-number').value,
      bus_number: document.getElementById('duty-bus').value,
      route: document.getElementById('duty-route').value,
      total_km: parseFloat(document.getElementById('duty-km').value) || 0,
      income: parseFloat(document.getElementById('duty-income').value) || 0
    };
    const res = await api.saveDraft(state.currentUser, payload, !navigator.onLine);
    alert(res.message);
  };

  // --- Initial Launch ---
  async function init() {
    initPWA();
    startClock();
    state.currentUser = await api.checkSession();
    if (state.currentUser) {
      await refreshDuties();
    }
    renderApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
