import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Student, FreezeMembershipData } from '../types';

interface FreezeMembershipModalProps {
  student: Student;
  onClose: () => void;
  onFreeze: (data: FreezeMembershipData) => void;
}

export const FreezeMembershipModal: React.FC<FreezeMembershipModalProps> = ({
  student,
  onClose,
  onFreeze,
}) => {
  const { t } = useI18n();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [days, setDays] = useState(7);
  const [error, setError] = useState('');

  const availableDays = student.membership
    ? student.membership.freeze_days_total - student.membership.freeze_days_used
    : 0;

  const handleDaysChange = (value: number) => {
    if (value > availableDays) {
      setError(t('students.freeze.maxDaysError', { days: availableDays }));
      setDays(availableDays);
    } else if (value < 1) {
      setDays(1);
      setError('');
    } else {
      setDays(value);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (days > availableDays || !student.membership) {
      setError(t('students.freeze.maxDaysError', { days: availableDays }));
      return;
    }

    onFreeze({
      enrollment_id: student.membership.id,
      days,
      reason: undefined,
    });
  };

  const calculateEndDate = (): string => {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return end.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateNewMembershipEnd = (): string => {
    if (!student.membership) return '';
    const currentEnd = new Date(student.membership.end_date);
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    return newEnd.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('students.freeze.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {t('students.freeze.studentName')}: <span className="font-medium text-gray-900">{student.first_name} {student.last_name}</span>
          </p>
          <p className="text-sm text-gray-600">
            {t('students.freeze.availableDays')}: <span className="font-medium text-gray-900">{availableDays}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('students.freeze.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('students.freeze.days')}
            </label>
            <input
              type="number"
              value={days}
              min={1}
              max={availableDays}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              className={`w-full border rounded-lg p-2 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-sm text-gray-600">
              {t('students.freeze.freezeEnd')}: <span className="font-medium text-gray-900">{calculateEndDate()}</span>
            </p>
            <p className="text-sm text-gray-600">
              {t('students.freeze.newMembershipEnd')}: <span className="font-medium text-gray-900">{calculateNewMembershipEnd()}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={days > availableDays || days < 1}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('students.freeze.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
