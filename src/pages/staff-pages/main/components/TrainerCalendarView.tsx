import React, { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Training } from '../types';

interface TrainerCalendarViewProps {
  trainings: Training[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  onTrainingClick: (training: Training) => void;
}

export const TrainerCalendarView: React.FC<TrainerCalendarViewProps> = ({
  trainings,
  selectedDate,
  onSelectDate,
}) => {
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push(day);
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Next month days to complete the grid (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
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

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDateString(date) === formatDateString(selectedDate);
  };

  const getTrainingsForDate = (date: Date): Training[] => {
    const dateStr = formatDateString(date);
    return trainings.filter(t => t.date === dateStr);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onSelectDate(new Date());
  };

  const days = getDaysInMonth(currentMonth);

  // Calculate stats for current month
  const monthStats = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthTrainings = trainings.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    return {
      total: monthTrainings.length,
      scheduled: monthTrainings.filter(t => t.status === 'scheduled').length,
      completed: monthTrainings.filter(t => t.status === 'completed').length,
      cancelled: monthTrainings.filter(t => t.status === 'cancelled').length,
    };
  }, [trainings, currentMonth]);

  const getStatusIndicators = (dayTrainings: Training[]) => {
    const scheduled = dayTrainings.filter(t => t.status === 'scheduled' || t.status === 'in_progress').length;
    const completed = dayTrainings.filter(t => t.status === 'completed').length;
    const cancelled = dayTrainings.filter(t => t.status === 'cancelled').length;
    return { scheduled, completed, cancelled, total: dayTrainings.length };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">
              {monthNames[currentMonth.getMonth()]}
            </h3>
            <p className="text-blue-100 text-sm">{currentMonth.getFullYear()}</p>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{monthStats.total}</p>
            <p className="text-xs text-blue-100">Всего</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{monthStats.scheduled}</p>
            <p className="text-xs text-blue-100">План</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{monthStats.completed}</p>
            <p className="text-xs text-blue-100">Готово</p>
          </div>
        </div>
      </div>

      {/* Today Button */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={goToToday}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Calendar size={14} />
          Сегодня
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 px-2">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`text-center text-xs font-semibold py-2 ${
              idx >= 5 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 p-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square bg-white" />;
          }

          const dayTrainings = getTrainingsForDate(day);
          const stats = getStatusIndicators(dayTrainings);
          const hasTrainings = dayTrainings.length > 0;
          const isSelectedDay = isSelected(day);
          const isTodayDay = isToday(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isPastDay = isPast(day) && !isTodayDay;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={index}
              onClick={() => onSelectDate(isSelectedDay ? null : day)}
              className={`
                aspect-square flex flex-col items-center justify-center
                rounded-xl text-sm transition-all duration-200 relative
                ${isSelectedDay
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105 z-10'
                  : isTodayDay
                  ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200'
                  : !isCurrentMonthDay
                  ? 'bg-gray-50 text-gray-300'
                  : isPastDay
                  ? 'bg-white text-gray-400'
                  : isWeekend
                  ? 'bg-white text-red-400 hover:bg-red-50'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className={`font-medium ${isSelectedDay || isTodayDay ? 'font-bold' : ''}`}>
                {day.getDate()}
              </span>
              
              {/* Training Indicators */}
              {hasTrainings && !isSelectedDay && (
                <div className="flex gap-0.5 mt-0.5">
                  {stats.scheduled > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                  {stats.completed > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                  {stats.cancelled > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </div>
              )}

              {/* Training Count Badge */}
              {hasTrainings && stats.total > 2 && !isSelectedDay && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {stats.total}
                </span>
              )}

              {/* Selected Day Indicator */}
              {isSelectedDay && hasTrainings && (
                <span className="text-[10px] text-blue-100 mt-0.5">
                  {stats.total} тр.
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Запланировано</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Проведено</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Отменено</span>
        </div>
      </div>
    </div>
  );
};
