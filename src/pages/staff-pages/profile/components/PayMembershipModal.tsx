import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { X, CreditCard, Check } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club, MembershipTariff } from '../types';

interface PayMembershipModalProps {
  club: Club;
  tariffs: MembershipTariff[];
  onClose: () => void;
  onPay: (tariffId: number) => void;
}

export const PayMembershipModal: React.FC<PayMembershipModalProps> = ({
  club,
  tariffs,
  onClose,
  onPay,
}) => {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky header
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const scrollY = contentElement.scrollTop;
      setIsScrolled(scrollY > 0);
    };

    contentElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, []);

  const [selectedTariff, setSelectedTariff] = useState<MembershipTariff | null>(
    club.membership ? tariffs.find(t => t.name === club.membership?.tariff_name) || tariffs[0] : tariffs[0]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = async () => {
    if (!selectedTariff) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Auto close after success
    setTimeout(() => {
      onPay(selectedTariff.id);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('profile.payment.success')}
          </h3>
          <p className="text-gray-600">
            {t('profile.payment.successDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl max-h-screen overflow-hidden flex flex-col">
        <div className={clsx(
          "flex items-center justify-between p-4 border-b border-gray-200 overflow-hidden",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled ? "pt-20" : "pt-0"
        )}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.payment.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {t('profile.payment.club')}: <span className="font-medium text-gray-900">{club.name}</span>
            </p>
            {club.membership && (
              <p className="text-sm text-gray-600">
                {t('profile.payment.currentTariff')}: <span className="font-medium text-gray-900">{club.membership.tariff_name}</span>
              </p>
            )}
          </div>

          <h3 className="font-medium text-gray-900 mb-3">
            {t('profile.payment.selectTariff')}
          </h3>

          <div className="space-y-2">
            {tariffs.map((tariff) => (
              <button
                key={tariff.id}
                onClick={() => setSelectedTariff(tariff)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                  selectedTariff?.id === tariff.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <span className="font-medium text-gray-900 block">{tariff.name}</span>
                  <span className="text-sm text-gray-500">{tariff.description}</span>
                  <span className="text-xs text-gray-400 block mt-1">
                    {tariff.duration_days} {t('profile.payment.days')}
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {tariff.price.toLocaleString()} ₸
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          {selectedTariff && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">{t('profile.payment.total')}</span>
              <span className="text-xl font-bold text-gray-900">
                {selectedTariff.price.toLocaleString()} ₸
              </span>
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={!selectedTariff || isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('profile.payment.processing')}
              </>
            ) : (
              <>
                <CreditCard size={20} />
                {t('profile.payment.pay')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
