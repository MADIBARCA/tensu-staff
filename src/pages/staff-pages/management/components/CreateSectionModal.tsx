import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club, Employee, CreateSectionData, CreateGroupData, CreateScheduleData, WeekDay } from '../types';
import { levelOptions, weekDays } from '../constants';

interface CreateSectionModalProps {
  clubs: Club[];
  employees: Employee[];
  onClose: () => void;
  onCreate: (section: CreateSectionData, groups: (CreateGroupData & { schedules: CreateScheduleData[] })[]) => void;
}

export const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  clubs,
  employees,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [sectionData, setSectionData] = useState<CreateSectionData>({
    name: '',
    club_id: 0,
    trainer_ids: [],
  });
  const [groups, setGroups] = useState<(CreateGroupData & { schedules: CreateScheduleData[] })[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeClubs = clubs.filter(c => c.status === 'active');
  const trainers = useMemo(() => {
    if (!sectionData.club_id) return [];
    return employees.filter(e => e.role === 'trainer' && e.club_ids.includes(sectionData.club_id));
  }, [employees, sectionData.club_id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!sectionData.name.trim()) newErrors.name = t('management.sections.errors.nameRequired');
    if (!sectionData.club_id) newErrors.club = t('management.sections.errors.clubRequired');
    if (sectionData.trainer_ids.length === 0) newErrors.trainers = t('management.sections.errors.trainerRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGroup = () => {
    setGroups([...groups, { name: '', level: '', capacity: undefined, schedules: [] }]);
  };

  const handleRemoveGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleGroupChange = (index: number, field: keyof CreateGroupData, value: any) => {
    setGroups(groups.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const handleAddSchedule = (groupIndex: number) => {
    const newSchedule: CreateScheduleData = {
      type: 'single',
      start_date: '',
      start_time: '',
      duration: 60,
    };
    setGroups(groups.map((g, i) => 
      i === groupIndex ? { ...g, schedules: [...g.schedules, newSchedule] } : g
    ));
  };

  const handleRemoveSchedule = (groupIndex: number, scheduleIndex: number) => {
    setGroups(groups.map((g, i) => 
      i === groupIndex ? { ...g, schedules: g.schedules.filter((_, si) => si !== scheduleIndex) } : g
    ));
  };

  const handleScheduleChange = (groupIndex: number, scheduleIndex: number, field: keyof CreateScheduleData, value: any) => {
    setGroups(groups.map((g, i) => 
      i === groupIndex ? {
        ...g,
        schedules: g.schedules.map((s, si) => si === scheduleIndex ? { ...s, [field]: value } : s)
      } : g
    ));
  };

  const handleDayToggle = (groupIndex: number, scheduleIndex: number, day: WeekDay) => {
    setGroups(groups.map((g, i) => 
      i === groupIndex ? {
        ...g,
        schedules: g.schedules.map((s, si) => {
          if (si !== scheduleIndex) return s;
          const days = s.days_of_week || [];
          return {
            ...s,
            days_of_week: days.includes(day) ? days.filter(d => d !== day) : [...days, day]
          };
        })
      } : g
    ));
  };

  const handleTrainerToggle = (trainerId: number) => {
    setSectionData(prev => ({
      ...prev,
      trainer_ids: prev.trainer_ids.includes(trainerId)
        ? prev.trainer_ids.filter(id => id !== trainerId)
        : [...prev.trainer_ids, trainerId],
    }));
  };

  const handleSubmit = () => {
    if (validate()) {
      onCreate(sectionData, groups);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.sections.createTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Club */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.sections.club')} *
            </label>
            <select
              value={sectionData.club_id}
              onChange={(e) => {
                setSectionData({ ...sectionData, club_id: Number(e.target.value), trainer_ids: [] });
                setErrors({ ...errors, club: '' });
              }}
              className={`w-full border rounded-lg p-2 ${errors.club ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value={0}>{t('management.sections.selectClub')}</option>
              {activeClubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            {errors.club && <p className="text-red-500 text-xs mt-1">{errors.club}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.sections.name')} *
            </label>
            <input
              type="text"
              value={sectionData.name}
              onChange={(e) => {
                setSectionData({ ...sectionData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              className={`w-full border rounded-lg p-2 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
              placeholder={t('management.sections.namePlaceholder')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Trainers */}
          {sectionData.club_id > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('management.sections.trainers')} *
              </label>
              {trainers.length === 0 ? (
                <p className="text-sm text-gray-500">{t('management.sections.noTrainers')}</p>
              ) : (
                <div className="space-y-2">
                  {trainers.map(trainer => (
                    <label
                      key={trainer.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={sectionData.trainer_ids.includes(trainer.id)}
                        onChange={() => handleTrainerToggle(trainer.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-900">{trainer.first_name} {trainer.last_name}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.trainers && <p className="text-red-500 text-xs mt-1">{errors.trainers}</p>}
            </div>
          )}

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
              <div key={groupIndex} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t('management.sections.group')} {groupIndex + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveGroup(groupIndex)}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleGroupChange(groupIndex, 'name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                    placeholder={t('management.sections.groupName')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={group.level || ''}
                      onChange={(e) => handleGroupChange(groupIndex, 'level', e.target.value)}
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
                      onChange={(e) => handleGroupChange(groupIndex, 'capacity', e.target.value ? Number(e.target.value) : undefined)}
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
                        onClick={() => handleAddSchedule(groupIndex)}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        + {t('management.sections.addSchedule')}
                      </button>
                    </div>

                    {group.schedules.map((schedule, scheduleIndex) => (
                      <div key={scheduleIndex} className="mb-2 p-2 bg-white rounded border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <select
                            value={schedule.type}
                            onChange={(e) => handleScheduleChange(groupIndex, scheduleIndex, 'type', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          >
                            <option value="single">{t('management.sections.singleTraining')}</option>
                            <option value="recurring">{t('management.sections.recurringTraining')}</option>
                          </select>
                          <button
                            onClick={() => handleRemoveSchedule(groupIndex, scheduleIndex)}
                            className="p-1 text-red-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="date"
                            value={schedule.start_date}
                            onChange={(e) => handleScheduleChange(groupIndex, scheduleIndex, 'start_date', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          />
                          <input
                            type="time"
                            value={schedule.start_time}
                            onChange={(e) => handleScheduleChange(groupIndex, scheduleIndex, 'start_time', e.target.value)}
                            className="text-xs border border-gray-200 rounded p-1"
                          />
                        </div>

                        <div className="mb-2">
                          <input
                            type="number"
                            value={schedule.duration}
                            onChange={(e) => handleScheduleChange(groupIndex, scheduleIndex, 'duration', Number(e.target.value))}
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
                                  onClick={() => handleDayToggle(groupIndex, scheduleIndex, day.value as WeekDay)}
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
                              onChange={(e) => handleScheduleChange(groupIndex, scheduleIndex, 'end_date', e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded p-1"
                              placeholder={t('management.sections.endDate')}
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

        <div className="p-4 border-t border-gray-200 flex gap-3">
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
      </div>
    </div>
  );
};
