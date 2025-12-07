import type { Lesson } from "@/functions/axios/responses";
import { Clock, MapPin, Users, X, Pencil, Building2, Dumbbell, Timer, Plus } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

export const DayDetailsModal: React.FC<{
  day: string;
  onClose: () => void;
  trainings: Lesson[];
  onSelectLesson?: (lesson: Lesson) => void;
  onCreateForDay?: (day: string) => void;
  clubNameBySectionId?: Record<number, string>;
  sectionNameBySectionId?: Record<number, string>;
  canEdit?: (lesson: Lesson) => boolean;
}> = ({ day, onClose, trainings, onSelectLesson, onCreateForDay, clubNameBySectionId, sectionNameBySectionId, canEdit }) => {
  const { t, lang } = useI18n();

  const getTemporalStatus = (tr: Lesson) => {
    if (tr.status === 'cancelled') {
      return { key: 'cancelled', label: lang === 'kk' ? 'Бас тартылды' : 'Отменено', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' } as const;
    }
    const start = new Date(`${tr.planned_date}T${tr.planned_start_time.slice(0,5)}:00`);
    const end = new Date(start.getTime() + (tr.duration_minutes || 0) * 60000);
    const now = new Date();
    if (now < start) {
      return { key: 'upcoming', label: lang === 'kk' ? 'Жоспарланған' : 'Запланировано', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' } as const;
    }
    if (now >= start && now <= end) {
      return { key: 'live', label: lang === 'kk' ? 'Қазір жүріп жатыр' : 'В процессе', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' } as const;
    }
    return { key: 'past', label: lang === 'kk' ? 'Өткізілді' : 'Проведено', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' } as const;
  };

  const formatDateTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div 
        className="bg-white w-full max-h-[85vh] rounded-t-2xl overflow-hidden shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {formatDateTitle(day)}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {trainings.length} {lang === 'kk' ? 'жаттығу' : 'тренировок'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3">
          {trainings.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                {lang === 'kk' ? 'Жаттығулар жоқ' : 'Тренировок нет'}
              </p>
              <p className="text-gray-400 text-sm">
                {lang === 'kk' ? 'Бұл күнге жаттығу қосыңыз' : 'Добавьте тренировку на этот день'}
              </p>
            </div>
          ) : (
            trainings.map((tr) => {
              const status = getTemporalStatus(tr);
              const endTime = (() => {
                const [h, m] = tr.planned_start_time.split(":").map(Number);
                const start = new Date(1970, 0, 1, h, m || 0);
                const end = new Date(start.getTime() + tr.duration_minutes * 60000);
                return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
              })();

              return (
                <div
                  key={tr.id}
                  className={`rounded-xl p-4 border transition-all ${
                    status.key === 'cancelled'
                      ? 'bg-red-50 border-red-100'
                      : status.key === 'live'
                      ? 'bg-orange-50 border-orange-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  {/* Time and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {tr.planned_start_time.slice(0, 5)}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className="text-gray-700">{endTime}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Section & Group */}
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {sectionNameBySectionId?.[tr.group.section_id] || '—'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{tr.group.name}</span>
                  </div>

                  {/* Club */}
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {clubNameBySectionId?.[tr.group.section_id] || '—'}
                    </span>
                  </div>

                  {/* Coach & Duration */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {tr.coach.first_name} {tr.coach.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{tr.duration_minutes} мин</span>
                    </div>
                  </div>

                  {/* Location */}
                  {tr.location && (
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{tr.location}</span>
                    </div>
                  )}

                  {/* Edit Button */}
                  {(canEdit ? canEdit(tr) : true) && (
                    <div className="pt-3 border-t border-gray-200/50">
                      <button
                        onClick={() => onSelectLesson?.(tr)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Pencil size={14} />
                        {lang === 'kk' ? 'Өңдеу' : 'Редактировать'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Training Button */}
        {onCreateForDay && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
            <button
              onClick={() => onCreateForDay(day)}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3.5 rounded-xl hover:bg-blue-600 active:scale-[0.99] transition-all font-semibold"
            >
              <Plus size={20} />
              {t('day.modal.add')}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};
