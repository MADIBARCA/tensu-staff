import React from 'react';
import { Edit2, Trash2, Building2, LayoutGrid, Users } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Tariff, Club, Section } from '../types';

interface TariffCardProps {
  tariff: Tariff;
  clubs: Club[];
  sections: Section[];
  onEdit: () => void;
  onDelete: () => void;
}

export const TariffCard: React.FC<TariffCardProps> = ({ tariff, clubs, sections, onEdit, onDelete }) => {
  const { t } = useI18n();

  const getPaymentTypeLabel = (type: string): string => {
    switch (type) {
      case 'monthly': return t('management.pricing.type.monthly');
      case 'semi_annual': return t('management.pricing.type.semi_annual');
      case 'annual': return t('management.pricing.type.annual');
      case 'session_pack': return t('management.pricing.type.session_pack');
      default: return type;
    }
  };

  const getPaymentTypeColor = (type: string): string => {
    switch (type) {
      case 'monthly': return 'bg-blue-100 text-blue-700';
      case 'semi_annual': return 'bg-purple-100 text-purple-700';
      case 'annual': return 'bg-green-100 text-green-700';
      case 'session_pack': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPackageTypeLabel = (type: string): string => {
    switch (type) {
      case 'full_club': return t('management.pricing.packageType.fullClub');
      case 'full_section': return t('management.pricing.packageType.fullSection');
      case 'single_group': return t('management.pricing.packageType.singleGroup');
      case 'multiple_groups': return t('management.pricing.packageType.multipleGroups');
      default: return type;
    }
  };

  const getPackageTypeColor = (type: string): string => {
    switch (type) {
      case 'full_club': return 'bg-emerald-100 text-emerald-700';
      case 'full_section': return 'bg-cyan-100 text-cyan-700';
      case 'single_group': return 'bg-amber-100 text-amber-700';
      case 'multiple_groups': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get access summary
  const getAccessSummary = () => {
    const items: string[] = [];

    // Clubs
    if (tariff.club_ids.length > 0) {
      const clubNames = tariff.club_ids
        .map(id => clubs.find(c => c.id === id)?.name)
        .filter(Boolean);
      items.push(...clubNames as string[]);
    }

    // Sections
    if (tariff.section_ids.length > 0) {
      const sectionNames = tariff.section_ids
        .map(id => sections.find(s => s.id === id)?.name)
        .filter(Boolean);
      items.push(...sectionNames as string[]);
    }

    // Groups
    if (tariff.group_ids.length > 0) {
      const groupNames = tariff.group_ids.map(gid => {
        for (const section of sections) {
          const group = section.groups.find(g => g.id === gid);
          if (group) return group.name;
        }
        return null;
      }).filter(Boolean);
      items.push(...groupNames as string[]);
    }

    return items;
  };

  const accessItems = getAccessSummary();

  // Determine access icon and count
  const getAccessIcon = () => {
    if (tariff.club_ids.length > 0) return <Building2 size={14} />;
    if (tariff.section_ids.length > 0) return <LayoutGrid size={14} />;
    return <Users size={14} />;
  };

  const getAccessCount = () => {
    if (tariff.club_ids.length > 0) return `${tariff.club_ids.length} ${t('management.pricing.clubsCount')}`;
    if (tariff.section_ids.length > 0) return `${tariff.section_ids.length} ${t('management.pricing.sectionsCount')}`;
    return `${tariff.group_ids.length} ${t('management.pricing.groupsCount')}`;
  };

  return (
    <div className={`bg-white rounded-lg border ${tariff.active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`font-semibold ${tariff.active ? 'text-gray-900' : 'text-gray-500'}`}>
                {tariff.name}
              </h3>
              {!tariff.active && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  {t('management.pricing.inactive')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPackageTypeColor(tariff.type)}`}>
                {getPackageTypeLabel(tariff.type)}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentTypeColor(tariff.payment_type)}`}>
                {getPaymentTypeLabel(tariff.payment_type)}
              </span>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Access Summary */}
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            {getAccessIcon()}
            <span>{getAccessCount()}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {accessItems.slice(0, 4).map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {item}
              </span>
            ))}
            {accessItems.length > 4 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-400 rounded">
                +{accessItems.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Price and Details */}
        <div className="flex items-end justify-between">
          <div>
            {tariff.payment_type === 'session_pack' && tariff.sessions_count && (
              <p className="text-xs text-gray-500">
                {tariff.sessions_count} {t('management.pricing.sessions')} / {tariff.validity_days} {t('management.pricing.days')}
              </p>
            )}
          </div>
          <p className="text-xl font-bold text-gray-900">{tariff.price.toLocaleString()} ₸</p>
        </div>
      </div>
    </div>
  );
};
