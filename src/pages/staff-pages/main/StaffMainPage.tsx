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

// Format time to HH:mm (remove seconds if present)
const formatTimeString = (time: string): string => {
  if (!time) return '';
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

// Helper function to transform API Lesson to Training
const transformLessonToTraining = (lesson: Lesson, clubName: string, sectionNameMap: Map<number, string>): Training => {
  const status = mapApiStatusToTrainingStatus(
    lesson.status,
    lesson.effective_date,
    lesson.effective_start_time,
    lesson.duration_minutes
  );
  
  const sectionId = lesson.group?.section_id || 0;
  const sectionName = sectionNameMap.get(sectionId) || '';
  
  return {
    id: lesson.id,
    club_id: sectionId,
    club_name: clubName,
    section_id: sectionId,
    section_name: sectionName,
    group_id: lesson.group_id,
    group_name: lesson.group?.name,
    coach_id: lesson.coach_id,
    coach_name: `${lesson.coach?.first_name || ''} ${lesson.coach?.last_name || ''}`.trim(),
    date: lesson.effective_date,
    time: formatTimeString(lesson.effective_start_time),
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
  const [coaches, setCoaches] = useState<Trainer[]>([]);
  const [clubRoles, setClubRoles] = useState<ClubWithRole[]>([]);
  const [currentUser, setCurrentUser] = useState<CreateStaffResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    clubId: null,
    coachId: null,
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
      let transformedSections: Section[] = [];
      const sectionsResponse = await sectionsApi.getMy(initDataRaw);
      if (sectionsResponse.data) {
        transformedSections = sectionsResponse.data.map(s => ({
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

      // Load team (coaches)
      const teamResponse = await teamApi.get(initDataRaw);
      if (teamResponse.data?.staff_members) {
        const transformedCoaches: Trainer[] = teamResponse.data.staff_members
          .filter(member => member.clubs_and_roles.some(cr => cr.role === 'coach'))
          .map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`.trim(),
            club_id: member.clubs_and_roles[0]?.club_id || 0,
          }));
        setCoaches(transformedCoaches);
      }

      // Load schedule for 3 months (current + 2 months ahead)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      const lessonsResponse = await scheduleApi.getLessons({
        page: 1,
        size: 50,
        date_from: formatDate(startDate),
        date_to: formatDate(endDate),
      }, initDataRaw);
      
      if (lessonsResponse.data?.lessons) {
        const allLessons: Training[] = [];
        const clubNameMap = new Map(loadedClubs.map(c => [c.id, c.name]));
        // Create section name map from sections response data
        const sectionNameMap = new Map(
          (sectionsResponse.data || []).map(s => [s.id, s.name] as [number, string])
        );
        
        // Helper to check if user can see a lesson based on their role
        const canSeeLessonLocal = (clubId: number, coachId: number): boolean => {
          const user = userResponse.data;
          if (!user) return false;
          
          // Find user's role in this club from loaded club roles
          const clubRole = (clubsResponse.data?.clubs || []).find(cr => cr.club.id === clubId);
          if (!clubRole) return false;
          
          // Owner or admin can see all lessons in the club
          if (clubRole.role === 'owner' || clubRole.role === 'admin') {
            return true;
          }
          
          // Coach can only see their own lessons
          if (clubRole.role === 'coach') {
            return coachId === user.id;
          }
          
          return false;
        };
        
        lessonsResponse.data.lessons.forEach(lesson => {
          // Get club name from group's section
          const sectionId = lesson.group?.section_id;
          const section = (sectionsResponse.data || []).find(s => s.id === sectionId);
          const clubId = section?.club_id || 0;
          
          // Filter lessons based on user's role
          if (canSeeLessonLocal(clubId, lesson.coach_id)) {
            const clubName = clubNameMap.get(clubId) || 'Клуб';
            allLessons.push(transformLessonToTraining(lesson, clubName, sectionNameMap));
          }
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

    if (filters.coachId !== null) {
      filtered = filtered.filter((t) => t.coach_id === filters.coachId);
    }

    return filtered;
  }, [trainings, filters]);

  // Get trainings for selected date
  const selectedDateTrainings = useMemo(() => {
    if (!selectedDate) return [];
    // Format date as YYYY-MM-DD without timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
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
    if (!initDataRaw) {
      window.Telegram?.WebApp?.showAlert(t('training.errors.createFailed') || 'Не удалось создать тренировку');
      return;
    }

    try {
      // Create lesson via API
      const response = await scheduleApi.createManualLesson({
        group_id: data.group_id || data.section_id,
        planned_date: data.date,
        planned_start_time: data.time,
        duration_minutes: data.duration,
        coach_id: data.coach_id,
        location: data.location,
        notes: data.notes || '',
      }, initDataRaw);

      if (response.data) {
        const sectionNameMap = new Map(sections.map(s => [s.id, s.name]));
        const newTraining = transformLessonToTraining(
          response.data as unknown as Lesson,
          clubs.find(c => c.id === data.club_id)?.name || '',
          sectionNameMap
        );
        newTraining.club_id = data.club_id;
        newTraining.section_id = data.section_id;
        newTraining.section_name = sections.find(s => s.id === data.section_id)?.name || '';
        
        setTrainings([...trainings, newTraining]);
        
        // Success - close modal and show date
        setShowCreateModal(false);
        setSelectedDate(new Date(data.date));
        window.Telegram?.WebApp?.showAlert(t('training.created') || 'Тренировка создана');
      } else {
        // No data in response - show error
        window.Telegram?.WebApp?.showAlert(t('training.errors.createFailed') || 'Не удалось создать тренировку');
      }
    } catch (error) {
      console.error('Error creating training:', error);
      // Show error message instead of success
      window.Telegram?.WebApp?.showAlert(t('training.errors.createFailed') || 'Не удалось создать тренировку. Попробуйте позже.');
    }
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
        duration_minutes: data.duration ?? selectedTraining.duration,
        status: apiStatus,
        coach_id: data.coach_id || selectedTraining.coach_id,
        location: data.location ?? selectedTraining.location,
        notes: data.notes ?? selectedTraining.notes ?? '',
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
        await scheduleApi.cancelLesson(selectedTraining.id, { reason: 'Cancelled by coach' }, initDataRaw);
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
              <span>{nextTraining.coach_name}</span>
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
          coaches={coaches}
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
            coaches={coaches}
            clubRoles={clubRoles}
            currentUser={currentUser}
            selectedDate={selectedDate ? (() => {
              const year = selectedDate.getFullYear();
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const day = String(selectedDate.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })() : undefined}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTraining}
          />
        )}

        {showEditModal && selectedTraining && (
          <EditTrainingModal
            training={selectedTraining}
            coaches={coaches}
            clubRoles={clubRoles}
            currentUser={currentUser}
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
