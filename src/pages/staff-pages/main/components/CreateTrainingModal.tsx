import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Club, Section, Group, Trainer, CreateTrainingData } from '../types';

interface CreateTrainingModalProps {
  clubs: Club[];
  sections: Section[];
  groups: Group[];
  trainers: Trainer[];
  selectedDate?: string;
  onClose: () => void;
  onCreate: (data: CreateTrainingData) => void;
}

export const CreateTrainingModal: React.FC<CreateTrainingModalProps> = ({
  clubs,
  sections,
  groups,
  trainers,
  selectedDate,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateTrainingData>({
    club_id: clubs[0]?.id || 0,
    section_id: 0,
    group_id: undefined,
    trainer_id: 0,
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: '',
    duration: 60,
    location: '',
    max_participants: undefined,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter sections by selected club
  const availableSections = sections.filter(s => s.club_id === formData.club_id);
  
  // Filter groups by selected section
  const availableGroups = groups.filter(g => g.section_id === formData.section_id);
  
  // Filter trainers by selected club
  const availableTrainers = trainers.filter(t => t.club_id === formData.club_id);

  useEffect(() => {
    // Reset section when club changes
    if (formData.club_id && availableSections.length > 0) {
      setFormData(prev => ({ ...prev, section_id: availableSections[0].id }));
    }
  }, [formData.club_id]);

  useEffect(() => {
    // Reset group when section changes
    if (formData.section_id && availableGroups.length > 0) {
      setFormData(prev => ({ ...prev, group_id: availableGroups[0].id }));
    } else {
      setFormData(prev => ({ ...prev, group_id: undefined }));
    }
  }, [formData.section_id]);

  useEffect(() => {
    // Reset trainer when club changes
    if (formData.club_id && availableTrainers.length > 0) {
      setFormData(prev => ({ ...prev, trainer_id: availableTrainers[0].id }));
    }
  }, [formData.club_id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.club_id) {
      newErrors.club_id = t('training.errors.clubRequired');
    }
    if (!formData.section_id) {
      newErrors.section_id = t('training.errors.sectionRequired');
    }
    if (!formData.trainer_id) {
      newErrors.trainer_id = t('training.errors.trainerRequired');
    }
    if (!formData.date) {
      newErrors.date = t('training.errors.dateRequired');
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = t('training.errors.datePast');
      }
    }
    if (!formData.time) {
      newErrors.time = t('training.errors.timeRequired');
    } else {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      if (selectedDateTime < oneHourFromNow) {
        newErrors.time = t('training.errors.timeTooSoon');
      }
    }
    if (!formData.location) {
      newErrors.location = t('training.errors.locationRequired');
    }
    if (formData.duration <= 0) {
      newErrors.duration = t('training.errors.durationRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onCreate(formData);
    }
  };

  const isFormValid = formData.club_id && formData.section_id && formData.trainer_id && 
                      formData.date && formData.time && formData.location && formData.duration > 0;

  return (
    <div className="fixed inset-0 bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4 mt-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('training.create.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Club */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.club')} *
            </label>
            <select
              value={formData.club_id || ''}
              onChange={(e) => setFormData({ ...formData, club_id: Number(e.target.value) })}
              className={`w-full border rounded-lg p-2 ${
                errors.club_id ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">{t('training.select.club')}</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {errors.club_id && (
              <p className="text-red-500 text-xs mt-1">{errors.club_id}</p>
            )}
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.section')} *
            </label>
            <select
              value={formData.section_id || ''}
              onChange={(e) => setFormData({ ...formData, section_id: Number(e.target.value) })}
              className={`w-full border rounded-lg p-2 ${
                errors.section_id ? 'border-red-500' : 'border-gray-200'
              }`}
              disabled={!formData.club_id || availableSections.length === 0}
            >
              <option value="">{t('training.select.section')}</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {errors.section_id && (
              <p className="text-red-500 text-xs mt-1">{errors.section_id}</p>
            )}
          </div>

          {/* Group */}
          {availableGroups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training.group')}
              </label>
              <select
                value={formData.group_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    group_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full border border-gray-200 rounded-lg p-2"
              >
                <option value="">{t('training.select.group')}</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trainer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.trainer')} *
            </label>
            <select
              value={formData.trainer_id || ''}
              onChange={(e) => setFormData({ ...formData, trainer_id: Number(e.target.value) })}
              className={`w-full border rounded-lg p-2 ${
                errors.trainer_id ? 'border-red-500' : 'border-gray-200'
              }`}
              disabled={!formData.club_id || availableTrainers.length === 0}
            >
              <option value="">{t('training.select.trainer')}</option>
              {availableTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
            {errors.trainer_id && (
              <p className="text-red-500 text-xs mt-1">{errors.trainer_id}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.date')} *
            </label>
            <input
              type="date"
              value={formData.date}
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
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className={`w-full border rounded-lg p-2 ${
                errors.time ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.time && (
              <p className="text-red-500 text-xs mt-1">{errors.time}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.duration')} ({t('training.duration.minutes')}) *
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: Number(e.target.value) })
              }
              min="15"
              step="15"
              className={`w-full border rounded-lg p-2 ${
                errors.duration ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.duration && (
              <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.location')} *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('training.location.placeholder')}
              className={`w-full border rounded-lg p-2 ${
                errors.location ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">{errors.location}</p>
            )}
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.maxParticipants')}
            </label>
            <input
              type="number"
              value={formData.max_participants || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_participants: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              min="1"
              className="w-full border border-gray-200 rounded-lg p-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('training.notes')}
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder={t('training.notes.placeholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
