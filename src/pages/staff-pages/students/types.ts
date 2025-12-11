// Types for students page

export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'new' | 'cancelled';

export interface Student {
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
  membership: StudentMembership | null;
  created_at: string;
}

export interface StudentMembership {
  id: number;
  status: MembershipStatus;
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

export interface AttendanceRecord {
  id: number;
  student_id: number;
  date: string;
  time: string;
  training_type: string;
  section_name: string;
  group_name?: string;
  coach_name: string;
  status: 'present' | 'absent' | 'late';
}

export interface PaymentRecord {
  id: number;
  student_id: number;
  date: string;
  amount: number;
  operation_type: 'purchase' | 'renewal' | 'freeze' | 'refund';
  tariff_name: string;
  status: 'paid' | 'pending' | 'failed';
}

export interface Trainer {
  id: number;
  name: string;
  club_id: number;
}

export interface Group {
  id: number;
  name: string;
  section_id: number;
  section_name: string;
  club_id: number;
}

export interface Club {
  id: number;
  name: string;
}

export interface StudentFilters {
  search: string;
  status: MembershipStatus | 'all';
  clubId: number | null;
  coachIds: number[];
  groupIds: number[];
}

export interface ExtendMembershipData {
  enrollment_id: number;
  tariff_id: number;
  days: number;
  tariff_name?: string;
  price?: number;
}

export interface FreezeMembershipData {
  enrollment_id: number;
  days: number;
  reason?: string;
}
