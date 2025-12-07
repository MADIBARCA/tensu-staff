import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Filter, List, CalendarDays, X, Loader2 } from 'lucide-react';
import { TrainingCard } from './components/TrainingCard';
import { CalendarView } from './components/CalendarView';
import { FiltersModal } from './components/FiltersModal';
import { NoMembershipModal } from './components/NoMembershipModal';
import { ParticipantsModal } from './components/ParticipantsModal';
import { useTelegram } from '@/hooks/useTelegram';
import { clubsApi, teamApi, scheduleApi } from '@/functions/axios/axiosFunctions';

export interface Training {
  id: number;
  section_name: string;
  group_name?: string;
  trainer_name: string;
  trainer_id: number;
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
  trainerId: number | null;
}

export default function SchedulePage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveMembership, setHasActiveMembership] = useState(true);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    clubId: null,
    sectionsType: 'all',
    trainerId: null,
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Modals
  const [showNoMembershipModal, setShowNoMembershipModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Calendar
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load clubs
      let loadedClubs: Club[] = [];
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        loadedClubs = clubsResponse.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
        }));
        setClubs(loadedClubs);
      }

      // Load trainers
      const teamResponse = await teamApi.get(initDataRaw);
      if (teamResponse.data?.staff_members) {
        const loadedTrainers: Trainer[] = teamResponse.data.staff_members
          .filter(member => member.clubs_and_roles.some(cr => cr.role === 'coach'))
          .map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`.trim(),
            club_id: member.clubs_and_roles[0]?.club_id || 0,
          }));
        setTrainers(loadedTrainers);
      }

      // Load schedule
      const today = formatDate(new Date());
      const scheduleResponse = await scheduleApi.getWeekSchedule(today, initDataRaw);
      if (scheduleResponse.data?.days) {
        const clubNameMap = new Map(loadedClubs.map(c => [c.id, c.name]));
        const allTrainings: Training[] = [];
        
        scheduleResponse.data.days.forEach(day => {
          day.lessons.forEach(lesson => {
            allTrainings.push({
              id: lesson.id,
              section_name: lesson.group?.name || '',
              group_name: lesson.group?.name,
              trainer_name: `${lesson.coach?.first_name || ''} ${lesson.coach?.last_name || ''}`.trim(),
              trainer_id: lesson.coach_id,
              club_id: lesson.group?.section_id || 0,
              club_name: clubNameMap.get(lesson.group?.section_id || 0) || 'Клуб',
              date: lesson.effective_date,
              time: lesson.effective_start_time,
              location: lesson.location || '',
              max_participants: 15,
              current_participants: 0,
              participants: [],
              notes: lesson.notes,
              is_booked: false,
              is_in_waitlist: false,
            });
          });
        });
        
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

    if (filters.trainerId) {
      result = result.filter(t => t.trainer_id === filters.trainerId);
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
    filters.trainerId,
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
            {filters.trainerId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {trainers.find(t => t.id === filters.trainerId)?.name}
                <button
                  onClick={() => setFilters(f => ({ ...f, trainerId: null }))}
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
          />
        )}

        {/* Modals */}
        {showFiltersModal && (
          <FiltersModal
            clubs={clubs}
            trainers={trainers}
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
