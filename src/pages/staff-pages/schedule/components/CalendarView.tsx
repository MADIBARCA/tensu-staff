import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TrainingCard } from './TrainingCard';
import type { Training } from '../SchedulePage';

interface CalendarViewProps {
  trainings: Training[];
  trainingDates: Set<string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  selectedDateTrainings: Training[];
  onBook: (trainingId: number) => void;
  onCancelBooking: (trainingId: number) => void;
  onWaitlist: (trainingId: number) => void;
  onShowParticipants: (training: Training) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  trainingDates,
  selectedDate,
  onSelectDate,
  selectedDateTrainings,
  onBook,
  onCancelBooking,
  onWaitlist,
  onShowParticipants,
}) => {
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weekDays = [
    t('schedule.weekdays.mon'),
    t('schedule.weekdays.tue'),
    t('schedule.weekdays.wed'),
    t('schedule.weekdays.thu'),
    t('schedule.weekdays.fri'),
    t('schedule.weekdays.sat'),
    t('schedule.weekdays.sun'),
  ];

  const monthNames = [
    t('schedule.months.jan'),
    t('schedule.months.feb'),
    t('schedule.months.mar'),
    t('schedule.months.apr'),
    t('schedule.months.may'),
    t('schedule.months.jun'),
    t('schedule.months.jul'),
    t('schedule.months.aug'),
    t('schedule.months.sep'),
    t('schedule.months.oct'),
    t('schedule.months.nov'),
    t('schedule.months.dec'),
  ];

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let startDay = firstDay.getDay();
    // Convert to Monday-based (0 = Monday)
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    // Add empty cells for days before the first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasTrainings = (date: Date): boolean => {
    return trainingDates.has(formatDateString(date));
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <button
                onClick={() => onSelectDate(isSelected(day) ? null : day)}
                className={`w-full h-full flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative ${
                  isSelected(day)
                    ? 'bg-blue-500 text-white'
                    : isToday(day)
                    ? 'bg-blue-100 text-blue-700'
                    : hasTrainings(day)
                    ? 'bg-gray-100 hover:bg-gray-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className={isSelected(day) ? 'font-semibold' : ''}>
                  {day.getDate()}
                </span>
                {hasTrainings(day) && !isSelected(day) && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                )}
              </button>
            ) : (
              <div className="w-full h-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Date Trainings */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h4>
            <button
              onClick={() => onSelectDate(null)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {selectedDateTrainings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              {t('schedule.noTrainingsOnDate')}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateTrainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  onBook={() => onBook(training.id)}
                  onCancelBooking={() => onCancelBooking(training.id)}
                  onWaitlist={() => onWaitlist(training.id)}
                  onShowParticipants={() => onShowParticipants(training)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
