import type { ScheduleEntry, WeeklyPattern } from "@/types/types";

export interface StaffPreferences {
  [key: string]: Record<string, unknown>;
}

export interface CreateStaffResponse {
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: StaffPreferences;
  created_at: string;
  updated_at: string;
  id: number;
}

export interface ClubOwner {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

export interface CreateClubResponse {
  id: number;
  owner_id: number;
  owner: ClubOwner;
  name: string;
  description: string;
  city: string;
  address: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  telegram_url: string;
  instagram_url: string;
  whatsapp_url?: string;
  working_hours?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  tags?: string[];
  timezone?: string;
  currency?: string;
  extra?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClubWithRole {
  club: CreateClubResponse;
  role: "owner" | "admin" | "coach";
  is_owner: boolean;
}

export interface GetMyClubsResponse {
  clubs: ClubWithRole[];
  total: number;
  user_id: number;
}

export interface CreateStudentResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GetStudentsListResponse {
  users: Array<{
    id: number;
    telegram_id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    username: string;
    photo_url: string;
    preferences: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  size: number;
  pages: number;
  filters: {
    first_name: string;
    last_name: string;
    phone_number: string;
    username: string;
  };
}

export interface GetStudentInfoResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateClubStuffInvitationResponse {
  phone_number: string,
  role: string,
  club_id: number,
  id: number,
  created_by_id: number,
  is_used: boolean,
  created_at: string
}

export interface SectionClub {
  id: number;
  name: string;
  city: string;
}

export interface SectionCoach {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

export interface CreateSectionResponse {
  id: number;
  club_id: number;
  name: string;
  description: string;
  coach_id: number;
  coach_ids?: number[];
  active: boolean;
  club: SectionClub;
  coach: SectionCoach;
  coaches?: SectionCoach[]; // All coaches
  groups: SectionGroupSummary[];
  created_at: string;
  updated_at: string;
}

export interface SectionGroupSummary {
  id: number;
  name: string;
  level: string;
  capacity: number;
  price: number;
  active: boolean;
  enrolled_students: number;
}

export type GetMySectionsResponse = CreateSectionResponse[];

export interface CreateGroupResponse {
  id: number;
  section_id: number;
  name: string;
  description: string;
  schedule: ScheduleEntry;
  price: number;
  capacity: number;
  level: string;
  coach_id: number;
  coach_ids?: number[];
  coaches?: SectionCoach[]; // All coaches
  tags: string[];
  active: boolean;
}

export interface GetMyGroupResponse {
  section_id: number;
  name: string;
  description: string;
  schedule: {
    [key: string]: unknown;
  }; price: number;
  capacity: number;
  level: string;
  coach_id: number;
  coach_ids?: number[];
  tags: string[];
  active: boolean;
  id: number;
  section: {
    id: number;
    name: string;
    club_id: number;
  };
  coach: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  coaches?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  }[];
  created_at: string;
  updated_at: string;
}

export type GetSectionGroupsResponse = GetMyGroupResponse[];

export interface Invitation {
  phone_number: string;
  role: string;
  club_id: number;
  club: SectionClub | null; // Club can be null if deleted or data is incomplete
  id: number;
  created_by_id: number;
  is_used: boolean;
  created_at: string;
  status: string;
}

export interface GetMyInvitationsResponse {
  invitations: Invitation[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GetClubsLimitCheckResponse {
  can_create: boolean,
  current_clubs: number,
  max_clubs: number,
  remaining: number,
  reason: string
}

export interface GetSectionsLimitCheckResponse {
  can_create: boolean;
  current_sections: number;
  max_sections: number;
  remaining: number;
  reason: string | null;
  club_id: number | null;
}

export interface GetSectionsStatsResponse {
  user_id: number;
  total_sections: number;
  max_sections: number;
  remaining_sections: number;
  clubs_sections: Array<{
    club_id: number;
    club_name: string;
    sections_count: number;
  }>;
  limits: {
    clubs: number;
    sections: number;
  };
}

export interface CanCreateSectionResponse {
  can_create: boolean;
  reason: string | null;
  permission_check: {
    can_create: boolean;
    is_owner: boolean;
    user_role: string | null;
    club_id: number;
    club_name: string;
    reason: string | null;
  };
  limits_check: GetSectionsLimitCheckResponse | null;
}

export interface ClubAndRole {
  club_id: number
  club_name: string
  role: "owner" | "admin" | "coach"
  joined_at: string
  is_active: boolean
  sections_count: number
}

export interface TeamMember {
  id: number
  telegram_id: number
  first_name: string
  last_name: string
  username: string
  phone_number: string
  photo_url: string
  created_at: string
  updated_at: string
  clubs_and_roles: ClubAndRole[]
}

export interface CurrentUserClub {
  club_id: number
  club_name: string
  user_role: "owner" | "admin" | "coach"
}

export interface GetTeamMembersResponse {
  staff_members: TeamMember[]
  total: number
  page: number
  size: number
  pages: number
  applied_filters: Record<string, unknown> | null
  current_user_clubs: CurrentUserClub[]
}

export interface GetGroupScheduleTemplateResponse {
  weekly_pattern: WeeklyPattern;
  valid_from: string;
  valid_until: string;
  timezone: string;
}

export interface CreateManualLessonResponse {
  group_id: number;
  planned_date: string;           
  planned_start_time: string;     
  duration_minutes: number;
  coach_id: number;
  location: string;
  notes: string;
  id: number;

  actual_date: string;
  actual_start_time: string;
  status: "scheduled" | "cancelled" | "completed"; 
  created_from_template: boolean;

  created_at: string;             
  updated_at: string;

  group: {
    id: number;
    name: string;
    section_id: number;
  };

  coach: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    phone_number: string;
  };

  effective_date: string;
  effective_start_time: string;
  is_rescheduled: boolean;
}

export interface LessonGroupInfo {
  id: number;
  name: string;
  section_id: number;
  capacity?: number;
  section?: {
    id: number;
    name: string;
    club_id: number;
    club_name?: string;
  };
}

export interface LessonCoachInfo {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
}

export interface Lesson {
  group_id: number;
  planned_date: string;
  planned_start_time: string;
  duration_minutes: number;
  coach_id: number;
  location: string;
  notes: string;
  id: number;
  actual_date: string;
  actual_start_time: string;
  status: "scheduled" | "cancelled" | "completed"; 
  created_from_template: boolean;
  created_at: string;
  updated_at: string;
  group: LessonGroupInfo;
  coach: LessonCoachInfo;
  effective_date: string;
  effective_start_time: string;
  is_rescheduled: boolean;
}

export interface GetLessonsResponse {
  lessons: Lesson[];
  total: number;
  page: number;
  size: number;
  pages: number;
  filters: Record<string, unknown>;
}

export interface GetDayScheduleResponse {
  schedule_date: string;
  lessons: Lesson[];     
  total_lessons: number;
}

export interface GetWeekScheduleResponse {
  week_start: string; 
  week_end: string;  
  days: DaySchedule[];
  total_lessons: number;
}

export interface DaySchedule {
  schedule_date: string; 
  lessons: Lesson[];
  total_lessons: number;
}

// Student-specific response types (for student app)
export interface StudentPreferences {
  [key: string]: Record<string, unknown>;
}

export interface StudentResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: StudentPreferences;
  created_at: string;
  updated_at: string;
}

export interface StaffResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: StaffPreferences;
  created_at: string;
  updated_at: string;
}

// These types are kept for mock data (payments, memberships - no API endpoints)
export interface MembershipResponse {
  id: number;
  user_id: number;
  club_id: number;
  section_id?: number;
  group_id?: number;
  status: 'active' | 'frozen' | 'expired' | 'canceled';
  start_date: string;
  end_date: string;
  price: number;
  freeze_days_available?: number;
  freeze_days_used?: number;
  club_name: string;
  section_name?: string;
  group_name?: string;
  training_type: 'Group' | 'Personal';
  level?: string;
}

export interface AttendanceRecordResponse {
  id: number;
  user_id: number;
  club_id: number;
  section_id?: number;
  checkin_date: string;
  club_name: string;
  section_name?: string;
}

export interface AttendanceStatsResponse {
  visits_this_month: number;
  missed_this_month: number;
  average_attendance: number;
}

export interface PaymentResponse {
  id: number;
  user_id: number;
  club_id: number;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
  club_name: string;
}

export interface SessionResponse {
  id: number;
  section_name: string;
  group_name?: string;
  coach_name: string;
  date: string;
  time: string;
  club_address: string;
  participants_count: number;
  max_participants?: number;
  notes?: string;
  status: 'scheduled' | 'cancelled' | 'booked' | 'full';
  club_id: number;
  section_id?: number;
  group_id?: number;
}

export interface ClubLocationResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

// Tariff types
export type PackageType = 'full_club' | 'full_section' | 'single_group' | 'multiple_groups';
export type PaymentType = 'monthly' | 'semi_annual' | 'annual' | 'session_pack';

export interface TariffCreatorInfo {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
}

export interface TariffResponse {
  id: number;
  name: string;
  description?: string;
  type: PackageType;
  payment_type: PaymentType;
  price: number;
  club_ids: number[];
  section_ids: number[];
  group_ids: number[];
  sessions_count?: number;
  validity_days?: number;
  freeze_days_total: number;
  features: string[];
  active: boolean;
  created_by_id?: number;
  created_by?: TariffCreatorInfo;
  created_at: string;
  updated_at: string;
}

export interface TariffListResponse {
  tariffs: TariffResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
  filters?: Record<string, unknown>;
}

// Staff Students Response Types
export type StaffStudentStatus = 'active' | 'frozen' | 'expired' | 'cancelled' | 'new';

export interface StaffStudentMembership {
  id: number;
  status: StaffStudentStatus;
  start_date: string;
  end_date: string;
  tariff_id?: number;
  tariff_name?: string;
  price: number;
  freeze_days_total: number;
  freeze_days_used: number;
  freeze_start_date?: string;
  freeze_end_date?: string;
}

export interface StaffStudentResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  phone_number: string;
  username?: string;
  photo_url?: string;
  club_id: number;
  club_name: string;
  section_id?: number;
  section_name?: string;
  group_id?: number;
  group_name?: string;
  coach_id?: number;
  coach_name?: string;
  membership?: StaffStudentMembership;
  created_at: string;
}

export interface StaffStudentsListResponse {
  students: StaffStudentResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
  filters?: {
    search?: string;
    status?: StaffStudentStatus;
    club_id?: number;
    section_id?: number;
    group_ids?: number[];
    coach_ids?: number[];
  };
}

// Staff - Student Attendance History
export interface StudentAttendanceRecord {
  id: number;
  date: string;
  time?: string;
  club_id?: number;
  club_name?: string;
  section_id?: number;
  section_name?: string;
  group_id?: number;
  group_name?: string;
  lesson_id?: number;
  coach_name?: string;
  status: 'attended' | 'missed' | 'late' | 'excused';
}

export interface StudentAttendanceListResponse {
  records: StudentAttendanceRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StudentAttendanceStatsResponse {
  total_visits: number;
  visits_this_month: number;
  missed_this_month: number;
  late_this_month: number;
  attendance_rate: number;
}

// Staff - Student Payment History
export interface StudentPaymentRecord {
  id: number;
  date: string;
  amount: number;
  currency: string;
  club_id?: number;
  club_name?: string;
  tariff_id?: number;
  tariff_name?: string;
  operation_type: 'purchase' | 'renewal' | 'extension' | 'refund';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: string;
}

export interface StudentPaymentListResponse {
  payments: StudentPaymentRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StudentPaymentStatsResponse {
  total_paid: number;
  payments_count: number;
  last_payment_date?: string;
  pending_amount: number;
}

// Staff Analytics
export interface SectionStats {
  id: number;
  name: string;
  students_count: number;
  groups_count: number;
}

export interface ClubAnalyticsResponse {
  club_id: number;
  club_name: string;
  total_students: number;
  active_students: number;
  new_students_this_month: number;
  trainings_this_month: number;
  trainings_conducted: number;
  trainings_scheduled: number;
  trainings_cancelled: number;
  sections: SectionStats[];
  period_start: string;
  period_end: string;
}

export interface DashboardSummaryResponse {
  total_clubs: number;
  total_sections: number;
  total_groups: number;
  total_students: number;
  trainings_this_month: number;
  new_students_this_month: number;
  period_start: string;
  period_end: string;
}
