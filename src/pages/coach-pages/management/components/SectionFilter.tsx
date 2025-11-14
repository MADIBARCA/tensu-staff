import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Select } from "@/components/ui";
import { useI18n } from "@/i18n/i18n";

interface SectionFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterClub: string;
  filterCoach: string;
  clubOptions: string[];
  coachOptions: string[];
  onFiltersChange: (next: { club?: string; coach?: string }) => void;
}

const SectionFilter: React.FC<SectionFilterProps> = ({
  search,
  onSearchChange,
  filterClub,
  filterCoach,
  clubOptions,
  coachOptions,
  onFiltersChange,
}) => {
  const [show, setShow] = useState<boolean>(false);
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Найти секцию..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShow((v) => !v)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          aria-label="Показать фильтры"
        >
          <Filter size={20} />
        </button>
      </div>
      {show && (
        <FilterArea
          clubOptions={clubOptions}
          coachOptions={coachOptions}
          filterClub={filterClub}
          filterCoach={filterCoach}
          onFiltersChange={onFiltersChange}
        />
      )}
    </>
  );
};

export default SectionFilter;
 
const FilterArea: React.FC<{
  clubOptions: string[];
  coachOptions: string[];
  filterClub: string;
  filterCoach: string;
  onFiltersChange: (next: { club?: string; coach?: string }) => void;
}> = ({ clubOptions, coachOptions, filterClub, filterCoach, onFiltersChange }) => {
  const { t } = useI18n();
  return (
    <>
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t('filters.clubs')}
            value={filterClub}
            onChange={(e) => onFiltersChange({ club: e.target.value })}
            options={[
              { value: "all", label: t('filters.allClubs') },
              ...clubOptions.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            label={t('filters.coaches')}
            value={filterCoach}
            onChange={(e) => onFiltersChange({ coach: e.target.value })}
            options={[
              { value: "all", label: t('filters.allCoaches') },
              ...coachOptions.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      </div>
    </>
  );
};

