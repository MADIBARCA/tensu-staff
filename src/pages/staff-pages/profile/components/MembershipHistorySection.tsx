import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { ChevronDown, ChevronUp, Calendar, MapPin, Users } from 'lucide-react';

interface MembershipHistory {
  id: number;
  club_name: string;
  section_name?: string;
  group_name?: string;
  training_type: 'Group' | 'Personal';
  deactivation_date: string;
  reason: 'expired' | 'canceled';
}

export const MembershipHistorySection: React.FC = () => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<MembershipHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await studentsApi.getMembershipHistory(token);
        // setHistory(response.data);
        
        // Mock data for demo
        const mockHistory: MembershipHistory[] = [
          {
            id: 1,
            club_name: 'Бассейн "Волна"',
            section_name: 'Плавание',
            group_name: 'Взрослая группа',
            training_type: 'Group',
            deactivation_date: '2023-12-31',
            reason: 'expired',
          },
          {
            id: 2,
            club_name: 'Теннисный клуб "Ас"',
            section_name: 'Большой теннис',
            training_type: 'Personal',
            deactivation_date: '2023-11-15',
            reason: 'canceled',
          },
        ];
        setHistory(mockHistory);
      } catch (error) {
        console.error('Failed to load membership history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getReasonLabel = (reason: string) => {
    return reason === 'expired' ? 'Истёк' : 'Отменён';
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.membership.history')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Card
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.membership.history')}</h2>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
            {history.map((item) => (
              <div key={item.id} className="pb-3 last:pb-0 border-b border-gray-100 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{item.club_name}</h4>
                  <span className="text-xs text-gray-500">{getReasonLabel(item.reason)}</span>
                </div>
                {item.section_name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <MapPin size={14} />
                    <span>{item.section_name}</span>
                    {item.group_name && <span> • {item.group_name}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{item.training_type}</span>
                  <span className="mx-1">•</span>
                  <Calendar size={14} />
                  <span>Деактивирован: {formatDate(item.deactivation_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
