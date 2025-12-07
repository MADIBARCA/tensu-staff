import { useState, useEffect } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { CheckInSlider } from './components/CheckInSlider';
import { NextSessionsSection } from './components/NextSessionsSection';
import { LocationDistance } from './components/LocationDistance';
import { NoMembershipBanner } from './components/NoMembershipBanner';
import { checkInApi } from '@/functions/axios/axiosFunctions';

export default function StudentMainPage() {
  const { t } = useI18n();
  const [hasActiveMembership, setHasActiveMembership] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        // TODO: Replace with actual API call
        // const tg = window.Telegram?.WebApp;
        // const token = tg?.initData || null;
        // const response = await studentsApi.getActiveMemberships(token);
        // setHasActiveMembership(response.data.length > 0);
        
        // Mock for demo - set to true to show full functionality
        setHasActiveMembership(true);
      } catch (error) {
        console.error('Failed to check membership:', error);
        // Mock for demo - set to true even on error
        setHasActiveMembership(true);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();
  }, []);

  const handleCheckIn = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      await checkInApi.checkIn(token);
      
      // Show success notification
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Посещение успешно отмечено!');
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      // Show error notification
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Ошибка при отметке посещения. Попробуйте еще раз.');
      }
    }
  };

  if (loading) {
    return (
      <Layout title={t('nav.home')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.home')}>
      <PageContainer>
        {!hasActiveMembership ? (
          <NoMembershipBanner />
        ) : (
          <>
            <CheckInSlider onCheckIn={handleCheckIn} />
            <LocationDistance />
            <NextSessionsSection />
          </>
        )}
      </PageContainer>
    </Layout>
  );
}
