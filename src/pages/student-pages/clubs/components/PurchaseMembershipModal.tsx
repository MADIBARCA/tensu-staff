import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Club } from '../ClubsPage';

interface MembershipPlan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number;
  description?: string;
  features: string[];
}

interface PurchaseMembershipModalProps {
  club: Club;
  plan: MembershipPlan;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export const PurchaseMembershipModal: React.FC<PurchaseMembershipModalProps> = ({
  club,
  plan,
  onClose,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = t('clubs.payment.errors.name');
    }

    const cardDigits = cardNumber.replace(/\s/g, '');
    if (cardDigits.length !== 16) {
      newErrors.cardNumber = t('clubs.payment.errors.card');
    }

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;
    
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      newErrors.expiryDate = t('clubs.payment.errors.expiry');
    } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      newErrors.expiryDate = t('clubs.payment.errors.expiryPast');
    }

    if (cvv.length !== 3) {
      newErrors.cvv = t('clubs.payment.errors.cvv');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return (
      customerName.trim() &&
      cardNumber.replace(/\s/g, '').length === 16 &&
      expiryDate.length === 5 &&
      cvv.length === 3
    );
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setPaymentStatus('processing');

    try {
      // TODO: Replace with actual payment API
      // const paymentData = {
      //   club_id: club.id,
      //   plan_id: plan.id,
      //   customer_name: customerName,
      //   card_number: cardNumber.replace(/\s/g, ''),
      //   expiry_date: expiryDate,
      //   cvv: cvv,
      // };
      // const response = await paymentApi.initiatePayment(paymentData, token);
      // Poll for status...

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success (80% chance)
      if (Math.random() > 0.2) {
        setPaymentStatus('success');
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          navigate('/student/profile');
        }, 5000);
      } else {
        setPaymentStatus('error');
        // Log error
        console.error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Success Screen
  if (paymentStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('clubs.payment.success.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('clubs.payment.success.description')}
          </p>
          <button
            onClick={() => navigate('/student/profile')}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('clubs.payment.success.button')}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {t('clubs.payment.success.redirect')}
          </p>
        </div>
      </div>
    );
  }

  // Error handling
  if (paymentStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('clubs.payment.error.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('clubs.payment.error.description')}
          </p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('clubs.payment.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl overflow-hidden relative">
        {/* Processing Overlay */}
        {paymentStatus === 'processing' && (
          <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">{t('clubs.payment.processing')}</p>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('clubs.payment.title')}</h2>
          <button
            onClick={onClose}
            disabled={paymentStatus === 'processing'}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Order Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-600">{t('clubs.payment.order')}</p>
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-500">{club.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              <span className="font-medium text-gray-700">{t('clubs.payment.total')}</span>
              <span className="text-xl font-bold text-blue-600">{formatPrice(plan.price)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clubs.payment.customerName')} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Иван Иванов"
                className={`w-full border rounded-lg p-3 ${
                  errors.customerName ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={paymentStatus === 'processing'}
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clubs.payment.cardNumber')} *
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className={`w-full border rounded-lg p-3 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={paymentStatus === 'processing'}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clubs.payment.expiry')} *
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`w-full border rounded-lg p-3 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={paymentStatus === 'processing'}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  className={`w-full border rounded-lg p-3 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={paymentStatus === 'processing'}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={paymentStatus === 'processing'}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {t('clubs.payment.cancel')}
            </button>
            <button
              onClick={handlePayment}
              disabled={!isFormValid() || paymentStatus === 'processing'}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('clubs.payment.pay')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
