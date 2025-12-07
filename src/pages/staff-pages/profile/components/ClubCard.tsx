import React from 'react';
import { MapPin, Clock, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club } from '../types';

interface ClubCardProps {
  club: Club;
  onClick: () => void;
  onPayment?: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, onClick, onPayment }) => {
  const { t } = useI18n();

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return t('profile.club.status.active');
      case 'frozen':
        return t('profile.club.status.frozen');
      case 'pending':
        return t('profile.club.status.pending');
      case 'deactivated':
        return t('profile.club.status.deactivated');
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'frozen':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'deactivated':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isPaymentDue = club.membership && club.membership.days_until_expiry <= 7;
  const isExpired = club.membership && club.membership.days_until_expiry <= 0;
  const showPayButton = isPaymentDue || club.status === 'frozen' || club.status === 'pending';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        onClick={onClick}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{club.name}</h3>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(club.status)}`}
              >
                {getStatusLabel(club.status)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={14} />
              <span className="truncate">{club.address}</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{club.working_hours}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{club.sections_count} {t('profile.club.sections')}</span>
          </div>
        </div>

        {/* Payment warning */}
        {isPaymentDue && !isExpired && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <AlertTriangle size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-700">
              {t('profile.club.paymentDue', { days: club.membership?.days_until_expiry })}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm text-red-700">
              {t('profile.club.paymentOverdue')}
            </span>
          </div>
        )}
      </div>

      {/* Payment Button */}
      {showPayButton && onPayment && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPayment();
            }}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('profile.club.payNow')}
          </button>
        </div>
      )}
    </div>
  );
};
