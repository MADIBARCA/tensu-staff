import React, { useState } from 'react';
import { X, Loader2, MapPin, Phone, Clock, Tag } from 'lucide-react';
import { TelegramIcon, InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';
import { useI18n } from '@/i18n/i18n';
import { clubsApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { Club } from '../types';
import type { UpdateClubRequest } from '@/functions/axios/requests';
import { isValidPhoneNumber, parsePhoneNumber, AsYouType } from 'libphonenumber-js';

interface EditClubModalProps {
  club: Club;
  onClose: () => void;
  onSave: () => void;
}

export const EditClubModal: React.FC<EditClubModalProps> = ({
  club,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();

  const [formData, setFormData] = useState({
    name: club.name,
    description: club.description || '',
    city: club.city,
    address: club.address,
    phone: club.phone,
    telegram_link: club.telegram_link || '',
    instagram_link: club.instagram_link || '',
    whatsapp_link: club.whatsapp_link || '',
    working_hours_start: club.working_hours_start || '09:00',
    working_hours_end: club.working_hours_end || '21:00',
    tags: club.tags || [],
  });

  const [customTag, setCustomTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    'fitness', 'yoga', 'martial_arts', 'swimming', 'tennis', 'dance',
    'crossfit', 'pilates', 'boxing', 'basketball', 'football', 'volleyball'
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatter = new AsYouType();
    const formatted = formatter.input(input);
    setFormData({ ...formData, phone: formatted });
    setErrors({ ...errors, phone: '' });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = formData.tags;
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else if (currentTags.length < 20) {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 20 && tag.length <= 50) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('profile.createClub.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('profile.createClub.errors.nameTooShort');
    }

    if (!formData.city.trim()) {
      newErrors.city = t('profile.createClub.errors.cityRequired');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('profile.createClub.errors.addressRequired');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('profile.createClub.errors.phoneRequired');
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = t('profile.createClub.errors.phoneInvalid');
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.working_hours_start)) {
      newErrors.working_hours_start = t('profile.createClub.errors.invalidTimeFormat');
    }
    if (!timeRegex.test(formData.working_hours_end)) {
      newErrors.working_hours_end = t('profile.createClub.errors.invalidTimeFormat');
    }

    // Validate social links if provided
    if (formData.telegram_link && !formData.telegram_link.startsWith('https://t.me/')) {
      newErrors.telegram_link = t('profile.createClub.errors.telegramInvalid');
    }
    if (formData.instagram_link && !formData.instagram_link.startsWith('https://instagram.com/') && !formData.instagram_link.startsWith('https://www.instagram.com/')) {
      newErrors.instagram_link = t('profile.createClub.errors.instagramInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !initDataRaw) return;

    setIsSubmitting(true);

    try {
      // Format phone number
      let formattedPhone = formData.phone;
      try {
        const parsed = parsePhoneNumber(formData.phone);
        if (parsed) {
          formattedPhone = parsed.format('E.164');
        }
      } catch {
        // Keep original format if parsing fails
      }

      const updateData: UpdateClubRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        phone: formattedPhone,
        telegram_url: formData.telegram_link || undefined,
        instagram_url: formData.instagram_link || undefined,
        whatsapp_url: formData.whatsapp_link || undefined,
        working_hours_start: formData.working_hours_start,
        working_hours_end: formData.working_hours_end,
        tags: formData.tags,
      };

      await clubsApi.update(club.id.toString(), updateData, initDataRaw);
      
      window.Telegram?.WebApp?.showAlert(t('profile.editClub.success'));
      onSave();
    } catch (error) {
      console.error('Error updating club:', error);
      window.Telegram?.WebApp?.showAlert(t('profile.editClub.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.editClub.title')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          {/* Club Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.createClub.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              placeholder={t('profile.createClub.namePlaceholder')}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              disabled={isSubmitting}
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
              placeholder={t('profile.createClub.descriptionPlaceholder')}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin size={14} className="inline mr-1" />
              {t('profile.createClub.city')} *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                setErrors({ ...errors, city: '' });
              }}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              disabled={isSubmitting}
            />
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
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                setErrors({ ...errors, address: '' });
              }}
              placeholder={t('profile.createClub.addressPlaceholder')}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              disabled={isSubmitting}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={14} className="inline mr-1" />
              {t('profile.createClub.phone')} *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder={t('profile.createClub.phonePlaceholder')}
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              disabled={isSubmitting}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              {t('profile.createClub.workingHours')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={formData.working_hours_start}
                onChange={(e) => {
                  setFormData({ ...formData, working_hours_start: e.target.value });
                  setErrors({ ...errors, working_hours_start: '' });
                }}
                className="flex-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
              />
              <span className="text-gray-400">—</span>
              <input
                type="time"
                value={formData.working_hours_end}
                onChange={(e) => {
                  setFormData({ ...formData, working_hours_end: e.target.value });
                  setErrors({ ...errors, working_hours_end: '' });
                }}
                className="flex-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
              />
            </div>
            {(errors.working_hours_start || errors.working_hours_end) && (
              <p className="text-red-500 text-xs mt-1">
                {errors.working_hours_start || errors.working_hours_end}
              </p>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.createClub.socialLinks')}
            </label>
            
            {/* Telegram */}
            <div className="flex items-center gap-2">
              <TelegramIcon size={18} className="text-blue-500 shrink-0" />
              <input
                type="url"
                value={formData.telegram_link}
                onChange={(e) => {
                  setFormData({ ...formData, telegram_link: e.target.value });
                  setErrors({ ...errors, telegram_link: '' });
                }}
                placeholder="https://t.me/your_channel"
                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
              />
            </div>
            {errors.telegram_link && <p className="text-red-500 text-xs ml-7">{errors.telegram_link}</p>}
            
            {/* Instagram */}
            <div className="flex items-center gap-2">
              <InstagramIcon size={18} className="text-pink-500 shrink-0" />
              <input
                type="url"
                value={formData.instagram_link}
                onChange={(e) => {
                  setFormData({ ...formData, instagram_link: e.target.value });
                  setErrors({ ...errors, instagram_link: '' });
                }}
                placeholder="https://instagram.com/your_page"
                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
              />
            </div>
            {errors.instagram_link && <p className="text-red-500 text-xs ml-7">{errors.instagram_link}</p>}
            
            {/* WhatsApp */}
            <div className="flex items-center gap-2">
              <WhatsAppIcon size={18} className="text-green-500 shrink-0" />
              <input
                type="url"
                value={formData.whatsapp_link}
                onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                placeholder="https://wa.me/77001234567"
                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag size={14} className="inline mr-1" />
              {t('profile.createClub.tags')}
            </label>
            
            {/* Selected tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-500 hover:text-blue-700"
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={isSubmitting}
                  className={`px-2.5 py-1 text-sm rounded-full transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder={t('profile.createClub.customTag')}
                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                disabled={isSubmitting}
                maxLength={50}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={isSubmitting || !customTag.trim()}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-4 pb-8 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
