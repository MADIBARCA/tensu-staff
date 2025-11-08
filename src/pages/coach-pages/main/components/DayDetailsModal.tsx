import type { Lesson } from "@/functions/axios/responses";
import { Clock, MapPin, Users, X, Pencil, BadgeCheck } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

export const DayDetailsModal: React.FC<{
  day: string;
  onClose: () => void;
  trainings: Lesson[];
  onSelectLesson?: (lesson: Lesson) => void;
  onCreateForDay?: (day: string) => void;
  clubNameBySectionId?: Record<number, string>;
}> = ({ day, onClose, trainings, onSelectLesson, onCreateForDay, clubNameBySectionId }) => {
  const { t } = useI18n();
  const getTemporalStatus = (t: Lesson) => {
    if (t.status === 'cancelled') {
      return { key: 'cancelled', label: 'Отменено', color: 'bg-red-100 text-red-700' } as const;
    }
    const start = new Date(`${t.planned_date}T${t.planned_start_time.slice(0,5)}:00`);
    const end = new Date(start.getTime() + (t.duration_minutes || 0) * 60000);
    const now = new Date();
    if (now < start) {
      return { key: 'upcoming', label: 'Запланировано', color: 'bg-blue-100 text-blue-700' } as const;
    }
    if (now >= start && now <= end) {
      return { key: 'live', label: 'Идет сейчас', color: 'bg-orange-100 text-orange-700' } as const;
    }
    return { key: 'past', label: 'Завершено', color: 'bg-gray-100 text-gray-700' } as const;
  };

  return (
    <div className="fixed inset-0 bg-gray-800/30 z-50 flex items-end">
      <div className="bg-white w-full max-h-[85vh] rounded-t-2xl overflow-hidden shadow-xl pb-2">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              {t('day.modal.title')} {" "}
              {new Date(day).toLocaleDateString("ru-RU", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-3 space-y-3">
          {trainings.map((t) => (
            <div key={t.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {t.planned_start_time.slice(0,5)} - {(() => {
                        const [h, m] = t.planned_start_time.split(":").map(Number);
                        const start = new Date(1970, 0, 1, h, m || 0);
                        const end = new Date(start.getTime() + t.duration_minutes * 60000);
                        const hh = String(end.getHours()).padStart(2, '0');
                        const mm = String(end.getMinutes()).padStart(2, '0');
                        return `${hh}:${mm}`;
                      })()}
                    </span>
                    {(() => {
                      const s = getTemporalStatus(t);
                      return (
                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.color}`}>
                          <BadgeCheck size={12} /> {s.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{t.location || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {t.coach.first_name} {t.coach.last_name}
                      {` • ${clubNameBySectionId?.[t.group.section_id] ?? ''}`}
                      {clubNameBySectionId?.[t.group.section_id] ? ' • ' : ' • '}
                      {t.group.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onSelectLesson?.(t)}
                    className="p-2 rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 active:scale-[0.98] transition"
                    aria-label="Редактировать тренировку"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </div>
              {/* Progress or extra info can be placed here if needed */}
            </div>
          ))}
          {trainings.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-sm text-gray-500 mb-3">{t('day.modal.empty')}</div>
            </div>
          )}
        </div>

        {onCreateForDay && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => onCreateForDay(day)}
              className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 active:scale-[0.99] transition"
            >
              {t('day.modal.add')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
