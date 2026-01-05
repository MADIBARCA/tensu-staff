/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Calendar, Info, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { sectionsApi, groupsApi, scheduleApi } from '@/functions/axios/axiosFunctions';
import type { Club, Employee } from '../types';
import type { ClubWithRole, CreateStaffResponse, CreateSectionResponse } from '@/functions/axios/responses';
import { levelOptions } from '../mockData';
import { useStickyState } from '@/hooks/useStickyState';

interface CreateSectionModalProps {
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  employees: Employee[];
  onClose: () => void;
  onCreate: () => void;
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
  name: string;
  level: string;
  capacity: number | '';
  price: number | '';
  description: string;
  schedule: ScheduleRow[];
  valid_from: string;
  valid_until: string;
}

export const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  clubs,
  clubRoles,
  currentUser,
  employees,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [sectionCreated, setSectionCreated] = useState(false);
  const [createdSection, setCreatedSection] = useState<CreateSectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  const [limitErrorDetails, setLimitErrorDetails] = useState<{ current: number; max: number } | null>(null);
  
  const [sectionData, setSectionData] = useState({
    name: '',
    club_id: 0,
    coach_ids: [] as number[],
    description: '',
  });
  
  const [groups, setGroups] = useState<GroupForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canCreateInClub, setCanCreateInClub] = useState<boolean | null>(null);
  const [checkingLimits, setCheckingLimits] = useState(false);

  // Filter clubs where user is owner or admin
  const activeClubs = useMemo(() => {
    return clubs.filter(c => {
      if (c.status !== 'active') return false;
      const clubRole = clubRoles.find(cr => cr.club.id === c.id);
      return clubRole && (clubRole.role === 'owner' || clubRole.role === 'admin');
    });
  }, [clubs, clubRoles]);

  // Check if current user is owner of the selected club
  const isOwnerOfSelectedClub = useMemo(() => {
    if (!sectionData.club_id || !currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === sectionData.club_id);
    return clubRole?.role === 'owner' || clubRole?.is_owner;
  }, [sectionData.club_id, clubRoles, currentUser]);

  // Check limits when club is selected
  useEffect(() => {
    const checkLimits = async () => {
      if (!initDataRaw || !sectionData.club_id) {
        setCanCreateInClub(null);
        return;
      }
      
      try {
        setCheckingLimits(true);
        const response = await sectionsApi.canCreate(sectionData.club_id, initDataRaw);
        if (response.data) {
          setCanCreateInClub(response.data.can_create);
          if (!response.data.can_create && response.data.limits_check) {
            // Pre-populate error details if limit is reached
            const limits = response.data.limits_check;
            if (limits.current_sections >= limits.max_sections) {
              setLimitErrorDetails({
                current: limits.current_sections,
                max: limits.max_sections,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking limits:', error);
        setCanCreateInClub(true); // Default to allowing creation if check fails
      } finally {
        setCheckingLimits(false);
      }
    };
    
    checkLimits();
  }, [sectionData.club_id, initDataRaw]);

  // Get coaches for selected club, including current user if they are owner
  const coaches = useMemo(() => {
    if (!sectionData.club_id) return [];
    
    const clubCoaches = employees.filter(
      e => e.role === 'coach' && e.club_ids.includes(sectionData.club_id)
    );
    
    // Add current user as coach option if they are owner of the club
    if (isOwnerOfSelectedClub && currentUser) {
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
            club_ids: [sectionData.club_id],
            photo_url: currentUser.photo_url,
            created_at: currentUser.created_at,
            isCurrentUser: true,
          },
          ...clubCoaches.map(t => ({ ...t, isCurrentUser: false })),
        ];
      }
    }
    
    return clubCoaches.map(t => ({ ...t, isCurrentUser: t.id === currentUser?.id }));
  }, [employees, sectionData.club_id, isOwnerOfSelectedClub, currentUser]);

  const handleTrainerToggle = (coachId: number) => {
    setSectionData(prev => ({
      ...prev,
      coach_ids: prev.coach_ids.includes(coachId)
        ? prev.coach_ids.filter(id => id !== coachId)
        : [...prev.coach_ids, coachId],
    }));
    setErrors({ ...errors, coaches: '' });
  };

  // Build schedule entry for API
  const buildScheduleEntry = (rows: ScheduleRow[], validFrom: string, validUntil: string) => {
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
    }]);
  };

  const updateGroup = (idx: number, field: keyof GroupForm, value: any) => {
    setGroups(g => g.map((grp, i) => (i === idx ? { ...grp, [field]: value } : grp)));
  };

  const removeGroup = (idx: number) => {
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

  // Create section
  const handleCreateSection = async () => {
    if (!initDataRaw) return;
    
    const newErrors: Record<string, string> = {};
    if (!sectionData.name.trim()) newErrors.name = t('management.sections.errors.nameRequired');
    if (!sectionData.club_id) newErrors.club = t('management.sections.errors.clubRequired');
    if (sectionData.coach_ids.length === 0) newErrors.coaches = t('management.sections.errors.coachRequired');
    
    if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await sectionsApi.create({
        club_id: sectionData.club_id,
        name: sectionData.name,
        description: sectionData.description || '',
        coach_id: sectionData.coach_ids[0], // Primary coach (required)
        coach_ids: sectionData.coach_ids, // All coaches including primary
        active: true,
      }, initDataRaw);
      
      if (response.data) {
        setCreatedSection(response.data);
        setSectionCreated(true);
        window.Telegram?.WebApp?.showAlert(t('management.sections.created'));
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors({ name: 'Секция с таким названием уже существует' });
      } else if (error.response?.status === 400 && error.response?.data?.error === 'BUSINESS_LOGIC_ERROR') {
        // Handle limit exceeded error
        const details = error.response?.data?.details;
        if (details?.resource === 'sections') {
          setLimitErrorDetails({
            current: details.current || 0,
            max: details.limit || 0,
          });
          setShowLimitError(true);
        } else {
          console.error('Error creating section:', error);
          window.Telegram?.WebApp?.showAlert(error.response?.data?.message || 'Ошибка при создании секции');
        }
      } else {
        console.error('Error creating section:', error);
        window.Telegram?.WebApp?.showAlert('Ошибка при создании секции');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save groups and generate lessons
  const handleSaveGroups = async () => {
    if (!initDataRaw || !createdSection) return;
    
    setLoading(true);
    let lessonsGenerated = 0;
    
    try {
      for (const grp of groups) {
        if (!grp.name.trim()) {
          window.Telegram?.WebApp?.showAlert('Имя группы не может быть пустым');
          setLoading(false);
          return;
        }

        const payload = {
          section_id: createdSection.id,
          name: grp.name,
          description: grp.description || '',
          schedule: buildScheduleEntry(grp.schedule, grp.valid_from, grp.valid_until),
          price: Number(grp.price) || 0,
          capacity: Number(grp.capacity) || 0,
          level: grp.level || 'all',
          coach_id: sectionData.coach_ids[0], // Primary coach
          coach_ids: sectionData.coach_ids, // All coaches
          tags: [],
          active: true,
        };

        // Create group
        const groupResponse = await groupsApi.create(payload, initDataRaw);
        const createdGroup = groupResponse.data as { id: number } | null;
        
        // Generate lessons if schedule exists and has valid dates
        if (createdGroup && grp.schedule.length > 0 && grp.valid_from && grp.valid_until) {
          try {
            await scheduleApi.generateLessons(
              createdGroup.id,
              {
                start_date: grp.valid_from,
                end_date: grp.valid_until,
                overwrite_existing: false,
                exclude_holidays: true,
              },
              initDataRaw
            );
            lessonsGenerated++;
          } catch (lessonError) {
            console.error('Error generating lessons for group:', createdGroup.id, lessonError);
            // Continue with other groups even if lesson generation fails for one
          }
        }
      }
      
      // Show success message
      const message = lessonsGenerated > 0
        ? t('management.sections.groupsAndLessonsCreated') || 'Группы и занятия успешно созданы'
        : groups.length > 0 
          ? t('management.sections.groupsCreated') || 'Группы успешно созданы'
          : t('management.sections.created');
      
      window.Telegram?.WebApp?.showAlert(message);
      onCreate();
      onClose();
    } catch (error) {
      console.error('Error creating groups:', error);
      window.Telegram?.WebApp?.showAlert('Ошибка при создании групп');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (!sectionCreated) {
      handleCreateSection();
    } else {
      handleSaveGroups();
    }
  };

  const { isSticky, sentinelRef, stickyRef } = useStickyState(true);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-lg mx-auto flex flex-col">
        {/* Sentinel for sticky detection */}
        <div ref={sentinelRef} className="h-0" />
        
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div 
          ref={stickyRef as React.Ref<HTMLDivElement>}
          className={`sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 transition-all duration-200 ${
            isSticky ? 'mt-20' : ''
          }`}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.sections.createTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Section Info */}
          {sectionCreated ? (
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{sectionData.name}</h3>
                <p className="text-sm text-gray-500">
                  {activeClubs.find(c => c.id === sectionData.club_id)?.name}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1" />
                {t('management.sections.sectionCreated') || 'Секция создана'}
              </span>
            </div>
          ) : (
            <>
          {/* Club */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.sections.club')} *
            </label>
            <select
              value={sectionData.club_id}
              onChange={(e) => {
                setSectionData({ ...sectionData, club_id: Number(e.target.value), coach_ids: [] });
                setErrors({ ...errors, club: '' });
                setCanCreateInClub(null); // Reset limit check
              }}
              className={`w-full border rounded-lg p-2 ${errors.club ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value={0}>{t('management.sections.selectClub')}</option>
              {activeClubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            {errors.club && <p className="text-red-500 text-xs mt-1">{errors.club}</p>}
            {sectionData.club_id > 0 && canCreateInClub === false && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Лимит секций достигнут</p>
                    {limitErrorDetails && (
                      <p className="text-xs text-red-600 mt-1">
                        Использовано: {limitErrorDetails.current}/{limitErrorDetails.max} секций
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
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

              {/* Coaches (Checkboxes) */}
          {sectionData.club_id > 0 && (
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
                        checked={sectionData.coach_ids.includes(coach.id)}
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
          )}
            </>
          )}

          {/* Groups Section */}
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

            {groups.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('management.sections.noGroupsYet') || 'Группы пока не добавлены'}
              </p>
            )}

            {groups.map((group, gIdx) => (
              <div key={gIdx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {t('management.sections.group')} {gIdx + 1}
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
                            className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white"
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
                            className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Weekly Schedule */}
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
            ))}
          </div>
        </div>

        {/* Footer with safe bottom padding */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-3 pb-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleFinish}
            disabled={loading || checkingLimits || (!sectionCreated && (!sectionData.name || !sectionData.club_id || sectionData.coach_ids.length === 0 || canCreateInClub === false))}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : sectionCreated ? (
              t('common.save')
            ) : (
              t('management.sections.createSection') || 'Создать секцию'
            )}
          </button>
        </div>
      </div>

      {/* Limit Error Dialog */}
      {showLimitError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => {
              setShowLimitError(false);
              setLimitErrorDetails(null);
            }}
          />
          
          {/* Dialog */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10"
            style={{
              animation: 'fadeIn 0.2s ease-out, scaleIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-50 text-orange-500">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Лимит секций достигнут</h3>
                </div>
                <button
                  onClick={() => {
                    setShowLimitError(false);
                    setLimitErrorDetails(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {limitErrorDetails
                  ? `Вы достигли максимального количества секций (${limitErrorDetails.current}/${limitErrorDetails.max}). Для создания новых секций обратитесь к администратору или удалите неиспользуемые секции.`
                  : 'Вы достигли максимального количества секций. Для создания новых секций обратитесь к администратору.'}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setShowLimitError(false);
                  setLimitErrorDetails(null);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
