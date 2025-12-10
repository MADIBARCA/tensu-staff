import { useState, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Users, LayoutGrid, DollarSign, Loader2 } from 'lucide-react';
import { EmployeesTab } from './components/EmployeesTab';
import { SectionsTab } from './components/SectionsTab';
import { PricingTab } from './components/PricingTab';
import { useTelegram } from '@/hooks/useTelegram';
import { clubsApi, teamApi, sectionsApi, invitationsApi, staffApi } from '@/functions/axios/axiosFunctions';
import { mockTariffs } from './mockData';
import type {
  Employee,
  EmployeeRole,
  Section,
  Tariff,
  CreateEmployeeData,
  UpdateEmployeeData,
  CreateTariffData,
  Club,
} from './types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

type TabId = 'employees' | 'sections' | 'pricing';

export default function ManagementPage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubRoles, setClubRoles] = useState<ClubWithRole[]>([]);
  const [currentUser, setCurrentUser] = useState<CreateStaffResponse | null>(null);
  // Tariffs don't have API endpoint, using mock data
  const [tariffs, setTariffs] = useState<Tariff[]>(mockTariffs);

  const tabs = [
    { id: 'employees' as TabId, label: t('management.tabs.employees'), icon: Users },
    { id: 'sections' as TabId, label: t('management.tabs.sections'), icon: LayoutGrid },
    { id: 'pricing' as TabId, label: t('management.tabs.pricing'), icon: DollarSign },
  ];

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

      // Load clubs
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        // Save club roles for filtering
        setClubRoles(clubsResponse.data.clubs);
        
        const transformedClubs: Club[] = clubsResponse.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
          status: 'active' as const,
        }));
        setClubs(transformedClubs);
      }

      // Load team (employees)
      const teamResponse = await teamApi.get(initDataRaw);
      let transformedEmployees: Employee[] = [];
      if (teamResponse.data?.staff_members) {
        transformedEmployees = teamResponse.data.staff_members.map(member => ({
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone_number,
          telegram_username: member.username,
          role: (member.clubs_and_roles[0]?.role === 'coach' ? 'coach' : (member.clubs_and_roles[0]?.role === 'owner' ? 'owner' : member.clubs_and_roles[0]?.role === 'admin' ? 'admin' : 'coach')) as EmployeeRole,
          status: member.clubs_and_roles[0]?.is_active ? 'active' : 'pending',
          club_ids: member.clubs_and_roles.map(cr => cr.club_id),
          photo_url: member.photo_url,
          created_at: member.created_at,
        }));
      }

      // Load pending invitations for all clubs
      const clubIds = clubsResponse.data?.clubs?.map(c => c.club.id) || [];
      const pendingInvitations: Employee[] = [];
      
      for (const clubId of clubIds) {
        try {
          const invitationsResponse = await invitationsApi.getByClub(clubId.toString(), initDataRaw);
          if (invitationsResponse.data?.invitations) {
            // Filter only pending invitations (status === 'pending' and not used)
            const clubPendingInvitations = invitationsResponse.data.invitations
              .filter(inv => inv.status === 'pending' && !inv.is_used)
              .map(inv => ({
                id: inv.id,
                first_name: '',
                last_name: '',
                phone: inv.phone_number,
                telegram_username: undefined,
                role: inv.role as EmployeeRole,
                status: 'pending' as const,
                club_ids: [inv.club_id],
                invitation_id: inv.id,
                created_at: inv.created_at,
              }));
            pendingInvitations.push(...clubPendingInvitations);
          }
        } catch (error) {
          console.error(`Error loading invitations for club ${clubId}:`, error);
        }
      }

      // Combine employees and pending invitations (avoid duplicates by phone)
      const existingPhones = new Set(transformedEmployees.map(e => e.phone));
      const uniquePendingInvitations = pendingInvitations.filter(inv => !existingPhones.has(inv.phone));
      
      setEmployees([...transformedEmployees, ...uniquePendingInvitations]);

      // Load sections
      const sectionsResponse = await sectionsApi.getMy(initDataRaw);
      if (sectionsResponse.data) {
        const transformedSections: Section[] = sectionsResponse.data.map(s => ({
          id: s.id,
          name: s.name,
          club_id: s.club_id,
          club_name: s.club?.name || '',
          coach_ids: s.coach ? [s.coach.id] : [],
          coaches: s.coach ? [{ id: s.coach.id, name: `${s.coach.first_name} ${s.coach.last_name}` }] : [],
          groups: s.groups?.map(g => ({
            id: g.id,
            section_id: s.id,
            name: g.name,
            level: g.level,
            capacity: g.capacity,
            schedules: [],
          })) || [],
          created_at: s.created_at,
        }));
        setSections(transformedSections);
      }

      // Note: Tariffs don't have an API endpoint, so we keep mock data
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [initDataRaw]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Employee handlers
  const handleAddEmployee = async (data: CreateEmployeeData) => {
    if (initDataRaw && data.club_ids.length > 0) {
      try {
        // Create invitation via API
        const clubId = data.club_ids[0].toString();
        await invitationsApi.create(clubId, {
          phone_number: data.phone,
          role: data.role,
        }, initDataRaw);
      } catch (error) {
        console.error('Error creating invitation:', error);
      }
    }

    // Add to local state
    const newEmployee: Employee = {
      id: Date.now(),
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: data.role,
      status: 'pending',
      club_ids: data.club_ids,
      created_at: new Date().toISOString(),
    };
    setEmployees([...employees, newEmployee]);
    window.Telegram?.WebApp?.showAlert(t('management.employees.added'));
  };

  const handleEditEmployee = (id: number, data: UpdateEmployeeData) => {
    setEmployees(employees.map(e =>
      e.id === id ? { ...e, ...data } : e
    ));
    window.Telegram?.WebApp?.showAlert(t('management.employees.updated'));
  };

  // Section handlers are now in CreateSectionModal and EditSectionModal which call APIs directly

  // Tariff handlers (no API, mock only)
  const handleCreateTariff = (data: CreateTariffData) => {
    const newTariff: Tariff = {
      id: Date.now(),
      name: data.name,
      type: data.type,
      payment_type: data.payment_type,
      price: data.price,
      club_ids: data.club_ids,
      section_ids: data.section_ids,
      group_ids: data.group_ids,
      sessions_count: data.sessions_count,
      validity_days: data.validity_days,
      active: data.active,
      created_at: new Date().toISOString(),
    };

    setTariffs([...tariffs, newTariff]);
    window.Telegram?.WebApp?.showAlert(t('management.pricing.created'));
  };

  const handleUpdateTariff = (id: number, data: CreateTariffData) => {
    setTariffs(tariffs.map(t =>
      t.id === id ? {
        ...t,
        name: data.name,
        type: data.type,
        payment_type: data.payment_type,
        price: data.price,
        club_ids: data.club_ids,
        section_ids: data.section_ids,
        group_ids: data.group_ids,
        sessions_count: data.sessions_count,
        validity_days: data.validity_days,
        active: data.active,
      } : t
    ));
    window.Telegram?.WebApp?.showAlert(t('management.pricing.updated'));
  };

  const handleDeleteTariff = (id: number) => {
    setTariffs(tariffs.filter(t => t.id !== id));
    window.Telegram?.WebApp?.showAlert(t('management.pricing.deleted'));
  };

  if (loading) {
    return (
      <Layout title={t('nav.management')}>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.management')}>
      <PageContainer>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'employees' && (
          <EmployeesTab
            employees={employees}
            clubs={clubs}
            clubRoles={clubRoles}
            currentUser={currentUser}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
          />
        )}

        {activeTab === 'sections' && (
          <SectionsTab
            sections={sections}
            clubs={clubs}
            clubRoles={clubRoles}
            currentUser={currentUser}
            employees={employees}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            tariffs={tariffs}
            clubs={clubs}
            sections={sections}
            onCreateTariff={handleCreateTariff}
            onUpdateTariff={handleUpdateTariff}
            onDeleteTariff={handleDeleteTariff}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
