import React, { useMemo } from 'react';
import { Crown, Shield, Dumbbell, Building2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface UserRoleSummaryProps {
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
}

export const UserRoleSummary: React.FC<UserRoleSummaryProps> = ({
  clubRoles,
  currentUser,
}) => {
  const { t } = useI18n();

  // Calculate role counts
  const roleStats = useMemo(() => {
    const stats = {
      owner: 0,
      admin: 0,
      coach: 0,
      ownerClubs: [] as string[],
      adminClubs: [] as string[],
      coachClubs: [] as string[],
    };

    clubRoles.forEach(cr => {
      if (cr.role === 'owner' || cr.is_owner) {
        stats.owner++;
        stats.ownerClubs.push(cr.club.name);
      } else if (cr.role === 'admin') {
        stats.admin++;
        stats.adminClubs.push(cr.club.name);
      } else if (cr.role === 'coach') {
        stats.coach++;
        stats.coachClubs.push(cr.club.name);
      }
    });

    return stats;
  }, [clubRoles]);

  // Determine primary role (highest level)
  const primaryRole = useMemo(() => {
    if (roleStats.owner > 0) return 'owner';
    if (roleStats.admin > 0) return 'admin';
    if (roleStats.coach > 0) return 'coach';
    return null;
  }, [roleStats]);

  // Check if user has multiple different roles
  const hasMultipleRoles = useMemo(() => {
    const activeRoles = [
      roleStats.owner > 0,
      roleStats.admin > 0,
      roleStats.coach > 0,
    ].filter(Boolean).length;
    return activeRoles > 1;
  }, [roleStats]);

  if (!currentUser || clubRoles.length === 0) return null;

  const totalClubs = clubRoles.length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
      {/* User greeting with primary role */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          primaryRole === 'owner' 
            ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
            : primaryRole === 'admin'
            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
            : 'bg-gradient-to-br from-green-500 to-green-700'
        }`}>
          {currentUser.photo_url ? (
            <img 
              src={currentUser.photo_url} 
              alt="" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            primaryRole === 'owner' ? <Crown className="text-white" size={22} /> :
            primaryRole === 'admin' ? <Shield className="text-white" size={22} /> :
            <Dumbbell className="text-white" size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {currentUser.first_name} {currentUser.last_name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Building2 size={14} />
            <span>{t('home.roleSummary.clubCount', { count: totalClubs })}</span>
          </div>
        </div>
      </div>

      {/* Role badges */}
      <div className="flex flex-wrap gap-2">
        {roleStats.owner > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 rounded-full">
            <Crown size={14} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              {t('home.roleSummary.owner', { count: roleStats.owner })}
            </span>
          </div>
        )}
        {roleStats.admin > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 rounded-full">
            <Shield size={14} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {t('home.roleSummary.admin', { count: roleStats.admin })}
            </span>
          </div>
        )}
        {roleStats.coach > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
            <Dumbbell size={14} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {t('home.roleSummary.coach', { count: roleStats.coach })}
            </span>
          </div>
        )}
      </div>

      {/* Multi-role hint */}
      {hasMultipleRoles && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-blue-100">
          {t('home.roleSummary.multiRoleHint')}
        </p>
      )}
    </div>
  );
};
