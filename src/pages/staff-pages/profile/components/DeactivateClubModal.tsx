import React, { useState, useMemo } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
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
  const [confirmationInput, setConfirmationInput] = useState('');

  // Check if the input matches the club name (case-sensitive for extra safety)
  const isConfirmationValid = useMemo(() => {
    return confirmationInput.trim() === club.name.trim();
  }, [confirmationInput, club.name]);

  const handleConfirm = async () => {
    if (!isConfirmationValid) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsProcessing(false);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-6">
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {t('profile.deactivate.title')}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 text-center mb-4">
          {t('profile.deactivate.message', { name: club.name })}
        </p>

        {/* Warning box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <ShieldAlert size={18} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              {t('profile.deactivate.warning')}
            </p>
          </div>
        </div>

        {/* Confirmation input section */}
        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">
            {t('profile.deactivate.confirmInstruction')}
          </label>
          
          {/* Club name to type */}
          <div className="bg-gray-100 rounded-lg px-3 py-2 mb-3">
            <code className="text-sm font-mono font-semibold text-gray-900 select-all">
              {club.name}
            </code>
          </div>
          
          {/* Input field */}
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder={t('profile.deactivate.inputPlaceholder')}
            disabled={isProcessing}
            className={`
              w-full border rounded-lg px-3 py-2.5 text-sm
              transition-colors outline-none
              ${confirmationInput.length > 0 
                ? isConfirmationValid 
                  ? 'border-green-500 bg-green-50 focus:ring-2 focus:ring-green-200' 
                  : 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100'
              }
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
          
          {/* Validation hint */}
          {confirmationInput.length > 0 && !isConfirmationValid && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={12} />
              {t('profile.deactivate.nameMismatch')}
            </p>
          )}
          {isConfirmationValid && (
            <p className="text-xs text-green-600 mt-1.5">
              ✓ {t('profile.deactivate.nameMatch')}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !isConfirmationValid}
            className={`
              w-full py-3 rounded-lg font-medium transition-all
              ${isConfirmationValid 
                ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
              disabled:opacity-60
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('common.loading')}
              </span>
            ) : (
              t('profile.deactivate.confirm')
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
