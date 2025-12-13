import React, { useMemo } from 'react';
import { MapPin, Clock, Users, AlertTriangle, ChevronRight, Tag } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface ClubCardProps {
  club: Club;
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onClick: () => void;
  onPayment?: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, clubRoles, currentUser, onClick, onPayment }) => {
  const { t } = useI18n();

  // Determine user role for this specific club
  const userRoleInClub = useMemo(() => {
    if (!currentUser) return null;
    const clubRole = clubRoles.find(cr => cr.club.id === club.id);
    if (!clubRole) return null;
    
    if (clubRole.role === 'owner' || clubRole.is_owner) {
      return 'owner';
    } else if (clubRole.role === 'admin') {
      return 'admin';
    } else if (clubRole.role === 'coach') {
      return 'coach';
    }
    return null;
  }, [club.id, clubRoles, currentUser]);

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
            {/* User Role Badge */}
            {userRoleInClub && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  userRoleInClub === 'owner' 
                    ? 'bg-purple-100 text-purple-700' 
                    : userRoleInClub === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {userRoleInClub === 'owner' && t('profile.club.role.owner')}
                  {userRoleInClub === 'admin' && t('profile.club.role.admin')}
                  {userRoleInClub === 'coach' && t('profile.club.role.coach')}
                </span>
              </div>
            )}
          </div>
          <ChevronRight size={20} className="text-gray-400 shrink-0" />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{club.working_hours_start && club.working_hours_end ? `${club.working_hours_start} - ${club.working_hours_end}` : (club.working_hours || '09:00 - 21:00')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{club.sections_count} {t('profile.club.sections')}</span>
          </div>
        </div>

        {/* Tags */}
        {club.tags && club.tags.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <Tag size={12} className="text-gray-400 shrink-0" />
            {club.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 4 && (
              <span className="text-xs text-gray-400">
                +{club.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Payment warning */}
        {isPaymentDue && !isExpired && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <AlertTriangle size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-700">
              {t('profile.club.paymentDue', { days: club.membership?.days_until_expiry ?? 0 })}
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
