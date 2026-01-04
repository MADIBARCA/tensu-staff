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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Cover Image */}
      {club.cover_url && (
        <div
          onClick={onClick}
          className="relative w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden cursor-pointer"
        >
          <img
            src={club.cover_url}
            alt={`${club.name} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error, show gradient background
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Stronger gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/70" />
        </div>
      )}

      {/* Header with Content Card */}
      <div
        onClick={onClick}
        className={`cursor-pointer transition-colors ${club.cover_url ? 'relative' : ''}`}
      >
        {/* Content Card - overlaps cover image */}
        <div className={`${club.cover_url ? '-mt-20 relative z-10 mx-4' : ''} bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow`}>
          {/* Logo and Name Section */}
          <div className="flex items-start gap-3 mb-3">
            {/* Logo */}
            {club.logo_url ? (
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-white ring-2 ring-gray-100">
                  <img
                    src={club.logo_url}
                    alt={`${club.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">' + club.name.charAt(0).toUpperCase() + '</div>';
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-gray-100 shrink-0">
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name and Status */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-bold text-lg text-gray-900 truncate">{club.name}</h3>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${getStatusColor(club.status)}`}
                >
                  {getStatusLabel(club.status)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-2">
                <MapPin size={14} className="shrink-0 text-gray-500" />
                <span className="truncate font-medium">{club.address}</span>
              </div>
              {/* User Role Badge */}
              {userRoleInClub && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
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
            <ChevronRight size={20} className="text-gray-400 shrink-0 mt-1" />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-500" />
              <span className="font-medium">{club.working_hours_start && club.working_hours_end ? `${club.working_hours_start} - ${club.working_hours_end}` : (club.working_hours || '09:00 - 21:00')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-500" />
              <span className="font-medium">{club.sections_count} {t('profile.club.sections')}</span>
            </div>
          </div>

          {/* Tags */}
          {club.tags && club.tags.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <Tag size={12} className="text-gray-400 shrink-0" />
              {club.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
              {club.tags.length > 4 && (
                <span className="text-xs text-gray-500 font-medium">
                  +{club.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Payment warning */}
          {isPaymentDue && !isExpired && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
              <span className="text-sm text-yellow-700 font-medium">
                {t('profile.club.paymentDue', { days: club.membership?.days_until_expiry ?? 0 })}
              </span>
            </div>
          )}

          {isExpired && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span className="text-sm text-red-700 font-medium">
                {t('profile.club.paymentOverdue')}
              </span>
            </div>
          )}
        </div>
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
