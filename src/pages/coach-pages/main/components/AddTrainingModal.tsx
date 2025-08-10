import React, { useEffect, useState } from 'react';
import { groupsApi, scheduleApi } from '@/functions/axios/axiosFunctions';
import type { CreateManualLessonRequest } from '@/functions/axios/requests';
import type { GetMyGroupResponse } from '@/functions/axios/responses';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export const AddTrainingModal: React.FC<{ onClose: () => void; token: string | null; onSuccess?: () => void; defaultDate?: string }> = ({ onClose, token, onSuccess, defaultDate }) => {
  const { t } = useI18n();
  const [newTraining, setNewTraining] = useState({ date: '', time: '', endTime: '' });
  const [userGroups, setUserGroups] = useState<GetMyGroupResponse[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | ''>('');

  useEffect(() => {
    if (!token) return;
    groupsApi.getMy(token).then(res => setUserGroups(res.data)).catch(console.error);
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
  const invalidEndTime = (() => {
    if (!newTraining.time || !newTraining.endTime) return false;
    const [sh, sm] = newTraining.time.split(':').map(Number);
    const [eh, em] = newTraining.endTime.split(':').map(Number);
    const startMin = (sh || 0) * 60 + (sm || 0);
    const endMin = (eh || 0) * 60 + (em || 0);
    return endMin <= startMin;
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
    const start = new Date(`1970-01-01T${newTraining.time}:00`);
    const end = new Date(`1970-01-01T${newTraining.endTime}:00`);
    if (end <= start) {
        end.setDate(end.getDate() + 1);
    }
    const duration = (end.getTime() - start.getTime()) / 60000;


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
    <div className="fixed inset-0 bg-gray-50 border border-gray-200 bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
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
              {clubOptions.map(id => <option key={id} value={id}>Club {id}</option>)}
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
              type="time"
              className={`border rounded-lg p-2 ${invalidEndTime ? 'border-red-500' : 'border-gray-200'}`}
              value={newTraining.endTime}
              onChange={e => setNewTraining(prev => ({ ...prev, endTime: e.target.value }))}
              disabled={invalidDate}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={
              !selectedClubId || !selectedSectionId || !selectedGroupId || !selectedCoachId || !newTraining.date || !newTraining.time || !newTraining.endTime || invalidDate || invalidStartTime || invalidEndTime
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