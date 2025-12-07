import React, { useEffect, useMemo, useState } from "react";
import type { Lesson } from "@/functions/axios/responses";
import { scheduleApi, teamApi, groupsApi } from "@/functions/axios/axiosFunctions";
import type { UpdateLessonRequest } from "@/functions/axios/requests";
import { X, AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

type Coach = { id: number; first_name: string; last_name: string };

export const EditLessonModal: React.FC<{
  lesson: Lesson;
  token: string;
  onClose: () => void;
  onSaved?: () => void;
}> = ({ lesson, token, onClose, onSaved }) => {
  const { lang } = useI18n();
  const [plannedDate, setPlannedDate] = useState(lesson.planned_date);
  const [plannedStartTime, setPlannedStartTime] = useState(
    lesson.planned_start_time.slice(0, 5)
  );
  const [duration, setDuration] = useState<number>(lesson.duration_minutes);
  const [location, setLocation] = useState<string>(lesson.location || "");
  const [notes, setNotes] = useState<string>(lesson.notes || "");
  const [status, setStatus] = useState<UpdateLessonRequest["status"]>(
    lesson.status
  );
  const [coachId, setCoachId] = useState<number>(lesson.coach_id);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load coaches for the dropdown and section name
  useEffect(() => {
    if (!token) return;
    Promise.all([teamApi.get(token), groupsApi.getMy(token)])
      .then(([teamRes, groupsRes]) => {
        // Find the group and section info
        const group = groupsRes.data.find(g => g.section.id === lesson.group.section_id);
        const lessonClubId = group?.section.club_id;
        
        // if (group?.section?.name) {
        //   setSectionName(group.section.name);
        // }
        
        if (lessonClubId) {
          const coachMembers = (teamRes.data.staff_members || []).filter((m) =>
            (m.clubs_and_roles || []).some(
              (cr) => cr.club_id === lessonClubId && cr.role === "coach"
            )
          );
          setCoaches(coachMembers.map(m => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name || ''
          })));
        }
      })
      .catch(console.error);
  }, [token, lesson.group.section_id]);

  // Get today's date string for validation
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Check if date/time is in the future
  const isFutureDateTime = useMemo(() => {
    const selected = new Date(`${plannedDate}T${plannedStartTime}:00`);
    return selected > new Date();
  }, [plannedDate, plannedStartTime]);

  // Validation: can't set "completed" status on future trainings
  const canSetCompleted = !isFutureDateTime;

  // Validation: date must not be in the past
  const isDateValid = plannedDate >= todayStr;

  const payload: UpdateLessonRequest = useMemo(
    () => ({
      planned_date: plannedDate,
      planned_start_time: plannedStartTime,
      actual_date: lesson.actual_date || plannedDate,
      actual_start_time:
        lesson.actual_start_time?.slice(0, 5) || plannedStartTime,
      duration_minutes: duration,
      status,
      coach_id: coachId,
      location,
      notes,
    }),
    [plannedDate, plannedStartTime, lesson.actual_date, lesson.actual_start_time, duration, status, coachId, location, notes]
  );

  const handleSave = async () => {
    setError(null);
    
    // Validation: can't set completed on future training
    if (status === 'completed' && isFutureDateTime) {
      setError(lang === 'kk' 
        ? 'Болашақ жаттығуға "Өткізілді" мәртебесін қою мүмкін емес' 
        : 'Нельзя установить статус "Проведено" для будущей тренировки');
      return;
    }
    
    // If changing to cancelled, show confirmation
    if (status === 'cancelled' && lesson.status !== 'cancelled') {
      setShowCancelConfirm(true);
      return;
    }
    
    await performSave();
  };
  
  const performSave = async () => {
    try {
      setSaving(true);
      await scheduleApi.updateLesson(lesson.id, payload, token);
      onSaved?.();
    } catch (e) {
      console.error(e);
      setError(lang === 'kk' ? 'Сақтау қатесі' : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    await performSave();
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await scheduleApi.deleteLesson(lesson.id, token);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-800/40 z-50 flex items-end">
        <div className="bg-white w-full max-h-[85vh] rounded-t-2xl overflow-hidden shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {lang === 'kk' ? 'Жаттығуды өңдеу' : 'Редактировать тренировку'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {/* {lesson.group.section?.name} • {lesson.group.name} */}
                {lesson.group.name}
              </p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'kk' ? 'Күні' : 'Дата'}
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-xl p-2.5 transition-colors ${
                    !isDateValid ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  value={plannedDate}
                  min={todayStr}
                  onChange={(e) => setPlannedDate(e.target.value)}
                />
                {!isDateValid && (
                  <p className="text-xs text-red-500 mt-1">
                    {lang === 'kk' ? 'Өткен күнді таңдау мүмкін емес' : 'Нельзя выбрать прошедшую дату'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'kk' ? 'Уақыты' : 'Время'}
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
                  value={plannedStartTime}
                  onChange={(e) => setPlannedStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* Duration & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'kk' ? 'Ұзақтығы (мин)' : 'Длительность (мин)'}
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={5}
                  step={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'kk' ? 'Мәртебесі' : 'Статус'}
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
                  value={status}
                  onChange={(e) => {
                    setError(null);
                    setStatus(e.target.value as UpdateLessonRequest["status"]);
                  }}
                >
                  <option value="scheduled">{lang === 'kk' ? 'Жоспарланған' : 'Запланировано'}</option>
                  <option value="cancelled">{lang === 'kk' ? 'Бас тартылды' : 'Отменено'}</option>
                  <option value="completed" disabled={!canSetCompleted}>
                    {lang === 'kk' ? 'Өткізілді' : 'Проведено'}
                  </option>
                </select>
                {status === 'completed' && !canSetCompleted && (
                  <p className="text-xs text-orange-500 mt-1">
                    {lang === 'kk' ? 'Тек өткен жаттығулар үшін қол жетімді' : 'Только для прошедших тренировок'}
                  </p>
                )}
              </div>
            </div>

            {/* Coach dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === 'kk' ? 'Жаттықтырушы' : 'Тренер'}
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
                value={coachId}
                onChange={(e) => setCoachId(Number(e.target.value))}
              >
                {coaches.length === 0 && (
                  <option value={lesson.coach_id}>
                    {lesson.coach.first_name} {lesson.coach.last_name}
                  </option>
                )}
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === 'kk' ? 'Орны' : 'Локация'}
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
                placeholder={lang === 'kk' ? 'Зал, адрес...' : 'Зал, адрес...'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === 'kk' ? 'Ескертпелер' : 'Заметки'}
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors resize-none"
                rows={2}
                placeholder={lang === 'kk' ? 'Қосымша ақпарат...' : 'Дополнительная информация...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-white pt-2 pb-3">
              <button
                onClick={handleSave}
                disabled={saving || !isDateValid}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 active:scale-[0.99] disabled:bg-gray-300 transition-all"
              >
                {saving 
                  ? (lang === 'kk' ? 'Сақталуда...' : 'Сохранение...') 
                  : (lang === 'kk' ? 'Өзгерістерді сақтау' : 'Сохранить изменения')}
              </button>
            </div>

            {/* Danger zone */}
            <div className="mt-1 mb-4 pt-3 border-t border-gray-100">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 active:scale-[0.99] transition-all"
                >
                  {lang === 'kk' ? 'Жаттығуды жою' : 'Удалить тренировку'}
                </button>
              ) : (
                <div className="border border-red-200 bg-red-50 rounded-xl p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      {lang === 'kk'
                        ? 'Жаттығуды жою қайтарылмайды. Бұл әрекетті болдырмау мүмкін емес.'
                        : 'Удаление тренировки необратимо. Это действие нельзя отменить.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-medium transition-colors"
                    >
                      {lang === 'kk' ? 'Бас тарту' : 'Отмена'}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 font-medium transition-colors"
                    >
                      {deleting 
                        ? (lang === 'kk' ? 'Жойылуда...' : 'Удаление...') 
                        : (lang === 'kk' ? 'Жою' : 'Удалить')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-gray-800/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {lang === 'kk' ? 'Жаттығуды бас тарту' : 'Отмена тренировки'}
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {lang === 'kk' 
                  ? 'Жаттығуды бас тартуды растайсыз ба? Бұл әрекетті қайтару мүмкін емес.' 
                  : 'Вы уверены, что хотите отменить тренировку? Это действие необратимо.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="py-2.5 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition-colors"
                >
                  {lang === 'kk' ? 'Жоқ' : 'Нет'}
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  {lang === 'kk' ? 'Иә, бас тарту' : 'Да, отменить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


