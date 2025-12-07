// Constants for Profile page
import type { MembershipTariff } from './types';

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

// Note: Membership tariffs are kept as constants since there's no API endpoint for them
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

