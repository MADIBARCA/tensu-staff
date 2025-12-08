import React from 'react';
import { Users, Clock, Edit2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Section } from '../types';

interface SectionCardProps {
  section: Section;
  canEdit: boolean;
  onEdit: () => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section, canEdit, onEdit }) => {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{section.name}</h3>
          <p className="text-sm text-gray-500">{section.club_name}</p>
        </div>
        {canEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>

      {/* Trainers */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
          <Users size={14} />
          <span>{t('management.sections.trainers')}:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {section.trainers.map(trainer => (
            <span
              key={trainer.id}
              className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded"
            >
              {trainer.name}
            </span>
          ))}
        </div>
      </div>

      {/* Groups */}
      {section.groups.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <Clock size={14} />
            <span>{t('management.sections.groups')}: {section.groups.length}</span>
          </div>
          <div className="space-y-1">
            {section.groups.slice(0, 3).map(group => (
              <div key={group.id} className="text-sm text-gray-600">
                <span className="font-medium">{group.name}</span>
                {group.level && (
                  <span className="text-gray-400 ml-2">({group.level})</span>
                )}
              </div>
            ))}
            {section.groups.length > 3 && (
              <p className="text-xs text-gray-400">
                +{section.groups.length - 3} {t('management.sections.moreGroups')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
