import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { 
  Tag, 
  Check, 
  X, 
  Clock, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  User,
  Phone,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Percent,
  RefreshCw
} from 'lucide-react';
import { priceRequestsApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { PriceRequestResponse, PriceRequestStatus } from '@/functions/axios/responses';

interface PriceRequestsSectionProps {
  clubId?: number;
}

export const PriceRequestsSection: React.FC<PriceRequestsSectionProps> = ({ clubId }) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  const [requests, setRequests] = useState<PriceRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState<number | null>(null);
  const [approvedPrice, setApprovedPrice] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');

  const loadRequests = async () => {
    if (!initDataRaw) return;
    
    setLoading(true);
    try {
      const response = await priceRequestsApi.getList({
        page: 1,
        size: 100,
        club_id: clubId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }, initDataRaw);
      
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load price requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [initDataRaw, clubId, statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async (requestId: number) => {
    if (!initDataRaw || !approvedPrice) return;
    
    setProcessingId(requestId);
    try {
      await priceRequestsApi.approve(requestId, {
        approved_price: parseFloat(approvedPrice),
        response_message: responseMessage.trim() || undefined,
      }, initDataRaw);
      
      window.Telegram?.WebApp?.showAlert(t('priceRequests.approveSuccess'));
      setApproveModalOpen(null);
      setApprovedPrice('');
      setResponseMessage('');
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      window.Telegram?.WebApp?.showAlert(t('priceRequests.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    if (!initDataRaw) return;
    
    setProcessingId(requestId);
    try {
      await priceRequestsApi.decline(requestId, {
        response_message: responseMessage.trim() || undefined,
      }, initDataRaw);
      
      window.Telegram?.WebApp?.showAlert(t('priceRequests.declineSuccess'));
      setExpandedId(null);
      setResponseMessage('');
      await loadRequests();
    } catch (error) {
      console.error('Failed to decline request:', error);
      window.Telegram?.WebApp?.showAlert(t('priceRequests.error'));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: PriceRequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
            <Clock size={12} />
            {t('priceRequests.status.pending')}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
            <CheckCircle size={12} />
            {t('priceRequests.status.approved')}
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
            <XCircle size={12} />
            {t('priceRequests.status.declined')}
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Tag size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('priceRequests.title')}</h3>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-600">{t('priceRequests.pendingCount', { count: pendingCount })}</p>
            )}
          </div>
        </div>
        <button
          onClick={loadRequests}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['pending', 'approved', 'declined', 'all'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === filter
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`priceRequests.filter.${filter}`)}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Tag size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">{t('priceRequests.empty')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('priceRequests.emptyDescription')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                request.status === 'pending' ? 'border-amber-200' : 'border-gray-200'
              }`}
            >
              {/* Main row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">{request.student_name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{request.tariff_name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-400">{formatDate(request.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{t('priceRequests.standardPrice')}</p>
                      <p className="font-semibold text-gray-900">{formatPrice(request.standard_price)}</p>
                      {request.requested_price && (
                        <p className="text-xs text-violet-600 font-medium">
                          {t('priceRequests.requested')}: {formatPrice(request.requested_price)}
                        </p>
                      )}
                    </div>
                    {expandedId === request.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === request.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                  {/* Reason */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{t('priceRequests.reason')}</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} />
                        {t('priceRequests.message')}
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                    </div>
                  )}

                  {/* Contact */}
                  {request.student_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      <span>{request.student_phone}</span>
                    </div>
                  )}

                  {/* Approved info */}
                  {request.status === 'approved' && request.approved_price && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-sm text-emerald-700">
                        {t('priceRequests.approvedAt', { price: formatPrice(request.approved_price) })}
                      </span>
                    </div>
                  )}

                  {/* Response message */}
                  {request.response_message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('priceRequests.responseMessage')}</p>
                      <p className="text-sm text-gray-700">{request.response_message}</p>
                    </div>
                  )}

                  {/* Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="space-y-3">
                      {/* Approve modal */}
                      {approveModalOpen === request.id ? (
                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              {t('priceRequests.setApprovedPrice')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={approvedPrice}
                                onChange={(e) => setApprovedPrice(e.target.value)}
                                placeholder={request.requested_price?.toString() || request.standard_price.toString()}
                                className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:border-violet-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₸</span>
                            </div>
                            {approvedPrice && parseFloat(approvedPrice) > 0 && (
                              <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                                <Percent size={10} />
                                {t('priceRequests.discountPercent', { 
                                  percent: Math.round((1 - parseFloat(approvedPrice) / request.standard_price) * 100) 
                                })}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              {t('priceRequests.responseToStudent')}
                            </label>
                            <textarea
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              placeholder={t('priceRequests.responsePlaceholder')}
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-violet-500 resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setApproveModalOpen(null);
                                setApprovedPrice('');
                                setResponseMessage('');
                              }}
                              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={!approvedPrice || parseFloat(approvedPrice) <= 0 || processingId === request.id}
                              className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === request.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                              {t('priceRequests.confirmApprove')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setApproveModalOpen(request.id);
                              setApprovedPrice(request.requested_price?.toString() || '');
                            }}
                            disabled={processingId === request.id}
                            className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                            {t('priceRequests.approve')}
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {processingId === request.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                            {t('priceRequests.decline')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
