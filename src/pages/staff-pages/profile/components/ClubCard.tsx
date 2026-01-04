import React, { useMemo } from 'react';
import { MapPin, Clock, Users, AlertTriangle, ChevronRight, Phone, GraduationCap } from 'lucide-react';
import { TelegramIcon, InstagramIcon, WhatsAppIcon } from '@/components/SocialIcons';
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
        return 'bg-emerald-500 text-white';
      case 'frozen':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'deactivated':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getRoleBadgeStyle = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'admin':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'coach':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isPaymentDue = club.membership && club.membership.days_until_expiry <= 7;
  const isExpired = club.membership && club.membership.days_until_expiry <= 0;
  const showPayButton = isPaymentDue || club.status === 'frozen' || club.status === 'pending';
  const hasSocialLinks = club.telegram_link || club.instagram_link || club.whatsapp_link;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      {/* Cover Image with Gradient Overlay */}
      <div
        onClick={onClick}
        className="relative w-full h-28 cursor-pointer overflow-hidden"
      >
        {club.cover_url ? (
          <img
            src={club.cover_url}
            alt={`${club.name} cover`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {/* Fallback/Overlay gradient */}
        <div className={`absolute inset-0 ${club.cover_url ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent' : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500'}`} />
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg ${getStatusColor(club.status)}`}>
            {getStatusLabel(club.status)}
          </span>
        </div>

        {/* Role Badge - Top Left */}
        {userRoleInClub && (
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg ${getRoleBadgeStyle(userRoleInClub)}`}>
              {userRoleInClub === 'owner' && t('profile.club.role.owner')}
              {userRoleInClub === 'admin' && t('profile.club.role.admin')}
              {userRoleInClub === 'coach' && t('profile.club.role.coach')}
            </span>
          </div>
        )}

        {/* Club Name on Cover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-8">
          <div className="flex items-end gap-3">
            {/* Logo */}
            <div className="shrink-0">
              {club.logo_url ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-[3px] border-white shadow-xl bg-white">
                  <img
                    src={club.logo_url}
                    alt={`${club.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl">${club.name.charAt(0).toUpperCase()}</div>`;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-blue-600 font-bold text-xl shadow-xl border-[3px] border-white">
                  {club.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Name and Location */}
            <div className="flex-1 min-w-0 mb-1">
              <h3 className="font-bold text-white text-lg truncate drop-shadow-lg">{club.name}</h3>
              <div className="flex items-center gap-1 text-white/90 text-sm">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{club.city}</span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight size={24} className="text-white/80 shrink-0 mb-2" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div onClick={onClick} className="cursor-pointer">
        {/* Address */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-sm text-gray-600 line-clamp-1">{club.address}</p>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Working Hours */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-700">
              {club.working_hours_start && club.working_hours_end 
                ? `${club.working_hours_start} - ${club.working_hours_end}` 
                : (club.working_hours || '09:00 - 21:00')}
            </span>
          </div>
          
          {/* Sections */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
            <Users size={14} className="text-purple-500" />
            <span className="text-xs font-medium text-gray-700">{club.sections_count}</span>
          </div>

          {/* Students */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
            <GraduationCap size={14} className="text-green-500" />
            <span className="text-xs font-medium text-gray-700">{club.students_count}</span>
          </div>
        </div>

        {/* Tags */}
        {club.tags && club.tags.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-1.5 flex-wrap">
            {club.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 4 && (
              <span className="text-[10px] text-gray-400 font-medium">
                +{club.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Social Links & Phone */}
        {(hasSocialLinks || club.phone) && (
          <div className="px-4 py-2 flex items-center gap-2">
            {club.phone && (
              <a
                href={`tel:${club.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Phone size={12} className="text-gray-600" />
                <span className="text-[10px] font-medium text-gray-600">{t('profile.club.call')}</span>
              </a>
            )}
            {club.telegram_link && (
              <a
                href={club.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 rounded-full transition-colors"
              >
                <TelegramIcon size={14} className="text-[#229ED9]" />
              </a>
            )}
            {club.instagram_link && (
              <a
                href={club.instagram_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors"
              >
                <InstagramIcon size={14} className="text-pink-500" />
              </a>
            )}
            {club.whatsapp_link && (
              <a
                href={club.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-green-50 hover:bg-green-100 rounded-full transition-colors"
              >
                <WhatsAppIcon size={14} className="text-green-500" />
              </a>
            )}
          </div>
        )}

        {/* Payment warnings */}
        {isPaymentDue && !isExpired && (
          <div className="mx-4 mb-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <span className="text-sm text-amber-700 font-medium">
              {t('profile.club.paymentDue', { days: club.membership?.days_until_expiry ?? 0 })}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="mx-4 mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <span className="text-sm text-red-700 font-medium">
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
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold text-sm shadow-lg shadow-blue-500/25"
          >
            {t('profile.club.payNow')}
          </button>
        </div>
      )}
    </div>
  );
};
