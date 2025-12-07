// Mock data for students page
import type { Student, AttendanceRecord, PaymentRecord, Trainer, Group } from './types';

export const mockTrainers: Trainer[] = [
  { id: 1, name: 'Иванов Иван Иванович', club_id: 1 },
  { id: 2, name: 'Петрова Мария Сергеевна', club_id: 1 },
  { id: 3, name: 'Сидоров Петр Александрович', club_id: 1 },
];

export const mockGroups: Group[] = [
  { id: 1, name: 'Группа А (Начальный)', section_id: 1, section_name: 'Йога', club_id: 1 },
  { id: 2, name: 'Группа Б (Средний)', section_id: 1, section_name: 'Йога', club_id: 1 },
  { id: 3, name: 'Группа В (Продвинутый)', section_id: 1, section_name: 'Йога', club_id: 1 },
  { id: 4, name: 'Группа А', section_id: 2, section_name: 'Пилатес', club_id: 1 },
  { id: 5, name: 'Группа Б', section_id: 2, section_name: 'Пилатес', club_id: 1 },
  { id: 6, name: 'Кроссфит Pro', section_id: 3, section_name: 'Кроссфит', club_id: 1 },
];

const today = new Date();

export const mockStudents: Student[] = [
  {
    id: 1,
    telegram_id: 123456789,
    first_name: 'Алексей',
    last_name: 'Смирнов',
    phone_number: '+7 777 123 45 67',
    username: 'alexey_smirnov',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 1,
    section_name: 'Йога',
    group_id: 1,
    group_name: 'Группа А (Начальный)',
    trainer_id: 1,
    trainer_name: 'Иванов Иван Иванович',
    membership: {
      id: 1,
      student_id: 1,
      club_id: 1,
      section_id: 1,
      group_id: 1,
      status: 'active',
      start_date: '2024-12-01',
      end_date: '2025-02-28',
      tariff_name: 'Стандарт (3 месяца)',
      price: 45000,
      freeze_available: true,
      freeze_days_total: 14,
      freeze_days_used: 0,
      created_at: '2024-12-01T10:00:00Z',
    },
    created_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 2,
    telegram_id: 234567890,
    first_name: 'Мария',
    last_name: 'Козлова',
    phone_number: '+7 777 234 56 78',
    username: 'maria_kozlova',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 2,
    section_name: 'Пилатес',
    group_id: 4,
    group_name: 'Группа А',
    trainer_id: 2,
    trainer_name: 'Петрова Мария Сергеевна',
    membership: {
      id: 2,
      student_id: 2,
      club_id: 1,
      section_id: 2,
      group_id: 4,
      status: 'frozen',
      start_date: '2024-11-15',
      end_date: '2025-02-15',
      tariff_name: 'Премиум (3 месяца)',
      price: 65000,
      freeze_available: true,
      freeze_days_total: 21,
      freeze_days_used: 7,
      created_at: '2024-11-15T10:00:00Z',
    },
    created_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 3,
    telegram_id: 345678901,
    first_name: 'Дмитрий',
    last_name: 'Волков',
    phone_number: '+7 777 345 67 89',
    username: 'dmitry_volkov',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 3,
    section_name: 'Кроссфит',
    group_id: 6,
    group_name: 'Кроссфит Pro',
    trainer_id: 3,
    trainer_name: 'Сидоров Петр Александрович',
    membership: {
      id: 3,
      student_id: 3,
      club_id: 1,
      section_id: 3,
      group_id: 6,
      status: 'expired',
      start_date: '2024-09-01',
      end_date: '2024-12-01',
      tariff_name: 'Стандарт (3 месяца)',
      price: 45000,
      freeze_available: false,
      freeze_days_total: 0,
      freeze_days_used: 0,
      created_at: '2024-09-01T10:00:00Z',
    },
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 4,
    telegram_id: 456789012,
    first_name: 'Анна',
    last_name: 'Петрова',
    phone_number: '+7 777 456 78 90',
    username: 'anna_petrova',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 1,
    section_name: 'Йога',
    group_id: 2,
    group_name: 'Группа Б (Средний)',
    trainer_id: 1,
    trainer_name: 'Иванов Иван Иванович',
    membership: {
      id: 4,
      student_id: 4,
      club_id: 1,
      section_id: 1,
      group_id: 2,
      status: 'new',
      start_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tariff_name: 'Пробный (1 месяц)',
      price: 15000,
      freeze_available: false,
      freeze_days_total: 0,
      freeze_days_used: 0,
      created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    telegram_id: 567890123,
    first_name: 'Сергей',
    last_name: 'Николаев',
    phone_number: '+7 777 567 89 01',
    username: 'sergey_nikolaev',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 2,
    section_name: 'Пилатес',
    group_id: 5,
    group_name: 'Группа Б',
    trainer_id: 2,
    trainer_name: 'Петрова Мария Сергеевна',
    membership: {
      id: 5,
      student_id: 5,
      club_id: 1,
      section_id: 2,
      group_id: 5,
      status: 'active',
      start_date: '2024-11-01',
      end_date: '2025-05-01',
      tariff_name: 'Полугодовой',
      price: 80000,
      freeze_available: true,
      freeze_days_total: 30,
      freeze_days_used: 0,
      created_at: '2024-11-01T10:00:00Z',
    },
    created_at: '2024-11-01T10:00:00Z',
  },
  {
    id: 6,
    telegram_id: 678901234,
    first_name: 'Елена',
    last_name: 'Федорова',
    phone_number: '+7 777 678 90 12',
    username: 'elena_fedorova',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 1,
    section_name: 'Йога',
    group_id: 3,
    group_name: 'Группа В (Продвинутый)',
    trainer_id: 1,
    trainer_name: 'Иванов Иван Иванович',
    membership: {
      id: 6,
      student_id: 6,
      club_id: 1,
      section_id: 1,
      group_id: 3,
      status: 'active',
      start_date: '2024-10-15',
      end_date: '2025-04-15',
      tariff_name: 'Полугодовой',
      price: 80000,
      freeze_available: true,
      freeze_days_total: 30,
      freeze_days_used: 10,
      created_at: '2024-10-15T10:00:00Z',
    },
    created_at: '2024-10-15T10:00:00Z',
  },
  {
    id: 7,
    telegram_id: 789012345,
    first_name: 'Андрей',
    last_name: 'Морозов',
    phone_number: '+7 777 789 01 23',
    username: 'andrey_morozov',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 3,
    section_name: 'Кроссфит',
    group_id: 6,
    group_name: 'Кроссфит Pro',
    trainer_id: 3,
    trainer_name: 'Сидоров Петр Александрович',
    membership: {
      id: 7,
      student_id: 7,
      club_id: 1,
      section_id: 3,
      group_id: 6,
      status: 'new',
      start_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(today.getTime() + 87 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tariff_name: 'Стандарт (3 месяца)',
      price: 45000,
      freeze_available: true,
      freeze_days_total: 14,
      freeze_days_used: 0,
      created_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 8,
    telegram_id: 890123456,
    first_name: 'Ольга',
    last_name: 'Соколова',
    phone_number: '+7 777 890 12 34',
    username: 'olga_sokolova',
    photo_url: '',
    club_id: 1,
    club_name: 'Фитнес клуб "Сила"',
    section_id: 2,
    section_name: 'Пилатес',
    group_id: 4,
    group_name: 'Группа А',
    trainer_id: 2,
    trainer_name: 'Петрова Мария Сергеевна',
    membership: {
      id: 8,
      student_id: 8,
      club_id: 1,
      section_id: 2,
      group_id: 4,
      status: 'active',
      start_date: '2024-12-10',
      end_date: '2025-03-10',
      tariff_name: 'Стандарт (3 месяца)',
      price: 45000,
      freeze_available: true,
      freeze_days_total: 14,
      freeze_days_used: 0,
      created_at: '2024-12-10T10:00:00Z',
    },
    created_at: '2024-12-10T10:00:00Z',
  },
];

// Generate attendance records for each student
export const generateAttendanceRecords = (studentId: number): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const student = mockStudents.find(s => s.id === studentId);
  if (!student) return records;

  const numRecords = Math.floor(Math.random() * 15) + 5;
  
  for (let i = 0; i < numRecords; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const hour = 9 + Math.floor(Math.random() * 10);
    const minute = Math.random() > 0.5 ? '00' : '30';
    
    records.push({
      id: i + 1,
      student_id: studentId,
      date: date.toISOString().split('T')[0],
      time: `${hour.toString().padStart(2, '0')}:${minute}`,
      training_type: student.section_name || 'Групповая тренировка',
      section_name: student.section_name || '',
      group_name: student.group_name,
      trainer_name: student.trainer_name || '',
      status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent'),
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate payment records for each student
export const generatePaymentRecords = (studentId: number): PaymentRecord[] => {
  const records: PaymentRecord[] = [];
  const student = mockStudents.find(s => s.id === studentId);
  if (!student || !student.membership) return records;

  // Initial purchase
  records.push({
    id: 1,
    student_id: studentId,
    date: student.membership.created_at.split('T')[0],
    amount: student.membership.price,
    operation_type: 'purchase',
    tariff_name: student.membership.tariff_name,
    status: 'paid',
  });

  // Add some random renewals for older students
  if (student.membership.status !== 'new') {
    const numRenewals = Math.floor(Math.random() * 3);
    for (let i = 0; i < numRenewals; i++) {
      const daysAgo = 90 + Math.floor(Math.random() * 180);
      const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      records.push({
        id: records.length + 1,
        student_id: studentId,
        date: date.toISOString().split('T')[0],
        amount: student.membership.price,
        operation_type: 'renewal',
        tariff_name: student.membership.tariff_name,
        status: 'paid',
      });
    }
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
