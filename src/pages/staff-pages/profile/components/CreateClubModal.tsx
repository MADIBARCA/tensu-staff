import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { X, Plus, Clock, Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { TelegramIcon, InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';
import { useI18n } from '@/i18n/i18n';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CreateClubData } from '../types';
import { cities, availableTags } from '../mockData';
import { ImageCropModal } from '@/components/ImageCropModal';
import { uploadOptimizedBlob, processImageWithCrop, type ClubImageUploadResult } from '@/lib/storageUpload';
import { optimizeImage } from '@/lib/imageOptimization';
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
  const [isOptimizingLogo, setIsOptimizingLogo] = useState<boolean>(false);
  const [isOptimizingCover, setIsOptimizingCover] = useState<boolean>(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string>('');
  const [cropKind, setCropKind] = useState<'logo' | 'cover'>('logo');
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

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

  // Track scroll state inside modal
  useEffect(() => {
    const scrollContainer = document.getElementById('create-club-modal-scroll');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 0);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

    // Validate social links if provided (allow usernames)
    if (formData.telegram_link) {
      const v = formData.telegram_link.trim();
      if (v.startsWith('http') && !v.includes('t.me')) {
        newErrors.telegram_link = t('profile.createClub.errors.telegramInvalid');
      }
    }
    if (formData.instagram_link) {
      const v = formData.instagram_link.trim();
      if (v.startsWith('http') && !v.includes('instagram.com')) {
        newErrors.instagram_link = t('profile.createClub.errors.instagramInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      // Try to normalize phone to E.164 before sending (if possible)
      let formattedPhone = formData.phone;
      try {
        if (formattedPhone.trim().startsWith('+')) {
          const parsed = parsePhoneNumberFromString(formattedPhone.trim());
          if (parsed) formattedPhone = parsed.format('E.164');
        } else {
          const parsed = parsePhoneNumberFromString(formattedPhone.trim(), 'KZ' as any);
          if (parsed) formattedPhone = parsed.format('E.164');
        }
      } catch (err) {
        // keep original
      }

      const normalizeTelegram = (val?: string) => {
        if (!val) return undefined;
        const v = val.trim();
        if (!v) return undefined;
        if (v.startsWith('http')) return v;
        const nick = v.startsWith('@') ? v.slice(1) : v;
        return `https://t.me/${nick}`;
      };

      const normalizeInstagram = (val?: string) => {
        if (!val) return undefined;
        const v = val.trim();
        if (!v) return undefined;
        if (v.startsWith('http')) return v;
        const nick = v.startsWith('@') ? v.slice(1) : v;
        return `https://instagram.com/${nick}`;
      };

      const normalizeWhatsApp = (val?: string) => {
        if (!val) return undefined;
        const v = val.trim();
        if (!v) return undefined;
        if (v.startsWith('http')) return v;
        const digits = v.replace(/\D+/g, '');
        if (!digits) return undefined;
        return `https://wa.me/${digits}`;
      };

      const payload: CreateClubData = {
        ...formData,
        phone: formattedPhone,
        telegram_link: normalizeTelegram(formData.telegram_link) || undefined,
        instagram_link: normalizeInstagram(formData.instagram_link) || undefined,
        whatsapp_link: normalizeWhatsApp(formData.whatsapp_link) || undefined,
      };

      await onCreate(payload);
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
      const errorMsg = t('profile.createClub.errors.invalidFileType');
      if (kind === 'logo') {
        setLogoUploadError(errorMsg);
      } else {
        setCoverUploadError(errorMsg);
      }
      return;
    }

    // Validate file size (safety guard - increased limits)
    const maxSize = kind === 'logo' ? 10 * 1024 * 1024 : 15 * 1024 * 1024; // 10MB logo, 15MB cover
    if (file.size > maxSize) {
      const errorMsg = kind === 'logo' 
        ? t('profile.createClub.errors.logoTooLargeInput')
        : t('profile.createClub.errors.coverTooLargeInput');
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
      // Set optimizing state
      if (cropKind === 'logo') {
        setIsOptimizingLogo(true);
        setLogoUploadError('');
      } else {
        setIsOptimizingCover(true);
        setCoverUploadError('');
      }

      // Process image with crop
      const processedBlob = await processImageWithCrop(file, cropKind, croppedArea, zoom);

      // Optimize image
      const optimizedBlob = await optimizeImage(processedBlob, { kind: cropKind });

      // Clear optimizing state and start upload
      if (cropKind === 'logo') {
        setIsOptimizingLogo(false);
        setLogoUploadProgress(10);
      } else {
        setIsOptimizingCover(false);
        setCoverUploadProgress(10);
      }

      // Upload optimized blob to Firebase
      const result: ClubImageUploadResult = await uploadOptimizedBlob(
        optimizedBlob,
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
      let errorMsg: string;
      if (error instanceof Error) {
        if (error.message === 'IMAGE_TOO_LARGE_AFTER_OPTIMIZATION') {
          errorMsg = cropKind === 'logo'
            ? t('profile.createClub.errors.logoTooLargeAfterOptimization')
            : t('profile.createClub.errors.coverTooLargeAfterOptimization');
        } else if (error.message === 'INVALID_FILE_TYPE') {
          errorMsg = t('profile.createClub.errors.invalidFileType');
        } else if (error.message === 'LOGO_TOO_LARGE_INPUT' || error.message === 'COVER_TOO_LARGE_INPUT') {
          errorMsg = cropKind === 'logo'
            ? t('profile.createClub.errors.logoTooLargeInput')
            : t('profile.createClub.errors.coverTooLargeInput');
        } else {
          errorMsg = t('profile.createClub.errors.uploadFailed');
        }
      } else {
        errorMsg = t('profile.createClub.errors.uploadFailed');
      }
      
      if (cropKind === 'logo') {
        setLogoUploadError(errorMsg);
        setLogoUploadProgress(0);
        setIsOptimizingLogo(false);
      } else {
        setCoverUploadError(errorMsg);
        setCoverUploadProgress(0);
        setIsOptimizingCover(false);
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

  const isDisabled = loading || isSubmitting || isOptimizingLogo || isOptimizingCover || (logoUploadProgress > 0 && logoUploadProgress < 100) || (coverUploadProgress > 0 && coverUploadProgress < 100);

  return (
    <div id="create-club-modal-scroll" className="fixed inset-0 z-50 bg-white overflow-y-auto overflow-x-hidden">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col pt-23">
        {/* Header */}
        <div className={clsx(
          "sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled ? "pt-23" : ""
        )}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              {t('profile.createClub.workingHours')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={formData.working_hours_start}
                onChange={(e) => setFormData({ ...formData, working_hours_start: e.target.value })}
                disabled={isDisabled}
                className="flex-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              />
              <span className="text-gray-400">—</span>
              <input
                type="time"
                value={formData.working_hours_end}
                onChange={(e) => setFormData({ ...formData, working_hours_end: e.target.value })}
                disabled={isDisabled}
                className="flex-1 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
              />
            </div>
            {(errors.working_hours_start || errors.working_hours_end) && (
              <p className="text-red-500 text-xs mt-1">
                {errors.working_hours_start || errors.working_hours_end}
              </p>
            )}
          </div>

          {/* Logo Upload */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {t('profile.createClub.logo')}
              <span className="text-xs font-normal text-gray-500 ml-2">{t('profile.createClub.logoRatio')}</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Logo Preview Circle */}
              <div className="relative">
                {formData.logo_url ? (
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                      {(isOptimizingLogo || (logoUploadProgress > 0 && logoUploadProgress < 100)) && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-full">
                          <Loader2 size={24} className="animate-spin text-white" />
                          {logoUploadProgress > 0 && (
                            <span className="text-white text-xs font-bold mt-1">{logoUploadProgress}%</span>
                          )}
                        </div>
                      )}
                    </div>
                    {logoUploadProgress === 100 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('logo')}
                        disabled={isDisabled}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isDisabled}
                    className="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isOptimizingLogo ? (
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium">1:1</span>
                      </>
                    )}
                  </button>
                )}
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
          </div>

              {/* Info & Actions */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-2">{t('profile.createClub.uploadHint')}</p>
                <p className="text-xs text-gray-400">{t('profile.createClub.logoFormat')}</p>
                {formData.logo_url && logoUploadProgress === 100 && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isDisabled}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('profile.createClub.changeLogo')}
                  </button>
                )}
              </div>
            </div>
            {logoUploadError && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-600 text-xs font-medium">{logoUploadError}</p>
              </div>
            )}
          </div>

          {/* Cover Upload */}
          <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {t('profile.createClub.cover')}
              <span className="text-xs font-normal text-gray-500 ml-2">{t('profile.createClub.coverRatio')}</span>
            </label>
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
            {formData.cover_url ? (
              <div className="space-y-3">
                <div className="relative group">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-white shadow-xl bg-gray-100">
                    <img
                      src={formData.cover_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    {(isOptimizingCover || (coverUploadProgress > 0 && coverUploadProgress < 100)) && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-white mb-2" />
                        <div className="text-white text-sm font-bold">{isOptimizingCover ? t('profile.createClub.optimizingCover') : `${coverUploadProgress}%`}</div>
                        {coverUploadProgress > 0 && (
                          <div className="w-32 h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-300"
                              style={{ width: `${coverUploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {coverUploadProgress === 100 && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={isDisabled}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors"
                        >
                          <Upload size={16} className="text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('cover')}
                          disabled={isDisabled}
                          className="p-2 bg-red-500/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">{t('profile.createClub.coverFormat')}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isDisabled}
                className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                  coverUploadError
                    ? 'border-red-300 bg-red-50'
                    : isOptimizingCover || (coverUploadProgress > 0 && coverUploadProgress < 100)
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white/50 hover:border-blue-400 hover:bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isOptimizingCover ? (
                  <>
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">{t('profile.createClub.optimizingCover')}</span>
                  </>
                ) : coverUploadProgress > 0 && coverUploadProgress < 100 ? (
                  <>
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">{coverUploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ImageIcon size={20} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{t('profile.createClub.uploadCover')}</span>
                    <span className="text-xs text-gray-400">16:9</span>
                  </>
                )}
              </button>
            )}
            {coverUploadError && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-600 text-xs font-medium">{coverUploadError}</p>
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
              type="text"
              value={formData.telegram_link}
                onChange={(e) => {
                  setFormData({ ...formData, telegram_link: e.target.value });
                  setErrors({ ...errors, telegram_link: '' });
                }}
              disabled={isDisabled}
                className={`flex-1 border rounded-lg p-2.5 text-sm text-gray-900 caret-black disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.telegram_link ? 'border-red-500' : 'border-gray-200'
              }`}
                placeholder={t('profile.createClub.placeholders.telegram')}
            />
            </div>
            {errors.telegram_link && (
              <p className="text-red-500 text-xs ml-7">{errors.telegram_link}</p>
            )}
            
            {/* Instagram */}
            <div className="flex items-center gap-2">
              <InstagramIcon size={18} className="text-pink-500 shrink-0" />
            <input
              type="text"
              value={formData.instagram_link}
                onChange={(e) => {
                  setFormData({ ...formData, instagram_link: e.target.value });
                  setErrors({ ...errors, instagram_link: '' });
                }}
              disabled={isDisabled}
                className={`flex-1 border rounded-lg p-2.5 text-sm text-gray-900 caret-black disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.instagram_link ? 'border-red-500' : 'border-gray-200'
              }`}
                placeholder={t('profile.createClub.placeholders.instagram')}
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
                placeholder={t('profile.createClub.placeholders.whatsapp')}
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
          kind={cropKind}
          onClose={() => {
            setShowCropModal(false);
            if (cropImage) {
              URL.revokeObjectURL(cropImage);
              setCropImage('');
            }
          }}
          onCrop={handleCropComplete}
        />
      )}
    </div>
  );
};
