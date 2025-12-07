import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { BottomNav } from '@/components/Layout';
import { AddTrainingModal } from './components/AddTrainingModal';
import { CalendarSection } from './components/CalendarSection';
import { FloatingAddButton } from './components/FloatingAddButton';
import { staffApi } from '@/functions/axios/axiosFunctions';
import { Skeleton } from '@/components/ui';

const CoachMainPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const token = localStorage.getItem("telegramToken");

  // Load user info
  useEffect(() => {
    if (!token) {
      setIsLoadingUser(false);
      return;
    }
    
    staffApi.getMe(token)
      .then((res) => {
        const firstName = res.data.first_name || '';
        setUserName(firstName);
      })
      .catch(console.error)
      .finally(() => setIsLoadingUser(false));
  }, [token]);

  // Get current date for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (lang === 'kk') {
      if (hour < 12) return 'Қайырлы таң';
      if (hour < 18) return 'Қайырлы күн';
      return 'Қайырлы кеш';
    }
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const formatCurrentDate = () => {
    return new Date().toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{getGreeting()}</p>
              {isLoadingUser ? (
                <Skeleton className="h-7 w-32 mt-1" />
              ) : (
                <h1 className="text-xl font-bold text-gray-900">
                  {userName ? `${userName} 👋` : t('nav.home')}
                </h1>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {lang === 'kk' ? 'Бүгін' : 'Сегодня'}
              </p>
              <p className="text-sm font-medium text-gray-700 capitalize">
                {formatCurrentDate()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Quick Stats Summary */}
        <QuickStats token={token} />

        {/* Calendar/Schedule Section */}
        <CalendarSection token={token} refreshKey={calendarRefreshKey} />
      </main>

      {/* Floating Add Button */}
      {showAdd && (
        <AddTrainingModal
          onClose={() => setShowAdd(false)}
          token={token}
          onSuccess={() => setCalendarRefreshKey((k) => k + 1)}
        />
      )}
      <FloatingAddButton onClick={() => setShowAdd(true)} />

      {/* Bottom Navigation */}
      <BottomNav page="main" />
    </div>
  );
};

// Quick Stats Component
const QuickStats: React.FC<{ token: string | null }> = ({ token }) => {
  const { lang } = useI18n();
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    // This would load stats from API
    // For now using placeholder
    const timer = setTimeout(() => {
      setStats({
        todayCount: 3,
        weekCount: 12,
        isLoading: false,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [token]);

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
          {lang === 'kk' ? 'Бүгін' : 'Сегодня'}
        </p>
        <p className="text-2xl font-bold mt-1">{stats.todayCount}</p>
        <p className="text-blue-100 text-sm">
          {lang === 'kk' ? 'жаттығу' : 'тренировок'}
        </p>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
        <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
          {lang === 'kk' ? 'Бұл аптада' : 'На этой неделе'}
        </p>
        <p className="text-2xl font-bold mt-1">{stats.weekCount}</p>
        <p className="text-purple-100 text-sm">
          {lang === 'kk' ? 'жаттығу' : 'тренировок'}
        </p>
      </div>
    </div>
  );
};

export default CoachMainPage;
