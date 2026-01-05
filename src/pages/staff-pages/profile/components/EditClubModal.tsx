import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { X, Loader2, MapPin, Phone, Clock, Tag, Upload, Trash2 } from 'lucide-react';
import { TelegramIcon, InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';
import { useI18n } from '@/i18n/i18n';
import { clubsApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { Club } from '../types';
import type { UpdateClubRequest } from '@/functions/axios/requests';
import { isValidPhoneNumber, parsePhoneNumber, AsYouType } from 'libphonenumber-js';
import { ImageCropModal } from '@/components/ImageCropModal';
import { uploadOptimizedBlob, processImageWithCrop, type ClubImageUploadResult } from '@/lib/storageUpload';
import { optimizeImage } from '@/lib/imageOptimization';
import type { Area } from 'react-easy-crop';

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
    logo_url: club.logo_url || '',
    cover_url: club.cover_url || '',
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

  // Image upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(club.logo_url || '');
  const [coverPreview, setCoverPreview] = useState<string>(club.cover_url || '');
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky header
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const handleScroll = () => {
      const scrollY = modalElement.scrollTop;
      setIsScrolled(scrollY > 0);
    };

    modalElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => modalElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
      if (cropImage) URL.revokeObjectURL(cropImage);
    };
  }, [logoPreview, coverPreview, cropImage]);

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
        { kind: cropKind, clubKey: club.id.toString() },
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
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview('');
      setLogoUploadProgress(0);
      setLogoUploadError('');
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    } else {
      setFormData({ ...formData, cover_url: '' });
      setCoverFile(null);
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
      setCoverPreview('');
      setCoverUploadProgress(0);
      setCoverUploadError('');
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const isDisabled = isSubmitting || isOptimizingLogo || isOptimizingCover || (logoUploadProgress > 0 && logoUploadProgress < 100) || (coverUploadProgress > 0 && coverUploadProgress < 100);

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
        logo_url: formData.logo_url || undefined,
        cover_url: formData.cover_url || undefined,
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
    <div ref={modalRef} className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header */}
        <div className={clsx(
          "sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 overflow-hidden",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled ? "pt-20" : "pt-0"
        )}>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.editClub.title')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          {/* Logo Upload */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              {t('profile.createClub.logo')}
              <span className="text-xs font-normal text-gray-500 ml-2">{t('profile.createClub.logoRatio')}</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Logo Preview Circle */}
              <div className="relative">
                {logoPreview ? (
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                      <img
                        src={logoPreview}
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
                    {!isOptimizingLogo && (logoUploadProgress === 0 || logoUploadProgress === 100) && (
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
                {logoPreview && !isOptimizingLogo && (logoUploadProgress === 0 || logoUploadProgress === 100) && (
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
            {coverPreview ? (
              <div className="space-y-3">
                <div className="relative group">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-white shadow-xl bg-gray-100">
                    <img
                      src={coverPreview}
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
                    {!isOptimizingCover && (coverUploadProgress === 0 || coverUploadProgress === 100) && (
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
                      <Upload size={20} className="text-white" />
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
                  {t(`profile.createClub.tags.${tag}`)}
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
