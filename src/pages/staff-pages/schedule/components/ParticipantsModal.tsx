import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, User } from 'lucide-react';
import type { Training } from '../SchedulePage';

interface ParticipantsModalProps {
  training: Training;
  onClose: () => void;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({ training, onClose }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('schedule.participants.title')}
            </h2>
            <p className="text-sm text-gray-500">
              {training.section_name} • {training.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {training.participants && training.participants.length > 0 ? (
            <div className="space-y-2">
              {training.participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{participant}</span>
                  {participant === 'Вы' && (
                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      {t('schedule.participants.you')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('schedule.participants.empty')}</p>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {t('schedule.participants.count', {
                current: training.current_participants,
                max: training.max_participants,
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
