import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Instagram, MessageCircle, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui';

interface ClubDetailsModalProps {
  clubId?: number;
  onClose: () => void;
}

export const ClubDetailsModal: React.FC<ClubDetailsModalProps> = ({ onClose }) => {
  const [clubData, setClubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClubData = async () => {
      try {
        // TODO: Load club details from API
        // const response = await studentsApi.getClubDetails(clubId, token);
        // setClubData(response.data);
        
        // Mock data for now
        setClubData({
          name: 'Спортивный клуб',
          address: 'г. Алматы, ул. Примерная, 123',
          phone: '+7 777 123 45 67',
          instagram_url: 'https://instagram.com/club',
          telegram_url: 'https://t.me/club',
          sections: [
            { id: 1, name: 'Футбол', groups: [{ id: 1, name: 'Группа А' }] },
            { id: 2, name: 'Баскетбол', groups: [{ id: 2, name: 'Группа Б' }] },
          ],
          pricing: [
            { name: 'Месячный абонемент', price: 15000 },
            { name: 'Трёхмесячный абонемент', price: 40000 },
          ],
        });
      } catch (error) {
        console.error('Failed to load club data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClubData();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl p-6">
          <div className="text-center py-8">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!clubData) {
    return null;
  }

  const tg = window.Telegram?.WebApp;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{clubData.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Club Info */}
        <div className="space-y-3 mb-6">
          {clubData.address && (
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Адрес</p>
                <p className="text-sm text-gray-600">{clubData.address}</p>
              </div>
            </div>
          )}

          {clubData.phone && (
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Телефон</p>
                <a href={`tel:${clubData.phone}`} className="text-sm text-blue-600">
                  {clubData.phone}
                </a>
              </div>
            </div>
          )}

          {clubData.instagram_url && (
            <button
              onClick={() => tg?.openLink?.(clubData.instagram_url)}
              className="flex items-center gap-3 w-full"
            >
              <Instagram size={20} className="text-gray-400" />
              <span className="text-sm text-blue-600">Instagram</span>
            </button>
          )}

          {clubData.telegram_url && (
            <button
              onClick={() => tg?.openLink?.(clubData.telegram_url)}
              className="flex items-center gap-3 w-full"
            >
              <MessageCircle size={20} className="text-gray-400" />
              <span className="text-sm text-blue-600">Telegram</span>
            </button>
          )}
        </div>

        {/* Sections */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} />
            Секции и группы
          </h3>
          <div className="space-y-2">
            {clubData.sections?.map((section: any) => (
              <Card key={section.id} className="p-3">
                <p className="font-medium text-gray-900 mb-2">{section.name}</p>
                {section.groups?.length > 0 && (
                  <div className="space-y-1">
                    {section.groups.map((group: any) => (
                      <p key={group.id} className="text-sm text-gray-600 pl-4">
                        • {group.name}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign size={18} />
            Прайсинг
          </h3>
          <div className="space-y-2">
            {clubData.pricing?.map((item: any, index: number) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="font-semibold text-blue-600">
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'KZT',
                      minimumFractionDigits: 0,
                    }).format(item.price)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Buy Membership Button */}
        <button
          onClick={() => {
            // TODO: Navigate to membership purchase
            onClose();
          }}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Приобрести абонемент
        </button>
      </div>
    </div>
  );
};
