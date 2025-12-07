import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Section, Employee, Group, CreateGroupData, CreateScheduleData, WeekDay } from '../types';
import { levelOptions, weekDays } from '../constants';

interface EditSectionModalProps {
  section: Section;
  employees: Employee[];
  onClose: () => void;
  onSave: (name: string, trainerIds: number[], groups: Group[]) => void;
  onDelete: () => void;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  section,
  employees,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(section.name);
  const [trainerIds, setTrainerIds] = useState<number[]>(section.trainer_ids);
  const [groups, setGroups] = useState<Group[]>(section.groups);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const trainers = useMemo(() => {
    return employees.filter(e => e.role === 'trainer' && e.club_ids.includes(section.club_id));
  }, [employees, section.club_id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('management.sections.errors.nameRequired');
    if (trainerIds.length === 0) newErrors.trainers = t('management.sections.errors.trainerRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTrainerToggle = (trainerId: number) => {
    setTrainerIds(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  const handleAddGroup = () => {
    const newGroup: Group = {
      id: Date.now(),
      section_id: section.id,
      name: '',
      level: '',
      capacity: undefined,
      schedules: [],
    };
    setGroups([...groups, newGroup]);
  };

  const handleRemoveGroup = (groupId: number) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleGroupChange = (groupId: number, field: keyof CreateGroupData, value: any) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
  };

  const handleAddSchedule = (groupId: number) => {
    const newSchedule: CreateScheduleData & { id: number; group_id: number } = {
      id: Date.now(),
      group_id: groupId,
      type: 'single',
      start_date: '',
      start_time: '',
      duration: 60,
    };
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, schedules: [...g.schedules, newSchedule as any] } : g
    ));
  };

  const handleRemoveSchedule = (groupId: number, scheduleId: number) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, schedules: g.schedules.filter(s => s.id !== scheduleId) } : g
    ));
  };

  const handleScheduleChange = (groupId: number, scheduleId: number, field: string, value: any) => {
    setGroups(groups.map(g =>
      g.id === groupId ? {
        ...g,
        schedules: g.schedules.map(s => s.id === scheduleId ? { ...s, [field]: value } : s)
      } : g
    ));
  };

  const handleDayToggle = (groupId: number, scheduleId: number, day: WeekDay) => {
    setGroups(groups.map(g =>
      g.id === groupId ? {
        ...g,
        schedules: g.schedules.map(s => {
          if (s.id !== scheduleId) return s;
          const days = s.days_of_week || [];
          return {
            ...s,
            days_of_week: days.includes(day) ? days.filter(d => d !== day) : [...days, day]
          };
        })
      } : g
    ));
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(name, trainerIds, groups);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.sections.editTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Club (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.sections.club')}
            </label>
            <input
              type="text"
              value={section.club_name}
              readOnly
              className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-500"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.sections.name')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: '' });
              }}
              className={`w-full border rounded-lg p-2 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Trainers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('management.sections.trainers')} *
            </label>
            <div className="space-y-2">
              {trainers.map(trainer => (
                <label
                  key={trainer.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={trainerIds.includes(trainer.id)}
                    onChange={() => handleTrainerToggle(trainer.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-900">{trainer.first_name} {trainer.last_name}</span>
                </label>
              ))}
            </div>
            {errors.trainers && <p className="text-red-500 text-xs mt-1">{errors.trainers}</p>}
          </div>

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('management.sections.groups')}
              </label>
              <button
                type="button"
                onClick={handleAddGroup}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <Plus size={16} />
                {t('management.sections.addGroup')}
              </button>
            </div>

            {groups.map((group, groupIndex) => (
              <div key={group.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {group.name || `${t('management.sections.group')} ${groupIndex + 1}`}
                  </span>
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleGroupChange(group.id, 'name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                    placeholder={t('management.sections.groupName')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={group.level || ''}
                      onChange={(e) => handleGroupChange(group.id, 'level', e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm"
                    >
                      <option value="">{t('management.sections.level')}</option>
                      {levelOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={group.capacity || ''}
                      onChange={(e) => handleGroupChange(group.id, 'capacity', e.target.value ? Number(e.target.value) : undefined)}
                      className="border border-gray-200 rounded-lg p-2 text-sm"
                      placeholder={t('management.sections.capacity')}
                    />
                  </div>

                  {/* Schedules */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">{t('management.sections.schedules')}</span>
                      <button
                        type="button"
                        onClick={() => handleAddSchedule(group.id)}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        + {t('management.sections.addSchedule')}
                      </button>
                    </div>

                    {group.schedules.map((schedule) => (
                      <div key={schedule.id} className="mb-2 p-2 bg-white rounded border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <select
                            value={schedule.type}
                            onChange={(e) => handleScheduleChange(group.id, schedule.id, 'type', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          >
                            <option value="single">{t('management.sections.singleTraining')}</option>
                            <option value="recurring">{t('management.sections.recurringTraining')}</option>
                          </select>
                          <button
                            onClick={() => handleRemoveSchedule(group.id, schedule.id)}
                            className="p-1 text-red-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="date"
                            value={schedule.start_date}
                            onChange={(e) => handleScheduleChange(group.id, schedule.id, 'start_date', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          />
                          <input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) => handleScheduleChange(group.id, schedule.id, 'start_time', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          />
                        </div>

                        <div className="mb-2">
                          <input
                            type="number"
                            value={schedule.duration}
                            onChange={(e) => handleScheduleChange(group.id, schedule.id, 'duration', Number(e.target.value))}
                            className="w-full text-xs border border-gray-200 rounded p-1"
                            placeholder={t('management.sections.duration')}
                          />
                        </div>

                        {schedule.type === 'recurring' && (
                          <>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {weekDays.map(day => (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() => handleDayToggle(group.id, schedule.id, day.value as WeekDay)}
                                  className={`px-2 py-1 text-xs rounded ${
                                    schedule.days_of_week?.includes(day.value as WeekDay)
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                            <input
                              type="date"
                              value={schedule.end_date || ''}
                              onChange={(e) => handleScheduleChange(group.id, schedule.id, 'end_date', e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded p-1"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {t('common.save')}
            </button>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            {t('management.sections.delete')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t('management.sections.deleteTitle')}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {t('management.sections.deleteMessage', { name: section.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
