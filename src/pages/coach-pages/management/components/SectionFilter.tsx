import React from "react";
import { Search } from "lucide-react";
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
  const { t } = useI18n();
  return (
    <>
      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Найти секцию"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
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
    </>
  );
};

export default SectionFilter;

