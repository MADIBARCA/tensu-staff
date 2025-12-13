// Mock data for staff profile page - only data without API endpoints
import type { ClubAnalytics, PaymentHistory, MembershipTariff, Section } from './types';

// Analytics mock - нет API для аналитики
// Note: coach_id will be matched with currentUser.id to filter sections for coaches
const mockSectionsData: Section[] = [
  { id: 1, club_id: 1, name: 'Йога', students_count: 35, coach_id: 1 },
  { id: 2, club_id: 1, name: 'Пилатес', students_count: 28, coach_id: 2 },
  { id: 3, club_id: 1, name: 'Кроссфит', students_count: 42, coach_id: 1 },
  { id: 4, club_id: 1, name: 'Тренажерный зал', students_count: 30, coach_id: 3 },
  { id: 5, club_id: 1, name: 'Бокс', students_count: 15, coach_id: 2 },
  { id: 6, club_id: 2, name: 'Кроссфит', students_count: 35, coach_id: 1 },
  { id: 7, club_id: 2, name: 'Бокс', students_count: 25, coach_id: 4 },
  { id: 8, club_id: 2, name: 'ММА', students_count: 20, coach_id: 1 },
];

export const mockClubAnalytics: ClubAnalytics[] = [
  {
    club_id: 1,
    sections: mockSectionsData.filter(s => s.club_id === 1),
    total_students: 150,
    trainings_this_month: 120,
    trainings_conducted: 85,
    trainings_scheduled: 30,
    trainings_cancelled: 5,
  },
  {
    club_id: 2,
    sections: mockSectionsData.filter(s => s.club_id === 2),
    total_students: 80,
    trainings_this_month: 60,
    trainings_conducted: 45,
    trainings_scheduled: 12,
    trainings_cancelled: 3,
  },
];

// Payment history mock - нет API для истории платежей
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

// Membership tariffs mock - нет API для тарифов членства
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

// Справочные данные для создания клуба
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
