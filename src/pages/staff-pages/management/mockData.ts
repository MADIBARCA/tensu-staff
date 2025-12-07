// Mock data for Management page - only data without API endpoints
import type { Tariff } from './types';

// Tariffs mock - нет API для тарифов
export const mockTariffs: Tariff[] = [
  {
    id: 1,
    name: 'Йога Начинающие - месяц',
    type: 'single_group',
    payment_type: 'monthly',
    price: 25000,
    club_ids: [],
    section_ids: [],
    group_ids: [1],
    active: true,
    created_at: '2024-01-25T10:00:00Z',
  },
  {
    id: 2,
    name: 'Вся Йога - полгода',
    type: 'full_section',
    payment_type: 'semi_annual',
    price: 120000,
    club_ids: [],
    section_ids: [1],
    group_ids: [],
    active: true,
    created_at: '2024-01-25T10:00:00Z',
  },
  {
    id: 3,
    name: 'Полный доступ - Клуб Сила',
    type: 'full_club',
    payment_type: 'annual',
    price: 200000,
    club_ids: [1],
    section_ids: [],
    group_ids: [],
    active: true,
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 4,
    name: '8 занятий Кроссфит',
    type: 'full_section',
    payment_type: 'session_pack',
    price: 28000,
    club_ids: [],
    section_ids: [3],
    group_ids: [],
    sessions_count: 8,
    validity_days: 45,
    active: true,
    created_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 5,
    name: 'Бокс + Кроссфит - месяц',
    type: 'multiple_groups',
    payment_type: 'monthly',
    price: 45000,
    club_ids: [],
    section_ids: [],
    group_ids: [5, 6, 7, 8],
    active: true,
    created_at: '2024-04-20T10:00:00Z',
  },
];

// Справочные данные для форм
export const levelOptions = [
  { value: 'beginner', label: 'Начинающий' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
  { value: 'all', label: 'Все уровни' },
];

export const weekDays = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
];
