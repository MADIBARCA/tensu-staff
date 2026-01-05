import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { X, Check, Building2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Trainer, Group, StudentFilters, MembershipStatus, Club } from '../types';

interface StudentFiltersModalProps {
  clubs: Club[];
  coaches: Trainer[];
  groups: Group[];
  filters: StudentFilters;
  onApply: (filters: StudentFilters) => void;
  onClose: () => void;
}

export const StudentFiltersModal: React.FC<StudentFiltersModalProps> = ({
  clubs,
  coaches,
  groups,
  filters: initialFilters,
  onApply,
  onClose,
}) => {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky header
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const scrollY = contentElement.scrollTop;
      setIsScrolled(scrollY > 0);
    };

    contentElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, []);

  const [localFilters, setLocalFilters] = useState<StudentFilters>(initialFilters);

  const statusOptions: { value: MembershipStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('students.filter.allStatuses') },
    { value: 'active', label: t('students.status.active') },
    { value: 'new', label: t('students.status.new') },
    { value: 'frozen', label: t('students.status.frozen') },
    { value: 'expired', label: t('students.status.expired') },
  ];

  const handleClubToggle = (clubId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      clubId: prev.clubId === clubId ? null : clubId,
    }));
  };

  const handleTrainerToggle = (coachId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      coachIds: prev.coachIds.includes(coachId)
        ? prev.coachIds.filter((id) => id !== coachId)
        : [...prev.coachIds, coachId],
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
      clubId: null,
      coachIds: [],
      groupIds: [],
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
  };

  // Filter groups by selected club if any
  const filteredGroups = localFilters.clubId
    ? groups.filter(g => g.club_id === localFilters.clubId)
    : groups;

  // Filter coaches by selected club if any
  const filteredCoaches = localFilters.clubId
    ? coaches.filter(c => c.club_id === localFilters.clubId)
    : coaches;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl max-h-screen overflow-hidden flex flex-col">
        <div className={clsx(
          "flex items-center justify-between p-4 border-b border-gray-200 overflow-hidden",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled ? "pt-20" : "pt-0"
        )}>
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

        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
          {/* Club Filter */}
          {clubs.length > 1 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Building2 size={16} className="text-gray-500" />
                {t('students.filter.clubs')}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setLocalFilters(prev => ({ ...prev, clubId: null }))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    localFilters.clubId === null
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-900">{t('students.filter.allClubs')}</span>
                  {localFilters.clubId === null && (
                    <Check size={18} className="text-blue-500" />
                  )}
                </button>
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleClubToggle(club.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      localFilters.clubId === club.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-900">{club.name}</span>
                    {localFilters.clubId === club.id && (
                      <Check size={18} className="text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* Coaches Filter */}
          {filteredCoaches.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('students.filter.coaches')}
              </h3>
              <div className="space-y-2">
                {filteredCoaches.map((coach) => (
                  <button
                    key={coach.id}
                    onClick={() => handleTrainerToggle(coach.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      localFilters.coachIds.includes(coach.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-900">{coach.name}</span>
                    {localFilters.coachIds.includes(coach.id) && (
                      <Check size={18} className="text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Groups Filter */}
          {filteredGroups.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                {t('students.filter.groups')}
              </h3>
              <div className="space-y-2">
                {filteredGroups.map((group) => (
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
          )}
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
