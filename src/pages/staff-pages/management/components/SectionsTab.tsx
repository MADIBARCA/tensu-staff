import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, AlertTriangle, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { SectionCard } from './SectionCard';
import { CreateSectionModal } from './CreateSectionModal';
import { EditSectionModal } from './EditSectionModal';
import { sectionsApi } from '@/functions/axios/axiosFunctions';
import type { Section, Club, Employee, SectionFilters } from '../types';
import type { ClubWithRole, CreateStaffResponse, GetSectionsStatsResponse } from '@/functions/axios/responses';

interface SectionsTabProps {
  sections: Section[];
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  employees: Employee[];
  onRefresh: () => void;
}

export const SectionsTab: React.FC<SectionsTabProps> = ({
  sections,
  clubs,
  clubRoles,
  currentUser,
  employees,
  onRefresh,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  const [filters, setFilters] = useState<SectionFilters>({ search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionsStats, setSectionsStats] = useState<GetSectionsStatsResponse | null>(null);
  const [showLimitsModal, setShowLimitsModal] = useState(false);

  const coaches = employees.filter(e => e.role === 'coach');

  // Load sections stats
  useEffect(() => {
    const loadStats = async () => {
      if (!initDataRaw) return;
      try {
        const response = await sectionsApi.getMyStats(initDataRaw);
        if (response.data) {
          setSectionsStats(response.data);
        }
      } catch (error) {
        console.error('Error loading sections stats:', error);
      }
    };
    loadStats();
  }, [initDataRaw, sections.length]); // Reload when sections change

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
      if (filters.coach_id && !section.coach_ids.includes(filters.coach_id)) {
        return false;
      }

      return true;
    });
  }, [sections, filters]);

  const handleSectionCreated = () => {
    setShowCreateModal(false);
    onRefresh();
    // Reload stats after creating a section
    if (initDataRaw) {
      sectionsApi.getMyStats(initDataRaw).then(response => {
        if (response.data) {
          setSectionsStats(response.data);
        }
      }).catch(console.error);
    }
  };

  const handleEditClosed = () => {
      setEditingSection(null);
    onRefresh();
  };

  // Check if user can edit a section (must be owner or admin of the section's club)
  const canEditSection = (section: Section): boolean => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === section.club_id);
    return clubRole ? (clubRole.role === 'owner' || clubRole.role === 'admin') : false;
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const hasActiveFilters = filters.club_id || filters.coach_id;

  const canCreateMore = sectionsStats ? sectionsStats.remaining_sections > 0 : true;

  const handleCreateClick = () => {
    if (!canCreateMore) {
      setShowLimitsModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

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
          onClick={handleCreateClick}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600"
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
                {t('management.sections.coach')}
              </label>
              <select
                value={filters.coach_id || ''}
                onChange={(e) => setFilters({ ...filters, coach_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              >
                <option value="">{t('management.sections.allCoaches')}</option>
                {coaches.map(coach => (
                  <option key={coach.id} value={coach.id}>
                    {coach.first_name} {coach.last_name}
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
              canEdit={canEditSection(section)}
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
          onCreate={handleSectionCreated}
        />
      )}

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          employees={employees}
          clubRoles={clubRoles}
          currentUser={currentUser}
          onClose={() => setEditingSection(null)}
          onRefresh={handleEditClosed}
        />
      )}

      {/* Section Limits Modal */}
      {showLimitsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Лимит секций достигнут
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center mb-4">
                Вы достигли максимального количества секций. Для увеличения лимита свяжитесь с администратором.
              </p>
              
              {sectionsStats && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Создано секций</span>
                    <span className="font-semibold text-gray-900">{sectionsStats.total_sections}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Максимум</span>
                    <span className="font-semibold text-gray-900">{sectionsStats.max_sections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Доступно</span>
                    <span className="font-semibold text-amber-600">{sectionsStats.remaining_sections}</span>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 text-center">
                  Свяжитесь с нами для увеличения лимита
                </p>
                <a
                  href="https://t.me/admintensu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 text-blue-600 font-medium hover:text-blue-700"
                >
                  <MessageCircle size={18} />
                  @admintensu
                </a>
              </div>
              
              <button
                onClick={() => setShowLimitsModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
