/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * TypeScript Type Definitions
 */

export type EmployeeType = 'DRIVER' | 'CONDUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  emp_id: string;
  full_name: string;
  email: string;
  mobile: string;
  emp_type: EmployeeType;
  depot_name: string;
  depot_code?: string;
  designation?: string;
  address?: string;
  dob?: string;
  joining_date?: string;
  profile_photo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  created_at?: string;
  last_login?: string;
}

export interface DutyRecord {
  id: number;
  record_id: string;
  user_id: number;
  emp_id: string;
  emp_name: string;
  emp_type: 'DRIVER' | 'CONDUCTOR';
  depot_name: string;
  depot_code?: string;
  duty_date: string;
  duty_number: string;
  bus_number: string;
  bus_reg_number?: string;
  route: string;
  route_number?: string;
  start_point: string;
  end_point: string;
  start_time?: string;
  end_time?: string;
  shift: string;
  total_km: number;
  income: number;
  passenger_count: number;
  load_factor: number;
  trips_count: number;
  ticket_collection?: number;
  cash_collection?: number;
  remarks?: string;
  status: 'SUBMITTED' | 'DRAFT' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at?: string;
}

export interface DutyDraft {
  id?: number;
  draft_id: string;
  user_id: number;
  emp_id: string;
  duty_date: string;
  draft_data: Partial<DutyRecord>;
  updated_at?: string;
  is_local?: boolean;
}

export interface ExternalPortalLink {
  id?: number;
  portal_key: 'PAY_SLIP' | 'PF_PORTAL' | 'CHALLAN' | 'MANAV_SAMPADA' | string;
  portal_name: string;
  url: string;
  icon_name: string;
  description?: string;
}

export interface AppSettings {
  app_title: string;
  app_subtitle: string;
  partner_name: string;
  partner_tagline: string;
  partner_phone: string;
  partner_website: string;
  allow_registration?: string;
}

export interface DutyStats {
  total_duties: number;
  total_km: number;
  total_income: number;
  total_trips: number;
  avg_km: number;
  avg_income: number;
  avg_load_factor: number;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  emp_id?: string;
  action: string;
  record_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  created_at: string;
}

export interface DepotItem {
  id: number;
  depot_code: string;
  depot_name: string;
  region: string;
  is_active?: number;
}
