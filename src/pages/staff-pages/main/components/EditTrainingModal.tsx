import React, { useState, useMemo } from 'react';
import { X, MapPin, Users, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Training, Trainer, UpdateTrainingData } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface EditTrainingModalProps {
  training: Training;
  coaches: Trainer[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onClose: () => void;
  onSave: (data: UpdateTrainingData, changeType?: 'single' | 'series') => void;
  onCancel: (changeType?: 'single' | 'series') => void;
}

export const EditTrainingModal: React.FC<EditTrainingModalProps> = ({
  training,
  coaches,
  clubRoles,
  currentUser,
  onClose,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  
  const [formData, setFormData] = useState<UpdateTrainingData>({
    date: training.date,
    time: training.time,
    duration: training.duration || 60,
    coach_id: training.coach_id,
    location: training.location || '',
    notes: training.notes || '',
    status: training.status,
  });
  
  const [coachIds, setCoachIds] = useState<number[]>([training.coach_id]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isRecurring = training.training_type === 'recurring';

  // Check if user is admin or owner of the training's club
  const isAdminOrOwner = useMemo(() => {
    if (!currentUser) return false;
    const clubRole = clubRoles.find(cr => cr.club.id === training.club_id);
    return clubRole ? (clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner) : false;
  }, [training.club_id, clubRoles, currentUser]);

  // Filter coaches based on user role
  const availableCoaches = useMemo(() => {
    if (!currentUser) return [];
    
    const clubCoaches = coaches.filter(c => c.club_id === training.club_id);
    
    // If user is admin or owner, they can choose any coach + themselves
    if (isAdminOrOwner) {
      const currentUserInList = clubCoaches.some(c => c.id === currentUser.id);
      if (!currentUserInList) {
        return [
          {
            id: currentUser.id,
            name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
            club_id: training.club_id,
          },
          ...clubCoaches
        ];
      }
      return clubCoaches;
    }
    
    // If user is just a coach, they can only choose themselves
    const selfInList = clubCoaches.find(c => c.id === currentUser.id);
    if (selfInList) {
      return [selfInList];
    }
    
    return [{
      id: currentUser.id,
      name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
      club_id: training.club_id,
    }];
  }, [coaches, training.club_id, currentUser, isAdminOrOwner]);

  const handleCoachToggle = (coachId: number) => {
    setCoachIds(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
    setErrors({ ...errors, coach_id: '' });
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(formData.time || '', formData.duration || 60);

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
      if (selectedDateTime < now && formData.status !== 'completed' && formData.status !== 'cancelled') {
        newErrors.time = t('training.errors.timePast');
      }
    }

    if (coachIds.length === 0) {
      newErrors.coach_id = t('training.errors.coachRequired');
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

    if ((formData.duration || 0) <= 0) {
      newErrors.duration = t('training.errors.durationRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const dataToSave: UpdateTrainingData = {
      ...formData,
      coach_id: coachIds[0],
      coach_ids: coachIds,
    };

    if (isRecurring && (formData.date !== training.date || formData.time !== training.time)) {
      setShowSeriesDialog(true);
      return;
    }

    onSave(dataToSave);
  };

  const handleSaveWithType = (changeType: 'single' | 'series') => {
    setShowSeriesDialog(false);
    const dataToSave: UpdateTrainingData = {
      ...formData,
      coach_id: coachIds[0],
      coach_ids: coachIds,
    };
    onSave(dataToSave, changeType);
  };

  const handleCancelTraining = () => {
    setShowCancelDialog(true);
  };

  const handleCancelWithType = (changeType: 'single' | 'series') => {
    setShowCancelDialog(false);
    onCancel(changeType);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 mt-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('training.edit.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {training.section_name} • {training.group_name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Training Info Badge */}
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(training.status)}`}>
                {t(`training.status.${training.status}`)}
              </span>
              {isRecurring && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  {t('training.recurring')}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {training.club_name}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-5">
              {/* Date & Time Section */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar size={18} />
                  <span>{t('training.dateTime')}</span>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('training.date')} *
                  </label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full border rounded-lg p-3 bg-white text-gray-900 caret-black ${
                      errors.date ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                  )}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('training.startTime')} *
                    </label>
                    <input
                      type="time"
                      value={formData.time || ''}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className={`w-full border rounded-lg p-3 bg-white text-gray-900 caret-black ${
                        errors.time ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.time && (
                      <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('training.endTime')}
                    </label>
                    <div className="w-full border border-gray-200 rounded-lg p-3 bg-gray-100 text-gray-700">
                      {endTime || '--:--'}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('training.duration')} ({t('training.duration.minutes')}) *
                  </label>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration: mins })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          formData.duration === mins
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    min="15"
                    step="15"
                    placeholder={t('training.duration.custom')}
                    className="w-full border border-gray-200 rounded-lg p-3 bg-white mt-2 text-gray-900 caret-black"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
                  )}
                </div>
              </div>

              {/* Coaches Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                  <Users size={18} />
                  <span>{t('training.coach')} *</span>
                </div>
                
                {availableCoaches.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t('training.noCoachesAvailable')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableCoaches.map((coach) => (
                      <label
                        key={coach.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          coachIds.includes(coach.id)
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-white border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={coachIds.includes(coach.id)}
                          onChange={() => handleCoachToggle(coach.id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium">{coach.name}</span>
                          {coach.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-blue-600">({t('common.you')})</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.coach_id && (
                  <p className="text-red-500 text-xs mt-2">{errors.coach_id}</p>
                )}
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                  <MapPin size={18} />
                  <span>{t('training.location')}</span>
                </div>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t('training.location.placeholder')}
                  className="w-full border border-gray-200 rounded-lg p-3 bg-white text-gray-900 caret-black"
                />
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                  <FileText size={18} />
                  <span>{t('training.notes')}</span>
                </div>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder={t('training.notes.placeholder')}
                  className="w-full border border-gray-200 rounded-lg p-3 bg-white resize-none text-gray-900 caret-black"
                />
              </div>

              {/* Warning for recurring training */}
              {isRecurring && (formData.date !== training.date || formData.time !== training.time) && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {t('training.recurringWarning.title')}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {t('training.recurringWarning.description')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 space-y-3 pb-8">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                {t('training.edit.save')}
              </button>
            </div>
            
            {training.status !== 'cancelled' && training.status !== 'completed' && (
              <button
                type="button"
                onClick={handleCancelTraining}
                className="w-full px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                {t('training.cancel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Series Dialog */}
      {showSeriesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('training.series.dialog.title')}
            </h3>
            <p className="text-gray-600 mb-6">{t('training.series.dialog.message')}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSaveWithType('single')}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                {t('training.series.dialog.single')}
              </button>
              <button
                onClick={() => handleSaveWithType('series')}
                className="w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
              >
                {t('training.series.dialog.series')}
              </button>
              <button
                onClick={() => setShowSeriesDialog(false)}
                className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('training.cancel.dialog.title')}
            </h3>
            <p className="text-gray-600 mb-4">{t('training.cancel.dialog.message')}</p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex items-start gap-2">
              <div className="mt-0.5 text-blue-500">
                <Users size={16} />
              </div>
              <p className="text-sm text-blue-700">
                Ученики получат уведомление об отмене занятия в Telegram.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCancelWithType('single')}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {isRecurring ? t('training.cancel.dialog.single') : t('training.cancel')}
              </button>
              {isRecurring && (
                <button
                  onClick={() => handleCancelWithType('series')}
                  className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  {t('training.cancel.dialog.series')}
                </button>
              )}
              <button
                onClick={() => setShowCancelDialog(false)}
                className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
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
