import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingBag } from 'lucide-react';

interface NoMembershipModalProps {
  onClose: () => void;
}

export const NoMembershipModal: React.FC<NoMembershipModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleBuyMembership = () => {
    navigate('/student/clubs');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={32} className="text-orange-500" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {t('schedule.noMembership.title')}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {t('schedule.noMembership.description')}
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBuyMembership}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            {t('schedule.noMembership.buyButton')}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
