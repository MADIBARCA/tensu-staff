/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { sectionsApi, groupsApi } from '@/functions/axios/axiosFunctions';
import type { Section, Employee } from '../types';
import type { ClubWithRole, CreateStaffResponse, GetMyGroupResponse } from '@/functions/axios/responses';
import { levelOptions } from '../mockData';

interface EditSectionModalProps {
  section: Section;
  employees: Employee[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onClose: () => void;
  onRefresh: () => void;
}

type ScheduleRow = { day: string; start: string; end: string };

const dayMap: Record<string, string> = {
  'Понедельник': 'monday',
  'Вторник': 'tuesday',
  'Среда': 'wednesday',
  'Четверг': 'thursday',
  'Пятница': 'friday',
  'Суббота': 'saturday',
  'Воскресенье': 'sunday',
};

const reverseDayMap: Record<string, string> = {
  'monday': 'Понедельник',
  'tuesday': 'Вторник',
  'wednesday': 'Среда',
  'thursday': 'Четверг',
  'friday': 'Пятница',
  'saturday': 'Суббота',
  'sunday': 'Воскресенье',
};

const weekdays = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

interface GroupForm {
  id?: number;
  name: string;
  level: string;
  capacity: number | '';
  price: number | '';
  description: string;
  schedule: ScheduleRow[];
  isNew?: boolean;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  section,
  employees,
  clubRoles,
  currentUser,
  onClose,
  onRefresh,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [name, setName] = useState(section.name);
  const [trainerIds, setTrainerIds] = useState<number[]>(section.trainer_ids);
  const [groups, setGroups] = useState<GroupForm[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if current user can edit (must be owner or admin of the section's club)
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === section.club_id);
    return clubRole ? (clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner) : false;
  }, [section.club_id, clubRoles, currentUser]);

  // Check if current user is owner of the club (for showing self as trainer option)
  const isOwnerOfClub = useMemo(() => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === section.club_id);
    return clubRole?.role === 'owner' || clubRole?.is_owner;
  }, [section.club_id, clubRoles, currentUser]);

  // Get trainers for the club, including current user if they are owner
  const trainers = useMemo(() => {
    const clubTrainers = employees.filter(
      e => e.role === 'trainer' && e.club_ids.includes(section.club_id)
    );
    
    if (isOwnerOfClub && currentUser) {
      const currentUserAlreadyInList = clubTrainers.some(t => t.id === currentUser.id);
      if (!currentUserAlreadyInList) {
        return [
          {
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            phone: currentUser.phone_number,
            telegram_username: currentUser.username,
            role: 'owner' as const,
            status: 'active' as const,
            club_ids: [section.club_id],
            photo_url: currentUser.photo_url,
            created_at: currentUser.created_at,
            isCurrentUser: true,
          },
          ...clubTrainers.map(t => ({ ...t, isCurrentUser: t.id === currentUser?.id })),
        ];
      }
    }
    
    return clubTrainers.map(t => ({ ...t, isCurrentUser: t.id === currentUser?.id }));
  }, [employees, section.club_id, isOwnerOfClub, currentUser]);

  // Check permissions on mount - close modal if user doesn't have permission
  useEffect(() => {
    if (!canEdit) {
      window.Telegram?.WebApp?.showAlert('У вас нет прав для редактирования этой секции');
      onClose();
    }
  }, [canEdit, onClose]);

  // Load groups from API
  useEffect(() => {
    const loadGroups = async () => {
      if (!initDataRaw || !canEdit) {
        setLoadingGroups(false);
        return;
      }
      
      try {
        const res = await groupsApi.getBySectionId(section.id, initDataRaw);
        if (res.data) {
          const forms: GroupForm[] = res.data.map((g: GetMyGroupResponse) => {
            // Parse schedule from weekly_pattern
            const scheduleRows: ScheduleRow[] = [];
            if (g.schedule && typeof g.schedule === 'object') {
              const weeklyPattern = (g.schedule as any).weekly_pattern || g.schedule;
              Object.entries(weeklyPattern).forEach(([day, slots]) => {
                if (Array.isArray(slots)) {
                  slots.forEach((slot: any) => {
                    const [h, m] = (slot.time as string).split(':').map(Number);
                    const totalMin = h * 60 + m + (slot.duration || 60);
                    const endH = Math.floor(totalMin / 60) % 24;
                    const endM = totalMin % 60;
                    scheduleRows.push({
                      day: reverseDayMap[day] || day,
                      start: slot.time,
                      end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                    });
                  });
                }
              });
            }
            
            return {
              id: g.id,
              name: g.name,
              level: g.level || '',
              capacity: g.capacity || '',
              price: typeof g.price === 'number' ? g.price : (parseInt(g.price as string) || ''),
              description: g.description || '',
              schedule: scheduleRows,
            };
          });
          setGroups(forms);
        }
      } catch (err) {
        console.error('Error loading groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };
    
    loadGroups();
  }, [section.id, initDataRaw]);

  const handleTrainerToggle = (trainerId: number) => {
    setTrainerIds(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
    setErrors({ ...errors, trainers: '' });
  };

  // Build schedule entry for API
  const buildScheduleEntry = (rows: ScheduleRow[]) => {
    const pattern: Record<string, { time: string; duration: number }[]> = {};
    rows.forEach(({ day, start, end }) => {
      const engDay = dayMap[day] || day.toLowerCase();
      const duration =
        (Date.parse(`1970-01-01T${end}`) - Date.parse(`1970-01-01T${start}`)) / 60000;
      if (!pattern[engDay]) pattern[engDay] = [];
      pattern[engDay].push({ time: start, duration: duration > 0 ? duration : 60 });
    });
    return {
      weekly_pattern: pattern,
      valid_from: '',
      valid_until: '',
    };
  };

  // Group handlers
  const addGroup = () => {
    setGroups([...groups, {
      name: '',
      level: '',
      capacity: '',
      price: '',
      description: '',
      schedule: [],
      isNew: true,
    }]);
  };

  const updateGroup = (idx: number, field: keyof GroupForm, value: any) => {
    setGroups(g => g.map((grp, i) => (i === idx ? { ...grp, [field]: value } : grp)));
  };

  const removeGroup = async (idx: number) => {
    const group = groups[idx];
    if (group.id && initDataRaw) {
      try {
        await groupsApi.deleteById(group.id, initDataRaw);
      } catch (err) {
        console.error('Error deleting group:', err);
        window.Telegram?.WebApp?.showAlert('Ошибка при удалении группы');
        return;
      }
    }
    setGroups(g => g.filter((_, i) => i !== idx));
  };

  // Schedule handlers
  const addScheduleRow = (gIdx: number) => {
    setGroups(g =>
      g.map((grp, i) =>
        i === gIdx
          ? { ...grp, schedule: [...grp.schedule, { day: weekdays[0], start: '', end: '' }] }
          : grp
      )
    );
  };

  const updateScheduleRow = (gIdx: number, rowIdx: number, field: keyof ScheduleRow, value: string) => {
    setGroups(g =>
      g.map((grp, i) =>
        i === gIdx
          ? {
              ...grp,
              schedule: grp.schedule.map((row, j) =>
                j === rowIdx ? { ...row, [field]: value } : row
              ),
            }
          : grp
      )
    );
  };

  const removeScheduleRow = (gIdx: number, rowIdx: number) => {
    setGroups(g =>
      g.map((grp, i) =>
        i === gIdx
          ? { ...grp, schedule: grp.schedule.filter((_, j) => j !== rowIdx) }
          : grp
      )
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('management.sections.errors.nameRequired');
    if (trainerIds.length === 0) newErrors.trainers = t('management.sections.errors.trainerRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !initDataRaw || !canEdit) {
      if (!canEdit) {
        window.Telegram?.WebApp?.showAlert('У вас нет прав для редактирования этой секции');
        onClose();
      }
      return;
    }
    
    setLoading(true);
    try {
      // Update section
      await sectionsApi.updateById({
        club_id: section.club_id,
        name: name.trim(),
        description: '',
        coach_id: trainerIds[0],
        active: true,
      }, section.id, initDataRaw);

      // Update/create groups
      for (const grp of groups) {
        if (!grp.name.trim()) {
          window.Telegram?.WebApp?.showAlert('Имя группы не может быть пустым');
          setLoading(false);
          return;
        }

        const payload = {
          section_id: section.id,
          name: grp.name,
          description: grp.description || '',
          schedule: buildScheduleEntry(grp.schedule),
          price: Number(grp.price) || 0,
          capacity: Number(grp.capacity) || 0,
          level: grp.level || 'all',
          coach_id: trainerIds[0],
          tags: [],
          active: true,
        };

        if (grp.id && !grp.isNew) {
          await groupsApi.updateById(payload, grp.id, initDataRaw);
        } else if (grp.name) {
          await groupsApi.create(payload, initDataRaw);
        }
      }

      window.Telegram?.WebApp?.showAlert(t('management.sections.updated'));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving section:', error);
      window.Telegram?.WebApp?.showAlert('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initDataRaw || !canEdit) {
      if (!canEdit) {
        window.Telegram?.WebApp?.showAlert('У вас нет прав для удаления этой секции');
        onClose();
      }
      return;
    }
    
    setLoading(true);
    try {
      await sectionsApi.delete(section.id, initDataRaw);
      window.Telegram?.WebApp?.showAlert(t('management.sections.deleted'));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting section:', error);
      window.Telegram?.WebApp?.showAlert('Ошибка при удалении секции');
    } finally {
      setLoading(false);
    }
  };

  // Don't render modal if user doesn't have permission
  if (!canEdit) {
    return null;
  }

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

          {/* Trainers (Checkboxes) */}
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
                    checked={trainerIds.includes(trainer.id)}
                    onChange={() => handleTrainerToggle(trainer.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                    <span className="text-gray-900">
                      {trainer.first_name} {trainer.last_name}
                      {(trainer as any).isCurrentUser && (
                        <span className="text-blue-500 text-sm ml-1">
                          ({t('management.sections.selectSelf') || 'вы'})
                        </span>
                      )}
                    </span>
                </label>
              ))}
            </div>
            )}
            {errors.trainers && <p className="text-red-500 text-xs mt-1">{errors.trainers}</p>}
          </div>

          {/* Groups */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('management.sections.groups')}
              </h3>
              <button
                type="button"
                onClick={addGroup}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <Plus size={16} />
                {t('management.sections.addGroup')}
              </button>
            </div>

            {loadingGroups ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('management.sections.noGroupsYet')}
              </p>
            ) : (
              groups.map((group, gIdx) => (
                <div key={group.id || `new-${gIdx}`} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                      {group.name || `${t('management.sections.group')} ${gIdx + 1}`}
                  </span>
                  <button
                      onClick={() => removeGroup(gIdx)}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                  <div className="space-y-3">
                    {/* Group Name */}
                  <input
                    type="text"
                    value={group.name}
                      onChange={(e) => updateGroup(gIdx, 'name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                    placeholder={t('management.sections.groupName')}
                  />

                  <div className="grid grid-cols-2 gap-2">
                      {/* Level */}
                    <select
                        value={group.level}
                        onChange={(e) => updateGroup(gIdx, 'level', e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm"
                    >
                      <option value="">{t('management.sections.level')}</option>
                      {levelOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                      {/* Capacity */}
                    <input
                      type="number"
                        value={group.capacity}
                        onChange={(e) => updateGroup(gIdx, 'capacity', e.target.value ? Number(e.target.value) : '')}
                      className="border border-gray-200 rounded-lg p-2 text-sm"
                      placeholder={t('management.sections.capacity')}
                    />
                  </div>

                    {/* Schedule */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">{t('management.sections.schedules')}</span>
                      <button
                        type="button"
                          onClick={() => addScheduleRow(gIdx)}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        + {t('management.sections.addSchedule')}
                      </button>
                    </div>

                      {group.schedule.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          {t('management.sections.noScheduleYet') || 'Нажмите "+ Добавить расписание"'}
                        </p>
                      )}

                      {group.schedule.map((row, rowIdx) => (
                        <div key={rowIdx} className="mb-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">
                              {t('management.sections.scheduleItem') || 'Занятие'} {rowIdx + 1}
                            </span>
                          <button
                              onClick={() => removeScheduleRow(gIdx, rowIdx)}
                            className="p-1 text-red-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>

                          {/* Day Selection */}
                        <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">День недели</label>
                            <select
                              value={row.day}
                              onChange={(e) => updateScheduleRow(gIdx, rowIdx, 'day', e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg p-2"
                            >
                              {weekdays.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                        </div>

                          {/* Time Selection */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Начало</label>
                              <input
                                type="time"
                                value={row.start}
                                onChange={(e) => updateScheduleRow(gIdx, rowIdx, 'start', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg p-2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Конец</label>
                            <input
                                type="time"
                                value={row.end}
                                onChange={(e) => updateScheduleRow(gIdx, rowIdx, 'end', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg p-2"
                            />
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              ))
            )}
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
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              ) : (
                t('common.save')
              )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
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
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
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
