import React, { useState, useMemo, useEffect, useCallback } from "react";
import { DayDetailsModal } from "./DayDetailsModal";
import type { DaySchedule, Lesson } from "@/functions/axios/responses";
import { scheduleApi, teamApi, staffApi, groupsApi } from "@/functions/axios/axiosFunctions";
import { EditLessonModal } from "./EditLessonModal";
import { Filter, ChevronLeft, ChevronRight, Calendar, X, List, CalendarDays } from "lucide-react";
import { AddTrainingModal } from "./AddTrainingModal";
import { Skeleton, Select } from "@/components/ui";
import { useI18n } from "@/i18n/i18n";
import { TrainingListItem } from "./TrainingListItem";

export const CalendarSection: React.FC<{ token: string | null; refreshKey?: number }> = ({
  token,
  refreshKey,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, Array<DaySchedule>>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({
    coach: "all",
    club: "all",
  });
  const [sectionIdToClubName, setSectionIdToClubName] = useState<Record<number, string>>({});
  const [sectionIdToSectionName, setSectionIdToSectionName] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('calendar');
  const [isLoading, setIsLoading] = useState(true);

  const { t, lang } = useI18n();

  const formatDate = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Compute all week-start dates in the current month
  const getWeeksInMonth = useCallback((date: Date) => {
    const weeks: string[] = [];
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let current = new Date(firstOfMonth);
    const day = current.getDay();
    const diff = (day + 6) % 7;
    current.setDate(current.getDate() - diff);
    while (current <= lastOfMonth) {
      weeks.push(formatDate(current));
      current = new Date(current);
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }, [formatDate]);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    const weeks = getWeeksInMonth(currentDate);
    Promise.all(
      weeks.map((dateStr) =>
        scheduleApi
          .getWeekSchedule(dateStr, token)
          .then((res) => ({ key: dateStr, days: res.data.days }))
      )
    )
      .then((arr) => {
        const next: Record<string, Array<DaySchedule>> = {};
        arr.forEach(({ key, days }) => (next[key] = days));
        setCalendarData(next);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentDate, token, refreshKey, getWeeksInMonth]);

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const navigateMonth = (dir: "prev" | "next") =>
    setCurrentDate((d) => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + (dir === "next" ? 1 : -1));
      return nd;
    });

  // Get scheduled lessons for a date with applied filters
  const getLessonsForDate = useCallback((dateStr: string): Lesson[] => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const weekKey = formatDate(monday);
    const daysArr = calendarData[weekKey] || [];
    const dayEntry = daysArr.find((ws) => ws.schedule_date === dateStr);
    let lessons = dayEntry ? dayEntry.lessons : [];
    
    if (calendarFilters.coach !== "all") {
      lessons = lessons.filter((les) => {
        const coachName = `${les.coach.first_name}${les.coach.last_name ? " " + les.coach.last_name : ""}`.trim();
        return coachName === calendarFilters.coach;
      });
    }
    
    if (calendarFilters.club !== "all") {
      lessons = lessons.filter((les) => {
        const clubName = sectionIdToClubName[les.group.section_id];
        return clubName === calendarFilters.club;
      });
    }
    
    return lessons;
  }, [calendarData, calendarFilters, formatDate, sectionIdToClubName]);

  // Get all lessons for list view
  const allUpcomingLessons = useMemo(() => {
    const todayStr = formatDate(new Date());
    const allLessons: Lesson[] = [];
    
    Object.values(calendarData).forEach((weekDays) => {
      weekDays.forEach((daySchedule) => {
        if (daySchedule.schedule_date >= todayStr) {
          let lessons = daySchedule.lessons;
          
          if (calendarFilters.coach !== "all") {
            lessons = lessons.filter((les) => {
              const coachName = `${les.coach.first_name}${les.coach.last_name ? " " + les.coach.last_name : ""}`.trim();
              return coachName === calendarFilters.coach;
            });
          }
          
          if (calendarFilters.club !== "all") {
            lessons = lessons.filter((les) => {
              const clubName = sectionIdToClubName[les.group.section_id];
              return clubName === calendarFilters.club;
            });
          }
          
          allLessons.push(...lessons);
        }
      });
    });
    
    return allLessons.sort((a, b) => {
      const dateCompare = a.planned_date.localeCompare(b.planned_date);
      if (dateCompare !== 0) return dateCompare;
      return a.planned_start_time.localeCompare(b.planned_start_time);
    }).slice(0, 10);
  }, [calendarData, calendarFilters, formatDate, sectionIdToClubName]);

  const hasActiveFilters = calendarFilters.coach !== "all" || calendarFilters.club !== "all";

  const todayStr = useMemo(() => formatDate(new Date()), [formatDate]);

  const isPastDate = useCallback((dateStr: string) => dateStr < todayStr, [todayStr]);
  const isToday = useCallback((dateStr: string) => dateStr === todayStr, [todayStr]);
  const hasTrainings = useCallback((dateStr: string) => getLessonsForDate(dateStr).length > 0, [getLessonsForDate]);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const [coaches, setCoaches] = useState<string[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState<boolean>(false);
  const [clubNames, setClubNames] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    setIsLoadingCoaches(true);
    Promise.all([teamApi.get(token), staffApi.getMe(token), groupsApi.getMy(token)])
      .then(([teamRes, meRes, groupsRes]) => {
        const currentClubs = teamRes.data.current_user_clubs || [];
        const allowedClubIds = currentClubs
          .filter((c) => c.user_role === "owner" || c.user_role === "admin")
          .map((c) => c.club_id);

        const coachMembers = (teamRes.data.staff_members || []).filter((m) =>
          (m.clubs_and_roles || []).some(
            (cr) => allowedClubIds.includes(cr.club_id) && cr.role === "coach"
          )
        );

        const uniqueNames = new Map<number, string>(
          coachMembers.map((m) => [
            m.id,
            `${m.first_name}${m.last_name ? " " + m.last_name : ""}`.trim(),
          ])
        );

        const isCurrentUserCoach = currentClubs.some((c) => c.user_role === "coach");
        if (isCurrentUserCoach) {
          const myName = `${meRes.data.first_name}${meRes.data.last_name ? " " + meRes.data.last_name : ""}`.trim() || "Я (тренер)";
          uniqueNames.set(-1, myName);
        }

        setCoaches(Array.from(uniqueNames.values()));

        const names = Array.from(
          new Set((currentClubs || []).map((c) => c.club_name).filter(Boolean))
        );
        setClubNames(names);

        const clubIdToName = new Map<number, string>(
          (currentClubs || []).map((c) => [c.club_id, c.club_name])
        );
        const mapping: Record<number, string> = {};
        const sectionNameMapping: Record<number, string> = {};
        (groupsRes.data || []).forEach((g) => {
          const secId = g.section?.id;
          const clubId = g.section?.club_id;
          const secName = g.section?.name;
          if (typeof secId === "number") {
            if (secName) sectionNameMapping[secId] = secName;
            if (typeof clubId === "number") {
              const clubName = clubIdToName.get(clubId);
              if (clubName) mapping[secId] = clubName;
            }
          }
        });
        setSectionIdToClubName(mapping);
        setSectionIdToSectionName(sectionNameMapping);
      })
      .catch(console.error)
      .finally(() => setIsLoadingCoaches(false));
  }, [token]);

  const getStatusInfo = (lesson: Lesson) => {
    if (lesson.status === 'cancelled') {
      return { key: 'cancelled', label: lang === 'kk' ? 'Бас тартылды' : 'Отменено', color: 'bg-red-500' };
    }
    const start = new Date(`${lesson.planned_date}T${lesson.planned_start_time.slice(0,5)}:00`);
    const end = new Date(start.getTime() + (lesson.duration_minutes || 0) * 60000);
    const now = new Date();
    if (now < start) return { key: 'upcoming', label: lang === 'kk' ? 'Жоспарланған' : 'Запланировано', color: 'bg-blue-500' };
    if (now >= start && now <= end) return { key: 'live', label: lang === 'kk' ? 'Қазір жүріп жатыр' : 'В процессе', color: 'bg-orange-500' };
    return { key: 'past', label: lang === 'kk' ? 'Өткізілді' : 'Проведено', color: 'bg-gray-400' };
  };

  const activeFiltersCount = [calendarFilters.coach !== "all", calendarFilters.club !== "all"].filter(Boolean).length;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-4">
        {/* Header with Tabs and Filter */}
        <div className="flex items-center justify-between mb-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              {lang === 'kk' ? 'Тізім' : 'Список'}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays size={16} />
              {lang === 'kk' ? 'Күнтізбе' : 'Календарь'}
            </button>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-all ${
              showFilters 
                ? 'border-blue-200 bg-blue-50 text-blue-600' 
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            <span className="text-sm">{t('schedule.filters') || (lang === 'kk' ? 'Сүзгі' : 'Фильтр')}</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label={t('filters.coaches')}
                value={calendarFilters.coach}
                onChange={(e) => setCalendarFilters((prev) => ({ ...prev, coach: e.target.value }))}
                options={[
                  { value: "all", label: t('filters.allCoaches') },
                  ...coaches.map((c) => ({ value: c, label: c })),
                ]}
                disabled={isLoadingCoaches}
              />
              <Select
                label={t('filters.clubs')}
                value={calendarFilters.club}
                onChange={(e) => setCalendarFilters((prev) => ({ ...prev, club: e.target.value }))}
                options={[
                  { value: "all", label: t('filters.allClubs') },
                  ...clubNames.map((c) => ({ value: c, label: c })),
                ]}
                disabled={isLoadingCoaches}
              />
            </div>
          </div>
        )}

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {calendarFilters.coach !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {calendarFilters.coach}
                <button
                  onClick={() => setCalendarFilters((f) => ({ ...f, coach: "all" }))}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {calendarFilters.club !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {calendarFilters.club}
                <button
                  onClick={() => setCalendarFilters((f) => ({ ...f, club: "all" }))}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'calendar' ? (
          <>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-semibold text-gray-900 capitalize">
                {currentDate.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(t('calendar.weekdays').split(',')).map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {isLoading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                ))
              ) : (
                days.map((day, idx) => {
                  const dateStr = day ? formatDate(day) : '';
                  const past = day ? isPastDate(dateStr) : false;
                  const today = day ? isToday(dateStr) : false;
                  const selected = day ? dateStr === selectedDay : false;
                  const hasEvents = day ? hasTrainings(dateStr) : false;

                  return (
                    <div key={idx} className="aspect-square">
                      {day ? (
                        <button
                          onClick={() => setSelectedDay(selected ? null : dateStr)}
                          className={`w-full h-full flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${
                            selected
                              ? 'bg-blue-500 text-white'
                              : today
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : past
                              ? 'text-gray-400 bg-gray-50'
                              : hasEvents
                              ? 'bg-gray-100 hover:bg-gray-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={selected || today ? 'font-semibold' : ''}>
                            {day.getDate()}
                          </span>
                          {hasEvents && !selected && (
                            <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Status Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>{lang === 'kk' ? 'Жоспарланған' : 'Запланировано'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>{lang === 'kk' ? 'В процессе' : 'В процессе'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span>{lang === 'kk' ? 'Өткізілді' : 'Проведено'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>{lang === 'kk' ? 'Бас тартылды' : 'Отменено'}</span>
              </div>
            </div>
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))
            ) : allUpcomingLessons.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">
                  {lang === 'kk' ? 'Жоспарланған жаттығулар жоқ' : 'Нет запланированных тренировок'}
                </p>
              </div>
            ) : (
              allUpcomingLessons.map((lesson) => (
                <TrainingListItem
                  key={lesson.id}
                  lesson={lesson}
                  clubName={sectionIdToClubName[lesson.group.section_id]}
                  sectionName={sectionIdToSectionName[lesson.group.section_id]}
                  statusInfo={getStatusInfo(lesson)}
                  onEdit={() => setEditingLesson(lesson)}
                  canEdit={
                    lesson.status !== 'completed' && 
                    !(new Date() >= new Date(`${lesson.planned_date}T${lesson.planned_start_time.slice(0,5)}:00`))
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Empty state when filters return no results */}
        {hasActiveFilters && activeTab === 'calendar' && !isLoading && (
          (() => {
            const hasAnyLessons = days.some(day => day && getLessonsForDate(formatDate(day)).length > 0);
            if (!hasAnyLessons) {
              return (
                <div className="mt-4 p-6 bg-gray-50 rounded-xl text-center">
                  <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">
                    {lang === 'kk' ? 'Ештеңе табылмады' : 'Ничего не найдено'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {lang === 'kk' ? 'Сүзгілерді өзгертіп көріңіз' : 'Попробуйте изменить фильтры'}
                  </p>
                  <button
                    onClick={() => setCalendarFilters({ coach: "all", club: "all" })}
                    className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    {lang === 'kk' ? 'Сүзгілерді тазалау' : 'Сбросить фильтры'}
                  </button>
                </div>
              );
            }
            return null;
          })()
        )}

        {/* Day Details Modal */}
        {selectedDay && (
          <DayDetailsModal
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
            trainings={getLessonsForDate(selectedDay)}
            clubNameBySectionId={sectionIdToClubName}
            sectionNameBySectionId={sectionIdToSectionName}
            canEdit={(lesson) => {
              const start = new Date(`${lesson.planned_date}T${lesson.planned_start_time.slice(0,5)}:00`);
              const end = new Date(start.getTime() + (lesson.duration_minutes || 0) * 60000);
              const now = new Date();
              const isLive = now >= start && now <= end;
              const isFinished = now > end || lesson.status === 'completed';
              return !(isLive || isFinished);
            }}
            onSelectLesson={(lesson) => setEditingLesson(lesson)}
            onCreateForDay={isPastDate(selectedDay) ? undefined : (dayStr) => {
              if (isPastDate(dayStr)) return;
              setDefaultDate(dayStr);
              setShowAdd(true);
            }}
          />
        )}

        {/* Edit Modal */}
        {editingLesson && token && (
          <EditLessonModal
            token={token}
            lesson={editingLesson}
            onClose={() => setEditingLesson(null)}
            onSaved={() => {
              setEditingLesson(null);
              setCurrentDate((d) => new Date(d));
            }}
          />
        )}

        {/* Add Modal */}
        {showAdd && (
          <AddTrainingModal
            token={token}
            onClose={() => { setShowAdd(false); setDefaultDate(null); }}
            onSuccess={() => {
              setShowAdd(false);
              setDefaultDate(null);
              setCurrentDate((d) => new Date(d));
            }}
            defaultDate={defaultDate || undefined}
          />
        )}
      </div>
    </section>
  );
};
