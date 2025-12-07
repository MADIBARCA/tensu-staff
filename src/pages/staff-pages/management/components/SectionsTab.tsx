import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { SectionCard } from './SectionCard';
import { CreateSectionModal } from './CreateSectionModal';
import { EditSectionModal } from './EditSectionModal';
import type { Section, Club, Employee, SectionFilters, CreateSectionData, CreateGroupData, CreateScheduleData, Group } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface SectionsTabProps {
  sections: Section[];
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  employees: Employee[];
  onCreateSection: (section: CreateSectionData, groups: (CreateGroupData & { schedules: CreateScheduleData[] })[]) => void;
  onUpdateSection: (id: number, name: string, trainerIds: number[], groups: Group[]) => void;
  onDeleteSection: (id: number) => void;
}

export const SectionsTab: React.FC<SectionsTabProps> = ({
  sections,
  clubs,
  clubRoles,
  currentUser,
  employees,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
}) => {
  const { t } = useI18n();
  const [filters, setFilters] = useState<SectionFilters>({ search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const trainers = employees.filter(e => e.role === 'trainer');

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!section.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Club filter
      if (filters.club_id && section.club_id !== filters.club_id) {
        return false;
      }

      // Trainer filter
      if (filters.trainer_id && !section.trainer_ids.includes(filters.trainer_id)) {
        return false;
      }

      return true;
    });
  }, [sections, filters]);

  const handleCreateSection = (section: CreateSectionData, groups: (CreateGroupData & { schedules: CreateScheduleData[] })[]) => {
    onCreateSection(section, groups);
    setShowCreateModal(false);
  };

  const handleUpdateSection = (name: string, trainerIds: number[], groups: Group[]) => {
    if (editingSection) {
      onUpdateSection(editingSection.id, name, trainerIds, groups);
      setEditingSection(null);
    }
  };

  const handleDeleteSection = () => {
    if (editingSection) {
      onDeleteSection(editingSection.id);
      setEditingSection(null);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const hasActiveFilters = filters.club_id || filters.trainer_id;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('management.sections.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 border rounded-lg transition-colors ${
            hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          {t('management.sections.create')}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{t('management.sections.filters')}</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t('common.reset')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('management.sections.club')}
              </label>
              <select
                value={filters.club_id || ''}
                onChange={(e) => setFilters({ ...filters, club_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              >
                <option value="">{t('management.sections.allClubs')}</option>
                {clubs.filter(c => c.status === 'active').map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('management.sections.trainer')}
              </label>
              <select
                value={filters.trainer_id || ''}
                onChange={(e) => setFilters({ ...filters, trainer_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              >
                <option value="">{t('management.sections.allTrainers')}</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.first_name} {trainer.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sections Count */}
      <div className="text-sm text-gray-500">
        {filteredSections.length} {t('management.sections.count')}
      </div>

      {/* Sections List */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('management.sections.notFound')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredSections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              onEdit={() => setEditingSection(section)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSectionModal
          clubs={clubs}
          clubRoles={clubRoles}
          currentUser={currentUser}
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSection}
        />
      )}

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          employees={employees}
          onClose={() => setEditingSection(null)}
          onSave={handleUpdateSection}
          onDelete={handleDeleteSection}
        />
      )}
    </div>
  );
};
