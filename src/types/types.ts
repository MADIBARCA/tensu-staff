// Common types for staff and student apps

export interface Student {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username?: string;
  photo_url?: string;
}

export interface Staff {
  id: string;
  name: string;
  surname: string;
  telegramUsername?: string;
  role: 'owner' | 'coach' | 'admin';
  sports: string[];
  clubs: string[];
  phone?: string;
  status: string;
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  userRole: "owner" | "admin" | "coach";
  sections: number;
  students: number;
  monthlyRevenue: number;
  studentGrowth: number;
  plan: string;
  nextPayment: string;
  paymentStatus: "paid" | "pending" | "expired";
  analytics: {
    totalStudents: number;
    newStudents: number;
    lostStudents: number;
    weeklyRevenue: number;
    averageTicket: number;
    totalWorkouts: number;
    peakHours: string;
    revenueHistory: { month: string; amount: number }[];
    studentHistory: { month: string; count: number }[];
    sectionDistribution: { name: string; count: number; color: string }[];
  };
  paymentHistory: {
    date: string;
    amount: number;
    method: string;
    status: string;
  }[];
}

export interface SportsSection {
  id: string;
  name: string;
  icon: string;
  description: string;
  telegramLink: string;
  coaches: string[];
  color: string;
}

export interface Filters {
  search: string;
  roles: string[];
  clubs: string[];
  sections: string[];
}

export interface NewStaff {
  role: string;
  phone: string;
  clubId: string;
}

export interface NewSection {
  id?: number;
  club_id?: number;
  name: string;
  description?: string;
  coach_id?: number | null;
  active?: boolean;
  club?: {
    id: number;
    name: string;
    city: string;
  };
  coach?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  groups?: {
    schedule: never[];
    id: number;
    name: string;
    level: string;
    capacity: number | "";
    price: number | "";
    active: boolean;
    enrolled_students: number;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleEntry {
  weekly_pattern: Record<string, {
    time: string;
    duration: number;
  }[]>;
  valid_from: string;
  valid_until: string;
}

export interface WeeklyPattern {
  monday: ScheduleEntry[];
  tuesday: ScheduleEntry[];
  wednesday: ScheduleEntry[];
  thursday: ScheduleEntry[];
  friday: ScheduleEntry[];
  saturday: ScheduleEntry[];
  sunday: ScheduleEntry[];
}

export type TimeSlot = { time: string; duration: number };

export interface NewGroup {
  section_id?: number;
  name: string;
  description?: string;
  schedule?: Record<string, unknown>;
  price: number | "";
  capacity: number | "";
  level: string;
  coach_id?: number | null;
  tags?: string[];
  active?: boolean;
}

export type Training = {
  id: string;
  date: string;
  time: string;
  endTime: string;
  coach: string;
  section: string;
  club: string;
  attendedCount: number;
  totalCount: number;
  color: string;
};

export interface StatRow {
  club: string;
  section: string;
  slot?: string;
  count: number;
}
