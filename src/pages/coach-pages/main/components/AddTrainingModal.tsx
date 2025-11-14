import React, { useEffect, useState } from 'react';
import { groupsApi, scheduleApi, teamApi } from '@/functions/axios/axiosFunctions';
import type { CreateManualLessonRequest } from '@/functions/axios/requests';
import type { GetMyGroupResponse } from '@/functions/axios/responses';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export const AddTrainingModal: React.FC<{ onClose: () => void; token: string | null; onSuccess?: () => void; defaultDate?: string }> = ({ onClose, token, onSuccess, defaultDate }) => {
  const { t } = useI18n();
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
  const isPastTimeToday = (time: string) => {
    if (!isToday(newTraining.date) || !time) return false;
    const [hh, mm] = time.split(':').map(Number);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = (hh || 0) * 60 + (mm || 0);
    return targetMinutes <= currentMinutes; // must be strictly ahead
  };

  const invalidDate = isPastDate(newTraining.date);
  const invalidStartTime = isPastTimeToday(newTraining.time);
  const invalidDuration = (() => {
    if (!newTraining.duration) return false;
    const dur = Number(newTraining.duration);
    return !Number.isFinite(dur) || dur <= 0;
  })();

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

  return (
    <div className="fixed inset-0 bg-gray-50 border border-gray-200 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full overflow-hidden">
        <div className="sticky top-0 bg-white border border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('day.modal.add')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Club Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клуб</label>
            <select
              value={selectedClubId}
              onChange={e => {
                setSelectedClubId(Number(e.target.value));
                setSelectedSectionId(''); setSelectedGroupId(''); setSelectedCoachId('');
              }}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              <option value="">Выбрать клуб</option>
              {clubOptions.map(id => <option key={id} value={id}>{clubIdToName[id] ?? `Club ${id}`}</option>)}
            </select>
          </div>

          {/* Section Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Секция</label>
            <select
              value={selectedSectionId}
              onChange={e => { setSelectedSectionId(Number(e.target.value)); setSelectedGroupId(''); }}
              disabled={selectedClubId === ''}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              <option value="">Выбрать секцию</option>
              {sectionOptions.map(id => {
                const sec = userGroups.find(g => g.section.id === id)?.section;
                return sec ? <option key={id} value={id}>{sec.name}</option> : null;
              })}
            </select>
          </div>

          {/* Group Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Группа</label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(Number(e.target.value))}
              disabled={selectedSectionId === ''}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              <option value="">Выбрать группу</option>
              {groupOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Coach Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тренер</label>
            <select
              value={selectedCoachId}
              onChange={e => setSelectedCoachId(Number(e.target.value))}
              disabled={selectedClubId === ''}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              <option value="">Выбрать тренера</option>
              {coachOptions.map(c => <option key={c.id} value={c.id}>{`${c.first_name} ${c.last_name}`}</option>)}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.date')}</label>
            <input
              type="date"
              value={newTraining.date}
              onChange={e => setNewTraining(prev => ({ ...prev, date: e.target.value }))}
              min={todayStr}
              className={`w-full border rounded-lg p-2 ${invalidDate ? 'border-red-500' : 'border-gray-200'}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="time"
              className={`border rounded-lg p-2 ${invalidStartTime ? 'border-red-500' : 'border-gray-200'}`}
              value={newTraining.time}
              onChange={e => setNewTraining(prev => ({ ...prev, time: e.target.value }))}
              disabled={invalidDate}
            />
            <input
              type="number"
              min={1}
              step={5}
              placeholder="Длительность (мин)"
              className={`border rounded-lg p-2 ${invalidDuration ? 'border-red-500' : 'border-gray-200'}`}
              value={newTraining.duration}
              onChange={e => setNewTraining(prev => ({ ...prev, duration: e.target.value }))}
              disabled={invalidDate}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={
              !selectedClubId || !selectedSectionId || !selectedGroupId || !selectedCoachId || !newTraining.date || !newTraining.time || !newTraining.duration || invalidDate || invalidStartTime || invalidDuration
            }
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            {t('add.save')}
          </button>
        </div>
      </div>
    </div>
  );
};