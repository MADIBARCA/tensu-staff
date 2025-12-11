import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { TariffCard } from './TariffCard';
import { TariffModal } from './TariffModal';
import type { Tariff, Club, Section, CreateTariffData } from '../types';
import type { ClubWithRole } from '@/functions/axios/responses';

interface PricingTabProps {
  tariffs: Tariff[];
  clubs: Club[];
  sections: Section[];
  clubRoles: ClubWithRole[];
  onCreateTariff: (data: CreateTariffData) => void | Promise<void>;
  onUpdateTariff: (id: number, data: CreateTariffData) => void | Promise<void>;
  onDeleteTariff: (id: number) => void | Promise<void>;
}

export const PricingTab: React.FC<PricingTabProps> = ({
  tariffs,
  clubs,
  sections,
  clubRoles,
  onCreateTariff,
  onUpdateTariff,
  onDeleteTariff,
}) => {
  const { t } = useI18n();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [deletingTariff, setDeletingTariff] = useState<Tariff | null>(null);

  const handleCreateTariff = async (data: CreateTariffData) => {
    await onCreateTariff(data);
    setShowCreateModal(false);
  };

  const handleUpdateTariff = async (data: CreateTariffData) => {
    if (editingTariff) {
      await onUpdateTariff(editingTariff.id, data);
      setEditingTariff(null);
    }
  };

  const handleDeleteTariff = async () => {
    if (deletingTariff) {
      await onDeleteTariff(deletingTariff.id);
      setDeletingTariff(null);
    }
  };

  // Sort tariffs: active first, then by creation date
  const sortedTariffs = [...tariffs].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">
          {tariffs.length} {t('management.pricing.count')}
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          {t('management.pricing.create')}
        </button>
      </div>

      {/* Tariffs List */}
      {tariffs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">{t('management.pricing.notFound')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('management.pricing.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTariffs.map(tariff => (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              clubs={clubs}
              sections={sections}
              onEdit={() => setEditingTariff(tariff)}
              onDelete={() => setDeletingTariff(tariff)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <TariffModal
          clubs={clubs}
          sections={sections}
          clubRoles={clubRoles}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTariff}
        />
      )}

      {/* Edit Modal */}
      {editingTariff && (
        <TariffModal
          tariff={editingTariff}
          clubs={clubs}
          sections={sections}
          clubRoles={clubRoles}
          onClose={() => setEditingTariff(null)}
          onSave={handleUpdateTariff}
        />
      )}

      {/* Delete Confirmation */}
      {deletingTariff && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t('management.pricing.deleteTitle')}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {t('management.pricing.deleteMessage', { name: deletingTariff.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTariff(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteTariff}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
