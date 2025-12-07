import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Calendar, MapPin, Users, CreditCard, Snowflake, ChevronRight } from 'lucide-react';

interface Membership {
  id: number;
  club_name: string;
  section_name?: string;
  group_name?: string;
  training_type: 'Group' | 'Personal';
  level?: string;
  status: 'active' | 'frozen' | 'expired' | 'canceled';
  start_date: string;
  end_date: string;
  freeze_days_available?: number;
  freeze_days_used?: number;
}

interface MembershipsSectionProps {
  onPayment: (membership: Membership) => void;
  onFreeze: (membership: Membership) => void;
  onClubClick: (clubId: number) => void;
}

export const MembershipsSection: React.FC<MembershipsSectionProps> = ({
  onPayment,
  onFreeze,
  onClubClick,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemberships = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await studentsApi.getMemberships(token);
        // setMemberships(response.data);
        
        // Mock data for demo
        const mockMemberships: Membership[] = [
          {
            id: 1,
            club_name: 'Спортивный клуб "Чемпион"',
            section_name: 'Футбол',
            group_name: 'Группа А (Начальный уровень)',
            training_type: 'Group',
            level: 'Начальный',
            status: 'active',
            start_date: '2024-01-15',
            end_date: '2024-02-15',
            freeze_days_available: 5,
            freeze_days_used: 0,
          },
          {
            id: 2,
            club_name: 'Фитнес центр "Сила"',
            section_name: 'Йога',
            group_name: 'Утренняя группа',
            training_type: 'Group',
            level: 'Средний',
            status: 'frozen',
            start_date: '2024-01-10',
            end_date: '2024-02-10',
            freeze_days_available: 3,
            freeze_days_used: 2,
          },
        ];
        setMemberships(mockMemberships);
      } catch (error) {
        console.error('Failed to load memberships:', error);
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    };

    loadMemberships();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Активен',
      frozen: 'Заморожен',
      expired: 'Истёк',
      canceled: 'Отменён',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.memberships')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.memberships')} />
        <Card className="text-center py-8">
          <p className="text-gray-600 mb-4">{t('no.memberships')}</p>
          <button
            onClick={() => navigate('/student/clubs')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('find.club')}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <SectionHeader title={t('profile.memberships')} />
      <div className="space-y-3">
        {memberships.map((membership) => (
          <Card
            key={membership.id}
            onClick={() => onClubClick(membership.id)}
            className="cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{membership.club_name}</h3>
                {membership.section_name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <MapPin size={14} />
                    <span>{membership.section_name}</span>
                    {membership.group_name && <span> • {membership.group_name}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{membership.training_type}</span>
                  {membership.level && <span> • {membership.level}</span>}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(membership.status)}`}>
                {getStatusLabel(membership.status)}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar size={14} />
                <span>до {formatDate(membership.end_date)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {membership.status === 'active' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPayment(membership);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <CreditCard size={16} />
                    {t('membership.pay')}
                  </button>
                  {membership.freeze_days_available && membership.freeze_days_available > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFreeze(membership);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Snowflake size={16} />
                      {t('membership.freeze')}
                    </button>
                  ) : null}
                </>
              )}
              {membership.status === 'frozen' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFreeze(membership);
                  }}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Snowflake size={16} />
                  {t('membership.unfreeze')}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
