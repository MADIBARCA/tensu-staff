import { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { StudentCard } from './components/StudentCard';
import { StudentFiltersModal } from './components/StudentFiltersModal';
import { StudentDetailsModal } from './components/StudentDetailsModal';
import { ExtendMembershipModal } from './components/ExtendMembershipModal';
import { FreezeMembershipModal } from './components/FreezeMembershipModal';
import { useTelegram } from '@/hooks/useTelegram';
import { studentsApi, teamApi, groupsApi } from '@/functions/axios/axiosFunctions';
import type { Student, StudentFilters, ExtendMembershipData, FreezeMembershipData, Trainer, Group } from './types';

export default function StudentsPage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    status: 'all',
    trainerIds: [],
    groupIds: [],
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load students
      const studentsResponse = await studentsApi.getList(initDataRaw);
      if (studentsResponse.data?.users) {
        const transformedStudents: Student[] = studentsResponse.data.users.map(s => ({
          id: s.id,
          telegram_id: s.telegram_id,
          first_name: s.first_name,
          last_name: s.last_name,
          phone_number: s.phone_number,
          username: s.username,
          photo_url: s.photo_url,
          club_id: 1,
          club_name: '',
          section_id: undefined,
          section_name: undefined,
          group_id: undefined,
          group_name: undefined,
          trainer_id: undefined,
          trainer_name: undefined,
          // Note: Membership info not available from basic students API
          membership: null,
          created_at: s.created_at,
        }));
        setStudents(transformedStudents);
      }

      // Load trainers (from team)
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
  }, [initDataRaw]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter students based on current filters
  const filteredStudents = useMemo(() => {
    let result = students;

    // Search by name or phone
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (student) =>
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchLower) ||
          student.phone_number.replace(/\s/g, '').includes(filters.search.replace(/\s/g, ''))
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(
        (student) => student.membership?.status === filters.status
      );
    }

    // Filter by trainers
    if (filters.trainerIds.length > 0) {
      result = result.filter(
        (student) => student.trainer_id && filters.trainerIds.includes(student.trainer_id)
      );
    }

    // Filter by groups
    if (filters.groupIds.length > 0) {
      result = result.filter(
        (student) => student.group_id && filters.groupIds.includes(student.group_id)
      );
    }

    return result;
  }, [students, filters]);

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.trainerIds.length > 0 ||
    filters.groupIds.length > 0;

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Note: Membership extension is mock-only since there's no membership API
  const handleExtendMembership = (data: ExtendMembershipData) => {
    if (!selectedStudent) return;

    // Update student membership
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === selectedStudent.id && student.membership) {
          const currentEndDate = new Date(student.membership.end_date);
          const newEndDate = new Date(
            currentEndDate.getTime() + data.period * 24 * 60 * 60 * 1000
          );
          return {
            ...student,
            membership: {
              ...student.membership,
              end_date: newEndDate.toISOString().split('T')[0],
              tariff_name: data.tariff_name,
              price: data.price,
              status: 'active',
            },
          };
        }
        return student;
      })
    );

    // Update selected student
    setSelectedStudent((prev) => {
      if (!prev || !prev.membership) return prev;
      const currentEndDate = new Date(prev.membership.end_date);
      const newEndDate = new Date(
        currentEndDate.getTime() + data.period * 24 * 60 * 60 * 1000
      );
      return {
        ...prev,
        membership: {
          ...prev.membership,
          end_date: newEndDate.toISOString().split('T')[0],
          tariff_name: data.tariff_name,
          price: data.price,
          status: 'active',
        },
      };
    });

    setShowExtendModal(false);
    
    // Show success message
    window.Telegram?.WebApp?.showAlert(t('students.extend.success'));
  };

  // Note: Membership freeze is mock-only since there's no membership API
  const handleFreezeMembership = (data: FreezeMembershipData) => {
    if (!selectedStudent) return;

    // Update student membership
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.id === selectedStudent.id && student.membership) {
          const currentEndDate = new Date(student.membership.end_date);
          const newEndDate = new Date(
            currentEndDate.getTime() + data.days * 24 * 60 * 60 * 1000
          );
          return {
            ...student,
            membership: {
              ...student.membership,
              status: 'frozen',
              end_date: newEndDate.toISOString().split('T')[0],
              freeze_days_used: student.membership.freeze_days_used + data.days,
            },
          };
        }
        return student;
      })
    );

    // Update selected student
    setSelectedStudent((prev) => {
      if (!prev || !prev.membership) return prev;
      const currentEndDate = new Date(prev.membership.end_date);
      const newEndDate = new Date(
        currentEndDate.getTime() + data.days * 24 * 60 * 60 * 1000
      );
      return {
        ...prev,
        membership: {
          ...prev.membership,
          status: 'frozen',
          end_date: newEndDate.toISOString().split('T')[0],
          freeze_days_used: prev.membership.freeze_days_used + data.days,
        },
      };
    });

    setShowFreezeModal(false);
    
    // Show success message
    window.Telegram?.WebApp?.showAlert(t('students.freeze.success'));
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

  const handleApplyFilters = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setShowFiltersModal(false);
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, search: '' }));
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
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder={t('students.search.placeholder')}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filters.search && (
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
              {filters.trainerIds.length + filters.groupIds.length + (filters.status !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">{t('students.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => handleStudentClick(student)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {t('students.count', { count: filteredStudents.length })}
        </div>

        {/* Modals */}
        {showFiltersModal && (
          <StudentFiltersModal
            trainers={trainers}
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
      </PageContainer>
    </Layout>
  );
}
