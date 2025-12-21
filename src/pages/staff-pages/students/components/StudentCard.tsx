import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Student } from '../types';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  const { t } = useI18n();

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return t('students.status.active');
      case 'frozen':
        return t('students.status.frozen');
      case 'expired':
        return t('students.status.expired');
      case 'new':
        return t('students.status.new');
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
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'new':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${student.phone_number.replace(/\s/g, '')}`;
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (student.username && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(`https://t.me/${student.username}`, { try_instant_view: false });
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={`${student.first_name} ${student.last_name || ''}`}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                // Fall back to initials on image load error
                const target = e.currentTarget;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 ${
              student.photo_url ? 'hidden' : ''
            }`}
          >
            {student.first_name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {student.first_name} {student.last_name}
              </h3>
              {student.membership && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    student.membership.status
                  )}`}
                >
                  {getStatusLabel(student.membership.status)}
                </span>
              )}
            </div>
            {student.group_name && (
              <p className="text-sm text-gray-600 truncate">{student.group_name}</p>
            )}
            {student.membership && (
              <p className="text-xs text-gray-500 mt-1">
                {t('students.validUntil')}: {formatDate(student.membership.end_date)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleCall}
            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title={t('students.call')}
          >
            <Phone size={18} />
          </button>
          {student.username && (
            <button
              onClick={handleMessage}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title={t('students.message')}
            >
              <MessageCircle size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
