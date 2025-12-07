import React, { useState, useMemo, useEffect, useCallback } from "react";
import { DayDetailsModal } from "./DayDetailsModal";
import type { DaySchedule, Lesson } from "@/functions/axios/responses";
import { scheduleApi, teamApi, staffApi, groupsApi } from "@/functions/axios/axiosFunctions";
import { EditLessonModal } from "./EditLessonModal";
import { Filter, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { AddTrainingModal } from "./AddTrainingModal";
import { Skeleton, Select, Badge } from "@/components/ui";
import { useI18n } from "@/i18n/i18n";

export const CalendarSection: React.FC<{ token: string | null; refreshKey?: number }> = ({
  token,
  refreshKey,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<
    Record<string, Array<DaySchedule>>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({
    coach: "all",
    club: "all",
    type: "all",
  });
  const [sectionIdToClubName, setSectionIdToClubName] = useState<Record<number, string>>({});
  const [sectionIdToSectionName, setSectionIdToSectionName] = useState<Record<number, string>>({});

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
    // find Monday of first week
    let current = new Date(firstOfMonth);
    const day = current.getDay();
    const diff = (day + 6) % 7; // Monday=0
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
      .catch(console.error);
  }, [currentDate, token, refreshKey, getWeeksInMonth]);

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
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
    // find week start for this date
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    const weekKey = formatDate(monday);
    const daysArr = calendarData[weekKey] || [];
    const dayEntry = daysArr.find((ws) => ws.schedule_date === dateStr);
    let lessons = dayEntry ? dayEntry.lessons : [];
    
    // Apply filters
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

  // Check if any lessons exist in current view (for empty state)
  const hasAnyLessons = useMemo(() => {
    for (const day of days) {
      if (day && getLessonsForDate(formatDate(day)).length > 0) {
        return true;
      }
    }
    return false;
  }, [days, getLessonsForDate, formatDate]);

  // Check if filters are active
  const hasActiveFilters = calendarFilters.coach !== "all" || calendarFilters.club !== "all";

  const getLessonChipClass = (lesson: Lesson) => {
    const start = new Date(`${lesson.planned_date}T${lesson.planned_start_time.slice(0,5)}:00`);
    const end = new Date(start.getTime() + (lesson.duration_minutes || 0) * 60000);
    const now = new Date();
    if (lesson.status === 'cancelled') return 'bg-red-500';
    if (now < start) return 'bg-blue-500'; // upcoming
    if (now >= start && now <= end) return 'bg-orange-500'; // live
    return 'bg-gray-400'; // past
  };

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const [coaches, setCoaches] = useState<string[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState<boolean>(false);
  const [clubNames, setClubNames] = useState<string[]>([]);
  const { t, lang } = useI18n();

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
          // Use a synthetic key to ensure inclusion without clashing with numeric IDs
          uniqueNames.set(-1, myName);
        }

        setCoaches(Array.from(uniqueNames.values()));

        // Clubs: list all clubs the user is in (owner/admin/coach)
        const names = Array.from(
          new Set((currentClubs || []).map((c) => c.club_name).filter(Boolean))
        );
        setClubNames(names);

        // Build section_id -> club_name mapping from groups + team clubs
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

  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const isPastDate = useCallback((dateStr: string) => {
    return dateStr < todayStr;
  }, [todayStr]);

  const isToday = useCallback((dateStr: string) => {
    return dateStr === todayStr;
  }, [todayStr]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{t('schedule.title')}</h2>
            {hasActiveFilters && (
              <Badge variant="info" size="sm">
                {lang === 'kk' ? 'Сүзгі' : 'Фильтр'}
              </Badge>
            )}
          </div>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-xl mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label={t('filters.coaches')}
                value={calendarFilters.coach}
                onChange={(e) =>
                  setCalendarFilters((prev) => ({ ...prev, coach: e.target.value }))
                }
                options={[
                  { value: "all", label: t('filters.allCoaches') },
                  ...coaches.map((c) => ({ value: c, label: c })),
                ]}
                disabled={isLoadingCoaches}
              />
              <Select
                label={t('filters.clubs')}
                value={calendarFilters.club}
                onChange={(e) =>
                  setCalendarFilters((prev) => ({ ...prev, club: e.target.value }))
                }
                options={[
                  { value: "all", label: t('filters.allClubs') },
                  ...clubNames.map((c) => ({ value: c, label: c })),
                ]}
                disabled={isLoadingCoaches}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => setCalendarFilters({ coach: "all", club: "all", type: "all" })}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={14} />
                {lang === 'kk' ? 'Сүзгілерді тазалау' : 'Сбросить фильтры'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-base font-semibold text-gray-900 capitalize">
            {currentDate.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {/* calendar grid */}
        <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 bg-gray-100 text-gray-500 text-xs font-semibold">
            {(t('calendar.weekdays').split(',')).map((d) => (
              <div key={d} className="py-2.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Object.keys(calendarData).length === 0 && (
              Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[68px] p-1.5 border border-gray-100 bg-white">
                  <Skeleton className="h-4 w-6 mb-1 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
              ))
            )}
            {Object.keys(calendarData).length > 0 && days.map((day, idx) => {
              const dateStr = day ? formatDate(day) : '';
              const dayLessons = day ? getLessonsForDate(dateStr) : [];
              const past = day ? isPastDate(dateStr) : false;
              const today = day ? isToday(dateStr) : false;
              
              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(dateStr)}
                  className={`min-h-[68px] p-1.5 border border-gray-100 cursor-pointer transition-all duration-200 ${
                    !day
                      ? "bg-gray-50"
                      : today
                      ? "bg-blue-50 ring-2 ring-blue-400 ring-inset"
                      : past
                      ? "bg-gray-100"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-xs font-semibold mb-1 ${
                          today
                            ? "text-blue-600"
                            : past
                            ? "text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayLessons
                          .slice(0, 2)
                          .map((les) => (
                            <div
                              key={les.id}
                              className={`text-[10px] text-white rounded px-1 py-0.5 truncate font-medium ${getLessonChipClass(les)}`}
                            >
                              {les.planned_start_time.slice(0, 5)}
                            </div>
                          ))}
                        {dayLessons.length > 2 && (
                          <p className="text-[10px] text-gray-500 font-medium">
                            +{dayLessons.length - 2}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span>{lang === 'kk' ? 'Жоспарланған' : 'Запланировано'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span>{lang === 'kk' ? 'Қазір жүріп жатыр' : 'В процессе'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
            <span>{lang === 'kk' ? 'Аяқталды' : 'Проведено'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span>{lang === 'kk' ? 'Бас тартылды' : 'Отменено'}</span>
          </div>
        </div>

        {/* Empty state when filters return no results */}
        {hasActiveFilters && !hasAnyLessons && Object.keys(calendarData).length > 0 && (
          <div className="mt-4 p-6 bg-gray-50 rounded-xl text-center">
            <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">
              {lang === 'kk' ? 'Ештеңе табылмады' : 'Ничего не найдено'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {lang === 'kk' ? 'Сүзгілерді өзгертіп көріңіз' : 'Попробуйте изменить фильтры'}
            </p>
            <button
              onClick={() => setCalendarFilters({ coach: "all", club: "all", type: "all" })}
              className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              {lang === 'kk' ? 'Сүзгілерді тазалау' : 'Сбросить фильтры'}
            </button>
          </div>
        )}

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
