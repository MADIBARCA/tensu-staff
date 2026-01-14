import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { X, Tag, Percent, Calendar, Loader2, Sparkles, Info, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { tariffsApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { Student } from '../types';
import type { TariffResponse } from '@/functions/axios/responses';

interface SetIndividualPriceModalProps {
  student: Student;
  onClose: () => void;
  onSave: (data: IndividualPriceData) => void;
}

export interface IndividualPriceData {
  student_id: number;
  tariff_id: number;
  custom_price: number;
  reason: string;
  valid_until?: string;
}

// Common discount reasons
const DISCOUNT_REASONS = [
  { key: 'female_discount', discount: 50 },
  { key: 'family_member', discount: 30 },
  { key: 'student_discount', discount: 20 },
  { key: 'loyal_customer', discount: 15 },
  { key: 'group_discount', discount: 25 },
  { key: 'promotional', discount: 0 },
  { key: 'other', discount: 0 },
];

export const SetIndividualPriceModal: React.FC<SetIndividualPriceModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<TariffResponse | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [fixedPrice, setFixedPrice] = useState<number>(0);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Track scroll state inside modal
  useEffect(() => {
    const scrollContainer = document.getElementById('set-price-modal-scroll');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 0);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Load tariffs for the student's club
  useEffect(() => {
    const loadTariffs = async () => {
      if (!initDataRaw) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await tariffsApi.getMy(initDataRaw);
        if (response.data) {
          const applicableTariffs = response.data.filter(tariff => 
            tariff.active && (
              tariff.club_ids.includes(student.club_id) ||
              (student.section_id && tariff.section_ids.includes(student.section_id)) ||
              (student.group_id && tariff.group_ids.includes(student.group_id))
            )
          );
          setTariffs(applicableTariffs);
          
          // Pre-select current tariff if available
          if (student.membership?.tariff_id) {
            const currentTariff = applicableTariffs.find(t => t.id === student.membership?.tariff_id);
            if (currentTariff) {
              setSelectedTariff(currentTariff);
              setFixedPrice(currentTariff.price);
            }
          } else if (applicableTariffs.length > 0) {
            setSelectedTariff(applicableTariffs[0]);
            setFixedPrice(applicableTariffs[0].price);
          }
        }
      } catch (error) {
        console.error('Error loading tariffs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTariffs();
  }, [initDataRaw, student.club_id, student.section_id, student.group_id, student.membership?.tariff_id]);

  // Calculate final price
  const finalPrice = useMemo(() => {
    if (!selectedTariff) return 0;
    
    if (discountType === 'fixed') {
      return fixedPrice;
    }
    
    const discount = (selectedTariff.price * discountValue) / 100;
    return Math.max(0, Math.round(selectedTariff.price - discount));
  }, [selectedTariff, discountType, discountValue, fixedPrice]);

  // Calculate discount percentage for display
  const displayDiscount = useMemo(() => {
    if (!selectedTariff || selectedTariff.price <= 0) return 0;
    return Math.round(((selectedTariff.price - finalPrice) / selectedTariff.price) * 100);
  }, [selectedTariff, finalPrice]);

  // Handle preset discount selection
  const handlePresetSelect = (preset: typeof DISCOUNT_REASONS[0]) => {
    setSelectedReason(preset.key);
    if (preset.discount > 0) {
      setDiscountType('percentage');
      setDiscountValue(preset.discount);
    }
  };

  // Update fixed price when tariff changes
  useEffect(() => {
    if (selectedTariff && discountType === 'fixed') {
      setFixedPrice(selectedTariff.price);
    }
  }, [selectedTariff]);

  const handleSubmit = async () => {
    if (!selectedTariff) return;

    const reason = selectedReason === 'other' ? customReason : t(`students.individualPrice.reasons.${selectedReason}`);
    
    setSubmitting(true);
    try {
      await onSave({
        student_id: student.id,
        tariff_id: selectedTariff.id,
        custom_price: finalPrice,
        reason: reason,
        valid_until: hasExpiry ? expiryDate : undefined,
      });
    } catch (error) {
      console.error('Error setting individual price:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  const isValid = selectedTariff && selectedReason && (selectedReason !== 'other' || customReason.trim());

  return (
    <div id="set-price-modal-scroll" className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col pt-23">
        {/* Header */}
        <div className={clsx(
          "sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled && "pt-23"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('students.individualPrice.title')}
              </h2>
              <p className="text-sm text-gray-500">{student.first_name} {student.last_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-purple-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                {t('students.individualPrice.description')}
              </p>
            </div>
          </div>

          {/* Tariff Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {t('students.individualPrice.selectTariff')}
            </label>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>
            ) : tariffs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Tag size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">{t('students.extend.noTariffs')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tariffs.map((tariff) => (
                  <button
                    key={tariff.id}
                    onClick={() => {
                      setSelectedTariff(tariff);
                      setFixedPrice(tariff.price);
                    }}
                    className={clsx(
                      "w-full text-left p-3 rounded-xl border-2 transition-all",
                      selectedTariff?.id === tariff.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{tariff.name}</span>
                      <span className="font-semibold text-gray-900">{formatPrice(tariff.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discount Type */}
          {selectedTariff && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('students.individualPrice.discountType')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={clsx(
                      "p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                      discountType === 'percentage'
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Percent size={18} />
                    <span className="font-medium">{t('students.individualPrice.percentage')}</span>
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={clsx(
                      "p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                      discountType === 'fixed'
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Tag size={18} />
                    <span className="font-medium">{t('students.individualPrice.fixedPrice')}</span>
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                {discountType === 'percentage' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      {t('students.individualPrice.discountPercent')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="w-16 text-center">
                        <span className="text-xl font-bold text-purple-600">{discountValue}%</span>
                      </div>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-2 mt-3">
                      {[10, 20, 30, 50].map((val) => (
                        <button
                          key={val}
                          onClick={() => setDiscountValue(val)}
                          className={clsx(
                            "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
                            discountValue === val
                              ? "bg-purple-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('students.individualPrice.setPrice')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={fixedPrice}
                        onChange={(e) => setFixedPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full border border-gray-200 rounded-xl p-3 pr-12 text-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent caret-black"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₸</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('students.individualPrice.reason')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_REASONS.map((reason) => (
                    <button
                      key={reason.key}
                      onClick={() => handlePresetSelect(reason)}
                      className={clsx(
                        "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                        selectedReason === reason.key
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {t(`students.individualPrice.reasons.${reason.key}`)}
                      {reason.discount > 0 && (
                        <span className="ml-1 opacity-70">(-{reason.discount}%)</span>
                      )}
                    </button>
                  ))}
                </div>
                
                {selectedReason === 'other' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={t('students.individualPrice.customReasonPlaceholder')}
                    className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent caret-black"
                  />
                )}
              </div>

              {/* Expiry Date */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {t('students.individualPrice.setExpiry')}
                    </span>
                  </div>
                  <button
                    onClick={() => setHasExpiry(!hasExpiry)}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      hasExpiry ? "bg-purple-500" : "bg-gray-300"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      hasExpiry ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>
                
                {hasExpiry && (
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Price Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('students.individualPrice.standardPrice')}</p>
                    <p className="text-gray-500 line-through">{formatPrice(selectedTariff.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t('students.individualPrice.individualPrice')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(finalPrice)}</p>
                  </div>
                </div>
                {displayDiscount > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {t('students.individualPrice.saving')} {displayDiscount}% ({formatPrice(selectedTariff.price - finalPrice)})
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-4 pb-8 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/25 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            {t('students.individualPrice.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
