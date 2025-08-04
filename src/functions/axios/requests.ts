import type { WeeklyPattern } from "@/types/types";

export interface StaffPreferences {
  [key: string]: Record<string, unknown>;
}

export interface CreateStaffRequest {
  contact_init_data: string;
  preferences: StaffPreferences;
}

export interface UpdateStaffRequest {
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  city: string;
  address: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  telegram_url: string;
  instagram_url: string; 
}

export interface CreateStuffInvitationRequest {
  phone_number: string;
  role: string;
}

export interface CreateSectionRequest {
  club_id?: number;
  name: string;
  description: string;
  coach_id?: number | null;
  active: boolean;
}

export interface CreateGroupRequest {
  section_id: number | undefined;
  name: string;
  description: string;
  schedule: Record<string, unknown>;
  price: number | "";
  capacity: number | "";
  level: string;
  coach_id: number;
  tags: string[];
  active: boolean;
}

export interface UpdateGroupScheduleTemplateRequest {
  weekly_pattern: WeeklyPattern;
  valid_from: string;  
  valid_until: string;
  timezone: string;   
}

export interface GenerateLessonsRequest {
  start_date: string;  
  end_date: string;          
  overwrite_existing: boolean; 
  exclude_holidays: boolean;   
}

export interface CreateManualLessonRequest {
  group_id: number;
  planned_date: string;        
  planned_start_time: string;  
  duration_minutes: number;
  coach_id: number;
  location: string;
  notes: string;
}

export interface UpdateLessonRequest {
  planned_date: string;        
  planned_start_time: string;     
  actual_date: string;
  actual_start_time: string;
  duration_minutes: number;
  status: "scheduled" | "cancelled" | "completed"; 
  coach_id: number;
  location: string;
  notes: string;
}

export interface RescheduleLessonRequest {
  new_date: string;    
  new_time: string;
  reason: CancelLessonRequest;
}

export interface CancelLessonRequest {
  reason: string;
}

export interface CompleteLessonRequest {
  notes: string;
  actual_duration: number;
}
