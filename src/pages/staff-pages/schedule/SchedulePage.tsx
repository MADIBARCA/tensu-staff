import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Filter, List, CalendarDays, X } from 'lucide-react';
import { TrainingCard } from './components/TrainingCard';
import { CalendarView } from './components/CalendarView';
import { FiltersModal } from './components/FiltersModal';
import { NoMembershipModal } from './components/NoMembershipModal';
import { ParticipantsModal } from './components/ParticipantsModal';
import { useTelegram } from '@/hooks/useTelegram';
import { clubsApi, teamApi, scheduleApi, staffApi } from '@/functions/axios/axiosFunctions';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

export interface Training {
  id: number;
  section_name: string;
  group_name?: string;
  coach_name: string;
  coach_id: number;
  club_id: number;
  club_name: string;
  date: string;
  time: string;
  location: string;
  max_participants: number;
  current_participants: number;
  participants?: string[];
  notes?: string;
  is_booked: boolean;
  is_in_waitlist: boolean;
}

export interface Club {
  id: number;
  name: string;
}

export interface Trainer {
  id: number;
  name: string;
  club_id: number;
}

export interface Filters {
  clubId: number | null;
  sectionsType: 'all' | 'my';
  coachId: number | null;
}

export default function SchedulePage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [coaches, setCoaches] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveMembership, setHasActiveMembership] = useState(true);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    clubId: null,
    sectionsType: 'all',
    coachId: null,
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Modals
  const [showNoMembershipModal, setShowNoMembershipModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Calendar
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadingLessons, setLoadingLessons] = useState(false);
  const loadedClubsRef = useRef<Club[]>([]);
  const clubRolesRef = useRef<ClubWithRole[]>([]);
  const currentUserRef = useRef<CreateStaffResponse | null>(null);

  // Helper to check if user can see a lesson based on their role
  const canUserSeeLessonForClub = useCallback((clubId: number, coachId: number): boolean => {
    const roles = clubRolesRef.current;
    const user = currentUserRef.current;
    
    if (!user) return false;
    
    // Find user's role in this club
    const clubRole = roles.find(cr => cr.club.id === clubId);
    
    if (!clubRole) return false; // User has no role in this club
    
    // Owner or admin can see all lessons in the club
    if (clubRole.role === 'owner' || clubRole.role === 'admin') {
      return true;
    }
    
    // Coach can only see their own lessons
    if (clubRole.role === 'coach') {
      return coachId === user.id;
    }
    
    return false;
  }, []);

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Load lessons for a specific month
  const loadLessonsForMonth = useCallback(async (targetMonth: Date) => {
    if (!initDataRaw) return;

    setLoadingLessons(true);
    try {
      // Get first and last day of month with buffer for surrounding weeks
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth();
      
      // Start from first day of previous month (to cover prev week overflow)
      const startDate = new Date(year, month - 1, 1);
      // End at last day of next month (to cover next week overflow)
      const endDate = new Date(year, month + 2, 0);

      const clubNameMap = new Map(loadedClubsRef.current.map(c => [c.id, c.name]));

      // Use getLessons API with date range
      const lessonsResponse = await scheduleApi.getLessons({
        page: 1,
        size: 50,
        date_from: formatDate(startDate),
        date_to: formatDate(endDate),
      }, initDataRaw);

      if (lessonsResponse.data?.lessons) {
        const allTrainings: Training[] = lessonsResponse.data.lessons
          .filter(lesson => {
            const clubId = lesson.group?.section?.club_id || 0;
            return canUserSeeLessonForClub(clubId, lesson.coach_id);
          })
          .map(lesson => ({
            id: lesson.id,
            section_name: lesson.group?.section?.name || lesson.group?.name || '',
            group_name: lesson.group?.name,
            coach_name: `${lesson.coach?.first_name || ''} ${lesson.coach?.last_name || ''}`.trim(),
            coach_id: lesson.coach_id,
            club_id: lesson.group?.section?.club_id || 0,
            club_name: clubNameMap.get(lesson.group?.section?.club_id || 0) || 'Клуб',
            date: lesson.effective_date || lesson.planned_date,
            time: lesson.effective_start_time || lesson.planned_start_time,
            location: lesson.location || '',
            max_participants: lesson.group?.capacity || 15,
            current_participants: 0,
            participants: [],
            notes: lesson.notes,
            is_booked: false,
            is_in_waitlist: false,
          }));

        setTrainings(allTrainings);
      }
    } catch (err) {
      console.error('Failed to load lessons for month:', err);
    } finally {
      setLoadingLessons(false);
    }
  }, [initDataRaw, canUserSeeLessonForClub]);

  // Handle calendar month change
  const handleMonthChange = useCallback((newMonth: Date) => {
    setCurrentMonth(newMonth);
    loadLessonsForMonth(newMonth);
  }, [loadLessonsForMonth]);

  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load current user first
      const userResponse = await staffApi.getMe(initDataRaw);
      if (userResponse.data) {
        currentUserRef.current = userResponse.data;
      }

      // Load clubs with roles
      let loadedClubs: Club[] = [];
      let loadedClubRoles: ClubWithRole[] = [];
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        loadedClubRoles = clubsResponse.data.clubs;
        clubRolesRef.current = loadedClubRoles;
        
        loadedClubs = clubsResponse.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
        }));
        setClubs(loadedClubs);
        loadedClubsRef.current = loadedClubs;
      }

      // Load coaches
      const teamResponse = await teamApi.get(initDataRaw);
      if (teamResponse.data?.staff_members) {
        const loadedCoaches: Trainer[] = teamResponse.data.staff_members
          .filter(member => member.clubs_and_roles.some(cr => cr.role === 'coach'))
          .map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`.trim(),
            club_id: member.clubs_and_roles[0]?.club_id || 0,
          }));
        setCoaches(loadedCoaches);
      }

      // Load lessons for current month (3 months range)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

      const clubNameMap = new Map(loadedClubs.map(c => [c.id, c.name]));

      const lessonsResponse = await scheduleApi.getLessons({
        page: 1,
        size: 50,
        date_from: formatDate(startDate),
        date_to: formatDate(endDate),
      }, initDataRaw);

      if (lessonsResponse.data?.lessons) {
        // Helper to check if user can see a lesson
        const canSeeLessonLocal = (clubId: number, coachId: number): boolean => {
          const user = userResponse.data;
          if (!user) return false;
          
          const clubRole = loadedClubRoles.find(cr => cr.club.id === clubId);
          if (!clubRole) return false;
          
          if (clubRole.role === 'owner' || clubRole.role === 'admin') {
            return true;
          }
          
          if (clubRole.role === 'coach') {
            return coachId === user.id;
          }
          
          return false;
        };

        const allTrainings: Training[] = lessonsResponse.data.lessons
          .filter(lesson => {
            const clubId = lesson.group?.section?.club_id || 0;
            return canSeeLessonLocal(clubId, lesson.coach_id);
          })
          .map(lesson => ({
            id: lesson.id,
            section_name: lesson.group?.section?.name || lesson.group?.name || '',
            group_name: lesson.group?.name,
            coach_name: `${lesson.coach?.first_name || ''} ${lesson.coach?.last_name || ''}`.trim(),
            coach_id: lesson.coach_id,
            club_id: lesson.group?.section?.club_id || 0,
            club_name: clubNameMap.get(lesson.group?.section?.club_id || 0) || 'Клуб',
            date: lesson.effective_date || lesson.planned_date,
            time: lesson.effective_start_time || lesson.planned_start_time,
            location: lesson.location || '',
            max_participants: lesson.group?.capacity || 15,
            current_participants: 0,
            participants: [],
            notes: lesson.notes,
            is_booked: false,
            is_in_waitlist: false,
          }));

        setTrainings(allTrainings);
      }
      
      setHasActiveMembership(true);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(t('schedule.error'));
    } finally {
      setLoading(false);
    }
  }, [initDataRaw, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter trainings
  const filteredTrainings = useMemo(() => {
    let result = [...trainings];

    if (filters.clubId) {
      result = result.filter(t => t.club_id === filters.clubId);
    }

    if (filters.coachId) {
      result = result.filter(t => t.coach_id === filters.coachId);
    }

    // Sort by date and time
    result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return result;
  }, [trainings, filters]);

  // Get upcoming trainings for list view (max 3)
  const upcomingTrainings = useMemo(() => {
    const today = formatDate(new Date());
    return filteredTrainings
      .filter(t => t.date >= today)
      .slice(0, 3);
  }, [filteredTrainings]);

  // Get trainings for selected date in calendar
  const selectedDateTrainings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = formatDate(selectedDate);
    return filteredTrainings.filter(t => t.date === dateStr);
  }, [filteredTrainings, selectedDate]);

  // Get dates with trainings for calendar
  const trainingDates = useMemo(() => {
    return new Set(filteredTrainings.map(t => t.date));
  }, [filteredTrainings]);

  // Actions
  const handleBook = (trainingId: number) => {
    if (!hasActiveMembership) {
      setShowNoMembershipModal(true);
      return;
    }

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          is_booked: true,
          current_participants: t.current_participants + 1,
          participants: [...(t.participants || []), 'Вы'],
        };
      }
      return t;
    }));
  };

  const handleCancelBooking = (trainingId: number) => {
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;

    // Check if less than 1 hour before training
    const trainingDateTime = new Date(`${training.date}T${training.time}`);
    const now = new Date();
    const hoursDiff = (trainingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      alert(t('schedule.cancelTooLate'));
      return;
    }

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return {
          ...t,
          is_booked: false,
          current_participants: Math.max(0, t.current_participants - 1),
          participants: (t.participants || []).filter(p => p !== 'Вы'),
        };
      }
      return t;
    }));
  };

  const handleWaitlist = (trainingId: number) => {
    if (!hasActiveMembership) {
      setShowNoMembershipModal(true);
      return;
    }

    setTrainings(prev => prev.map(t => {
      if (t.id === trainingId) {
        return { ...t, is_in_waitlist: true };
      }
      return t;
    }));
  };

  const handleShowParticipants = (training: Training) => {
    setSelectedTraining(training);
    setShowParticipantsModal(true);
  };

  const activeFiltersCount = [
    filters.clubId,
    filters.sectionsType !== 'all',
    filters.coachId,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <Layout title={t('nav.schedule')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t('nav.schedule')}>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              {t('common.retry')}
            </button>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.schedule')}>
      <PageContainer>
        {/* Tabs and Filter Button */}
        <div className="flex items-center justify-between mb-4">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={18} />
              {t('schedule.tabs.list')}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays size={18} />
              {t('schedule.tabs.calendar')}
            </button>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} className="text-gray-600" />
            <span className="text-sm text-gray-700">{t('schedule.filters')}</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.clubId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {clubs.find(c => c.id === filters.clubId)?.name}
                <button
                  onClick={() => setFilters(f => ({ ...f, clubId: null }))}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.coachId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {coaches.find(t => t.id === filters.coachId)?.name}
                <button
                  onClick={() => setFilters(f => ({ ...f, coachId: null }))}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.sectionsType === 'my' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {t('schedule.filters.mySections')}
                <button
                  onClick={() => setFilters(f => ({ ...f, sectionsType: 'all' }))}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'list' ? (
          <div className="space-y-3">
            {upcomingTrainings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">{t('schedule.noTrainings')}</p>
              </div>
            ) : (
              upcomingTrainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  onBook={() => handleBook(training.id)}
                  onCancelBooking={() => handleCancelBooking(training.id)}
                  onWaitlist={() => handleWaitlist(training.id)}
                  onShowParticipants={() => handleShowParticipants(training)}
                />
              ))
            )}
          </div>
        ) : (
          <CalendarView
            trainings={filteredTrainings}
            trainingDates={trainingDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedDateTrainings={selectedDateTrainings}
            onBook={handleBook}
            onCancelBooking={handleCancelBooking}
            onWaitlist={handleWaitlist}
            onShowParticipants={handleShowParticipants}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            loadingLessons={loadingLessons}
          />
        )}

        {/* Modals */}
        {showFiltersModal && (
          <FiltersModal
            clubs={clubs}
            coaches={coaches}
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFiltersModal(false)}
          />
        )}

        {showNoMembershipModal && (
          <NoMembershipModal onClose={() => setShowNoMembershipModal(false)} />
        )}

        {showParticipantsModal && selectedTraining && (
          <ParticipantsModal
            training={selectedTraining}
            onClose={() => {
              setShowParticipantsModal(false);
              setSelectedTraining(null);
            }}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
