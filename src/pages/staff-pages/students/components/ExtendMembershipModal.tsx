import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Student, ExtendMembershipData } from '../types';

interface ExtendMembershipModalProps {
  student: Student;
  onClose: () => void;
  onExtend: (data: ExtendMembershipData) => void;
}

const TARIFF_OPTIONS = [
  { name: 'Пробный (1 месяц)', days: 30, price: 15000 },
  { name: 'Стандарт (1 месяц)', days: 30, price: 20000 },
  { name: 'Стандарт (3 месяца)', days: 90, price: 45000 },
  { name: 'Премиум (3 месяца)', days: 90, price: 65000 },
  { name: 'Полугодовой', days: 180, price: 80000 },
  { name: 'Годовой', days: 365, price: 140000 },
];

export const ExtendMembershipModal: React.FC<ExtendMembershipModalProps> = ({
  student,
  onClose,
  onExtend,
}) => {
  const { t } = useI18n();
  const [selectedTariff, setSelectedTariff] = useState<typeof TARIFF_OPTIONS[0] | null>(null);

  const handleSubmit = () => {
    if (!selectedTariff) return;

    onExtend({
      period: selectedTariff.days,
      tariff_name: selectedTariff.name,
      price: selectedTariff.price,
    });
  };

  const calculateNewEndDate = (days: number): string => {
    const currentEndDate = student.membership
      ? new Date(student.membership.end_date)
      : new Date();
    const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    return newEndDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl max-h-screen overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('students.extend.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {t('students.extend.studentName')}: <span className="font-medium text-gray-900">{student.first_name} {student.last_name}</span>
            </p>
            {student.membership && (
              <p className="text-sm text-gray-600">
                {t('students.extend.currentEnd')}: <span className="font-medium text-gray-900">
                  {new Date(student.membership.end_date).toLocaleDateString('ru-RU')}
                </span>
              </p>
            )}
          </div>

          <h3 className="font-medium text-gray-900 mb-3">
            {t('students.extend.selectTariff')}
          </h3>

          <div className="space-y-2">
            {TARIFF_OPTIONS.map((tariff) => (
              <button
                key={tariff.name}
                onClick={() => setSelectedTariff(tariff)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                  selectedTariff?.name === tariff.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <span className="font-medium text-gray-900 block">{tariff.name}</span>
                  <span className="text-xs text-gray-500">
                    {t('students.extend.newEnd')}: {calculateNewEndDate(tariff.days)}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {tariff.price.toLocaleString()} ₸
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTariff}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('students.extend.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
