import React from 'react';
import type { Lesson } from '@/functions/axios/responses';
import { Clock, MapPin, Users, Pencil } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

interface TrainingListItemProps {
  lesson: Lesson;
  clubName?: string;
  sectionName?: string;
  statusInfo: {
    key: string;
    label: string;
    color: string;
  };
  onEdit: () => void;
  canEdit: boolean;
}

export const TrainingListItem: React.FC<TrainingListItemProps> = ({
  lesson,
  clubName,
  sectionName,
  statusInfo,
  onEdit,
  canEdit,
}) => {
  const { lang } = useI18n();

  const formatTrainingDate = (dateStr: string, timeStr: string): string => {
    const trainingDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const daysDiff = Math.floor((trainingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const todayLabel = lang === 'kk' ? 'Бүгін' : 'Сегодня';
    const tomorrowLabel = lang === 'kk' ? 'Ертең' : 'Завтра';
    
    if (daysDiff === 0) {
      return `${todayLabel}, ${timeStr}`;
    } else if (daysDiff === 1) {
      return `${tomorrowLabel}, ${timeStr}`;
    } else if (daysDiff <= 5) {
      const weekdays = lang === 'kk' 
        ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
        : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      return `${weekdays[trainingDate.getDay()]}, ${timeStr}`;
    } else {
      return `${trainingDate.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { day: '2-digit', month: '2-digit' })}, ${timeStr}`;
    }
  };

  const endTime = (() => {
    const [h, m] = lesson.planned_start_time.split(":").map(Number);
    const start = new Date(1970, 0, 1, h, m || 0);
    const end = new Date(start.getTime() + lesson.duration_minutes * 60000);
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  })();

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all ${
      statusInfo.key === 'cancelled' 
        ? 'border-red-200 bg-red-50/50' 
        : statusInfo.key === 'live'
        ? 'border-orange-200 bg-orange-50/50'
        : 'border-gray-200 hover:shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {sectionName || '—'}
            <span className="text-gray-500 font-normal"> • {lesson.group.name}</span>
          </h3>
          <p className="text-sm text-gray-600">
            {lesson.coach.first_name} {lesson.coach.last_name}
          </p>
        </div>
        <span className={`px-2 py-1 text-white text-xs rounded-full font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} className="text-gray-400" />
          <span>{formatTrainingDate(lesson.planned_date, lesson.planned_start_time.slice(0, 5))}</span>
          <span className="text-gray-400">—</span>
          <span>{endTime}</span>
          <span className="text-gray-400">({lesson.duration_minutes} {lang === 'kk' ? 'мин' : 'мин'})</span>
        </div>
        {lesson.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            <span>{lesson.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} className="text-gray-400" />
          <span>{clubName || '—'}</span>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Pencil size={14} />
            {lang === 'kk' ? 'Өңдеу' : 'Редактировать'}
          </button>
        </div>
      )}
    </div>
  );
};
