import { useState, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Search, Filter, X, Loader2, Users } from 'lucide-react';
import { StudentCard } from './components/StudentCard';
import { StudentFiltersModal } from './components/StudentFiltersModal';
import { StudentDetailsModal } from './components/StudentDetailsModal';
import { ExtendMembershipModal } from './components/ExtendMembershipModal';
import { FreezeMembershipModal } from './components/FreezeMembershipModal';
import { SetIndividualPriceModal, type IndividualPriceData } from './components/SetIndividualPriceModal';
import { useTelegram } from '@/hooks/useTelegram';
import { staffStudentsApi, teamApi, groupsApi, clubsApi } from '@/functions/axios/axiosFunctions';
import type { Student, StudentFilters, ExtendMembershipData, FreezeMembershipData, Trainer, Group, Club } from './types';

export default function StudentsPage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [coaches, setCoaches] = useState<Trainer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    status: 'all',
    clubId: null,
    coachIds: [],
    groupIds: [],
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load clubs first
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        const loadedClubs: Club[] = clubsResponse.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
        }));
        setClubs(loadedClubs);
      }

      // Load students using the new staff students API
      const studentsResponse = await staffStudentsApi.getList({
        page: 1,
        size: 100,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        club_id: filters.clubId || undefined,
        coach_ids: filters.coachIds.length > 0 ? filters.coachIds : undefined,
        group_ids: filters.groupIds.length > 0 ? filters.groupIds : undefined,
      }, initDataRaw);
      
      if (studentsResponse.data?.students) {
        const transformedStudents: Student[] = studentsResponse.data.students.map(s => ({
          id: s.id,
          telegram_id: s.telegram_id,
          first_name: s.first_name,
          last_name: s.last_name,
          phone_number: s.phone_number,
          username: s.username,
          photo_url: s.photo_url,
          club_id: s.club_id,
          club_name: s.club_name,
          section_id: s.section_id,
          section_name: s.section_name,
          group_id: s.group_id,
          group_name: s.group_name,
          coach_id: s.coach_id,
          coach_name: s.coach_name,
          membership: s.membership ? {
            id: s.membership.id,
            status: s.membership.status,
            start_date: s.membership.start_date,
            end_date: s.membership.end_date,
            tariff_id: s.membership.tariff_id,
            tariff_name: s.membership.tariff_name,
            price: s.membership.price,
            freeze_days_total: s.membership.freeze_days_total,
            freeze_days_used: s.membership.freeze_days_used,
            freeze_start_date: s.membership.freeze_start_date,
            freeze_end_date: s.membership.freeze_end_date,
          } : null,
          created_at: s.created_at,
        }));
        setStudents(transformedStudents);
        setTotalStudents(studentsResponse.data.total);
      }

      // Load coaches (from team)
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

      // Load groups
      const groupsResponse = await groupsApi.getMy(initDataRaw);
      if (groupsResponse.data) {
        const transformedGroups: Group[] = groupsResponse.data.map(g => ({
          id: g.id,
          name: g.name,
          section_id: g.section_id,
          section_name: g.section?.name || '',
          club_id: g.section?.club_id || 0,
        }));
        setGroups(transformedGroups);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initDataRaw, filters.search, filters.status, filters.clubId, filters.coachIds, filters.groupIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== filters.search) {
        setFilters(prev => ({ ...prev, search: debouncedSearch }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch, filters.search]);

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.clubId !== null ||
    filters.coachIds.length > 0 ||
    filters.groupIds.length > 0;

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleExtendMembership = async (data: ExtendMembershipData) => {
    if (!selectedStudent || !initDataRaw) return;

    try {
      // Use extendWithCustomPrice if custom price or payment status is provided
      const response = await staffStudentsApi.extendWithCustomPrice({
        enrollment_id: data.enrollment_id,
        tariff_id: data.tariff_id,
        days: data.days,
        custom_price: data.custom_price,
        payment_status: data.payment_status || 'paid',
        note: data.note,
      }, initDataRaw);

      if (response.data) {
        // Determine the actual price charged
        const finalPrice = data.custom_price ?? data.price ?? selectedStudent.membership?.price ?? 0;

        // Update student in list
        setStudents(prevStudents =>
          prevStudents.map(student => {
            if (student.id === selectedStudent.id && student.membership) {
              return {
                ...student,
                membership: {
                  ...student.membership,
                  end_date: response.data!.new_end_date,
                  status: 'active',
                  tariff_name: data.tariff_name,
                  price: finalPrice,
                },
              };
            }
            return student;
          })
        );

        // Update selected student
        setSelectedStudent(prev => {
          if (!prev || !prev.membership) return prev;
          return {
            ...prev,
            membership: {
              ...prev.membership,
              end_date: response.data!.new_end_date,
              status: 'active',
              tariff_name: data.tariff_name,
              price: finalPrice,
            },
          };
        });

        setShowExtendModal(false);
        window.Telegram?.WebApp?.showAlert(t('students.extend.success'));
      }
    } catch (error) {
      console.error('Error extending membership:', error);
      window.Telegram?.WebApp?.showAlert(t('students.extend.error'));
    }
  };

  const handleFreezeMembership = async (data: FreezeMembershipData) => {
    if (!selectedStudent || !initDataRaw) return;

    try {
      const response = await staffStudentsApi.freeze({
        enrollment_id: data.enrollment_id,
        days: data.days,
        reason: data.reason,
      }, initDataRaw);

      if (response.data) {
        // Update student in list
        setStudents(prevStudents =>
          prevStudents.map(student => {
            if (student.id === selectedStudent.id && student.membership) {
              return {
                ...student,
                membership: {
                  ...student.membership,
                  status: 'frozen',
                  end_date: response.data!.new_end_date,
                  freeze_days_used: student.membership.freeze_days_used + data.days,
                  freeze_end_date: response.data!.freeze_end_date,
                },
              };
            }
            return student;
          })
        );

        // Update selected student
        setSelectedStudent(prev => {
          if (!prev || !prev.membership) return prev;
          return {
            ...prev,
            membership: {
              ...prev.membership,
              status: 'frozen',
              end_date: response.data!.new_end_date,
              freeze_days_used: prev.membership.freeze_days_used + data.days,
              freeze_end_date: response.data!.freeze_end_date,
            },
          };
        });

        setShowFreezeModal(false);
        window.Telegram?.WebApp?.showAlert(t('students.freeze.success'));
      }
    } catch (error) {
      console.error('Error freezing membership:', error);
      window.Telegram?.WebApp?.showAlert(t('students.freeze.error'));
    }
  };

  const handleMarkAttendance = () => {
    if (!selectedStudent) return;

    // In real app, this would make an API call
    console.log('Marking attendance for student:', selectedStudent.id);
    
    // Show success message
    window.Telegram?.WebApp?.showAlert(t('students.attendance.marked'));
    
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  const handleSetIndividualPrice = async (data: IndividualPriceData) => {
    if (!selectedStudent || !initDataRaw) return;

    try {
      const response = await staffStudentsApi.setIndividualPrice(
        data.student_id,
        {
          tariff_id: data.tariff_id,
          custom_price: data.custom_price,
          reason: data.reason,
          valid_until: data.valid_until,
        },
        initDataRaw
      );
      
      if (response.data) {
        setShowPriceModal(false);
        window.Telegram?.WebApp?.showAlert(t('students.individualPrice.success'));
      }
    } catch (error) {
      console.error('Error setting individual price:', error);
      window.Telegram?.WebApp?.showAlert(t('students.individualPrice.error'));
    }
  };

  const handleApplyFilters = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setShowFiltersModal(false);
  };

  const handleClearSearch = () => {
    setDebouncedSearch('');
    setFilters(prev => ({ ...prev, search: '' }));
  };

  if (loading) {
    return (
      <Layout title={t('students.title')}>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('students.title')}>
      <PageContainer>
        {/* Header with count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <span className="text-sm text-gray-600">
              {t('students.totalCount', { count: totalStudents })}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            placeholder={t('students.search.placeholder')}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {debouncedSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFiltersModal(true)}
          className={`w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={18} />
          {t('students.filter.button')}
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {filters.coachIds.length + filters.groupIds.length + (filters.status !== 'all' ? 1 : 0) + (filters.clubId ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Students List */}
        {students.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">{t('students.empty')}</p>
            <p className="text-sm text-gray-400">{t('students.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => handleStudentClick(student)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {students.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {t('students.count', { count: students.length })}
          </div>
        )}

        {/* Modals */}
        {showFiltersModal && (
          <StudentFiltersModal
            clubs={clubs}
            coaches={coaches}
            groups={groups}
            filters={filters}
            onApply={handleApplyFilters}
            onClose={() => setShowFiltersModal(false)}
          />
        )}

        {showDetailsModal && selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedStudent(null);
            }}
            onExtend={() => {
              setShowDetailsModal(false);
              setShowExtendModal(true);
            }}
            onFreeze={() => {
              setShowDetailsModal(false);
              setShowFreezeModal(true);
            }}
            onMarkAttendance={handleMarkAttendance}
            onSetIndividualPrice={() => {
              setShowDetailsModal(false);
              setShowPriceModal(true);
            }}
          />
        )}

        {showExtendModal && selectedStudent && (
          <ExtendMembershipModal
            student={selectedStudent}
            onClose={() => {
              setShowExtendModal(false);
              setShowDetailsModal(true);
            }}
            onExtend={handleExtendMembership}
          />
        )}

        {showFreezeModal && selectedStudent && (
          <FreezeMembershipModal
            student={selectedStudent}
            onClose={() => {
              setShowFreezeModal(false);
              setShowDetailsModal(true);
            }}
            onFreeze={handleFreezeMembership}
          />
        )}

        {showPriceModal && selectedStudent && (
          <SetIndividualPriceModal
            student={selectedStudent}
            onClose={() => {
              setShowPriceModal(false);
              setShowDetailsModal(true);
            }}
            onSave={handleSetIndividualPrice}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
