import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { Card } from '@/components/ui';
import { X, MapPin, Clock, Phone, MessageCircle, Layers, CreditCard } from 'lucide-react';
import { PurchaseMembershipModal } from './PurchaseMembershipModal';
import type { Club } from '../ClubsPage';

interface Section {
  id: number;
  name: string;
  description?: string;
}

interface MembershipPlan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number;
  description?: string;
  features: string[];
}

interface ClubDetailsModalProps {
  club: Club;
  isMember: boolean;
  onClose: () => void;
}

export const ClubDetailsModal: React.FC<ClubDetailsModalProps> = ({ club, isMember: _isMember, onClose }) => {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClubDetails = async () => {
      try {
        // TODO: Replace with actual API calls
        // const sectionsResponse = await clubsApi.getSections(club.id, token);
        // const plansResponse = await clubsApi.getMembershipPlans(club.id, token);
        
        // Mock data for demo
        const mockSections: Section[] = [
          { id: 1, name: 'Футбол', description: 'Тренировки по футболу для всех возрастов' },
          { id: 2, name: 'Баскетбол', description: 'Профессиональные занятия баскетболом' },
          { id: 3, name: 'Волейбол', description: 'Волейбольная секция' },
          { id: 4, name: 'Фитнес', description: 'Общая физическая подготовка' },
        ];

        const mockPlans: MembershipPlan[] = [
          {
            id: 1,
            name: 'Стартовый',
            type: 'monthly',
            price: 15000,
            duration_days: 30,
            description: 'Базовый абонемент на месяц',
            features: ['8 тренировок', 'Доступ к раздевалкам', 'Консультация тренера'],
          },
          {
            id: 2,
            name: 'Оптимальный',
            type: 'monthly',
            price: 25000,
            duration_days: 30,
            description: 'Расширенный абонемент',
            features: ['12 тренировок', 'Доступ к раздевалкам', 'Персональная программа', 'Заморозка до 5 дней'],
          },
          {
            id: 3,
            name: 'Безлимит',
            type: 'monthly',
            price: 40000,
            duration_days: 30,
            description: 'Неограниченное посещение',
            features: ['Безлимитные тренировки', 'Все секции', 'Персональный тренер', 'Заморозка до 10 дней', 'Гостевой визит'],
          },
          {
            id: 4,
            name: 'Квартальный',
            type: 'quarterly',
            price: 100000,
            duration_days: 90,
            description: '3 месяца со скидкой',
            features: ['Безлимитные тренировки', 'Все секции', 'Персональный тренер', 'Заморозка до 20 дней'],
          },
        ];

        setSections(mockSections);
        setMembershipPlans(mockPlans);
      } catch (error) {
        console.error('Failed to load club details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClubDetails();
  }, [club.id]);

  const handleContactClick = (type: 'telegram' | 'whatsapp' | 'phone') => {
    const tg = window.Telegram?.WebApp;
    if (type === 'telegram' && club.telegram_url) {
      tg?.openLink?.(club.telegram_url);
    } else if (type === 'whatsapp' && club.whatsapp_url) {
      tg?.openLink?.(club.whatsapp_url);
    } else if (type === 'phone' && club.phone) {
      window.location.href = `tel:${club.phone}`;
    }
  };

  const handlePurchase = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">{club.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : (
            <>
              {/* Club Info */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">{t('clubs.details.info')}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('clubs.details.address')}</p>
                      <p className="text-sm text-gray-600">{club.address}</p>
                    </div>
                  </div>

                  {club.working_hours && (
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('clubs.details.hours')}</p>
                        <p className="text-sm text-gray-600">{club.working_hours}</p>
                      </div>
                    </div>
                  )}

                  {club.phone && (
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('clubs.details.phone')}</p>
                        <a href={`tel:${club.phone}`} className="text-sm text-blue-600">{club.phone}</a>
                      </div>
                    </div>
                  )}

                  {club.description && (
                    <p className="text-sm text-gray-600 mt-2">{club.description}</p>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="flex gap-2 mt-4">
                  {club.telegram_url && (
                    <button
                      onClick={() => handleContactClick('telegram')}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <MessageCircle size={16} />
                      Telegram
                    </button>
                  )}
                  {club.whatsapp_url && (
                    <button
                      onClick={() => handleContactClick('whatsapp')}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers size={18} />
                  {t('clubs.details.sections')}
                </h3>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <Card key={section.id} className="p-3">
                      <p className="font-medium text-gray-900">{section.name}</p>
                      {section.description && (
                        <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Membership Plans */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard size={18} />
                  {t('clubs.details.memberships')}
                </h3>
                <div className="space-y-3">
                  {membershipPlans.map((plan) => (
                    <Card key={plan.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                          <p className="text-xs text-gray-500">{plan.type === 'monthly' ? '1 месяц' : '3 месяца'}</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{formatPrice(plan.price)}</p>
                      </div>
                      
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                      )}

                      <ul className="space-y-1 mb-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handlePurchase(plan)}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        {t('clubs.details.purchase')}
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PurchaseMembershipModal
          club={club}
          plan={selectedPlan}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
            onClose();
          }}
        />
      )}
    </div>
  );
};
