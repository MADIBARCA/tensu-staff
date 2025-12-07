import React from 'react';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { MapPin, Users, Layers, ShoppingCart, CheckCircle } from 'lucide-react';
import type { Club } from '../ClubsPage';

interface ClubCardProps {
  club: Club;
  isMember: boolean;
  onClick: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, isMember, onClick }) => {
  const { t } = useI18n();

  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0">
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            club.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{club.name}</h3>
            {isMember && (
              <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                <CheckCircle size={12} />
                {t('clubs.card.member')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <MapPin size={14} />
            <span className="truncate">{club.address}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Layers size={14} />
              <span>{club.sections_count} {t('clubs.card.sections')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{club.students_count}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {club.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{club.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <ShoppingCart size={16} />
        {t('clubs.card.buy')}
      </button>
    </Card>
  );
};
