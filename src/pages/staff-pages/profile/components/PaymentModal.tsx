import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  membership: any;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ membership, onClose }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
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

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return;
    }

    setProcessing(true);
    try {
      // TODO: Implement payment API
      // Step 1: Initiate payment
      // const response = await fetch('https://gateway.paysage.io/transactions/payments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: membership.price,
      //     card_number: cardNumber.replace(/\s/g, ''),
      //     expiry_date: expiryDate,
      //     cvv: cvv,
      //     cardholder_name: cardholderName,
      //   }),
      // });
      // const { uid } = await response.json();
      
      // Step 2: Poll for status
      // const statusResponse = await fetch(`https://api.paysage.io/beyag/transactions/${uid}`);
      // const status = await statusResponse.json();
      
      // Handle success/error
      console.log('Payment processing...');
      
      // Mock success for now
      setTimeout(() => {
        setProcessing(false);
        onClose();
        // Show success message
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      setProcessing(false);
    }
  };

  const amount = membership.price || 0;
  const formattedAmount = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Оплата абонемента</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Сумма к оплате</p>
              <p className="text-2xl font-bold text-gray-900">{formattedAmount}</p>
            </div>
            <CreditCard size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер карты
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full border border-gray-200 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Срок действия
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                maxLength={3}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя держателя карты
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              placeholder="IVAN IVANOV"
              className="w-full border border-gray-200 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handlePayment}
            disabled={processing || !cardNumber || !expiryDate || !cvv || !cardholderName}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Обработка...' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  );
};
