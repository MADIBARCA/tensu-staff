import React from 'react';
import { X, Clock, MapPin, Users, User, Dumbbell } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Training } from '../types';

interface SelectedDateTrainingsProps {
  date: Date;
  trainings: Training[];
  onClose: () => void;
  onTrainingClick: (training: Training) => void;
}

export const SelectedDateTrainings: React.FC<SelectedDateTrainingsProps> = ({
  date,
  trainings,
  onClose,
  onTrainingClick,
}) => {
  const { t } = useI18n();

  const getStatusConfig = (status: Training['status']) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t('training.status.scheduled'),
          bg: 'bg-blue-500',
          text: 'text-blue-700',
          lightBg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: '📅',
        };
      case 'in_progress':
        return {
          label: t('training.status.in_progress'),
          bg: 'bg-green-500',
          text: 'text-green-700',
          lightBg: 'bg-green-50',
          border: 'border-green-200',
          icon: '🏃',
        };
      case 'completed':
        return {
          label: t('training.status.completed'),
          bg: 'bg-gray-400',
          text: 'text-gray-600',
          lightBg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: '✅',
        };
      case 'cancelled':
        return {
          label: t('training.status.cancelled'),
          bg: 'bg-red-500',
          text: 'text-red-700',
          lightBg: 'bg-red-50',
          border: 'border-red-200',
          icon: '❌',
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500',
          text: 'text-gray-700',
          lightBg: 'bg-gray-50',
          border: 'border-gray-200',
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

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return 'Сегодня';
    }
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {formatDate(date)}
            </h3>
            <p className="text-sm text-gray-500">
              {trainings.length} {trainings.length === 1 ? 'тренировка' : 
                trainings.length < 5 ? 'тренировки' : 'тренировок'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {trainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Dumbbell size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">{t('training.noTrainingsOnDate')}</p>
              <p className="text-sm text-gray-400">Нажмите + чтобы добавить тренировку</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainings.map((training) => {
                const statusConfig = getStatusConfig(training.status);
                
                return (
                  <button
                    key={training.id}
                    onClick={() => onTrainingClick(training)}
                    className={`w-full text-left rounded-2xl border-2 transition-all hover:shadow-md active:scale-[0.98] ${
                      training.status === 'cancelled'
                        ? 'border-red-100 bg-red-50/50'
                        : training.status === 'in_progress'
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-100 bg-white hover:border-blue-200'
                    }`}
                  >
                    {/* Status Bar */}
                    <div className={`h-1 ${statusConfig.bg} rounded-t-xl`} />
                    
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {training.section_name}
                            </h4>
                            {training.group_name && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                {training.group_name}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">{training.club_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.lightBg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Clock size={16} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Время</p>
                            <p className="text-sm font-medium">{formatTime(training.time, training.duration)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-purple-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Тренер</p>
                            <p className="text-sm font-medium truncate">{training.coach_name}</p>
                          </div>
                        </div>

                        {training.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                              <MapPin size={16} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Место</p>
                              <p className="text-sm font-medium truncate">{training.location}</p>
                            </div>
                          </div>
                        )}

                        {training.max_participants && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                              <Users size={16} className="text-green-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Участники</p>
                              <p className="text-sm font-medium">
                                {training.current_participants}/{training.max_participants}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
