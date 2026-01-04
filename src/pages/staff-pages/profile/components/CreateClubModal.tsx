import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Clock, Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { TelegramIcon, InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';
import { useI18n } from '@/i18n/i18n';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { CreateClubData } from '../types';
import { cities, availableTags } from '../mockData';
import { ImageCropModal } from '@/components/ImageCropModal';
import { uploadClubImage, processImageWithCrop, type ClubImageUploadResult } from '@/lib/storageUpload';
import type { Area } from 'react-easy-crop';

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

  // Image upload state
  const [clubKey] = useState(() => `tmp-${Date.now()}`);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [logoUploadProgress, setLogoUploadProgress] = useState<number>(0);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number>(0);
  const [logoUploadError, setLogoUploadError] = useState<string>('');
  const [coverUploadError, setCoverUploadError] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string>('');
  const [cropKind, setCropKind] = useState<'logo' | 'cover'>('logo');
  const [cropAspect, setCropAspect] = useState<number>(1);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (cropImage) URL.revokeObjectURL(cropImage);
    };
  }, [logoPreview, coverPreview, cropImage]);

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

  const handleFileSelect = (file: File, kind: 'logo' | 'cover') => {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      const errorMsg = 'Only JPEG, PNG, and WebP images are allowed';
      if (kind === 'logo') {
        setLogoUploadError(errorMsg);
      } else {
        setCoverUploadError(errorMsg);
      }
      return;
    }

    // Validate file size
    const maxSize = kind === 'logo' ? 1.5 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = `Image is too large. Maximum size: ${kind === 'logo' ? '1.5MB' : '5MB'}`;
      if (kind === 'logo') {
        setLogoUploadError(errorMsg);
      } else {
        setCoverUploadError(errorMsg);
      }
      return;
    }

    // Clear errors
    if (kind === 'logo') {
      setLogoUploadError('');
      setLogoFile(file);
    } else {
      setCoverUploadError('');
      setCoverFile(file);
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    if (kind === 'logo') {
      setLogoPreview(previewUrl);
    } else {
      setCoverPreview(previewUrl);
    }

    // Open crop modal
    setCropImage(previewUrl);
    setCropKind(kind);
    setCropAspect(kind === 'logo' ? 1 : 16 / 9);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedArea: Area, zoom: number) => {
    setShowCropModal(false);
    
    const file = cropKind === 'logo' ? logoFile : coverFile;
    if (!file) return;

    try {
      if (cropKind === 'logo') {
        setLogoUploadProgress(10);
        setLogoUploadError('');
      } else {
        setCoverUploadProgress(10);
        setCoverUploadError('');
      }

      // Process image with crop
      const processedBlob = await processImageWithCrop(file, cropKind, croppedArea, zoom);

      // Upload to Firebase
      const result: ClubImageUploadResult = await uploadClubImage(
        new File([processedBlob], file.name, { type: 'image/webp' }),
        { kind: cropKind, clubKey },
        (progress) => {
          if (cropKind === 'logo') {
            setLogoUploadProgress(progress);
          } else {
            setCoverUploadProgress(progress);
          }
        }
      );

      // Update form data
      if (cropKind === 'logo') {
        setFormData({ ...formData, logo_url: result.downloadURL });
        setLogoUploadProgress(100);
      } else {
        setFormData({ ...formData, cover_url: result.downloadURL });
        setCoverUploadProgress(100);
      }

      // Cleanup
      if (cropImage) {
        URL.revokeObjectURL(cropImage);
        setCropImage('');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
      if (cropKind === 'logo') {
        setLogoUploadError(errorMsg);
        setLogoUploadProgress(0);
      } else {
        setCoverUploadError(errorMsg);
        setCoverUploadProgress(0);
      }
    }
  };

  const handleRemoveImage = (kind: 'logo' | 'cover') => {
    if (kind === 'logo') {
      setFormData({ ...formData, logo_url: '' });
      setLogoFile(null);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview('');
      }
      setLogoUploadProgress(0);
      setLogoUploadError('');
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    } else {
      setFormData({ ...formData, cover_url: '' });
      setCoverFile(null);
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
        setCoverPreview('');
      }
      setCoverUploadProgress(0);
      setCoverUploadError('');
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const isDisabled = loading || isSubmitting || (logoUploadProgress > 0 && logoUploadProgress < 100) || (coverUploadProgress > 0 && coverUploadProgress < 100);

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

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.createClub.logoUrl')}
              <span className="text-xs font-normal text-gray-500 ml-1">{t('profile.createClub.logoRatio')}</span>
            </label>
            {formData.logo_url ? (
              <div className="space-y-3">
                <div className="relative group">
                  <div className="relative w-32 h-32 mx-auto border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm">
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    {logoUploadProgress > 0 && logoUploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 size={28} className="animate-spin text-white mb-2" />
                        <div className="text-white text-sm font-semibold">{logoUploadProgress}%</div>
                        <div className="w-20 h-1 bg-white bg-opacity-30 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${logoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {logoUploadProgress === 0 && (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isDisabled}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                      title={t('profile.createClub.changeLogo')}
                    >
                      <Upload size={16} className="text-gray-600" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage('logo')}
                  disabled={isDisabled}
                  className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  {t('profile.createClub.removeLogo')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'logo');
                  }}
                  disabled={isDisabled}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isDisabled}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                    logoUploadError
                      ? 'border-red-300 bg-red-50'
                      : logoUploadProgress > 0 && logoUploadProgress < 100
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {logoUploadProgress > 0 && logoUploadProgress < 100 ? (
                    <>
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-1">{t('profile.createClub.uploadingLogo')}</div>
                        <div className="text-xs text-gray-500">{logoUploadProgress}% {t('profile.createClub.complete')}</div>
                      </div>
                      <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${logoUploadProgress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-full border-2 border-gray-200">
                        <Upload size={24} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-1">{t('profile.createClub.uploadLogo')}</div>
                        <div className="text-xs text-gray-500">{t('profile.createClub.uploadHint')}</div>
                        <div className="text-xs text-gray-400 mt-1">{t('profile.createClub.logoFormat')}</div>
                      </div>
                    </>
                  )}
                </button>
                {logoUploadError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs font-medium">{logoUploadError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cover Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.createClub.coverUrl')}
              <span className="text-xs font-normal text-gray-500 ml-1">{t('profile.createClub.coverRatio')}</span>
            </label>
            {formData.cover_url ? (
              <div className="space-y-3">
                <div className="relative group">
                  <div className="relative w-full h-48 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm">
                    <img
                      src={formData.cover_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    {coverUploadProgress > 0 && coverUploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 size={32} className="animate-spin text-white mb-2" />
                        <div className="text-white text-sm font-semibold">{coverUploadProgress}%</div>
                        <div className="w-32 h-1.5 bg-white bg-opacity-30 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${coverUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {coverUploadProgress === 0 && (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isDisabled}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                      title={t('profile.createClub.changeCover')}
                    >
                      <Upload size={16} className="text-gray-600" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage('cover')}
                  disabled={isDisabled}
                  className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  {t('profile.createClub.removeCover')}
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'cover');
                  }}
                  disabled={isDisabled}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isDisabled}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                    coverUploadError
                      ? 'border-red-300 bg-red-50'
                      : coverUploadProgress > 0 && coverUploadProgress < 100
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {coverUploadProgress > 0 && coverUploadProgress < 100 ? (
                    <>
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-1">{t('profile.createClub.uploadingCover')}</div>
                        <div className="text-xs text-gray-500">{coverUploadProgress}% {t('profile.createClub.complete')}</div>
                      </div>
                      <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${coverUploadProgress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-full border-2 border-gray-200">
                        <ImageIcon size={28} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-1">{t('profile.createClub.uploadCover')}</div>
                        <div className="text-xs text-gray-500">{t('profile.createClub.uploadHint')}</div>
                        <div className="text-xs text-gray-400 mt-1">{t('profile.createClub.coverFormat')}</div>
                      </div>
                    </>
                  )}
                </button>
                {coverUploadError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs font-medium">{coverUploadError}</p>
                  </div>
                )}
              </div>
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
                disabled={isDisabled}
                className={`flex-1 border rounded-lg p-2.5 text-sm text-gray-900 caret-black disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telegram_link ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="https://t.me/your_channel"
              />
            </div>
            {errors.telegram_link && (
              <p className="text-red-500 text-xs ml-7">{errors.telegram_link}</p>
            )}
            
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
                disabled={isDisabled}
                className={`flex-1 border rounded-lg p-2.5 text-sm text-gray-900 caret-black disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.instagram_link ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="https://instagram.com/your_page"
              />
            </div>
            {errors.instagram_link && (
              <p className="text-red-500 text-xs ml-7">{errors.instagram_link}</p>
            )}
            
            {/* WhatsApp */}
            <div className="flex items-center gap-2">
              <WhatsAppIcon size={18} className="text-green-500 shrink-0" />
              <input
                type="text"
                value={formData.whatsapp_link}
                onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                disabled={isDisabled}
                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 caret-black disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://wa.me/77001234567"
              />
            </div>
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

      {/* Crop Modal */}
      {showCropModal && cropImage && (
        <ImageCropModal
          image={cropImage}
          aspect={cropAspect}
          onClose={() => {
            setShowCropModal(false);
            if (cropImage) {
              URL.revokeObjectURL(cropImage);
              setCropImage('');
            }
          }}
          onCrop={handleCropComplete}
          title={cropKind === 'logo' ? 'Crop Logo (Square)' : 'Crop Cover Image (16:9)'}
        />
      )}
    </div>
  );
};
