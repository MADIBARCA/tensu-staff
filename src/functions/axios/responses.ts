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
  timezone: string;
  currency: string;
  extra: Record<string, unknown>;
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
  active: boolean;
  club: SectionClub;
  coach: SectionCoach;
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
  section_id: number;
  name: string;
  description: string;
  schedule: ScheduleEntry;
  price: number;
  capacity: number;
  level: string;
  coach_id: number;
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
