import React, { useState } from 'react';
import { Edit2, Camera, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { StaffUser } from '../types';

interface UserProfileSectionProps {
  user: StaffUser;
  onSave: (data: { first_name: string; last_name: string }) => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({ user, onSave }) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [error, setError] = useState('');

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

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'owner':
        return t('profile.role.owner');
      case 'admin':
        return t('profile.role.admin');
      case 'trainer':
        return t('profile.role.trainer');
      default:
        return role;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
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
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mb-2">
                {getRoleLabel(user.role)}
              </span>
              <div className="space-y-1">
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
    </div>
  );
};
