import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { ChevronDown, ChevronUp, Calendar, MapPin, TrendingUp, BarChart3 } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  checkin_date: string;
  club_name: string;
  section_name?: string;
}

interface AttendanceStats {
  visits_this_month: number;
  missed_this_month: number;
  average_attendance: number;
}

export const AttendanceHistorySection: React.FC = () => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await studentsApi.getAttendance(token);
        // setAttendance(response.data.records);
        // setStats(response.data.stats);
        
        // Mock data for demo
        const mockAttendance: AttendanceRecord[] = [
          {
            id: 1,
            checkin_date: new Date().toISOString(),
            club_name: 'Спортивный клуб "Чемпион"',
            section_name: 'Футбол',
          },
          {
            id: 2,
            checkin_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            club_name: 'Спортивный клуб "Чемпион"',
            section_name: 'Футбол',
          },
          {
            id: 3,
            checkin_date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
            club_name: 'Фитнес центр "Сила"',
            section_name: 'Йога',
          },
          {
            id: 4,
            checkin_date: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
            club_name: 'Спортивный клуб "Чемпион"',
            section_name: 'Футбол',
          },
          {
            id: 5,
            checkin_date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
            club_name: 'Фитнес центр "Сила"',
            section_name: 'Йога',
          },
        ];
        
        const mockStats: AttendanceStats = {
          visits_this_month: 12,
          missed_this_month: 3,
          average_attendance: 80,
        };
        
        setAttendance(mockAttendance);
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to load attendance:', error);
        setAttendance([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.attendance')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title="История посещаемости" />
        <Card className="text-center py-8">
          <p className="text-gray-600">{t('attendance.no.visits')}</p>
        </Card>
      </div>
    );
  }

  const recentVisits = attendance.slice(0, 5);

  return (
    <div className="mb-4">
      <Card
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.attendance')}</h2>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">Посещений за месяц</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.visits_this_month}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-red-600" />
                <span className="text-xs text-gray-600">Пропусков за месяц</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.missed_this_month}</p>
            </div>
            <div className="col-span-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-gray-600" />
                <span className="text-xs text-gray-600">Средняя посещаемость</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.average_attendance}%</p>
            </div>
          </div>
        )}

        {/* Recent Visits */}
        {!isExpanded && (
          <div className="space-y-2">
            {recentVisits.map((record) => (
              <div key={record.id} className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-900">{record.club_name}</p>
                  {record.section_name && (
                    <p className="text-gray-500 text-xs">{record.section_name}</p>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDate(record.checkin_date)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Full List */}
        {isExpanded && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {attendance.map((record) => (
              <div key={record.id} className="pb-3 last:pb-0 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.club_name}</p>
                    {record.section_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin size={12} />
                        <span>{record.section_name}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(record.checkin_date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
