import { useState, useEffect } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { studentsApi } from '@/functions/axios/axiosFunctions';
import { UserInfoSection } from './components/UserInfoSection';
import { MembershipsSection } from './components/MembershipsSection';
import { MembershipHistorySection } from './components/MembershipHistorySection';
import { AttendanceHistorySection } from './components/AttendanceHistorySection';
import { PaymentHistorySection } from './components/PaymentHistorySection';
import { SettingsSection } from './components/SettingsSection';
import { EditProfileModal } from './components/EditProfileModal';
import { PaymentModal } from './components/PaymentModal';
import { FreezeMembershipModal } from './components/FreezeMembershipModal';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import type { StudentResponse } from '@/functions/axios/responses';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user } = useTelegram();
  const [studentData, setStudentData] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showClubDetailsModal, setShowClubDetailsModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        const response = await studentsApi.getMe(token);
        setStudentData(response.data);
      } catch (error) {
        console.error('Failed to load student data, using mock:', error);
        // Fallback to mock data for demo
        setStudentData({
          id: 1,
          telegram_id: user?.id || 123456789,
          first_name: user?.first_name || 'Иван',
          last_name: user?.last_name || 'Иванов',
          phone_number: user?.phone_number || '+7 777 123 45 67',
          username: user?.username || 'ivan_ivanov',
          photo_url: (user?.photo_url && typeof user.photo_url === 'string') ? user.photo_url : '',
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (updatedData: { first_name: string; last_name?: string }) => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      if (!token) return;

      const response = await studentsApi.updateMe(updatedData, token);
      setStudentData(response.data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handlePayment = (membership: any) => {
    setSelectedMembership(membership);
    setShowPaymentModal(true);
  };

  const handleFreeze = (membership: any) => {
    setSelectedMembership(membership);
    setShowFreezeModal(true);
  };

  const handleClubClick = () => {
    setShowClubDetailsModal(true);
    // TODO: Load club details
  };

  if (loading) {
    return (
      <Layout title={t('nav.profile')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.profile')}>
      <PageContainer>
        {/* User Info Section */}
        <UserInfoSection
          student={studentData}
          onEdit={handleEditProfile}
        />

        {/* My Memberships Section */}
        <MembershipsSection
          onPayment={handlePayment}
          onFreeze={handleFreeze}
          onClubClick={handleClubClick}
        />

        {/* Membership History Section */}
        <MembershipHistorySection />

        {/* Attendance History Section */}
        <AttendanceHistorySection />

        {/* Payment History Section */}
        <PaymentHistorySection />

        {/* Settings Section */}
        <SettingsSection />

        {/* Modals */}
        {showEditModal && studentData && (
          <EditProfileModal
            student={studentData}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveProfile}
          />
        )}

        {showPaymentModal && selectedMembership && (
          <PaymentModal
            membership={selectedMembership}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedMembership(null);
            }}
          />
        )}

        {showFreezeModal && selectedMembership && (
          <FreezeMembershipModal
            membership={selectedMembership}
            onClose={() => {
              setShowFreezeModal(false);
              setSelectedMembership(null);
            }}
          />
        )}

        {showClubDetailsModal && (
          <ClubDetailsModal
            onClose={() => setShowClubDetailsModal(false)}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
