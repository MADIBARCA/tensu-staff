import React, { useState } from 'react';
import { BottomNav } from '@/components/Layout';
import { AddTrainingModal } from './components/AddTrainingModal';
import { CalendarSection } from './components/CalendarSection';
import { FloatingAddButton } from './components/FloatingAddButton';
import { StatsSection } from './components/StatsSection';

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
  const sampleTrainings: Training[] = [];
  const [showAdd, setShowAdd] = useState(false);

  const token = localStorage.getItem("telegramToken");

  return (
    <div className="min-h-screen bg-gray-50 pb-16 py-2">
      <header className="bg-white border border-gray-200 sticky top-0 z-10 px-4 py-3">
        <h1 className="text-xl font-semibold">Главная</h1>
      </header>

      <StatsSection trainings={sampleTrainings} />
      <CalendarSection token={token}/>

      {showAdd && <AddTrainingModal onClose={() => setShowAdd(false)} token={token}/>}
      <FloatingAddButton onClick={() => setShowAdd(true)} />

      <BottomNav page="main" />
    </div>
  );
};

export default CoachMainPage;