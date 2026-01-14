import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { X, Calendar, CreditCard, Tag, Clock, Loader2, ChevronDown, ChevronUp, Sparkles, Gift, Percent } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { tariffsApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { Student, ExtendMembershipData } from '../types';
import type { TariffResponse } from '@/functions/axios/responses';

interface ExtendMembershipModalProps {
  student: Student;
  onClose: () => void;
  onExtend: (data: ExtendMembershipData) => void;
}

type PaymentStatus = 'paid' | 'pending' | 'free';

export const ExtendMembershipModal: React.FC<ExtendMembershipModalProps> = ({
  student,
  onClose,
  onExtend,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<TariffResponse | null>(null);
  const [customDays, setCustomDays] = useState<number>(30);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [note, setNote] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Track scroll state inside modal
  useEffect(() => {
    const scrollContainer = document.getElementById('extend-membership-modal-scroll');
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
          // Filter tariffs that apply to this student's club
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
              setCustomPrice(currentTariff.price);
              setCustomDays(currentTariff.validity_days || 30);
            }
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

  // Calculate new end date
  const newEndDate = useMemo(() => {
    const currentEndDate = student.membership
      ? new Date(student.membership.end_date)
      : new Date();
    const days = selectedTariff?.validity_days || customDays;
    const newDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    return newDate;
  }, [student.membership, selectedTariff, customDays]);

  // Get final price
  const finalPrice = useMemo(() => {
    if (paymentStatus === 'free') return 0;
    if (useCustomPrice) return customPrice;
    return selectedTariff?.price || 0;
  }, [paymentStatus, useCustomPrice, customPrice, selectedTariff]);

  // Discount percentage if using custom price
  const discountPercent = useMemo(() => {
    if (!selectedTariff || !useCustomPrice || paymentStatus === 'free') return 0;
    const originalPrice = selectedTariff.price;
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - customPrice) / originalPrice) * 100);
  }, [selectedTariff, useCustomPrice, customPrice, paymentStatus]);

  const handleTariffSelect = (tariff: TariffResponse) => {
    setSelectedTariff(tariff);
    setCustomPrice(tariff.price);
    setCustomDays(tariff.validity_days || 30);
    setUseCustomPrice(false);
  };

  const handleSubmit = async () => {
    if (!selectedTariff || !student.membership) return;

    setSubmitting(true);
    try {
      const data: ExtendMembershipData = {
        enrollment_id: student.membership.id,
        tariff_id: selectedTariff.id,
        days: selectedTariff.validity_days || customDays,
        tariff_name: selectedTariff.name,
        price: selectedTariff.price, // Original tariff price
        custom_price: useCustomPrice || paymentStatus === 'free' ? finalPrice : undefined,
        payment_status: paymentStatus,
        note: note.trim() || undefined,
      };
      
      await onExtend(data);
    } catch (error) {
      console.error('Error extending membership:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  const getPaymentTypeLabel = (type: string): string => {
    switch (type) {
      case 'monthly': return t('students.extend.paymentType.monthly');
      case 'session_pack': return t('students.extend.paymentType.sessionPack');
      case 'semi_annual': return t('students.extend.paymentType.semiAnnual');
      case 'annual': return t('students.extend.paymentType.annual');
      default: return type;
    }
  };

  return (
    <div id="extend-membership-modal-scroll" className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col pt-23">
        {/* Header */}
        <div className={clsx(
          "sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200",
          "transition-[padding-top] duration-300 ease-out will-change-[padding-top]",
          isScrolled && "pt-23"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('students.extend.title')}
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
          {/* Current Membership Info */}
          {student.membership && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">{t('students.extend.currentMembership')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('students.extend.currentTariff')}</span>
                  <span className="font-medium text-gray-900">{student.membership.tariff_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('students.extend.currentEnd')}</span>
                  <span className="font-medium text-gray-900">
                    {new Date(student.membership.end_date).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('students.extend.currentPrice')}</span>
                  <span className="font-medium text-gray-900">{formatPrice(student.membership.price)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tariff Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {t('students.extend.selectTariff')}
            </label>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-500" />
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
                    onClick={() => handleTariffSelect(tariff)}
                    className={clsx(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      selectedTariff?.id === tariff.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{tariff.name}</span>
                          {tariff.id === student.membership?.tariff_id && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                              {t('students.extend.current')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {tariff.validity_days || 30} {t('students.extend.days')}
                          </span>
                          <span>{getPaymentTypeLabel(tariff.payment_type)}</span>
                        </div>
                        {tariff.features && tariff.features.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tariff.features.slice(0, 3).map((feature, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full">
                                {feature}
                              </span>
                            ))}
                            {tariff.features.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{tariff.features.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-lg text-gray-900">{formatPrice(tariff.price)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Price Section */}
          {selectedTariff && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-500" />
                  <span className="font-medium text-gray-900">{t('students.extend.customOptions')}</span>
                </div>
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                  {/* Custom Price Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{t('students.extend.useCustomPrice')}</span>
                    </div>
                    <button
                      onClick={() => setUseCustomPrice(!useCustomPrice)}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        useCustomPrice ? "bg-blue-500" : "bg-gray-300"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        useCustomPrice ? "translate-x-7" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {/* Custom Price Input */}
                  {useCustomPrice && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        {t('students.extend.customPrice')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full border border-gray-200 rounded-xl p-3 pr-12 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₸</span>
                      </div>
                      {discountPercent > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-gray-500 line-through">{formatPrice(selectedTariff.price)}</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            -{discountPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      {t('students.extend.paymentStatus')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['paid', 'pending', 'free'] as PaymentStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setPaymentStatus(status)}
                          className={clsx(
                            "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                            paymentStatus === status
                              ? status === 'paid' ? "bg-green-500 text-white"
                                : status === 'pending' ? "bg-amber-500 text-white"
                                : "bg-purple-500 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {status === 'free' && <Gift size={14} />}
                          {t(`students.extend.payment.${status}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      {t('students.extend.note')}
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('students.extend.notePlaceholder')}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent caret-black"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New End Date Preview */}
          {selectedTariff && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('students.extend.newEnd')}</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(newEndDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{t('students.extend.totalPrice')}</p>
                  <p className={clsx(
                    "text-xl font-bold",
                    paymentStatus === 'free' ? "text-purple-600" : "text-gray-900"
                  )}>
                    {paymentStatus === 'free' ? t('students.extend.free') : formatPrice(finalPrice)}
                  </p>
                </div>
              </div>
            </div>
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
            disabled={!selectedTariff || submitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {t('students.extend.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
