import React, { useState } from 'react';
import { X, Plus, Clock, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { CreateClubData } from '../types';
import { cities, availableTags } from '../mockData';

interface CreateClubModalProps {
  onClose: () => void;
  onCreate: (data: CreateClubData) => Promise<void>;
  isSubmitting?: boolean;
}

export const CreateClubModal: React.FC<CreateClubModalProps> = ({
  onClose,
  onCreate,
  isSubmitting = false,
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
    working_hours_start: '09:00',
    working_hours_end: '21:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('profile.createClub.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('profile.createClub.errors.nameTooShort');
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
          newErrors.phone = t('profile.createClub.errors.phoneInvalid');
        }
      } catch {
        newErrors.phone = t('profile.createClub.errors.phoneInvalid');
      }
    }

    // Validate working hours
    if (formData.working_hours_start && formData.working_hours_end) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.working_hours_start)) {
        newErrors.working_hours_start = t('profile.createClub.errors.invalidTimeFormat');
      }
      if (!timeRegex.test(formData.working_hours_end)) {
        newErrors.working_hours_end = t('profile.createClub.errors.invalidTimeFormat');
      }
    }

    // Validate URLs if provided
    if (formData.telegram_link && !formData.telegram_link.startsWith('https://t.me/')) {
      newErrors.telegram_link = t('profile.createClub.errors.telegramInvalid');
    }
    
    if (formData.instagram_link && 
        !formData.instagram_link.startsWith('https://instagram.com/') && 
        !formData.instagram_link.startsWith('https://www.instagram.com/')) {
      newErrors.instagram_link = t('profile.createClub.errors.instagramInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onCreate(formData);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error creating club:', error);
    } finally {
      setLoading(false);
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

  const isDisabled = loading || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.createClub.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={isDisabled}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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
              disabled={isDisabled}
              className={`w-full border rounded-lg p-3 text-gray-900 caret-black ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-100`}
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
              disabled={isDisabled}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100"
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
              disabled={isDisabled}
              className={`w-full border rounded-lg p-3 text-gray-900 ${
                errors.city ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-100`}
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
              disabled={isDisabled}
              className={`w-full border rounded-lg p-3 text-gray-900 caret-black ${
                errors.address ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-100`}
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
              disabled={isDisabled}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {t('profile.createClub.workingHours')}
              </div>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="time"
                  value={formData.working_hours_start}
                  onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
                  disabled={isDisabled}
                  className={`w-full border rounded-lg p-3 text-gray-900 ${
                    errors.working_hours_start ? 'border-red-500' : 'border-gray-200'
                  } disabled:bg-gray-100`}
                />
                {errors.working_hours_start && (
                  <p className="text-red-500 text-xs mt-1">{errors.working_hours_start}</p>
                )}
              </div>
              <span className="text-gray-500">—</span>
              <div className="flex-1">
                <input
                  type="time"
                  value={formData.working_hours_end}
                  onChange={(e) => setFormData({ ...formData, working_hours_end: e.target.value })}
                  disabled={isDisabled}
                  className={`w-full border rounded-lg p-3 text-gray-900 ${
                    errors.working_hours_end ? 'border-red-500' : 'border-gray-200'
                  } disabled:bg-gray-100`}
                />
                {errors.working_hours_end && (
                  <p className="text-red-500 text-xs mt-1">{errors.working_hours_end}</p>
                )}
              </div>
            </div>
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
              disabled={isDisabled}
              className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100"
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
              disabled={isDisabled}
              className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100"
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
              disabled={isDisabled}
              className={`w-full border rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100 ${
                errors.telegram_link ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Telegram (https://t.me/...)"
            />
            {errors.telegram_link && (
              <p className="text-red-500 text-xs">{errors.telegram_link}</p>
            )}
            <input
              type="url"
              value={formData.instagram_link}
              onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
              disabled={isDisabled}
              className={`w-full border rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100 ${
                errors.instagram_link ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Instagram (https://instagram.com/...)"
            />
            {errors.instagram_link && (
              <p className="text-red-500 text-xs">{errors.instagram_link}</p>
            )}
            <input
              type="text"
              value={formData.whatsapp_link}
              onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
              disabled={isDisabled}
              className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 caret-black disabled:bg-gray-100"
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
                  disabled={isDisabled}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
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
                disabled={isDisabled}
                className="flex-1 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 caret-black disabled:bg-gray-100"
                placeholder={t('profile.createClub.customTag')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={isDisabled || !customTag.trim()}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>
            {/* Selected custom tags */}
            {formData.tags.filter(tag => !availableTags.includes(tag)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.filter(tag => !availableTags.includes(tag)).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full bg-blue-500 text-white flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      disabled={isDisabled}
                      className="hover:bg-blue-600 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-3 pb-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isDisabled}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDisabled && <Loader2 size={18} className="animate-spin" />}
            {t('profile.createClub.create')}
          </button>
        </div>
      </div>
    </div>
  );
};
