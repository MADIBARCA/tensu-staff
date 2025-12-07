import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Filter, List, CalendarDays, X } from 'lucide-react';
import { TrainingCard } from './components/TrainingCard';
import { CalendarView } from './components/CalendarView';
import { FiltersModal } from './components/FiltersModal';
import { NoMembershipModal } from './components/NoMembershipModal';
import { ParticipantsModal } from './components/ParticipantsModal';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API calls
      // const trainingsResponse = await scheduleApi.getTrainings(token);
      // const clubsResponse = await clubsApi.getAll(token);
      // const trainersResponse = await trainersApi.getAll(token);

      // Mock clubs
      const mockClubs: Club[] = [
        { id: 1, name: 'Спортивный клуб "Чемпион"' },
        { id: 2, name: 'Фитнес центр "Сила"' },
        { id: 3, name: 'Бассейн "Волна"' },
      ];

      // Mock trainers
      const mockTrainers: Trainer[] = [
        { id: 1, name: 'Александр Петров', club_id: 1 },
        { id: 2, name: 'Мария Иванова', club_id: 2 },
        { id: 3, name: 'Дмитрий Сидоров', club_id: 1 },
        { id: 4, name: 'Елена Козлова', club_id: 3 },
      ];

      // Mock trainings
      const today = new Date();
      const mockTrainings: Training[] = [
        {
          id: 1,
          section_name: 'Футбол',
          group_name: 'Группа А',
          trainer_name: 'Александр Петров',
          trainer_id: 1,
          club_id: 1,
          club_name: 'Спортивный клуб "Чемпион"',
          date: formatDate(today),
          time: '18:00',
          location: 'Зал 1, ул. Абая 150',
          max_participants: 15,
          current_participants: 12,
          participants: ['Иван И.', 'Петр П.', 'Сергей С.', 'Андрей А.', 'Николай Н.', 'Алексей А.', 'Михаил М.', 'Владимир В.', 'Евгений Е.', 'Дмитрий Д.', 'Артем А.', 'Максим М.'],
          notes: 'Принести форму и бутсы',
          is_booked: true,
          is_in_waitlist: false,
        },
        {
          id: 2,
          section_name: 'Йога',
          group_name: 'Утренняя группа',
          trainer_name: 'Мария Иванова',
          trainer_id: 2,
          club_id: 2,
          club_name: 'Фитнес центр "Сила"',
          date: formatDate(addDays(today, 1)),
          time: '09:00',
          location: 'Зал йоги, пр. Достык 240',
          max_participants: 20,
          current_participants: 18,
          participants: [],
          notes: 'Коврики предоставляются',
          is_booked: false,
          is_in_waitlist: false,
        },
        {
          id: 3,
          section_name: 'Баскетбол',
          group_name: 'Продвинутые',
          trainer_name: 'Дмитрий Сидоров',
          trainer_id: 3,
          club_id: 1,
          club_name: 'Спортивный клуб "Чемпион"',
          date: formatDate(addDays(today, 2)),
          time: '19:30',
          location: 'Большой зал, ул. Абая 150',
          max_participants: 10,
          current_participants: 10,
          participants: [],
          is_booked: false,
          is_in_waitlist: false,
        },
        {
          id: 4,
          section_name: 'Плавание',
          group_name: 'Взрослые',
          trainer_name: 'Елена Козлова',
          trainer_id: 4,
          club_id: 3,
          club_name: 'Бассейн "Волна"',
          date: formatDate(addDays(today, 3)),
          time: '07:00',
          location: 'Бассейн, ул. Жандосова 58',
          max_participants: 8,
          current_participants: 5,
          participants: [],
          notes: 'Шапочка обязательна',
          is_booked: false,
          is_in_waitlist: false,
        },
        {
          id: 5,
          section_name: 'Футбол',
          group_name: 'Группа Б',
          trainer_name: 'Александр Петров',
          trainer_id: 1,
          club_id: 1,
          club_name: 'Спортивный клуб "Чемпион"',
          date: formatDate(addDays(today, 5)),
          time: '17:00',
          location: 'Зал 2, ул. Абая 150',
          max_participants: 15,
          current_participants: 8,
          participants: [],
          is_booked: false,
          is_in_waitlist: false,
        },
        {
          id: 6,
          section_name: 'Пилатес',
          trainer_name: 'Мария Иванова',
          trainer_id: 2,
          club_id: 2,
          club_name: 'Фитнес центр "Сила"',
          date: formatDate(addDays(today, 7)),
          time: '11:00',
          location: 'Зал пилатеса, пр. Достык 240',
          max_participants: 12,
          current_participants: 6,
          participants: [],
          is_booked: false,
          is_in_waitlist: false,
        },
        // Add more trainings for calendar view
        ...generateCalendarTrainings(today),
      ];

      setClubs(mockClubs);
      setTrainers(mockTrainers);
      setTrainings(mockTrainings);
      setHasActiveMembership(true); // Mock: user has membership
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(t('schedule.error'));
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function generateCalendarTrainings(startDate: Date): Training[] {
    const trainings: Training[] = [];
    for (let i = 8; i <= 25; i += 3) {
      const date = addDays(startDate, i);
      trainings.push({
        id: 100 + i,
        section_name: i % 2 === 0 ? 'Футбол' : 'Йога',
        trainer_name: i % 2 === 0 ? 'Александр Петров' : 'Мария Иванова',
        trainer_id: i % 2 === 0 ? 1 : 2,
        club_id: i % 2 === 0 ? 1 : 2,
        club_name: i % 2 === 0 ? 'Спортивный клуб "Чемпион"' : 'Фитнес центр "Сила"',
        date: formatDate(date),
        time: i % 2 === 0 ? '18:00' : '10:00',
        location: i % 2 === 0 ? 'Зал 1' : 'Зал йоги',
        max_participants: 15,
        current_participants: Math.floor(Math.random() * 10) + 3,
        participants: [],
        is_booked: false,
        is_in_waitlist: false,
      });
    }
    return trainings;
  }

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
