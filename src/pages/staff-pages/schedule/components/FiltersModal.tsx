import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, Check } from 'lucide-react';
import type { Club, Trainer, Filters } from '../SchedulePage';

interface FiltersModalProps {
  clubs: Club[];
  trainers: Trainer[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClose: () => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  clubs,
  trainers,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { t } = useI18n();

  const filteredTrainers = filters.clubId
    ? trainers.filter(tr => tr.club_id === filters.clubId)
    : trainers;

  const handleClubChange = (clubId: number | null) => {
    onFiltersChange({
      ...filters,
      clubId,
      // Reset trainer if switching clubs
      trainerId: clubId && filters.trainerId 
        ? trainers.find(t => t.id === filters.trainerId)?.club_id === clubId 
          ? filters.trainerId 
          : null
        : filters.trainerId,
    });
  };

  const handleSectionsTypeChange = (type: 'all' | 'my') => {
    onFiltersChange({ ...filters, sectionsType: type });
  };

  const handleTrainerChange = (trainerId: number | null) => {
    onFiltersChange({ ...filters, trainerId });
  };

  const handleReset = () => {
    onFiltersChange({
      clubId: null,
      sectionsType: 'all',
      trainerId: null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('schedule.filters')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Club Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {t('schedule.filters.club')}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleClubChange(null)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  !filters.clubId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={!filters.clubId ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {t('schedule.filters.allClubs')}
                </span>
                {!filters.clubId && <Check size={18} className="text-blue-500" />}
              </button>
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleClubChange(club.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    filters.clubId === club.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={filters.clubId === club.id ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                    {club.name}
                  </span>
                  {filters.clubId === club.id && <Check size={18} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sections Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {t('schedule.filters.sections')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleSectionsTypeChange('all')}
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  filters.sectionsType === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('schedule.filters.allSections')}
              </button>
              <button
                onClick={() => handleSectionsTypeChange('my')}
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  filters.sectionsType === 'my'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('schedule.filters.mySections')}
              </button>
            </div>
          </div>

          {/* Trainer Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {t('schedule.filters.trainer')}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleTrainerChange(null)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  !filters.trainerId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={!filters.trainerId ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {t('schedule.filters.allTrainers')}
                </span>
                {!filters.trainerId && <Check size={18} className="text-blue-500" />}
              </button>
              {filteredTrainers.map((trainer) => (
                <button
                  key={trainer.id}
                  onClick={() => handleTrainerChange(trainer.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    filters.trainerId === trainer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={filters.trainerId === trainer.id ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                    {trainer.name}
                  </span>
                  {filters.trainerId === trainer.id && <Check size={18} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('schedule.filters.reset')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('schedule.filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
