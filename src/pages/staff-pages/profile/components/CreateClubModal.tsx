import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { CreateClubData, MembershipTariff } from '../types';
import { cities, availableTags } from '../mockData';

interface CreateClubModalProps {
  tariffs: MembershipTariff[];
  onClose: () => void;
  onCreate: (data: CreateClubData) => void;
}

export const CreateClubModal: React.FC<CreateClubModalProps> = ({
  tariffs,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateClubData>({
    name: '',
    description: '',
    city: cities[0],
    address: '',
    phone: '',
    logo_url: '',
    cover_url: '',
    telegram_link: '',
    instagram_link: '',
    whatsapp_link: '',
    tags: [],
    membership_tariff_id: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customTag, setCustomTag] = useState('');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('profile.createClub.errors.nameRequired');
    }
    if (!formData.city) {
      newErrors.city = t('profile.createClub.errors.cityRequired');
    }
    if (!formData.address.trim()) {
      newErrors.address = t('profile.createClub.errors.addressRequired');
    }
    if (!formData.phone) {
      newErrors.phone = t('profile.createClub.errors.phoneRequired');
    } else {
      try {
        if (!isValidPhoneNumber(formData.phone)) {
          newErrors.phone = t('profile.createClub.errors.phoneInvalid') || 'Некорректный номер телефона';
        }
      } catch {
        newErrors.phone = t('profile.createClub.errors.phoneInvalid') || 'Некорректный номер телефона';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onCreate(formData);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()],
      }));
      setCustomTag('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.createClub.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full border rounded-lg p-2 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder={t('profile.createClub.namePlaceholder')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder={t('profile.createClub.descriptionPlaceholder')}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.city')} *
            </label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={`w-full border rounded-lg p-2 ${
                errors.city ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.address')} *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full border rounded-lg p-2 ${
                errors.address ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder={t('profile.createClub.addressPlaceholder')}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.phone')} *
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              hasError={!!errors.phone}
              placeholder={t('profile.createClub.phonePlaceholder') || 'Введите номер телефона'}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.logoUrl')}
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="https://..."
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.coverUrl')}
            </label>
            <input
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="https://..."
            />
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.createClub.socialLinks')}
            </label>
            <input
              type="url"
              value={formData.telegram_link}
              onChange={(e) => setFormData({ ...formData, telegram_link: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="Telegram (https://t.me/...)"
            />
            <input
              type="url"
              value={formData.instagram_link}
              onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="Instagram (https://instagram.com/...)"
            />
            <input
              type="text"
              value={formData.whatsapp_link}
              onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="WhatsApp (+7...)"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.createClub.tags')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
                placeholder={t('profile.createClub.customTag')}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Membership Tariff (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.createClub.membership')} ({t('common.optional')})
            </label>
            <div className="space-y-2">
              {tariffs.map((tariff) => (
                <button
                  key={tariff.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      membership_tariff_id:
                        prev.membership_tariff_id === tariff.id ? undefined : tariff.id,
                    }))
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    formData.membership_tariff_id === tariff.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <span className="font-medium text-gray-900 block">{tariff.name}</span>
                    <span className="text-xs text-gray-500">{tariff.description}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {tariff.price.toLocaleString()} ₸
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer with safe bottom padding */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-3 pb-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('profile.createClub.create')}
          </button>
        </div>
      </div>
    </div>
  );
};
