import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Plus, CalendarDays, Clock, Loader2 } from 'lucide-react';
import { TrainerCalendarView } from './components/TrainerCalendarView';
import { TrainingFilters } from './components/TrainingFilters';
import { SelectedDateTrainings } from './components/SelectedDateTrainings';
import { CreateTrainingModal } from './components/CreateTrainingModal';
import { EditTrainingModal } from './components/EditTrainingModal';
import { TrainingDetailsModal } from './components/TrainingDetailsModal';
import { useTelegram } from '@/hooks/useTelegram';
import { clubsApi, sectionsApi, groupsApi, teamApi, scheduleApi, staffApi } from '@/functions/axios/axiosFunctions';
import type { Lesson, ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';
import type {
  Training,
  Filters,
  CreateTrainingData,
  UpdateTrainingData,
  Club,
  Section,
  Group,
  Trainer,
} from './types';

// Helper function to map API status to UI status
const mapApiStatusToTrainingStatus = (apiStatus: "scheduled" | "cancelled" | "completed", date: string, time: string, durationMinutes: number): Training['status'] => {
  if (apiStatus === 'cancelled' || apiStatus === 'completed') {
    return apiStatus;
  }
  
  const now = new Date();
  const trainingDateTime = new Date(`${date}T${time}`);
  const endTime = new Date(trainingDateTime.getTime() + durationMinutes * 60 * 1000);
  
  if (now >= trainingDateTime && now <= endTime) {
    return 'in_progress';
  } else if (now > endTime) {
    return 'completed';
  }
  
  return 'scheduled';
};

// Helper function to map UI status to API status
const mapTrainingStatusToApiStatus = (status: Training['status']): "scheduled" | "cancelled" | "completed" => {
  if (status === 'in_progress') {
    return 'scheduled'; // API doesn't have in_progress, map to scheduled
  }
  return status;
};

// Helper function to transform API Lesson to Training
const transformLessonToTraining = (lesson: Lesson, clubName: string): Training => {
  const status = mapApiStatusToTrainingStatus(
    lesson.status,
    lesson.effective_date,
    lesson.effective_start_time,
    lesson.duration_minutes
  );
  
  return {
    id: lesson.id,
    club_id: lesson.group?.section_id || 0,
    club_name: clubName,
    section_id: lesson.group?.section_id || 0,
    section_name: lesson.group?.name || '',
    group_id: lesson.group_id,
    group_name: lesson.group?.name,
    trainer_id: lesson.coach_id,
    trainer_name: `${lesson.coach?.first_name || ''} ${lesson.coach?.last_name || ''}`.trim(),
    date: lesson.effective_date,
    time: lesson.effective_start_time,
    duration: lesson.duration_minutes,
    location: lesson.location || '',
    max_participants: undefined,
    current_participants: 0,
    status,
    training_type: lesson.created_from_template ? 'recurring' : 'single',
    notes: lesson.notes,
    created_at: lesson.created_at,
    updated_at: lesson.updated_at,
  };
};

export default function StaffMainPage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [clubRoles, setClubRoles] = useState<ClubWithRole[]>([]);
  const [currentUser, setCurrentUser] = useState<CreateStaffResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    clubId: null,
    trainerId: null,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load current user
      const userResponse = await staffApi.getMe(initDataRaw);
      if (userResponse.data) {
        setCurrentUser(userResponse.data);
      }
      
      // Load clubs first to get club names for schedule
      let loadedClubs: Club[] = [];
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        setClubRoles(clubsResponse.data.clubs);
        loadedClubs = clubsResponse.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
        }));
        setClubs(loadedClubs);
      }

      // Load sections
      const sectionsResponse = await sectionsApi.getMy(initDataRaw);
      if (sectionsResponse.data) {
        const transformedSections: Section[] = sectionsResponse.data.map(s => ({
          id: s.id,
          name: s.name,
          club_id: s.club_id,
          coach_id: s.coach_id,
        }));
        setSections(transformedSections);
      }

      // Load groups
      const groupsResponse = await groupsApi.getMy(initDataRaw);
      if (groupsResponse.data) {
        const transformedGroups: Group[] = groupsResponse.data.map(g => ({
          id: g.id,
          name: g.name,
          section_id: g.section_id,
        }));
        setGroups(transformedGroups);
      }

      // Load team (trainers)
      const teamResponse = await teamApi.get(initDataRaw);
      if (teamResponse.data?.staff_members) {
        const transformedTrainers: Trainer[] = teamResponse.data.staff_members
          .filter(member => member.clubs_and_roles.some(cr => cr.role === 'coach'))
          .map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`.trim(),
            club_id: member.clubs_and_roles[0]?.club_id || 0,
          }));
        setTrainers(transformedTrainers);
      }

      // Load schedule for current week
      const today = new Date().toISOString().split('T')[0];
      const scheduleResponse = await scheduleApi.getWeekSchedule(today, initDataRaw);
      if (scheduleResponse.data?.days) {
        const allLessons: Training[] = [];
        const clubNameMap = new Map(loadedClubs.map(c => [c.id, c.name]));
        
        scheduleResponse.data.days.forEach(day => {
          day.lessons.forEach(lesson => {
            const clubName = clubNameMap.get(lesson.group_id) || 'Клуб';
            allLessons.push(transformLessonToTraining(lesson, clubName));
          });
        });
        
        setTrainings(allLessons);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initDataRaw]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update training statuses based on current time
  useEffect(() => {
    const updateStatuses = () => {
      setTrainings((prevTrainings) =>
        prevTrainings.map((training) => {
          const trainingDateTime = new Date(`${training.date}T${training.time}`);
          const now = new Date();
          const endTime = new Date(
            trainingDateTime.getTime() + training.duration * 60 * 1000
          );

          if (training.status === 'cancelled' || training.status === 'completed') {
            return training;
          }

          let newStatus: Training['status'] = training.status;
          if (now >= trainingDateTime && now <= endTime) {
            newStatus = 'in_progress';
          } else if (now > endTime) {
            newStatus = 'completed';
          }

          if (newStatus !== training.status) {
            return { ...training, status: newStatus };
          }
          return training;
        })
      );
    };

    updateStatuses();
    const interval = setInterval(updateStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter trainings
  const filteredTrainings = useMemo(() => {
    let filtered = trainings;

    if (filters.clubId !== null) {
      filtered = filtered.filter((t) => t.club_id === filters.clubId);
    }

    if (filters.trainerId !== null) {
      filtered = filtered.filter((t) => t.trainer_id === filters.trainerId);
    }

    return filtered;
  }, [trainings, filters]);

  // Get trainings for selected date
  const selectedDateTrainings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return filteredTrainings
      .filter((t) => t.date === dateStr)
      .sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  }, [selectedDate, filteredTrainings]);

  // Next upcoming training
  const nextTraining = useMemo(() => {
    const now = new Date();
    const upcoming = filteredTrainings
      .filter(t => {
        if (t.status === 'cancelled' || t.status === 'completed') return false;
        const trainingDate = new Date(`${t.date}T${t.time}`);
        return trainingDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    return upcoming[0] || null;
  }, [filteredTrainings]);

  const handleCreateTraining = async (data: CreateTrainingData) => {
    if (!initDataRaw) return;

    try {
      // Create lesson via API
      const response = await scheduleApi.createManualLesson({
        group_id: data.group_id || data.section_id,
        planned_date: data.date,
        planned_start_time: data.time,
        duration_minutes: data.duration,
        coach_id: data.trainer_id,
        location: data.location,
        notes: data.notes || '',
      }, initDataRaw);

      if (response.data) {
        const newTraining = transformLessonToTraining(
          response.data as unknown as Lesson,
          clubs.find(c => c.id === data.club_id)?.name || ''
        );
        newTraining.club_id = data.club_id;
        newTraining.section_id = data.section_id;
        newTraining.section_name = sections.find(s => s.id === data.section_id)?.name || '';
        
        setTrainings([...trainings, newTraining]);
      }
    } catch (error) {
      console.error('Error creating training:', error);
      // Fallback to local creation
      const newTraining: Training = {
        id: Math.max(...trainings.map((t) => t.id), 0) + 1,
        club_id: data.club_id,
        club_name: clubs.find((c) => c.id === data.club_id)?.name || '',
        section_id: data.section_id,
        section_name: sections.find((s) => s.id === data.section_id)?.name || '',
        group_id: data.group_id,
        group_name: data.group_id
          ? groups.find((g) => g.id === data.group_id)?.name
          : undefined,
        trainer_id: data.trainer_id,
        trainer_name: trainers.find((t) => t.id === data.trainer_id)?.name || '',
        date: data.date,
        time: data.time,
        duration: data.duration,
        location: data.location,
        max_participants: data.max_participants,
        current_participants: 0,
        status: 'scheduled',
        training_type: 'single',
        notes: data.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTrainings([...trainings, newTraining]);
    }
    
    setShowCreateModal(false);
    setSelectedDate(new Date(data.date));
  };

  const handleUpdateTraining = async (
    data: UpdateTrainingData,
    changeType?: 'single' | 'series'
  ) => {
    if (!selectedTraining || !initDataRaw) {
      // Local update as fallback
      setTrainings((prevTrainings) =>
        prevTrainings.map((training) => {
          if (training.id === selectedTraining?.id) {
            return {
              ...training,
              ...data,
              updated_at: new Date().toISOString(),
            };
          }
          return training;
        })
      );
      setShowEditModal(false);
      setSelectedTraining(null);
      return;
    }

    try {
      const apiStatus = mapTrainingStatusToApiStatus(data.status || selectedTraining.status);
      await scheduleApi.updateLesson(selectedTraining.id, {
        planned_date: data.date || selectedTraining.date,
        planned_start_time: data.time || selectedTraining.time,
        actual_date: data.date || selectedTraining.date,
        actual_start_time: data.time || selectedTraining.time,
        duration_minutes: selectedTraining.duration,
        status: apiStatus,
        coach_id: data.trainer_id || selectedTraining.trainer_id,
        location: selectedTraining.location,
        notes: selectedTraining.notes || '',
      }, initDataRaw);

      // Update local state
      setTrainings((prevTrainings) =>
        prevTrainings.map((training) => {
          if (training.id === selectedTraining.id) {
            const updated = {
              ...training,
              ...data,
              updated_at: new Date().toISOString(),
            };

            if (changeType === 'single' && training.training_type === 'recurring') {
              updated.training_type = 'single';
            }
            return updated;
          }

          if (
            changeType === 'series' &&
            training.training_type === 'recurring' &&
            training.section_id === selectedTraining.section_id &&
            training.time === selectedTraining.time
          ) {
            return {
              ...training,
              ...data,
              updated_at: new Date().toISOString(),
            };
          }

          return training;
        })
      );
    } catch (error) {
      console.error('Error updating training:', error);
    }

    setShowEditModal(false);
    setSelectedTraining(null);
  };

  const handleCancelTraining = async (changeType?: 'single' | 'series') => {
    if (!selectedTraining) return;

    if (initDataRaw) {
      try {
        await scheduleApi.cancelLesson(selectedTraining.id, { reason: 'Cancelled by trainer' }, initDataRaw);
      } catch (error) {
        console.error('Error cancelling training:', error);
      }
    }

    setTrainings((prevTrainings) =>
      prevTrainings.map((training) => {
        if (training.id === selectedTraining.id) {
          const updated = {
            ...training,
            status: 'cancelled' as const,
            updated_at: new Date().toISOString(),
          };

          if (changeType === 'single' && training.training_type === 'recurring') {
            updated.training_type = 'single';
          }
          return updated;
        }

        if (
          changeType === 'series' &&
          training.training_type === 'recurring' &&
          training.section_id === selectedTraining.section_id &&
          training.time === selectedTraining.time
        ) {
          return {
            ...training,
            status: 'cancelled' as const,
            updated_at: new Date().toISOString(),
          };
        }

        return training;
      })
    );

    setShowEditModal(false);
    setSelectedTraining(null);
  };

  const handleTrainingClick = (training: Training) => {
    setSelectedTraining(training);
    setShowDetailsModal(true);
  };

  const handleEditFromDetails = (training: Training) => {
    setSelectedTraining(training);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const formatNextTrainingTime = () => {
    if (!nextTraining) return null;
    const date = new Date(`${nextTraining.date}T${nextTraining.time}`);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `через ${diffMins} мин`;
    if (diffMins < 1440) return `через ${Math.floor(diffMins / 60)} ч`;
    return `через ${Math.floor(diffMins / 1440)} дн`;
  };

  if (loading) {
    return (
      <Layout title={t('nav.home')}>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.home')}>
      <PageContainer className="pb-24">

        {/* Next Training Card */}
        {nextTraining && (
          <button
            onClick={() => handleTrainingClick(nextTraining)}
            className="w-full mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium">{formatNextTrainingTime()}</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{nextTraining.section_name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{nextTraining.time}</span>
              <span>•</span>
              <span>{nextTraining.trainer_name}</span>
              {nextTraining.max_participants && (
                <>
                  <span>•</span>
                  <span>{nextTraining.current_participants}/{nextTraining.max_participants}</span>
                </>
              )}
            </div>
          </button>
        )}

        {/* Filters */}
        <TrainingFilters
          clubs={clubs}
          trainers={trainers}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Calendar */}
        <TrainerCalendarView
          trainings={filteredTrainings}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onTrainingClick={handleTrainingClick}
        />

        {/* Empty State */}
        {filteredTrainings.length === 0 && (
          <div className="text-center py-8 mt-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">{t('training.noTrainingsFound')}</p>
            <p className="text-sm text-gray-400">Измените фильтры или добавьте тренировку</p>
          </div>
        )}

        {/* FAB - Add Training Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all z-10"
        >
          <Plus size={28} />
        </button>

        {/* Selected Date Trainings Modal */}
        {selectedDate && (
          <SelectedDateTrainings
            date={selectedDate}
            trainings={selectedDateTrainings}
            onClose={() => setSelectedDate(null)}
            onTrainingClick={handleTrainingClick}
          />
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateTrainingModal
            clubs={clubs}
            sections={sections}
            groups={groups}
            trainers={trainers}
            clubRoles={clubRoles}
            currentUser={currentUser}
            selectedDate={selectedDate?.toISOString().split('T')[0]}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTraining}
          />
        )}

        {showEditModal && selectedTraining && (
          <EditTrainingModal
            training={selectedTraining}
            trainers={trainers}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTraining(null);
            }}
            onSave={handleUpdateTraining}
            onCancel={handleCancelTraining}
          />
        )}

        {showDetailsModal && selectedTraining && (
          <TrainingDetailsModal
            training={selectedTraining}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedTraining(null);
            }}
            onEdit={handleEditFromDetails}
            onCreateNew={() => {
              setShowDetailsModal(false);
              setShowCreateModal(true);
            }}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
