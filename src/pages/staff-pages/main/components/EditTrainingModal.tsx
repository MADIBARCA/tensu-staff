import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Training, Trainer, UpdateTrainingData } from '../types';

interface EditTrainingModalProps {
  training: Training;
  trainers: Trainer[];
  onClose: () => void;
  onSave: (data: UpdateTrainingData, changeType?: 'single' | 'series') => void;
  onCancel: (changeType?: 'single' | 'series') => void;
}

export const EditTrainingModal: React.FC<EditTrainingModalProps> = ({
  training,
  trainers,
  onClose,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<UpdateTrainingData>({
    date: training.date,
    time: training.time,
    trainer_id: training.trainer_id,
    status: training.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isRecurring = training.training_type === 'recurring';
  const availableTrainers = trainers.filter(t => t.club_id === training.club_id);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = t('training.errors.datePast');
      }
    }

    if (formData.time && formData.date) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      if (selectedDateTime < now) {
        newErrors.time = t('training.errors.timePast');
      }
    }

    if (formData.status === 'completed') {
      if (formData.date && formData.time) {
        const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
        const now = new Date();
        if (selectedDateTime > now) {
          newErrors.status = t('training.errors.cannotCompleteFuture');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (isRecurring && (formData.date !== training.date || formData.time !== training.time)) {
      setShowSeriesDialog(true);
      return;
    }

    onSave(formData);
  };

  const handleSaveWithType = (changeType: 'single' | 'series') => {
    setShowSeriesDialog(false);
    onSave(formData, changeType);
  };

  const handleCancelTraining = () => {
    if (isRecurring) {
      setShowCancelDialog(true);
      return;
    }
    onCancel('single');
  };

  const handleCancelWithType = (changeType: 'single' | 'series') => {
    setShowCancelDialog(false);
    onCancel(changeType);
  };

  const getStatusLabel = (status: Training['status']): string => {
    switch (status) {
      case 'scheduled':
        return t('training.status.scheduled');
      case 'in_progress':
        return t('training.status.in_progress');
      case 'completed':
        return t('training.status.completed');
      case 'cancelled':
        return t('training.status.cancelled');
      default:
        return status;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('training.edit.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training.date')} *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-lg p-2 ${
                  errors.date ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training.time')} *
              </label>
              <input
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full border rounded-lg p-2 ${
                  errors.time ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.time && (
                <p className="text-red-500 text-xs mt-1">{errors.time}</p>
              )}
            </div>

            {/* Trainer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training.trainer')} *
              </label>
              <select
                value={formData.trainer_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, trainer_id: Number(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg p-2"
              >
                {availableTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training.status.label')}
              </label>
              <select
                value={formData.status || 'scheduled'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Training['status'],
                  })
                }
                className={`w-full border rounded-lg p-2 ${
                  errors.status ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="scheduled">{t('training.status.scheduled')}</option>
                <option value="in_progress">{t('training.status.in_progress')}</option>
                <option value="completed">{t('training.status.completed')}</option>
                <option value="cancelled">{t('training.status.cancelled')}</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 mt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('training.edit.save')}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCancelTraining}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              {t('training.cancel')}
            </button>
          </div>
        </div>
      </div>

      {/* Series Dialog */}
      {showSeriesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('training.series.dialog.title')}
            </h3>
            <p className="text-gray-600 mb-4">{t('training.series.dialog.message')}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSaveWithType('single')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('training.series.dialog.single')}
              </button>
              <button
                onClick={() => handleSaveWithType('series')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('training.series.dialog.series')}
              </button>
              <button
                onClick={() => setShowSeriesDialog(false)}
                className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('training.cancel.dialog.title')}
            </h3>
            <p className="text-gray-600 mb-4">{t('training.cancel.dialog.message')}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCancelWithType('single')}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('training.cancel.dialog.single')}
              </button>
              <button
                onClick={() => handleCancelWithType('series')}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('training.cancel.dialog.series')}
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
