import React, { useMemo, useState } from "react";
import type { CreateSectionResponse } from "@/functions/axios/responses";
import { Plus, Filter } from "lucide-react";
import SectionCard from "./SectionCard";
import { Select, Input } from "@/components/ui";
import { useI18n } from "@/i18n/i18n";

export const SectionsPanel: React.FC<{
  sections: CreateSectionResponse[];
  onEdit: (id: number) => void;
  onAdd: () => void;
  editableClubIds?: number[];
}> = ({ sections, onEdit, onAdd, editableClubIds = [] }) => {
  const { t } = useI18n();
  const [filters, setFilters] = useState<{ club: string; coach: string }>({
    club: "all",
    coach: "all",
  });
  const [search, setSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const clubs = useMemo(() => {
    return Array.from(
      new Set(
        (sections || [])
          .map((s) => s.club?.name)
          .filter((v): v is string => Boolean(v))
      )
    );
  }, [sections]);

  const coaches = useMemo(() => {
    return Array.from(
      new Set(
        (sections || []).map((s) =>
          `${s.coach.first_name}${s.coach.last_name ? " " + s.coach.last_name : ""}`.trim()
        )
      )
    );
  }, [sections]);

  const filteredSections = useMemo(() => {
    const sLower = search.trim().toLowerCase();
    return (sections || []).filter((s) => {
      const coachName = `${s.coach.first_name}${s.coach.last_name ? " " + s.coach.last_name : ""}`.trim();
      const clubName = s.club?.name || "";
      const matchesSearch = !sLower || s.name.toLowerCase().includes(sLower);
      const coachOk = filters.coach === "all" || coachName === filters.coach;
      const clubOk = filters.club === "all" || clubName === filters.club;
      return matchesSearch && coachOk && clubOk;
    });
  }, [sections, filters, search]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div />
        <button
          onClick={() => setShowFilters((f) => !f)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Filter size={20} />
        </button>
      </div>
      <div className="space-y-3 mb-3">
        <Input
          placeholder="Найти секцию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {showFilters && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label={t('filters.clubs')}
                value={filters.club}
                onChange={(e) => setFilters((prev) => ({ ...prev, club: e.target.value }))}
                options={[
                  { value: "all", label: t('filters.allClubs') },
                  ...clubs.map((c) => ({ value: c, label: c })),
                ]}
              />
              <Select
                label={t('filters.coaches')}
                value={filters.coach}
                onChange={(e) => setFilters((prev) => ({ ...prev, coach: e.target.value }))}
                options={[
                  { value: "all", label: t('filters.allCoaches') },
                  ...coaches.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>
        )}
      </div>
      <div className="mb-3 text-sm text-gray-600">{filteredSections.length} секций</div>
      <div className="space-y-4">
        {filteredSections.map((sec) => (
          <SectionCard
            key={sec.id}
            section={sec}
            onEdit={onEdit}
            canEdit={editableClubIds.includes(sec.club_id)}
          />
        ))}
        <button onClick={onAdd} className="fixed bottom-28 right-4 bg-blue-500 p-4 rounded-full shadow-lg text-white hover:bg-blue-600 transition-colors">
          <Plus size={20} /> 
        </button>
      </div>
    </>
  );
};

