import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CreateClubRequest } from '@/functions/axios/requests';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface CreateClubModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClubRequest) => void;
  loading?: boolean;
}

export const CreateClubModal: React.FC<CreateClubModalProps> = ({
  show,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form, setForm] = useState<CreateClubRequest>({
    name: '',
    description: '',
    city: '',
    address: '',
    logo_url: '',
    cover_url: '',
    phone: '',
    telegram_url: '',
    instagram_url: '',
  });

  useEffect(() => {
    if (show) {
      setForm({
        name: '', description: '', city: '', address: '',
        logo_url: '', cover_url: '', phone: '',
        telegram_url: '', instagram_url: '',
      });
    }
  }, [show]);

  if (!show) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhoneChange = (value?: string) => {
    setForm((f) => ({ ...f, phone: value || '' }));
  };

  const handleSubmit = () => onSubmit(form);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Создать Клуб</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 focus:outline-none">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {[
            { label: 'Название', name: 'name', type: 'text', placeholder: 'Ваш клуб' },
            { label: 'Описание', name: 'description', type: 'textarea', placeholder: 'Краткое описание' },
            { label: 'Город', name: 'city', type: 'text', placeholder: 'Алматы' },
            { label: 'Адрес', name: 'address', type: 'text', placeholder: 'Ул. Пушкина, 1' },
            { label: 'Телефон', name: 'phone', type: 'phone', placeholder: '+7 701 123 4567' },
            { label: 'Логотип URL', name: 'logo_url', type: 'url', placeholder: 'https://...' },
            { label: 'Обложка URL', name: 'cover_url', type: 'url', placeholder: 'https://...' },
            { label: 'Telegram URL', name: 'telegram_url', type: 'url', placeholder: 'https://t.me/...' },
            { label: 'Instagram URL', name: 'instagram_url', type: 'url', placeholder: 'https://instagram.com/...'},
          ].map(({ label, name, type, placeholder }) => (
            <div key={name} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              {type === 'textarea' ? (
                <textarea
                  name={name}
                  value={form[name as keyof CreateClubRequest] as string}
                  onChange={handleChange}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                />
              ) : type === 'phone' ? (
                <PhoneInput
                  international
                  defaultCountry="KZ"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm focus:ring-2 focus:outline-none transition"
                />
              ) : (
                <input
                  name={name}
                  type={type}
                  value={form[name as keyof CreateClubRequest] as string}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end px-6 py-4 bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition disabled:opacity-50"
          >
            {loading && (
              <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};