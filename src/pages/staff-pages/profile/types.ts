// Types for staff profile page

export type ClubStatus = 'active' | 'frozen' | 'pending' | 'deactivated';
export type MembershipStatus = 'active' | 'expiring' | 'expired' | 'frozen';
export type UserRole = 'owner' | 'admin' | 'coach';

export interface StaffUser {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  username?: string;
  photo_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Club {
  id: number;
  name: string;
  description?: string;
  city: string;
  address: string;
  phone: string;
  logo_url?: string;
  cover_url?: string;
  telegram_link?: string;
  instagram_link?: string;
  whatsapp_link?: string;
  tags: string[];
  status: ClubStatus;
  activation_date: string;
  working_hours: string;
  sections_count: number;
  students_count: number;
  owner_id: number;
  membership?: ClubMembership;
}

export interface ClubMembership {
  id: number;
  club_id: number;
  tariff_name: string;
  price: number;
  start_date: string;
  end_date: string;
  payment_method: string;
  status: MembershipStatus;
  days_until_expiry: number;
}

export interface Section {
  id: number;
  club_id: number;
  name: string;
  students_count: number;
}

export interface ClubAnalytics {
  club_id: number;
  sections: Section[];
  total_students: number;
  trainings_this_month: number;
  trainings_conducted: number;
  trainings_scheduled: number;
  trainings_cancelled: number;
}

export interface PaymentHistory {
  id: number;
  club_id: number;
  date: string;
  tariff_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

export interface CreateClubData {
  name: string;
  description?: string;
  city: string;
  address: string;
  phone: string;
  logo_url?: string;
  cover_url?: string;
  telegram_link?: string;
  instagram_link?: string;
  whatsapp_link?: string;
  tags: string[];
  membership_tariff_id?: number;
}

export interface MembershipTariff {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  description: string;
}
