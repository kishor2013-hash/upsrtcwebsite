/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Unified API Client & Dual-Mode Engine (PHP MySQL Production + Local Storage Engine)
 * Partner: Grofasto Digital Solutions (www.grofasto.com)
 */

import {
  User,
  EmployeeType,
  DutyRecord,
  DutyDraft,
  ExternalPortalLink,
  AppSettings,
  DutyStats,
  AuditLogItem,
  DepotItem
} from '../types';

const IS_BROWSER = typeof window !== 'undefined';
const SESSION_KEY = 'upsrctc_active_session_token';

// Local storage keys for standalone preview (Zero demo records included)
const STORAGE_KEYS = {
  USERS: 'upsrctc_db_users',
  DUTIES: 'upsrctc_db_duty_records',
  DRAFTS: 'upsrctc_db_duty_drafts',
  SETTINGS: 'upsrctc_db_settings',
  PORTALS: 'upsrctc_db_portals',
  DEPOTS: 'upsrctc_db_depots',
  AUDIT_LOGS: 'upsrctc_db_audit_logs'
};

const DEFAULT_PORTAL_LINKS: ExternalPortalLink[] = [
  {
    portal_key: 'PAY_SLIP',
    portal_name: 'Pay Slip Portal',
    url: 'https://payroll.mectoi.in/EmpLogin.aspx',
    icon_name: 'file-text',
    description: 'UPSRCTC Employee Payroll & Monthly Slip Portal'
  },
  {
    portal_key: 'PF_PORTAL',
    portal_name: 'PF Portal',
    url: 'https://passbook.epfindia.gov.in/MemberPassBook/login',
    icon_name: 'shield',
    description: 'EPFO Unified Member Passbook & Provident Fund'
  },
  {
    portal_key: 'CHALLAN',
    portal_name: 'Challan Portal',
    url: 'https://echallan.parivahan.gov.in/index/challan-print',
    icon_name: 'alert-circle',
    description: 'eChallan Parivahan Portal for Traffic Challan Status & Print'
  },
  {
    portal_key: 'MANAV_SAMPADA',
    portal_name: 'Manav Sampada',
    url: 'https://ehrms.upsdc.gov.in/',
    icon_name: 'users',
    description: 'Uttar Pradesh Electronic Human Resource Management System'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  app_title: 'UPSRCTC ROADWAYS',
  app_subtitle: 'DIGITAL DUTY PORTAL V4.0',
  partner_name: 'Grofasto Digital Solutions',
  partner_tagline: 'GROW | CONNECT | SUCCEED.',
  partner_phone: '+91 9457690255',
  partner_website: 'www.grofasto.com',
  allow_registration: '1'
};

const DEFAULT_DEPOTS: DepotItem[] = [
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

// Helper to interact with local storage store
function getLocalStore<T>(key: string, defaultVal: T): T {
  if (!IS_BROWSER) return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, val: T): void {
  if (!IS_BROWSER) return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStore write error:', err);
  }
}

function addAuditLog(userId?: number, empId?: string, action?: string, recordId?: string, details?: any) {
  const logs = getLocalStore<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog: AuditLogItem = {
    id: Date.now(),
    user_id: userId,
    emp_id: empId,
    action: action || 'ACTION',
    record_id: recordId,
    ip_address: '127.0.0.1 (Web)',
    user_agent: navigator.userAgent.substring(0, 100),
    details: details,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  logs.unshift(newLog);
  setLocalStore(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));
}

// Low-level fetch wrapper that detects if Hostinger PHP is available or falls back
async function safeFetch(url: string, options: RequestInit = {}): Promise<{ response: Response | null; useFallback: boolean }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      credentials: 'include'
    });

    // Check if the response is actually valid JSON from PHP API
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || contentType.includes('text/html')) {
      // PHP server not executing directly in this dev host
      return { response: null, useFallback: true };
    }
    return { response: res, useFallback: false };
  } catch {
    return { response: null, useFallback: true };
  }
}

export const api = {
  // ------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // ------------------------------------------------------------

  async getSessionUser(): Promise<User | null> {
    const { response, useFallback } = await safeFetch('/api/auth/me.php');
    if (!useFallback && response && response.ok) {
      const data = await response.json();
      return data.user || null;
    }

    // Standalone / preview session engine
    const activeUserId = localStorage.getItem(SESSION_KEY);
    if (!activeUserId) return null;

    const users = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => String(u.id) === String(activeUserId) && u.status === 'ACTIVE');
    return user || null;
  },

  async login(loginId: string, password: string, rememberMe = false): Promise<{ success: boolean; user?: User; message?: string }> {
    const payload = { login_id: loginId.trim(), password, remember_me: rememberMe };
    const { response, useFallback } = await safeFetch('/api/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!useFallback && response) {
      const data = await response.json();
      return data;
    }

    // Local engine fallback
    const users = getLocalStore<any[]>(STORAGE_KEYS.USERS, []);
    const cleanId = loginId.trim().toLowerCase();
    const cleanEmpId = loginId.trim().toUpperCase();

    const user = users.find(u => 
      (u.email?.toLowerCase() === cleanId || u.emp_id?.toUpperCase() === cleanEmpId)
    );

    if (!user) {
      return { success: false, message: 'Invalid Login ID / Email or Password.' };
    }

    // Check password (supports plain or simulated hash)
    if (user.password !== password && user.password_hash !== password) {
      return { success: false, message: 'Invalid Login ID / Email or Password.' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, message: `Account is ${user.status.toLowerCase()}. Contact your depot administrator.` };
    }

    localStorage.setItem(SESSION_KEY, String(user.id));
    addAuditLog(user.id, user.emp_id, 'LOGIN', String(user.id), { login_id: loginId });

    const safeUser: User = { ...user };
    delete (safeUser as any).password;
    delete (safeUser as any).password_hash;

    return { success: true, user: safeUser, message: 'Login successful.' };
  },

  async register(data: {
    full_name: string;
    email: string;
    mobile: string;
    password: string;
    confirm_password: string;
    emp_id: string;
    emp_type: 'DRIVER' | 'CONDUCTOR' | 'ADMIN';
    depot_name: string;
    depot_code?: string;
    designation?: string;
    address?: string;
    dob?: string;
    joining_date?: string;
    profile_photo?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { response, useFallback } = await safeFetch('/api/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!useFallback && response) {
      const resData = await response.json();
      return resData;
    }

    // Local engine registration
    const users = getLocalStore<any[]>(STORAGE_KEYS.USERS, []);
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanEmpId = data.emp_id.trim().toUpperCase();
    const cleanMobile = data.mobile.replace(/\D/g, '');

    if (users.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'This email is already registered. Please login.' };
    }
    if (users.some(u => u.mobile?.replace(/\D/g, '') === cleanMobile)) {
      return { success: false, message: 'This mobile number is already registered.' };
    }
    if (users.some(u => u.emp_id?.toUpperCase() === cleanEmpId)) {
      return { success: false, message: 'This Employee ID / CND is already registered.' };
    }

    const newUserId = users.length ? Math.max(...users.map(u => u.id || 1)) + 1 : 101;
    const newUser = {
      id: newUserId,
      emp_id: cleanEmpId,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: data.password,
      emp_type: data.emp_type,
      depot_name: data.depot_name.trim(),
      depot_code: data.depot_code?.trim() || '',
      designation: data.designation?.trim() || (data.emp_type === 'DRIVER' ? 'Roadways Driver' : 'Roadways Conductor'),
      address: data.address?.trim() || '',
      dob: data.dob || '',
      joining_date: data.joining_date || '',
      profile_photo: data.profile_photo || '',
      status: 'ACTIVE',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    users.push(newUser);
    setLocalStore(STORAGE_KEYS.USERS, users);
    addAuditLog(newUserId, cleanEmpId, 'SIGNUP', String(newUserId), { full_name: data.full_name, emp_type: data.emp_type });

    return { success: true, message: 'Account created successfully. Please login to continue.' };
  },

  async logout(): Promise<void> {
    try {
      await safeFetch('/api/auth/logout.php');
    } catch {}
    const activeUserId = localStorage.getItem(SESSION_KEY);
    if (activeUserId) {
      addAuditLog(Number(activeUserId), undefined, 'LOGOUT', activeUserId);
    }
    localStorage.removeItem(SESSION_KEY);
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; reset_token?: string; emp_id?: string }> {
    const { response, useFallback } = await safeFetch('/api/auth/forgot-password.php', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    });

    if (!useFallback && response) {
      return await response.json();
    }

    const users = getLocalStore<any[]>(STORAGE_KEYS.USERS, []);
    const clean = identifier.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === clean || u.emp_id?.toLowerCase() === clean);

    if (!user) {
      return {
        success: true,
        message: 'If this account exists, password reset instructions and security token have been generated.'
      };
    }

    const token = 'RST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    return {
      success: true,
      message: 'Password reset request verified. Please enter your new password with the reset token.',
      reset_token: token,
      emp_id: user.emp_id
    };
  },

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const { response, useFallback } = await safeFetch('/api/auth/reset-password.php', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword, confirm_password: confirmPassword })
    });

    if (!useFallback && response) {
      return await response.json();
    }

    // In local engine
    const users = getLocalStore<any[]>(STORAGE_KEYS.USERS, []);
    if (users.length > 0) {
      users[0].password = newPassword;
      setLocalStore(STORAGE_KEYS.USERS, users);
    }
    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    };
  },

  // ------------------------------------------------------------
  // DUTY MODULE (SMART AUTO-FILL, FEED, SHOW DATA, DRAFTS)
  // ------------------------------------------------------------

  /**
   * Smart Previous Duty Lookup:
   * Returns reusable fields ONLY for the authenticated employee from the database.
   * Daily operational metrics (KM, Income, Passenger count, Load factor, etc.) are NOT copied.
   */
  async getLatestDutyForAutoFill(currentUser: User): Promise<{
    has_previous: boolean;
    previous_duty: {
      ref_record_id: string;
      ref_duty_date: string;
      duty_number?: string;
      bus_number: string;
      bus_reg_number?: string;
      route: string;
      route_number?: string;
      start_point: string;
      end_point: string;
      shift?: string;
    } | null;
  }> {
    const { response, useFallback } = await safeFetch('/api/duties/latest.php');
    if (!useFallback && response && response.ok) {
      return await response.json();
    }

    const duties = getLocalStore<DutyRecord[]>(STORAGE_KEYS.DUTIES, []);
    const userDuties = duties.filter(d => d.user_id === currentUser.id && d.status === 'SUBMITTED');

    if (userDuties.length === 0) {
      return { has_previous: false, previous_duty: null };
    }

    // Sort by date DESC, id DESC
    userDuties.sort((a, b) => {
      const dateCmp = new Date(b.duty_date).getTime() - new Date(a.duty_date).getTime();
      return dateCmp !== 0 ? dateCmp : b.id - a.id;
    });

    const latest = userDuties[0];
    return {
      has_previous: true,
      previous_duty: {
        ref_record_id: latest.record_id,
        ref_duty_date: latest.duty_date,
        duty_number: latest.duty_number,
        bus_number: latest.bus_number,
        bus_reg_number: latest.bus_reg_number,
        route: latest.route,
        route_number: latest.route_number,
        start_point: latest.start_point,
        end_point: latest.end_point,
        shift: latest.shift
      }
    };
  },

  async submitDuty(currentUser: User, dutyData: Omit<DutyRecord, 'id' | 'record_id' | 'user_id' | 'emp_id' | 'emp_name' | 'emp_type' | 'depot_name' | 'created_at' | 'status'> & { draft_id?: string }): Promise<{ success: boolean; record_id?: string; message: string }> {
    const { response, useFallback } = await safeFetch('/api/duties/feed.php', {
      method: 'POST',
      body: JSON.stringify(dutyData)
    });

    if (!useFallback && response) {
      return await response.json();
    }

    // Local engine submit duty
    const duties = getLocalStore<DutyRecord[]>(STORAGE_KEYS.DUTIES, []);

    // Duplicate check: same date and bus and duty number in last 3 minutes
    const isDup = duties.some(d => 
      d.user_id === currentUser.id &&
      d.duty_date === dutyData.duty_date &&
      d.duty_number === dutyData.duty_number &&
      d.bus_number.toUpperCase() === dutyData.bus_number.toUpperCase() &&
      d.status === 'SUBMITTED'
    );

    if (isDup) {
      return {
        success: false,
        message: 'Duplicate submission detected. A duty with this number and bus was already recorded for this date.'
      };
    }

    const dateClean = dutyData.duty_date.replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const recordId = `UP-DUTY-${dateClean}-${randPart}`;

    const newDuty: DutyRecord = {
      ...dutyData,
      id: duties.length ? Math.max(...duties.map(d => d.id || 1)) + 1 : 1,
      record_id: recordId,
      user_id: currentUser.id,
      emp_id: currentUser.emp_id,
      emp_name: currentUser.full_name,
      emp_type: currentUser.emp_type === 'CONDUCTOR' ? 'CONDUCTOR' : 'DRIVER',
      depot_name: currentUser.depot_name,
      depot_code: currentUser.depot_code,
      status: 'SUBMITTED',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    duties.unshift(newDuty);
    setLocalStore(STORAGE_KEYS.DUTIES, duties);

    // If there was a draft, remove it
    if (dutyData.draft_id) {
      const drafts = getLocalStore<DutyDraft[]>(STORAGE_KEYS.DRAFTS, []);
      setLocalStore(STORAGE_KEYS.DRAFTS, drafts.filter(d => d.draft_id !== dutyData.draft_id));
    }

    addAuditLog(currentUser.id, currentUser.emp_id, 'CREATE_DUTY', recordId, {
      bus_number: dutyData.bus_number,
      total_km: dutyData.total_km,
      income: dutyData.income
    });

    return {
      success: true,
      record_id: recordId,
      message: 'Duty record submitted successfully.'
    };
  },

  async saveDraft(currentUser: User, draftData: Partial<DutyRecord>, draftId?: string, isLocal = false): Promise<{ success: boolean; draft_id: string; message: string }> {
    if (!isLocal) {
      const { response, useFallback } = await safeFetch('/api/duties/draft.php', {
        method: 'POST',
        body: JSON.stringify({
          draft_id: draftId,
          duty_date: draftData.duty_date || new Date().toISOString().split('T')[0],
          draft_data: draftData
        })
      });

      if (!useFallback && response) {
        return await response.json();
      }
    }

    const assignedId = draftId || `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const drafts = getLocalStore<DutyDraft[]>(STORAGE_KEYS.DRAFTS, []);
    const existingIndex = drafts.findIndex(d => d.draft_id === assignedId);

    const draftItem: DutyDraft = {
      draft_id: assignedId,
      user_id: currentUser.id,
      emp_id: currentUser.emp_id,
      duty_date: draftData.duty_date || new Date().toISOString().split('T')[0],
      draft_data: draftData,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      is_local: isLocal
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = draftItem;
    } else {
      drafts.unshift(draftItem);
    }

    setLocalStore(STORAGE_KEYS.DRAFTS, drafts);
    addAuditLog(currentUser.id, currentUser.emp_id, 'SAVE_DRAFT', assignedId);

    return {
      success: true,
      draft_id: assignedId,
      message: isLocal ? 'Saved as LOCAL DRAFT (offline).' : 'Duty draft saved to database successfully.'
    };
  },

  async getDrafts(currentUser: User): Promise<DutyDraft[]> {
    const { response, useFallback } = await safeFetch('/api/duties/draft.php');
    if (!useFallback && response && response.ok) {
      const data = await response.json();
      return data.drafts || [];
    }

    const drafts = getLocalStore<DutyDraft[]>(STORAGE_KEYS.DRAFTS, []);
    return drafts.filter(d => d.user_id === currentUser.id);
  },

  async deleteDraft(currentUser: User, draftId: string): Promise<void> {
    try {
      await safeFetch(`/api/duties/draft.php?draft_id=${encodeURIComponent(draftId)}`, { method: 'DELETE' });
    } catch {}
    const drafts = getLocalStore<DutyDraft[]>(STORAGE_KEYS.DRAFTS, []);
    setLocalStore(STORAGE_KEYS.DRAFTS, drafts.filter(d => d.draft_id !== draftId));
  },

  /**
   * SHOW DATA:
   * Paginated, filtered duty records with derived calculations from real database.
   * NO FAKE DATA: Returns 0 totals if no records exist.
   */
  async getDuties(
    currentUser: User,
    params: {
      page?: number;
      limit?: number;
      month?: number;
      year?: number;
      start_date?: string;
      end_date?: string;
      bus?: string;
      route?: string;
      status?: string;
      search?: string;
      all_users?: boolean;
    }
  ): Promise<{
    records: DutyRecord[];
    pagination: { page: number; limit: number; total_records: number; total_pages: number };
    summary: DutyStats;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.month) query.set('month', String(params.month));
    if (params.year) query.set('year', String(params.year));
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    if (params.bus) query.set('bus', params.bus);
    if (params.route) query.set('route', params.route);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);

    const { response, useFallback } = await safeFetch(`/api/duties/list.php?${query.toString()}`);
    if (!useFallback && response && response.ok) {
      return await response.json();
    }

    // Local engine query
    const allDuties = getLocalStore<DutyRecord[]>(STORAGE_KEYS.DUTIES, []);
    const isAdmin = currentUser.emp_type === 'ADMIN' || currentUser.emp_type === 'SUPER_ADMIN';

    // Authorization: regular employees only view their own duties
    let filtered = allDuties.filter(d => {
      if (!isAdmin || !params.all_users) {
        if (d.user_id !== currentUser.id) return false;
      }
      return true;
    });

    if (params.start_date && params.end_date) {
      filtered = filtered.filter(d => d.duty_date >= params.start_date! && d.duty_date <= params.end_date!);
    } else if (params.month && params.year) {
      filtered = filtered.filter(d => {
        const parts = d.duty_date.split('-');
        return Number(parts[0]) === params.year && Number(parts[1]) === params.month;
      });
    } else if (params.year) {
      filtered = filtered.filter(d => Number(d.duty_date.split('-')[0]) === params.year);
    }

    if (params.bus) {
      filtered = filtered.filter(d => d.bus_number.toLowerCase().includes(params.bus!.toLowerCase()));
    }
    if (params.route) {
      filtered = filtered.filter(d => d.route.toLowerCase().includes(params.route!.toLowerCase()));
    }
    if (params.status) {
      filtered = filtered.filter(d => d.status === params.status);
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.record_id.toLowerCase().includes(term) ||
        d.bus_number.toLowerCase().includes(term) ||
        d.route.toLowerCase().includes(term) ||
        d.emp_name.toLowerCase().includes(term) ||
        d.emp_id.toLowerCase().includes(term) ||
        d.duty_date.includes(term)
      );
    }

    // Sort by date DESC, id DESC
    filtered.sort((a, b) => {
      const dCmp = new Date(b.duty_date).getTime() - new Date(a.duty_date).getTime();
      return dCmp !== 0 ? dCmp : b.id - a.id;
    });

    // Real Calculations
    const totalDuties = filtered.length;
    const totalKm = Math.round(filtered.reduce((acc, curr) => acc + (Number(curr.total_km) || 0), 0) * 100) / 100;
    const totalIncome = Math.round(filtered.reduce((acc, curr) => acc + (Number(curr.income) || 0), 0) * 100) / 100;
    const totalTrips = filtered.reduce((acc, curr) => acc + (Number(curr.trips_count) || 1), 0);
    const avgKm = totalDuties > 0 ? Math.round((totalKm / totalDuties) * 100) / 100 : 0;
    const avgIncome = totalDuties > 0 ? Math.round((totalIncome / totalDuties) * 100) / 100 : 0;
    const avgLoadFactor = totalDuties > 0 ? Math.round((filtered.reduce((acc, curr) => acc + (Number(curr.load_factor) || 0), 0) / totalDuties) * 100) / 100 : 0;

    const page = params.page || 1;
    const limit = params.limit || 15;
    const offset = (page - 1) * limit;
    const paginatedRecords = filtered.slice(offset, offset + limit);

    return {
      records: paginatedRecords,
      pagination: {
        page,
        limit,
        total_records: totalDuties,
        total_pages: Math.ceil(totalDuties / limit) || 1
      },
      summary: {
        total_duties: totalDuties,
        total_km: totalKm,
        total_income: totalIncome,
        total_trips: totalTrips,
        avg_km: avgKm,
        avg_income: avgIncome,
        avg_load_factor: avgLoadFactor
      }
    };
  },

  // ------------------------------------------------------------
  // SETTINGS & EXTERNAL PORTALS
  // ------------------------------------------------------------

  async getSettings(): Promise<{ portal_links: ExternalPortalLink[]; settings: AppSettings }> {
    const { response, useFallback } = await safeFetch('/api/settings/get.php');
    if (!useFallback && response && response.ok) {
      return await response.json();
    }

    const portals = getLocalStore<ExternalPortalLink[]>(STORAGE_KEYS.PORTALS, DEFAULT_PORTAL_LINKS);
    const settings = getLocalStore<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

    return { portal_links: portals, settings };
  },

  async updateSettings(portalLinks: Record<string, string>, settings: Partial<AppSettings>): Promise<{ success: boolean; message: string }> {
    const { response, useFallback } = await safeFetch('/api/settings/update.php', {
      method: 'POST',
      body: JSON.stringify({ portal_links: portalLinks, settings })
    });

    if (!useFallback && response) {
      return await response.json();
    }

    // Local engine update
    const curPortals = getLocalStore<ExternalPortalLink[]>(STORAGE_KEYS.PORTALS, DEFAULT_PORTAL_LINKS);
    const updatedPortals = curPortals.map(p => {
      if (portalLinks[p.portal_key]) {
        return { ...p, url: portalLinks[p.portal_key] };
      }
      return p;
    });
    setLocalStore(STORAGE_KEYS.PORTALS, updatedPortals);

    const curSettings = getLocalStore<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const updatedSettings = { ...curSettings, ...settings };
    setLocalStore(STORAGE_KEYS.SETTINGS, updatedSettings);

    addAuditLog(undefined, undefined, 'SETTINGS_UPDATE', undefined, { updated_keys: Object.keys(settings) });

    return { success: true, message: 'Settings updated successfully.' };
  },

  // ------------------------------------------------------------
  // MASTER DEPOTS
  // ------------------------------------------------------------

  async getDepots(): Promise<DepotItem[]> {
    const { response, useFallback } = await safeFetch('/api/admin/depots.php');
    if (!useFallback && response && response.ok) {
      const data = await response.json();
      return data.depots || [];
    }
    return getLocalStore<DepotItem[]>(STORAGE_KEYS.DEPOTS, DEFAULT_DEPOTS);
  },

  async addDepot(code: string, name: string, region = 'Uttar Pradesh'): Promise<{ success: boolean; message: string }> {
    const { response, useFallback } = await safeFetch('/api/admin/depots.php', {
      method: 'POST',
      body: JSON.stringify({ depot_code: code, depot_name: name, region })
    });

    if (!useFallback && response) {
      return await response.json();
    }

    const depots = getLocalStore<DepotItem[]>(STORAGE_KEYS.DEPOTS, DEFAULT_DEPOTS);
    const newDepot: DepotItem = {
      id: depots.length + 1,
      depot_code: code.toUpperCase(),
      depot_name: name,
      region
    };
    depots.push(newDepot);
    setLocalStore(STORAGE_KEYS.DEPOTS, depots);

    return { success: true, message: 'Depot added successfully.' };
  },

  // ------------------------------------------------------------
  // ADMIN PANEL
  // ------------------------------------------------------------

  async getAdminUsers(search?: string, depot?: string, role?: string): Promise<User[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (depot) query.set('depot', depot);
    if (role) query.set('role', role);

    const { response, useFallback } = await safeFetch(`/api/admin/users.php?${query.toString()}`);
    if (!useFallback && response && response.ok) {
      const data = await response.json();
      return data.users || [];
    }

    let users = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    if (search) {
      const term = search.toLowerCase();
      users = users.filter(u => 
        u.full_name.toLowerCase().includes(term) ||
        u.emp_id.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.mobile.includes(term)
      );
    }
    if (depot) {
      users = users.filter(u => u.depot_name === depot);
    }
    if (role) {
      users = users.filter(u => u.emp_type === role);
    }
    return users;
  },

  async updateAdminUser(userId: number, status?: 'ACTIVE' | 'SUSPENDED', role?: EmployeeType): Promise<{ success: boolean; message: string }> {
    const { response, useFallback } = await safeFetch('/api/admin/users.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, status, role })
    });

    if (!useFallback && response) {
      return await response.json();
    }

    const users = getLocalStore<User[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      if (status) users[idx].status = status;
      if (role) users[idx].emp_type = role;
      setLocalStore(STORAGE_KEYS.USERS, users);
      addAuditLog(userId, users[idx].emp_id, 'ADMIN_USER_UPDATE', String(userId), { status, role });
      return { success: true, message: 'Employee record updated successfully.' };
    }
    return { success: false, message: 'User not found.' };
  },

  async getAuditLogs(page = 1, action?: string, empId?: string): Promise<{ logs: AuditLogItem[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(page));
    if (action) query.set('action', action);
    if (empId) query.set('emp_id', empId);

    const { response, useFallback } = await safeFetch(`/api/admin/logs.php?${query.toString()}`);
    if (!useFallback && response && response.ok) {
      const data = await response.json();
      return { logs: data.logs || [], total: data.pagination?.total || 0 };
    }

    let logs = getLocalStore<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    if (action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
    }
    if (empId) {
      logs = logs.filter(l => l.emp_id?.toLowerCase().includes(empId.toLowerCase()));
    }
    return { logs, total: logs.length };
  }
};
