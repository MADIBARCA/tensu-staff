import React, { useState } from 'react';
import { Edit2, Camera } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import type { StudentResponse } from '@/functions/axios/responses';

interface UserInfoSectionProps {
  student: StudentResponse | null;
  onEdit: () => void;
}

export const UserInfoSection: React.FC<UserInfoSectionProps> = ({ student, onEdit }) => {
  const { user } = useTelegram();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // TODO: Implement photo upload API
      console.log('Uploading photo:', file);
      // await studentsApi.uploadPhoto(file, token);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const displayName = student
    ? `${student.first_name} ${student.last_name || ''}`.trim()
    : user
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Пользователь';

  const displayPhone = student?.phone_number || user?.phone_number || 'Не указан';
  const photoUrl = student?.photo_url || (user?.photo_url && typeof user.photo_url === 'string' ? user.photo_url : '') || '';

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
      <div className="flex items-center gap-4">
        {/* Photo */}
        <div className="relative">
          <label htmlFor="photo-upload" className="cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white">
              <Camera size={14} className="text-white" />
            </div>
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600">{displayPhone}</p>
        </div>
      </div>
    </div>
  );
};
