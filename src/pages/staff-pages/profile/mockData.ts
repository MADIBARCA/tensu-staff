// Mock data for staff profile page
import type { StaffUser, Club, ClubAnalytics, PaymentHistory, MembershipTariff, Section } from './types';

const today = new Date();
const daysUntilExpiry = (endDate: string): number => {
  const end = new Date(endDate);
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const mockStaffUser: StaffUser = {
  id: 1,
  telegram_id: 123456789,
  first_name: 'Иван',
  last_name: 'Иванов',
  phone_number: '+7 777 123 45 67',
  email: 'ivan@example.com',
  username: 'ivan_trainer',
  photo_url: '',
  role: 'owner',
  created_at: '2024-01-15T10:00:00Z',
};

const club1EndDate = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const club2EndDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const mockClubs: Club[] = [
  {
    id: 1,
    name: 'Фитнес клуб "Сила"',
    description: 'Современный фитнес-центр с профессиональным оборудованием',
    city: 'Алматы',
    address: 'ул. Абая, 150',
    phone: '+7 727 123 45 67',
    logo_url: '',
    cover_url: '',
    telegram_link: 'https://t.me/sila_fitness',
    instagram_link: 'https://instagram.com/sila_fitness',
    whatsapp_link: '+77271234567',
    tags: ['фитнес', 'тренажерный зал', 'йога', 'пилатес'],
    status: 'active',
    activation_date: '2024-01-15',
    working_hours: '06:00 - 23:00',
    sections_count: 5,
    students_count: 150,
    owner_id: 1,
    membership: {
      id: 1,
      club_id: 1,
      tariff_name: 'Премиум',
      price: 50000,
      start_date: '2024-10-01',
      end_date: club1EndDate,
      payment_method: 'Карта',
      status: 'active',
      days_until_expiry: daysUntilExpiry(club1EndDate),
    },
  },
  {
    id: 2,
    name: 'Спортзал "Энергия"',
    description: 'Спортивный клуб для всей семьи',
    city: 'Алматы',
    address: 'пр. Достык, 89',
    phone: '+7 727 987 65 43',
    logo_url: '',
    cover_url: '',
    telegram_link: '',
    instagram_link: '',
    whatsapp_link: '',
    tags: ['спорт', 'кроссфит', 'бокс'],
    status: 'expiring' as any,
    activation_date: '2024-06-01',
    working_hours: '07:00 - 22:00',
    sections_count: 3,
    students_count: 80,
    owner_id: 1,
    membership: {
      id: 2,
      club_id: 2,
      tariff_name: 'Стандарт',
      price: 30000,
      start_date: '2024-09-01',
      end_date: club2EndDate,
      payment_method: 'Карта',
      status: 'expiring',
      days_until_expiry: daysUntilExpiry(club2EndDate),
    },
  },
];

export const mockSections: Section[] = [
  { id: 1, club_id: 1, name: 'Йога', students_count: 35 },
  { id: 2, club_id: 1, name: 'Пилатес', students_count: 28 },
  { id: 3, club_id: 1, name: 'Кроссфит', students_count: 42 },
  { id: 4, club_id: 1, name: 'Тренажерный зал', students_count: 30 },
  { id: 5, club_id: 1, name: 'Бокс', students_count: 15 },
  { id: 6, club_id: 2, name: 'Кроссфит', students_count: 35 },
  { id: 7, club_id: 2, name: 'Бокс', students_count: 25 },
  { id: 8, club_id: 2, name: 'ММА', students_count: 20 },
];

export const mockClubAnalytics: ClubAnalytics[] = [
  {
    club_id: 1,
    sections: mockSections.filter(s => s.club_id === 1),
    total_students: 150,
    trainings_this_month: 120,
    trainings_conducted: 85,
    trainings_scheduled: 30,
    trainings_cancelled: 5,
  },
  {
    club_id: 2,
    sections: mockSections.filter(s => s.club_id === 2),
    total_students: 80,
    trainings_this_month: 60,
    trainings_conducted: 45,
    trainings_scheduled: 12,
    trainings_cancelled: 3,
  },
];

export const mockPaymentHistory: PaymentHistory[] = [
  {
    id: 1,
    club_id: 1,
    date: '2024-10-01',
    tariff_name: 'Премиум',
    amount: 50000,
    status: 'paid',
  },
  {
    id: 2,
    club_id: 1,
    date: '2024-07-01',
    tariff_name: 'Премиум',
    amount: 50000,
    status: 'paid',
  },
  {
    id: 3,
    club_id: 1,
    date: '2024-04-01',
    tariff_name: 'Стандарт',
    amount: 30000,
    status: 'paid',
  },
  {
    id: 4,
    club_id: 2,
    date: '2024-09-01',
    tariff_name: 'Стандарт',
    amount: 30000,
    status: 'paid',
  },
  {
    id: 5,
    club_id: 2,
    date: '2024-06-01',
    tariff_name: 'Стандарт',
    amount: 30000,
    status: 'paid',
  },
];

export const mockMembershipTariffs: MembershipTariff[] = [
  {
    id: 1,
    name: 'Базовый',
    price: 15000,
    duration_days: 30,
    description: 'До 50 студентов, 2 секции',
  },
  {
    id: 2,
    name: 'Стандарт',
    price: 30000,
    duration_days: 30,
    description: 'До 150 студентов, 5 секций',
  },
  {
    id: 3,
    name: 'Премиум',
    price: 50000,
    duration_days: 30,
    description: 'Неограниченно студентов и секций',
  },
  {
    id: 4,
    name: 'Годовой',
    price: 450000,
    duration_days: 365,
    description: 'Полный доступ на год',
  },
];

export const availableTags = [
  'фитнес',
  'тренажерный зал',
  'йога',
  'пилатес',
  'кроссфит',
  'бокс',
  'ММА',
  'танцы',
  'плавание',
  'теннис',
  'баскетбол',
  'футбол',
  'волейбол',
  'гимнастика',
  'единоборства',
];

export const cities = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Усть-Каменогорск',
  'Семей',
  'Атырау',
];
