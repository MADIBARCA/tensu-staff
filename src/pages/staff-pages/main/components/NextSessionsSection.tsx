import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Calendar, MapPin, Users, User, FileText, Clock, X, CheckCircle } from 'lucide-react';
import { sessionsApi } from '@/functions/axios/axiosFunctions';

interface Session {
  id: number;
  section_name: string;
  group_name?: string;
  coach_name: string;
  date: string;
  time: string;
  club_address: string;
  participants_count: number;
  max_participants?: number;
  notes?: string;
  status: 'scheduled' | 'cancelled' | 'booked' | 'full';
}

export const NextSessionsSection: React.FC = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        try {
          const response = await sessionsApi.getNext(token);
          setSessions(response.data.slice(0, 3)); // Get first 3
        } catch (error) {
          // API might not be ready yet, use mock data for demo
          console.warn('Sessions API not available yet, using mock data:', error);
          const mockSessions: Session[] = [
            {
              id: 1,
              section_name: 'Футбол',
              group_name: 'Группа А (Начальный уровень)',
              coach_name: 'Александр Петров',
              date: new Date().toISOString().split('T')[0],
              time: '18:00',
              club_address: 'г. Алматы, ул. Абая, 150',
              participants_count: 8,
              max_participants: 12,
              notes: 'Принести спортивную форму и бутылку воды',
              status: 'booked',
            },
            {
              id: 2,
              section_name: 'Йога',
              group_name: 'Утренняя группа',
              coach_name: 'Мария Иванова',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
              time: '09:00',
              club_address: 'г. Алматы, пр. Достык, 240',
              participants_count: 10,
              max_participants: 15,
              status: 'scheduled',
            },
            {
              id: 3,
              section_name: 'Баскетбол',
              group_name: 'Средняя группа',
              coach_name: 'Дмитрий Сидоров',
              date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
              time: '19:30',
              club_address: 'г. Алматы, ул. Абая, 150',
              participants_count: 14,
              max_participants: 14,
              status: 'full',
            },
          ];
          setSessions(mockSessions);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(`${date}T${time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = '';
    if (sessionDate.toDateString() === today.toDateString()) {
      dateLabel = t('home.sessions.today');
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      dateLabel = t('home.sessions.tomorrow');
    } else {
      dateLabel = sessionDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
      });
    }

    const timeLabel = sessionDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { dateLabel, timeLabel };
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      scheduled: {
        label: t('home.sessions.status.scheduled'),
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock size={14} />,
      },
      cancelled: {
        label: t('home.sessions.status.cancelled'),
        color: 'bg-red-100 text-red-800',
        icon: <X size={14} />,
      },
      booked: {
        label: t('home.sessions.status.booked'),
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={14} />,
      },
      full: {
        label: t('home.sessions.status.full'),
        color: 'bg-gray-100 text-gray-800',
        icon: <Users size={14} />,
      },
    };
    return configs[status] || configs.scheduled;
  };

  const handleBookSession = async (sessionId: number) => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      await sessionsApi.book(sessionId, token);
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'booked' as const } : s
      ));
      
      // Show success notification
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Вы успешно записались на тренировку!');
      }
    } catch (error) {
      console.error('Failed to book session:', error);
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Ошибка при записи на тренировку. Попробуйте еще раз.');
      }
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <SectionHeader title={t('home.sessions.title')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mb-6">
        <SectionHeader title={t('home.sessions.title')} />
        <Card className="text-center py-8">
          <p className="text-gray-600">{t('home.sessions.empty')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <SectionHeader title={t('home.sessions.title')} />
      <div className="space-y-3">
        {sessions.map((session) => {
          const { dateLabel, timeLabel } = formatDateTime(session.date, session.time);
          const statusConfig = getStatusConfig(session.status);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = session.status === 'scheduled' && !isFull;

          return (
            <Card key={session.id}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {session.section_name}
                    {session.group_name && ` • ${session.group_name}`}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{session.coach_name}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar size={14} />
                <span>{dateLabel}</span>
                <span className="mx-1">•</span>
                <Clock size={14} />
                <span>{timeLabel}</span>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin size={14} />
                <span className="flex-1">{session.club_address}</span>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Users size={14} />
                <span>
                  {session.participants_count}
                  {session.max_participants && ` / ${session.max_participants}`}
                </span>
              </div>

              {/* Notes */}
              {session.notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                  <FileText size={14} className="mt-0.5" />
                  <span className="flex-1">{session.notes}</span>
                </div>
              )}

              {/* Book Button */}
              {canBook && (
                <button
                  onClick={() => handleBookSession(session.id)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  {t('home.sessions.book')}
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
