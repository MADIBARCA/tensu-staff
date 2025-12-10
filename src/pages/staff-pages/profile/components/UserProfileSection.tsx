import React, { useState, useMemo } from 'react';
import { Edit2, Camera, Mail, Phone, Crown, Shield, Dumbbell, Building2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { StaffUser } from '../types';
import type { ClubWithRole } from '@/functions/axios/responses';

interface UserProfileSectionProps {
  user: StaffUser;
  clubRoles?: ClubWithRole[];
  onSave: (data: { first_name: string; last_name: string }) => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({ user, clubRoles = [], onSave }) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [error, setError] = useState('');

  // Calculate role counts
  const roleStats = useMemo(() => {
    const stats = {
      owner: 0,
      admin: 0,
      coach: 0,
    };

    clubRoles.forEach(cr => {
      if (cr.role === 'owner' || cr.is_owner) {
        stats.owner++;
      } else if (cr.role === 'admin') {
        stats.admin++;
      } else if (cr.role === 'coach') {
        stats.coach++;
      }
    });

    return stats;
  }, [clubRoles]);

  // Determine primary role (highest level) for avatar gradient
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

  const handleSave = () => {
    if (!firstName.trim()) {
      setError(t('profile.errors.nameRequired'));
      return;
    }
    onSave({ first_name: firstName.trim(), last_name: lastName.trim() });
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setIsEditing(false);
    setError('');
  };

  // Get avatar gradient based on primary role
  const getAvatarGradient = () => {
    switch (primaryRole) {
      case 'owner':
        return 'from-purple-500 to-purple-700';
      case 'admin':
        return 'from-blue-500 to-blue-700';
      case 'coach':
        return 'from-green-500 to-green-700';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  const totalClubs = clubRoles.length;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-2xl font-semibold overflow-hidden`}>
            {user.photo_url ? (
              <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              user.first_name.charAt(0).toUpperCase()
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white">
            <Camera size={14} className="text-white" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setError('');
                }}
                placeholder={t('profile.firstName')}
                className={`w-full border rounded-lg p-2 text-sm ${
                  error ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('profile.lastName')}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              {/* Club count */}
              {totalClubs > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <Building2 size={14} />
                  <span>{t('home.roleSummary.clubCount', { count: totalClubs })}</span>
                </div>
              )}

              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} />
                  <span>{user.phone_number}</span>
                </div>
                {user.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Role Badges - shown only when not editing */}
      {!isEditing && totalClubs > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {roleStats.owner > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
                <Crown size={14} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  {t('home.roleSummary.owner', { count: roleStats.owner })}
                </span>
              </div>
            )}
            {roleStats.admin > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                <Shield size={14} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {t('home.roleSummary.admin', { count: roleStats.admin })}
                </span>
              </div>
            )}
            {roleStats.coach > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
                <Dumbbell size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {t('home.roleSummary.coach', { count: roleStats.coach })}
                </span>
              </div>
            )}
          </div>

          {/* Multi-role hint */}
          {hasMultipleRoles && (
            <p className="text-xs text-gray-400 mt-2">
              {t('home.roleSummary.multiRoleHint')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
