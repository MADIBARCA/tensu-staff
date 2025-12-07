import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { BottomNav } from '@/components/Layout';
import { AddTrainingModal } from './components/AddTrainingModal';
import { CalendarSection } from './components/CalendarSection';
import { FloatingAddButton } from './components/FloatingAddButton';
import { Calendar } from 'lucide-react';

// Types
export type Training = {
  id: string;
  date: string;
  time: string;
  endTime: string;
  coach: string;
  section: string;
  club: string;
  attendedCount: number;
  totalCount: number;
  color: string;
};

export interface StatRow {
  club: string;
  section: string;
  slot?: string;
  count: number;
}

const CoachMainPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const token = localStorage.getItem("telegramToken");

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-0.5">{getGreeting()}</p>
            <h1 className="text-xl font-bold text-gray-900">{t('nav.home')}</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {new Date().toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
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

export default CoachMainPage;