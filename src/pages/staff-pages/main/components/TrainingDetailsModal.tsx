import React from 'react';
import { X, Edit2, Plus, Clock, MapPin, Users, User, Building2, Calendar, FileText, Repeat } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Training } from '../types';

interface TrainingDetailsModalProps {
  training: Training;
  onClose: () => void;
  onEdit: (training: Training) => void;
  onCreateNew: () => void;
}

export const TrainingDetailsModal: React.FC<TrainingDetailsModalProps> = ({
  training,
  onClose,
  onEdit,
  onCreateNew,
}) => {
  const { t } = useI18n();

  const getStatusConfig = (status: Training['status']) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t('training.status.scheduled'),
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: '📅',
        };
      case 'in_progress':
        return {
          label: t('training.status.in_progress'),
          bg: 'bg-green-500',
          lightBg: 'bg-green-50',
          text: 'text-green-700',
          icon: '🏃',
        };
      case 'completed':
        return {
          label: t('training.status.completed'),
          bg: 'bg-gray-400',
          lightBg: 'bg-gray-50',
          text: 'text-gray-600',
          icon: '✅',
        };
      case 'cancelled':
        return {
          label: t('training.status.cancelled'),
          bg: 'bg-red-500',
          lightBg: 'bg-red-50',
          text: 'text-red-700',
          icon: '❌',
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500',
          lightBg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: '📝',
        };
    }
  };

  const formatTime = (time: string, duration: number) => {
    const [hours, minutes] = time.split(':').map(Number);
    const endTime = new Date(2000, 0, 1, hours, minutes + duration);
    const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    return `${time} - ${endStr}`;
  };

  const formatDate = (dateStr: string) => {
    // Parse date string (format: YYYY-MM-DD) and create date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Compare dates by year, month, and day only
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    if (isToday) {
      return t('training.today');
    }
    
    // Check if tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate();
    
    if (isTomorrow) {
      return t('training.tomorrow');
    }
    
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  };

  const statusConfig = getStatusConfig(training.status);
  const canEdit = training.status === 'scheduled' || training.status === 'cancelled';

  return (
    <div className="fixed bg-black/50 inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header with gradient */}
        <div className={`relative overflow-hidden rounded-t-3xl sm:rounded-t-2xl`}>
          <div className={`${statusConfig.bg} px-6 pt-6 pb-8`}>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{statusConfig.icon}</span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                {statusConfig.label}
              </span>
              {training.training_type === 'recurring' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                  <Repeat size={12} />
                  Серия
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-1">
              {training.section_name}
            </h2>
            {training.group_name && (
              <p className="text-white/80">{training.group_name}</p>
            )}
          </div>

          {/* Curved bottom */}
          <div className="absolute -bottom-px left-0 right-0 h-4 bg-white rounded-t-3xl" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar size={14} />
                <span className="text-xs uppercase tracking-wide">Дата</span>
              </div>
              <p className="font-semibold text-gray-900">{formatDate(training.date)}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock size={14} />
                <span className="text-xs uppercase tracking-wide">Время</span>
              </div>
              <p className="font-semibold text-gray-900">{formatTime(training.time, training.duration)}</p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Клуб</p>
                <p className="font-medium text-gray-900">{training.club_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Тренер</p>
                <p className="font-medium text-gray-900">{training.coach_name}</p>
              </div>
            </div>

            {training.location && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Место</p>
                  <p className="font-medium text-gray-900">{training.location}</p>
                </div>
              </div>
            )}

            {training.max_participants && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Участники</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {training.current_participants} / {training.max_participants}
                    </p>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${(training.current_participants / training.max_participants) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {training.notes && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Заметки</p>
                  <p className="text-gray-700">{training.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          {canEdit && (
            <button
              onClick={() => onEdit(training)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={18} />
              Редактировать
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            Новая
          </button>
        </div>
      </div>
    </div>
  );
};
