import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club } from '../types';

interface DeactivateClubModalProps {
  club: Club;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeactivateClubModal: React.FC<DeactivateClubModalProps> = ({
  club,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsProcessing(false);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {t('profile.deactivate.title')}
        </h3>
        
        <p className="text-gray-600 text-center mb-4">
          {t('profile.deactivate.message', { name: club.name })}
        </p>

        <div className="bg-yellow-50 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-700">
            {t('profile.deactivate.warning')}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:bg-gray-300"
          >
            {isProcessing ? t('common.loading') : t('profile.deactivate.confirm')}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
