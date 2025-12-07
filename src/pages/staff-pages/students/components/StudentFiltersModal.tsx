import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Trainer, Group, StudentFilters, MembershipStatus } from '../types';

interface StudentFiltersModalProps {
  trainers: Trainer[];
  groups: Group[];
  filters: StudentFilters;
  onApply: (filters: StudentFilters) => void;
  onClose: () => void;
}

export const StudentFiltersModal: React.FC<StudentFiltersModalProps> = ({
  trainers,
  groups,
  filters: initialFilters,
  onApply,
  onClose,
}) => {
  const { t } = useI18n();
  const [localFilters, setLocalFilters] = useState<StudentFilters>(initialFilters);

  const statusOptions: { value: MembershipStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('students.filter.allStatuses') },
    { value: 'active', label: t('students.status.active') },
    { value: 'new', label: t('students.status.new') },
    { value: 'frozen', label: t('students.status.frozen') },
    { value: 'expired', label: t('students.status.expired') },
  ];

  const handleTrainerToggle = (trainerId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      trainerIds: prev.trainerIds.includes(trainerId)
        ? prev.trainerIds.filter((id) => id !== trainerId)
        : [...prev.trainerIds, trainerId],
    }));
  };

  const handleGroupToggle = (groupId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: StudentFilters = {
      search: '',
      status: 'all',
      trainerIds: [],
      groupIds: [],
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('students.filter.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              {t('students.filter.status')}
            </h3>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalFilters((prev) => ({ ...prev, status: option.value }))
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    localFilters.status === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-900">{option.label}</span>
                  {localFilters.status === option.value && (
                    <Check size={18} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Trainers Filter */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              {t('students.filter.trainers')}
            </h3>
            <div className="space-y-2">
              {trainers.map((trainer) => (
                <button
                  key={trainer.id}
                  onClick={() => handleTrainerToggle(trainer.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    localFilters.trainerIds.includes(trainer.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-900">{trainer.name}</span>
                  {localFilters.trainerIds.includes(trainer.id) && (
                    <Check size={18} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Groups Filter */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              {t('students.filter.groups')}
            </h3>
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupToggle(group.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    localFilters.groupIds.includes(group.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-gray-900 block">{group.name}</span>
                    <span className="text-xs text-gray-500">{group.section_name}</span>
                  </div>
                  {localFilters.groupIds.includes(group.id) && (
                    <Check size={18} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('students.filter.reset')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('students.filter.apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
