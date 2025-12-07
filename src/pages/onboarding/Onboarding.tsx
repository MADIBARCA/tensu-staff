import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';
import { studentsApi } from '@/functions/axios/axiosFunctions';
import { useI18n } from '@/i18n/i18n';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStudent = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;

        // Try to get student data
        const response = await studentsApi.getMe(token);
        
        if (response.data) {
          // Student exists, navigate to main page
          navigate('/student/main');
        }
      } catch (err) {
        console.error('Onboarding error:', err);
        setError('Failed to initialize');
        // TODO: Handle student creation/registration flow
      } finally {
        setLoading(false);
      }
    };

    initStudent();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Tensu Students</h1>
        <p className="text-gray-600">Initializing...</p>
      </div>
    </div>
  );
}
