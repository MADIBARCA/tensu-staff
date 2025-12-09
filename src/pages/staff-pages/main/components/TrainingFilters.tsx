import React, { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club, Trainer, Filters } from '../types';

interface TrainingFiltersProps {
  clubs: Club[];
  coaches: Trainer[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const TrainingFilters: React.FC<TrainingFiltersProps> = ({
  clubs,
  coaches,
  filters,
  onFiltersChange,
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClubChange = (clubId: number | null) => {
    onFiltersChange({
      ...filters,
      clubId,
      coachId: null, // Reset coach when club changes
    });
  };

  const handleTrainerChange = (coachId: number | null) => {
    onFiltersChange({
      ...filters,
      coachId,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      clubId: null,
      coachId: null,
    });
  };

  const hasActiveFilters = filters.clubId !== null || filters.coachId !== null;

  // Filter coaches by selected club
  const availableCoaches = filters.clubId
    ? coaches.filter(t => t.club_id === filters.clubId)
    : coaches;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.clubId) count++;
    if (filters.coachId) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className="mb-4">
      {/* Collapsed View - Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={16} />
          {t('schedule.filters')}
          {activeCount > 0 && (
            <span className="bg-white text-blue-500 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Active Filter Pills */}
        {hasActiveFilters && !isExpanded && (
          <>
            {filters.clubId && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                {clubs.find(c => c.id === filters.clubId)?.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClubChange(null);
                  }}
                  className="p-0.5 hover:bg-blue-100 rounded-full"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.coachId && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                {coaches.find(t => t.id === filters.coachId)?.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrainerChange(null);
                  }}
                  className="p-0.5 hover:bg-green-100 rounded-full"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Club Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                {t('schedule.filters.club')}
              </label>
              <select
                value={filters.clubId || ''}
                onChange={(e) => handleClubChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">{t('schedule.filters.allClubs')}</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trainer Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                {t('schedule.filters.coach')}
              </label>
              <select
                value={filters.coachId || ''}
                onChange={(e) => handleTrainerChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                disabled={filters.clubId !== null && availableCoaches.length === 0}
              >
                <option value="">{t('schedule.filters.allCoaches')}</option>
                {availableCoaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {t('schedule.filters.reset')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
