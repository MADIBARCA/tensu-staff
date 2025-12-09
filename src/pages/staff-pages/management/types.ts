// Types for Management page

export type EmployeeRole = 'owner' | 'admin' | 'trainer' | 'coach';
export type EmployeeStatus = 'active' | 'pending' | 'deactivated' | 'declined';
export type PaymentType = 'monthly' | 'semi_annual' | 'annual' | 'session_pack';
export type PackageType = 'full_club' | 'full_section' | 'single_group' | 'multiple_groups';
export type ScheduleType = 'single' | 'recurring';
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  telegram_username?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  club_ids: number[];
  photo_url?: string;
  created_at: string;
}

export interface Club {
  id: number;
  name: string;
  status: 'active' | 'frozen' | 'deactivated';
}

export interface Section {
  id: number;
  name: string;
  club_id: number;
  club_name: string;
  trainer_ids: number[];
  trainers: { id: number; name: string }[];
  groups: Group[];
  created_at: string;
}

export interface Group {
  id: number;
  section_id: number;
  name: string;
  level?: string;
  capacity?: number;
  schedules: Schedule[];
}

export interface Schedule {
  id: number;
  group_id: number;
  type: ScheduleType;
  start_date: string;
  start_time: string;
  duration: number; // minutes
  // For recurring
  days_of_week?: WeekDay[];
  end_date?: string;
  repeat_count?: number;
}

export interface Tariff {
  id: number;
  name: string;
  type: PackageType;
  payment_type: PaymentType;
  price: number;
  club_ids: number[];
  section_ids: number[];
  group_ids: number[];
  sessions_count?: number; // For session_pack type
  validity_days?: number; // For session_pack type
  active: boolean;
  created_at: string;
}

// Form Data Types
export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  phone: string;
  role: EmployeeRole;
  club_ids: number[];
}

export interface UpdateEmployeeData {
  role: EmployeeRole;
  club_ids: number[];
}

export interface CreateSectionData {
  name: string;
  club_id: number;
  trainer_ids: number[];
}

export interface UpdateSectionData {
  name: string;
  trainer_ids: number[];
}

export interface CreateGroupData {
  name: string;
  level?: string;
  capacity?: number;
}

export interface CreateScheduleData {
  type: ScheduleType;
  start_date: string;
  start_time: string;
  duration: number;
  days_of_week?: WeekDay[];
  end_date?: string;
  repeat_count?: number;
}

export interface CreateTariffData {
  name: string;
  type: PackageType;
  payment_type: PaymentType;
  price: number;
  club_ids: number[];
  section_ids: number[];
  group_ids: number[];
  sessions_count?: number;
  validity_days?: number;
  active: boolean;
}

// Filter Types
export interface EmployeeFilters {
  search: string;
  role?: EmployeeRole;
  club_id?: number;
}

export interface SectionFilters {
  search: string;
  club_id?: number;
  trainer_id?: number;
}
