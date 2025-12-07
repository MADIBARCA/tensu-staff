import React, { useEffect, useState } from 'react';
import { groupsApi, scheduleApi, teamApi } from '@/functions/axios/axiosFunctions';
import type { CreateManualLessonRequest } from '@/functions/axios/requests';
import type { GetMyGroupResponse } from '@/functions/axios/responses';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export const AddTrainingModal: React.FC<{ onClose: () => void; token: string | null; onSuccess?: () => void; defaultDate?: string }> = ({ onClose, token, onSuccess, defaultDate }) => {
  const { t, lang } = useI18n();
  const [newTraining, setNewTraining] = useState({ date: '', time: '', duration: '' });
  const [userGroups, setUserGroups] = useState<GetMyGroupResponse[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | ''>('');
  const [clubIdToName, setClubIdToName] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!token) return;
    Promise.all([groupsApi.getMy(token), teamApi.get(token)])
      .then(([groupsRes, teamRes]) => {
        setUserGroups(groupsRes.data);
        const mapping: Record<number, string> = {};
        (teamRes.data.current_user_clubs || []).forEach(c => {
          if (typeof c.club_id === 'number' && c.club_name) {
            mapping[c.club_id] = c.club_name;
          }
        });
        setClubIdToName(mapping);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (defaultDate) {
      setNewTraining(prev => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate]);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const isPastDate = (date: string) => date !== '' && date < todayStr;
  const isToday = (date: string) => date === todayStr;
  
  // Check if time is less than 1 hour from now (requirement: must be at least 1 hour ahead)
  const isTimeTooSoon = (time: string) => {
    if (!isToday(newTraining.date) || !time) return false;
    const [hh, mm] = time.split(':').map(Number);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = (hh || 0) * 60 + (mm || 0);
    const oneHourFromNow = currentMinutes + 60;
    return targetMinutes < oneHourFromNow; // must be at least 1 hour ahead
  };

  const invalidDate = isPastDate(newTraining.date);
  const invalidStartTime = isTimeTooSoon(newTraining.time);
  const invalidDuration = (() => {
    if (!newTraining.duration) return false;
    const dur = Number(newTraining.duration);
    return !Number.isFinite(dur) || dur <= 0;
  })();

  // Get minimum allowed time (now + 1 hour) for the time input
  const getMinTime = () => {
    if (!isToday(newTraining.date)) return undefined;
    const now = new Date();
    now.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Derive dropdown options
  const clubOptions = Array.from(new Set(userGroups.map(g => g.section.club_id)));
  const sectionOptions = selectedClubId === '' ? [] :
    Array.from(
      new Set(
        userGroups.filter(g => g.section.club_id === selectedClubId).map(g => g.section.id)
      )
    );
  const groupOptions = selectedSectionId === '' ? [] :
    userGroups.filter(g => g.section.id === selectedSectionId).map(g => ({ id: g.id, name: g.name }));
  const coachOptions = selectedClubId === '' ? [] :
    Array.from(
      new Map(
        userGroups
          .filter(g => g.section.club_id === selectedClubId)
          .map(g => [g.coach.id, g.coach])
      ).values()
    );

  const handleSave = async () => {
    if (!selectedGroupId || !selectedCoachId) return;
    const duration = Number(newTraining.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) return;


    const payload: CreateManualLessonRequest = {
      group_id: selectedGroupId,
      planned_date: newTraining.date,
      planned_start_time: newTraining.time,
      duration_minutes: duration,
      coach_id: selectedCoachId,
      location: '',
      notes: ''
    };

    try {
      await scheduleApi.createManualLesson(payload, token);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create lesson', error);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSaveWithLoading = async () => {
    setSaving(true);
    await handleSave();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800/40 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] rounded-t-2xl overflow-hidden shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('day.modal.add')}</h2>
            {defaultDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(defaultDate).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4 pb-8">
          {/* Club Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {lang === 'kk' ? 'Клуб' : 'Клуб'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClubId}
              onChange={e => {
                setSelectedClubId(Number(e.target.value));
                setSelectedSectionId(''); setSelectedGroupId(''); setSelectedCoachId('');
              }}
              className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors"
            >
              <option value="">{lang === 'kk' ? 'Клубты таңдаңыз' : 'Выбрать клуб'}</option>
              {clubOptions.map(id => <option key={id} value={id}>{clubIdToName[id] ?? `Club ${id}`}</option>)}
            </select>
          </div>

          {/* Section Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {lang === 'kk' ? 'Секция' : 'Секция'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSectionId}
              onChange={e => { setSelectedSectionId(Number(e.target.value)); setSelectedGroupId(''); }}
              disabled={selectedClubId === ''}
              className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{lang === 'kk' ? 'Секцияны таңдаңыз' : 'Выбрать секцию'}</option>
              {sectionOptions.map(id => {
                const sec = userGroups.find(g => g.section.id === id)?.section;
                return sec ? <option key={id} value={id}>{sec.name}</option> : null;
              })}
            </select>
          </div>

          {/* Group Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {lang === 'kk' ? 'Топ' : 'Группа'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(Number(e.target.value))}
              disabled={selectedSectionId === ''}
              className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{lang === 'kk' ? 'Топты таңдаңыз' : 'Выбрать группу'}</option>
              {groupOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Coach Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {lang === 'kk' ? 'Жаттықтырушы' : 'Тренер'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCoachId}
              onChange={e => setSelectedCoachId(Number(e.target.value))}
              disabled={selectedClubId === ''}
              className="w-full border border-gray-200 rounded-xl p-2.5 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{lang === 'kk' ? 'Жаттықтырушыны таңдаңыз' : 'Выбрать тренера'}</option>
              {coachOptions.map(c => <option key={c.id} value={c.id}>{`${c.first_name} ${c.last_name}`}</option>)}
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-3">
              {lang === 'kk' ? 'Уақыт және күні' : 'Дата и время'}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('add.date')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newTraining.date}
              onChange={e => setNewTraining(prev => ({ ...prev, date: e.target.value }))}
              min={todayStr}
              className={`w-full border rounded-xl p-2.5 transition-colors ${
                invalidDate ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {invalidDate && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'kk' ? 'Өткен күнді таңдау мүмкін емес' : 'Нельзя выбрать прошедшую дату'}
              </p>
            )}
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === 'kk' ? 'Басталу уақыты' : 'Время начала'} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                className={`w-full border rounded-xl p-2.5 transition-colors ${
                  invalidStartTime ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                value={newTraining.time}
                onChange={e => setNewTraining(prev => ({ ...prev, time: e.target.value }))}
                disabled={invalidDate || !newTraining.date}
                min={getMinTime()}
              />
              {invalidStartTime && (
                <p className="text-xs text-red-500 mt-1">
                  {lang === 'kk' ? 'Кемінде 1 сағаттан кейін' : 'Минимум через 1 час'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {lang === 'kk' ? 'Ұзақтығы (мин)' : 'Длительность (мин)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={5}
                placeholder="60"
                className={`w-full border rounded-xl p-2.5 transition-colors ${
                  invalidDuration ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                value={newTraining.duration}
                onChange={e => setNewTraining(prev => ({ ...prev, duration: e.target.value }))}
                disabled={invalidDate || !newTraining.date}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2">
            <button
              onClick={handleSaveWithLoading}
              disabled={
                saving || !selectedClubId || !selectedSectionId || !selectedGroupId || !selectedCoachId || !newTraining.date || !newTraining.time || !newTraining.duration || invalidDate || invalidStartTime || invalidDuration
              }
              className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {saving 
                ? (lang === 'kk' ? 'Сақталуда...' : 'Сохранение...') 
                : t('add.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};