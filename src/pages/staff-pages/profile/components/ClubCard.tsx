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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Cover Image Section */}
      {club.cover_url && (
        <div
          onClick={onClick}
          className="relative w-full h-24 cursor-pointer"
        >
          {/* Cover Image */}
          <img
            src={club.cover_url}
            alt={`${club.name} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error, show gradient background
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Fallback gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 -z-10" />
        </div>
      )}

      {/* Content Card */}
      <div
        onClick={onClick}
        className={`relative bg-white cursor-pointer ${club.cover_url ? '-mt-6 rounded-t-2xl' : ''}`}
      >
        {/* Logo - positioned at the edge when cover exists */}
        <div className={`flex items-start gap-3 p-4 ${club.cover_url ? 'pt-0' : ''}`}>
          {/* Logo Container */}
          <div className={`shrink-0 ${club.cover_url ? '-mt-8' : ''}`}>
            {club.logo_url ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden border-[3px] border-white shadow-lg bg-white">
                <img
                  src={club.logo_url}
                  alt={`${club.name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">' + club.name.charAt(0).toUpperCase() + '</div>';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-[3px] border-white">
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name, Status, Address - all on white background */}
          <div className={`flex-1 min-w-0 ${club.cover_url ? 'pt-2' : ''}`}>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate text-base">{club.name}</h3>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${getStatusColor(club.status)}`}
              >
                {getStatusLabel(club.status)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{club.address}</span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight size={20} className={`text-gray-400 shrink-0 ${club.cover_url ? 'mt-2' : 'mt-1'}`} />
        </div>

        {/* Details Section */}
        <div className="px-4 pb-3 space-y-2.5">
          {/* Role Badge */}
          {userRoleInClub && (
            <div>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
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

          {/* Working Hours & Sections */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span>{club.working_hours_start && club.working_hours_end ? `${club.working_hours_start} - ${club.working_hours_end}` : (club.working_hours || '09:00 - 21:00')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              <span>{club.sections_count} {t('profile.club.sections')}</span>
            </div>
          </div>

          {/* Tags */}
          {club.tags && club.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag size={12} className="text-gray-400 shrink-0" />
              {club.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {club.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{club.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Payment warning */}
          {isPaymentDue && !isExpired && (
            <div className="flex items-center gap-2 p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg">
              <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
              <span className="text-sm text-yellow-700">
                {t('profile.club.paymentDue', { days: club.membership?.days_until_expiry ?? 0 })}
              </span>
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span className="text-sm text-red-700">
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
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            {t('profile.club.payNow')}
          </button>
        </div>
      )}
    </div>
  );
};
