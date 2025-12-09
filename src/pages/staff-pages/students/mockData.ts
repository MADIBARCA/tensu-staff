// Mock data for students page - only data without API endpoints
import type { AttendanceRecord, PaymentRecord } from './types';

const today = new Date();

// Generate attendance records - нет API для истории посещений
export const generateAttendanceRecords = (studentId: number, sectionName?: string, groupName?: string, coachName?: string): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
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
      training_type: sectionName || 'Групповая тренировка',
      section_name: sectionName || '',
      group_name: groupName,
      coach_name: coachName || '',
      status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent'),
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate payment records - нет API для истории платежей студентов
export const generatePaymentRecords = (studentId: number, tariffName?: string, price?: number, startDate?: string): PaymentRecord[] => {
  const records: PaymentRecord[] = [];
  
  // Initial purchase
  records.push({
    id: 1,
    student_id: studentId,
    date: startDate || today.toISOString().split('T')[0],
    amount: price || 30000,
    operation_type: 'purchase',
    tariff_name: tariffName || 'Абонемент',
    status: 'paid',
  });

  // Add some random renewals
  const numRenewals = Math.floor(Math.random() * 3);
  for (let i = 0; i < numRenewals; i++) {
    const daysAgo = 90 + Math.floor(Math.random() * 180);
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    records.push({
      id: records.length + 1,
      student_id: studentId,
      date: date.toISOString().split('T')[0],
      amount: price || 30000,
      operation_type: 'renewal',
      tariff_name: tariffName || 'Абонемент',
      status: 'paid',
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
