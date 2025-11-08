import React from 'react';
import { Edit3 } from 'lucide-react';
import type { CreateSectionResponse } from '@/functions/axios/responses';

interface SectionCardProps {
  section: CreateSectionResponse;
  onEdit: (sectionId: number) => void;
  canEdit?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, onEdit, canEdit = true }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{section.name}</h3>
        {/* <p className="text-sm text-gray-600 mb-3">{section.description}</p> */}
        <div className="space-y-2">
          {/* <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-blue-600" />
            <a href={section} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
              Телеграм Группа
            </a>
          </div> */}
          <div>
            <span className="text-sm font-medium text-gray-700">Клуб: </span>
            <span className="text-sm text-gray-600">{section.club?.name || '—'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Тренера: </span>
            <span className="text-sm text-gray-600">{section.coach.first_name +(' ') + section.coach.last_name}</span>
          </div>
        </div>
      </div>
      {canEdit && (
        <button onClick={() => onEdit(section.id)} className="p-2 text-gray-400 hover:text-blue-600">
          <Edit3 size={18} />
        </button>
      )}
    </div>
  </div>
);

export default SectionCard;