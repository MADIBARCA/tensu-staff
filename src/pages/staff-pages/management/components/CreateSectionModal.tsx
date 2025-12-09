/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { sectionsApi, groupsApi } from '@/functions/axios/axiosFunctions';
import type { Club, Employee } from '../types';
import type { ClubWithRole, CreateStaffResponse, CreateSectionResponse } from '@/functions/axios/responses';
import { levelOptions } from '../mockData';

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
  
  const [sectionData, setSectionData] = useState({
    name: '',
    club_id: 0,
    coach_ids: [] as number[],
    description: '',
  });
  
  const [groups, setGroups] = useState<GroupForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        coach_id: sectionData.coach_ids[0], // API accepts single coach_id
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
      } else {
        console.error('Error creating section:', error);
        window.Telegram?.WebApp?.showAlert('Ошибка при создании секции');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save groups
  const handleSaveGroups = async () => {
    if (!initDataRaw || !createdSection) return;
    
    setLoading(true);
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
          schedule: buildScheduleEntry(grp.schedule),
          price: Number(grp.price) || 0,
          capacity: Number(grp.capacity) || 0,
          level: grp.level || 'all',
          coach_id: sectionData.coach_ids[0],
          tags: [],
          active: true,
        };

        await groupsApi.create(payload, initDataRaw);
      }
      
      window.Telegram?.WebApp?.showAlert(
        groups.length > 0 
          ? t('management.sections.groupsCreated') || 'Группы успешно созданы'
          : t('management.sections.created')
      );
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

  return (
    <div className="fixed inset-0 z-50 flex max-h-screen bg-white">
      <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.sections.createTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            onClick={handleFinish}
            disabled={loading || (!sectionCreated && (!sectionData.name || !sectionData.club_id || sectionData.coach_ids.length === 0))}
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
    </div>
  );
};
