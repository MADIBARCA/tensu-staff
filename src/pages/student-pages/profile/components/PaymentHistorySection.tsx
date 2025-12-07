import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { ChevronRight, CreditCard, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Payment {
  id: number;
  club_name: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
}

export const PaymentHistorySection: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await studentsApi.getPayments(token);
        // setPayments(response.data.slice(0, 5)); // Show last 5
        
        // Mock data for demo
        const mockPayments: Payment[] = [
          {
            id: 1,
            club_name: 'Спортивный клуб "Чемпион"',
            amount: 15000,
            payment_date: new Date().toISOString(),
            status: 'paid',
            payment_method: 'Kaspi',
          },
          {
            id: 2,
            club_name: 'Фитнес центр "Сила"',
            amount: 12000,
            payment_date: new Date(Date.now() - 7 * 86400000).toISOString(),
            status: 'paid',
            payment_method: 'Card',
          },
          {
            id: 3,
            club_name: 'Спортивный клуб "Чемпион"',
            amount: 15000,
            payment_date: new Date(Date.now() - 30 * 86400000).toISOString(),
            status: 'paid',
            payment_method: 'Kaspi',
          },
        ];
        setPayments(mockPayments);
      } catch (error) {
        console.error('Failed to load payments:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: t('payments.status.paid'),
      pending: t('payments.status.pending'),
      failed: t('payments.status.failed'),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.payments')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.payments')} />
        <Card className="text-center py-8">
          <p className="text-gray-600">{t('payments.no.payments')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="История платежей" />
        <button
          onClick={() => navigate('/student/payments')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {t('payments.view.all')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-gray-400" />
                  <h4 className="font-medium text-gray-900">{payment.club_name}</h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>{formatDate(payment.payment_date)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatAmount(payment.amount)}</p>
                <p className={`text-xs ${getStatusColor(payment.status)}`}>
                  {getStatusLabel(payment.status)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
