/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { X, Plus, Trash2, AlertTriangle, Calendar, Info, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { sectionsApi, groupsApi, scheduleApi } from '@/functions/axios/axiosFunctions';
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
  valid_from: string;
  valid_until: string;
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
  const [coachIds, setTrainerIds] = useState<number[]>(section.coach_ids);
  const [groups, setGroups] = useState<GroupForm[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Check if current user can edit (must be owner or admin of the section's club)
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === section.club_id);
    return clubRole ? (clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner) : false;
  }, [section.club_id, clubRoles, currentUser]);

  // Check if current user is owner of the club (for showing self as coach option)
  const isOwnerOfClub = useMemo(() => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === section.club_id);
    return clubRole?.role === 'owner' || clubRole?.is_owner;
  }, [section.club_id, clubRoles, currentUser]);

  // Get coaches for the club, including current user if they are owner
  const coaches = useMemo(() => {
    const clubCoaches = employees.filter(
      e => e.role === 'coach' && e.club_ids.includes(section.club_id)
    );
    
    if (isOwnerOfClub && currentUser) {
      const currentUserAlreadyInList = clubCoaches.some(t => t.id === currentUser.id);
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
          ...clubCoaches.map(t => ({ ...t, isCurrentUser: t.id === currentUser?.id })),
        ];
      }
    }
    
    return clubCoaches.map(t => ({ ...t, isCurrentUser: t.id === currentUser?.id }));
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
            let validFrom = '';
            let validUntil = '';
            
            if (g.schedule && typeof g.schedule === 'object') {
              const scheduleObj = g.schedule as any;
              const weeklyPattern = scheduleObj.weekly_pattern || g.schedule;
              
              // Extract valid_from and valid_until
              validFrom = scheduleObj.valid_from || '';
              validUntil = scheduleObj.valid_until || '';
              
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
            
            // Default dates if not set
            if (!validFrom) {
              validFrom = new Date().toISOString().split('T')[0];
            }
            if (!validUntil) {
              const threeMonthsLater = new Date();
              threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
              validUntil = threeMonthsLater.toISOString().split('T')[0];
            }
            
            return {
              id: g.id,
              name: g.name,
              level: g.level || '',
              capacity: g.capacity || '',
              price: typeof g.price === 'number' ? g.price : (parseInt(g.price as string) || ''),
              description: g.description || '',
              schedule: scheduleRows,
              valid_from: validFrom,
              valid_until: validUntil,
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

  const handleTrainerToggle = (coachId: number) => {
    setTrainerIds(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
    setErrors({ ...errors, coaches: '' });
  };

  // Calculate duration in minutes from start and end time
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 60;
    const duration = (Date.parse(`1970-01-01T${end}`) - Date.parse(`1970-01-01T${start}`)) / 60000;
    return duration > 0 ? duration : 60;
  };

  // Validate schedule duration (must be between 30 and 300 minutes)
  const validateScheduleDuration = (rows: ScheduleRow[]): { isValid: boolean; error: string | null } => {
    for (const row of rows) {
      if (!row.start || !row.end) continue;
      const duration = calculateDuration(row.start, row.end);
      if (duration < 30) {
        return { isValid: false, error: t('management.sections.errors.durationTooShort') || 'Длительность занятия должна быть минимум 30 минут' };
      }
      if (duration > 300) {
        return { isValid: false, error: t('management.sections.errors.durationTooLong') || 'Длительность занятия не может превышать 5 часов (300 минут)' };
      }
    }
    return { isValid: true, error: null };
  };

  // Build schedule entry for API
  const buildScheduleEntry = (rows: ScheduleRow[], validFrom: string, validUntil: string) => {
    const pattern: Record<string, { time: string; duration: number }[]> = {};
    rows.forEach(({ day, start, end }) => {
      const engDay = dayMap[day] || day.toLowerCase();
      const duration = calculateDuration(start, end);
      // Clamp duration to valid range
      const clampedDuration = Math.min(300, Math.max(30, duration));
      if (!pattern[engDay]) pattern[engDay] = [];
      pattern[engDay].push({ time: start, duration: clampedDuration });
    });
    return {
      weekly_pattern: pattern,
      valid_from: validFrom || '',
      valid_until: validUntil || '',
    };
  };

  // Group handlers
  const addGroup = () => {
    // Default to today and 3 months from now
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    setGroups([...groups, {
      name: '',
      level: '',
      capacity: '',
      price: '',
      description: '',
      schedule: [],
      valid_from: today.toISOString().split('T')[0],
      valid_until: threeMonthsLater.toISOString().split('T')[0],
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

  // Check if any group has period > 180 days
  const hasInvalidPeriod = groups.some(grp => {
    if (!grp.valid_from || !grp.valid_until) return false;
    const startDate = new Date(grp.valid_from);
    const endDate = new Date(grp.valid_until);
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 180;
  });

  // Check if any schedule has invalid duration
  const hasInvalidDuration = groups.some(grp => {
    const validation = validateScheduleDuration(grp.schedule);
    return !validation.isValid;
  });

  // Get duration error message for a specific schedule row
  const getDurationError = (start: string, end: string): string | null => {
    if (!start || !end) return null;
    const duration = calculateDuration(start, end);
    if (duration < 30) return t('management.sections.errors.durationTooShort') || 'Минимум 30 минут';
    if (duration > 300) return t('management.sections.errors.durationTooLong') || 'Максимум 5 часов';
    return null;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('management.sections.errors.nameRequired');
    if (coachIds.length === 0) newErrors.coaches = t('management.sections.errors.coachRequired');
    if (hasInvalidPeriod) {
      window.Telegram?.WebApp?.showAlert(t('management.sections.errors.periodTooLong') || 'Период не может превышать 6 месяцев (180 дней)');
      return false;
    }
    // Validate durations
    for (const grp of groups) {
      const validation = validateScheduleDuration(grp.schedule);
      if (!validation.isValid) {
        window.Telegram?.WebApp?.showAlert(validation.error || 'Ошибка в длительности занятия');
        return false;
      }
    }
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
    let lessonsGenerated = 0;
    
    try {
      // Update section
      await sectionsApi.updateById({
        club_id: section.club_id,
        name: name.trim(),
        description: '',
        coach_id: coachIds[0], // Primary coach
        coach_ids: coachIds, // All coaches
        active: true,
      }, section.id, initDataRaw);

      // Update/create groups and generate lessons
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
          schedule: buildScheduleEntry(grp.schedule, grp.valid_from, grp.valid_until),
          price: Number(grp.price) || 0,
          capacity: Number(grp.capacity) || 0,
          level: grp.level || 'all',
          coach_id: coachIds[0], // Primary coach
          coach_ids: coachIds, // All coaches
          tags: [],
          active: true,
        };

        let groupId = grp.id;
        
        if (grp.id && !grp.isNew) {
          // Update existing group
          await groupsApi.updateById(payload, grp.id, initDataRaw);
        } else if (grp.name) {
          // Create new group
          const response = await groupsApi.create(payload, initDataRaw);
          if (response.data) {
            groupId = response.data.id;
          }
        }
        
        // Generate lessons if schedule exists and has valid dates
        if (groupId && grp.schedule.length > 0 && grp.valid_from && grp.valid_until) {
          try {
            await scheduleApi.generateLessons(
              groupId,
              {
                start_date: grp.valid_from,
                end_date: grp.valid_until,
                overwrite_existing: false, // Don't overwrite existing lessons
                exclude_holidays: true,
              },
              initDataRaw
            );
            lessonsGenerated++;
          } catch (lessonError) {
            console.error('Error generating lessons for group:', groupId, lessonError);
            // Continue with other groups even if lesson generation fails
          }
        }
      }

      // Show success message
      const message = lessonsGenerated > 0
        ? t('management.sections.updatedWithLessons') || 'Секция обновлена, занятия созданы'
        : t('management.sections.updated');
        
      window.Telegram?.WebApp?.showAlert(message);
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

  // Track scroll state inside modal
  useEffect(() => {
    const scrollContainer = document.getElementById('edit-section-modal-scroll');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 0);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Don't render modal if user doesn't have permission
  if (!canEdit) {
    return null;
  }

  return (
    <div id="edit-section-modal-scroll" className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-lg mx-auto flex flex-col pt-23">
        {/* Header */}
        <div className={clsx(
          "sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled ? "pt-23" : ""
        )}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.sections.editTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4">
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

          {/* Coaches (Checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('management.sections.coaches')} *
            </label>
            {coaches.length === 0 ? (
              <p className="text-sm text-gray-500">{t('management.sections.noCoaches')}</p>
            ) : (
            <div className="space-y-2">
              {coaches.map(coach => (
                <label
                  key={coach.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={coachIds.includes(coach.id)}
                    onChange={() => handleTrainerToggle(coach.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                    <span className="text-gray-900">
                      {coach.first_name} {coach.last_name}
                      {(coach as any).isCurrentUser && (
                        <span className="text-blue-500 text-sm ml-1">
                          ({t('management.sections.selectSelf') || 'вы'})
                        </span>
                      )}
                    </span>
                </label>
              ))}
            </div>
            )}
            {errors.coaches && <p className="text-red-500 text-xs mt-1">{errors.coaches}</p>}
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

                    {/* Schedule Period */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {t('management.sections.schedulePeriod') || 'Период расписания'}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">
                          {t('management.sections.schedulePeriodHint') || 'Укажите период, в течение которого будут отображаться занятия в календаре'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            {t('management.sections.validFrom') || 'С даты'}
                          </label>
                          <input
                            type="date"
                            value={group.valid_from}
                            onChange={(e) => updateGroup(gIdx, 'valid_from', e.target.value)}
                            className="w-full min-w-0 text-sm border border-gray-200 rounded-lg p-2 bg-white box-border"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            {t('management.sections.validUntil') || 'По дату'}
                          </label>
                          <input
                            type="date"
                            value={group.valid_until}
                            onChange={(e) => updateGroup(gIdx, 'valid_until', e.target.value)}
                            min={group.valid_from}
                            className="w-full min-w-0 text-sm border border-gray-200 rounded-lg p-2 bg-white box-border"
                          />
                        </div>
                      </div>
                      {/* Period validation warning */}
                      {group.valid_from && group.valid_until && (() => {
                        const startDate = new Date(group.valid_from);
                        const endDate = new Date(group.valid_until);
                        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays > 180) {
                          return (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {t('management.sections.errors.periodTooLong') || 'Период не может превышать 6 месяцев (180 дней)'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    {/* Weekly Schedule */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-600">{t('management.sections.schedules')}</span>
                    </div>

                      {group.schedule.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          {t('management.sections.noScheduleYet') || 'Добавьте занятия в расписание'}
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
                              <label className="block text-xs text-gray-500 mb-1">{t('management.sections.startTime') || 'Начало'}</label>
                              <input
                                type="time"
                                value={row.start}
                                onChange={(e) => updateScheduleRow(gIdx, rowIdx, 'start', e.target.value)}
                                className={`w-full min-w-0 text-sm border rounded-lg p-2 box-border ${getDurationError(row.start, row.end) ? 'border-red-300' : 'border-gray-200'}`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">{t('management.sections.endTime') || 'Конец'}</label>
                            <input
                                type="time"
                                value={row.end}
                                onChange={(e) => updateScheduleRow(gIdx, rowIdx, 'end', e.target.value)}
                                className={`w-full min-w-0 text-sm border rounded-lg p-2 box-border ${getDurationError(row.start, row.end) ? 'border-red-300' : 'border-gray-200'}`}
                            />
                            </div>
                          </div>
                          {/* Duration validation error */}
                          {getDurationError(row.start, row.end) && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {getDurationError(row.start, row.end)}
                              {row.start && row.end && (
                                <span className="text-gray-400 ml-1">
                                  ({calculateDuration(row.start, row.end)} мин)
                                </span>
                              )}
                            </p>
                          )}
                      </div>
                    ))}

                    {/* Add Schedule Button - at the bottom */}
                    <button
                      type="button"
                      onClick={() => addScheduleRow(gIdx)}
                      className="w-full mt-2 p-3 border-2 border-dashed border-gray-300 rounded-lg 
                                 text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50
                                 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      <span className="text-sm font-medium">
                        {t('management.sections.addSchedule')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Footer with safe bottom padding */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 space-y-2 pb-8">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || hasInvalidPeriod || hasInvalidDuration}
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
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
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
