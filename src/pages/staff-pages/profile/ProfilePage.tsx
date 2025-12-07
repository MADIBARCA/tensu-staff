import { useState, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Plus, Loader2 } from 'lucide-react';
import { UserProfileSection } from './components/UserProfileSection';
import { ClubCard } from './components/ClubCard';
import { CreateClubModal } from './components/CreateClubModal';
import { ClubDetailsModalNew } from './components/ClubDetailsModalNew';
import { PayMembershipModal } from './components/PayMembershipModal';
import { DeactivateClubModal } from './components/DeactivateClubModal';
import { SettingsSection } from './components/SettingsSection';
import { useTelegram } from '@/hooks/useTelegram';
import { staffApi, clubsApi } from '@/functions/axios/axiosFunctions';
import {
  mockStaffUser,
  mockClubs,
  mockClubAnalytics,
  mockPaymentHistory,
  mockMembershipTariffs,
} from './mockData';
import type { StaffUser, Club, CreateClubData, ClubAnalytics } from './types';

export default function ProfilePage() {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StaffUser>(mockStaffUser);
  const [clubs, setClubs] = useState<Club[]>(mockClubs);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [showClubDetailsModal, setShowClubDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load user profile
      const userResponse = await staffApi.getMe(initDataRaw);
      if (userResponse.data) {
        const apiUser = userResponse.data;
        setUser({
          id: apiUser.id,
          telegram_id: apiUser.telegram_id,
          first_name: apiUser.first_name,
          last_name: apiUser.last_name,
          phone_number: apiUser.phone_number,
          username: apiUser.username,
          photo_url: apiUser.photo_url,
          role: 'owner', // Default role, will be updated based on clubs
          created_at: apiUser.created_at,
        });
      }

      // Load clubs
      const clubsResponse = await clubsApi.getMy(initDataRaw);
      if (clubsResponse.data?.clubs) {
        const transformedClubs: Club[] = clubsResponse.data.clubs.map(c => {
          // Calculate days until expiry (mock for now since API doesn't provide membership info)
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // Default 30 days
          const daysUntilExpiry = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: c.club.id,
            name: c.club.name,
            description: c.club.description,
            city: c.club.city,
            address: c.club.address,
            phone: c.club.phone,
            logo_url: c.club.logo_url,
            cover_url: c.club.cover_url,
            telegram_link: c.club.telegram_url,
            instagram_link: c.club.instagram_url,
            whatsapp_link: '',
            tags: [],
            status: 'active',
            activation_date: c.club.created_at.split('T')[0],
            working_hours: '09:00 - 21:00',
            sections_count: 0,
            students_count: 0,
            owner_id: c.club.owner_id,
            // Note: membership info not available from API, using mock
            membership: {
              id: c.club.id,
              club_id: c.club.id,
              tariff_name: 'Стандарт',
              price: 30000,
              start_date: c.club.created_at.split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              payment_method: 'Карта',
              status: 'active',
              days_until_expiry: daysUntilExpiry,
            },
          };
        });
        
        setClubs(transformedClubs.length > 0 ? transformedClubs : mockClubs);
        
        // Update user role based on clubs
        if (clubsResponse.data.clubs.some(c => c.is_owner)) {
          setUser(prev => ({ ...prev, role: 'owner' }));
        } else if (clubsResponse.data.clubs.some(c => c.role === 'admin')) {
          setUser(prev => ({ ...prev, role: 'admin' }));
        } else {
          setUser(prev => ({ ...prev, role: 'trainer' }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  }, [initDataRaw]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for expired memberships and update club status
  useEffect(() => {
    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.membership) {
          if (club.membership.days_until_expiry <= -3) {
            return { ...club, status: 'frozen' };
          } else if (club.membership.days_until_expiry <= 0) {
            return { ...club, status: 'pending' };
          }
        }
        return club;
      })
    );
  }, []);

  const handleSaveProfile = async (data: { first_name: string; last_name: string }) => {
    if (initDataRaw) {
      try {
        await staffApi.updateMe({
          first_name: data.first_name,
          last_name: data.last_name,
        }, initDataRaw);
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }

    setUser((prev) => ({ ...prev, ...data }));
    window.Telegram?.WebApp?.showAlert(t('profile.saved'));
  };

  const handleCreateClub = async (data: CreateClubData) => {
    let newClubId = clubs.length + 1;

    if (initDataRaw) {
      try {
        const response = await clubsApi.create({
          name: data.name,
          description: data.description || '',
          city: data.city,
          address: data.address,
          logo_url: data.logo_url || '',
          cover_url: data.cover_url || '',
          phone: data.phone,
          telegram_url: data.telegram_link || '',
          instagram_url: data.instagram_link || '',
        }, initDataRaw);

        if (response.data) {
          newClubId = response.data.id;
        }
      } catch (error) {
        console.error('Error creating club:', error);
      }
    }

    const newClub: Club = {
      id: newClubId,
      name: data.name,
      description: data.description,
      city: data.city,
      address: data.address,
      phone: data.phone,
      logo_url: data.logo_url,
      cover_url: data.cover_url,
      telegram_link: data.telegram_link,
      instagram_link: data.instagram_link,
      whatsapp_link: data.whatsapp_link,
      tags: data.tags,
      status: 'active',
      activation_date: new Date().toISOString().split('T')[0],
      working_hours: '09:00 - 21:00',
      sections_count: 0,
      students_count: 0,
      owner_id: user.id,
      membership: data.membership_tariff_id
        ? {
            id: Date.now(),
            club_id: newClubId,
            tariff_name: mockMembershipTariffs.find(t => t.id === data.membership_tariff_id)?.name || '',
            price: mockMembershipTariffs.find(t => t.id === data.membership_tariff_id)?.price || 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(
              Date.now() +
                (mockMembershipTariffs.find(t => t.id === data.membership_tariff_id)?.duration_days || 30) *
                  24 * 60 * 60 * 1000
            ).toISOString().split('T')[0],
            payment_method: 'Карта',
            status: 'active',
            days_until_expiry: mockMembershipTariffs.find(t => t.id === data.membership_tariff_id)?.duration_days || 30,
          }
        : undefined,
    };

    setClubs((prev) => [...prev, newClub]);
    setShowCreateClubModal(false);
    window.Telegram?.WebApp?.showAlert(t('profile.clubCreated'));
  };

  const handleClubClick = (club: Club) => {
    setSelectedClub(club);
    setShowClubDetailsModal(true);
  };

  const handlePaymentClick = (club: Club) => {
    setSelectedClub(club);
    setShowPaymentModal(true);
  };

  // Note: Payment handling is mock-only since there's no payment API
  const handlePayment = (tariffId: number) => {
    if (!selectedClub) return;

    const tariff = mockMembershipTariffs.find(t => t.id === tariffId);
    if (!tariff) return;

    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === selectedClub.id) {
          return {
            ...club,
            status: 'active',
            membership: {
              id: Date.now(),
              club_id: club.id,
              tariff_name: tariff.name,
              price: tariff.price,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(
                Date.now() + tariff.duration_days * 24 * 60 * 60 * 1000
              ).toISOString().split('T')[0],
              payment_method: 'Карта',
              status: 'active',
              days_until_expiry: tariff.duration_days,
            },
          };
        }
        return club;
      })
    );

    setShowPaymentModal(false);
    setShowClubDetailsModal(false);
    setSelectedClub(null);
  };

  const handleDeactivateClick = () => {
    setShowClubDetailsModal(false);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedClub) return;

    if (initDataRaw) {
      try {
        await clubsApi.delete(selectedClub.id.toString(), initDataRaw);
      } catch (error) {
        console.error('Error deactivating club:', error);
      }
    }

    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === selectedClub.id) {
          return { ...club, status: 'deactivated' };
        }
        return club;
      })
    );

    setShowDeactivateModal(false);
    setSelectedClub(null);
    window.Telegram?.WebApp?.showAlert(t('profile.clubDeactivated'));
  };

  // Note: Analytics are mock-only since there's no analytics API
  const getClubAnalytics = (clubId: number): ClubAnalytics => {
    return mockClubAnalytics.find(a => a.club_id === clubId) || {
      club_id: clubId,
      sections: [],
      total_students: 0,
      trainings_this_month: 0,
      trainings_conducted: 0,
      trainings_scheduled: 0,
      trainings_cancelled: 0,
    };
  };

  // Note: Payment history is mock-only since there's no payment API
  const getPaymentHistory = (clubId: number) => {
    return mockPaymentHistory.filter(p => p.club_id === clubId);
  };

  // Check if user can create more clubs (based on role)
  const maxClubs = user.role === 'owner' ? 5 : user.role === 'admin' ? 2 : 0;
  const canCreateClub = clubs.length < maxClubs;

  // Check if any club is frozen (hide create functionality)
  const hasFreeze = clubs.some(c => c.status === 'frozen' || c.status === 'pending');

  if (loading) {
    return (
      <Layout title={t('nav.profile')}>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.profile')}>
      <PageContainer>
        {/* User Profile Section */}
        <UserProfileSection user={user} onSave={handleSaveProfile} />

        {/* Clubs Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('profile.myClubs')}
            </h2>
            {canCreateClub && !hasFreeze && (
              <button
                onClick={() => setShowCreateClubModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                {t('profile.createClub')}
              </button>
            )}
          </div>

          {clubs.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">{t('profile.noClubs')}</p>
              {canCreateClub && (
                <button
                  onClick={() => setShowCreateClubModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('profile.createFirstClub')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {clubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onClick={() => handleClubClick(club)}
                  onPayment={
                    (club.membership?.days_until_expiry ?? 999) <= 7 ||
                    club.status === 'frozen' ||
                    club.status === 'pending'
                      ? () => handlePaymentClick(club)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <SettingsSection />

        {/* Modals */}
        {showCreateClubModal && (
          <CreateClubModal
            tariffs={mockMembershipTariffs}
            onClose={() => setShowCreateClubModal(false)}
            onCreate={handleCreateClub}
          />
        )}

        {showClubDetailsModal && selectedClub && (
          <ClubDetailsModalNew
            club={selectedClub}
            analytics={getClubAnalytics(selectedClub.id)}
            paymentHistory={getPaymentHistory(selectedClub.id)}
            userRole={user.role}
            onClose={() => {
              setShowClubDetailsModal(false);
              setSelectedClub(null);
            }}
            onPayment={() => {
              setShowClubDetailsModal(false);
              setShowPaymentModal(true);
            }}
            onDeactivate={handleDeactivateClick}
          />
        )}

        {showPaymentModal && selectedClub && (
          <PayMembershipModal
            club={selectedClub}
            tariffs={mockMembershipTariffs}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedClub(null);
            }}
            onPay={handlePayment}
          />
        )}

        {showDeactivateModal && selectedClub && (
          <DeactivateClubModal
            club={selectedClub}
            onClose={() => {
              setShowDeactivateModal(false);
              setSelectedClub(null);
            }}
            onConfirm={handleDeactivateConfirm}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
