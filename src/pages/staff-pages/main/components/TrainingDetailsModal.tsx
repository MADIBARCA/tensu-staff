import React, { useState, useEffect } from 'react';
import { X, Edit2, Plus, Clock, MapPin, Users, User, Building2, Calendar, FileText, Repeat, Snowflake, CheckCircle2, MessageSquare } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { LessonParticipant } from '@/functions/axios/responses';
import type { Training } from '../types';

interface TrainingDetailsModalProps {
  training: Training;
  onClose: () => void;
  onEdit: (training: Training) => void;
  onCreateNew: () => void;
}

export const TrainingDetailsModal: React.FC<TrainingDetailsModalProps> = ({
  training,
  onClose,
  onEdit,
  onCreateNew,
}) => {
  const { t } = useI18n();
  const [participants, setParticipants] = useState<LessonParticipant[]>([]);
  const [excusedParticipants, setExcusedParticipants] = useState<LessonParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');

  useEffect(() => {
    const loadParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await scheduleApi.getLessonParticipants(training.id, token);
        setParticipants(response.data.participants || []);
        setExcusedParticipants(response.data.excused_participants || []);
      } catch (error) {
        console.error('Failed to load participants:', error);
      } finally {
        setLoadingParticipants(false);
      }
    };

    loadParticipants();
  }, [training.id]);

  const getStatusConfig = (status: Training['status']) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t('training.status.scheduled'),
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: '📅',
        };
      case 'in_progress':
        return {
          label: t('training.status.in_progress'),
          bg: 'bg-green-500',
          lightBg: 'bg-green-50',
          text: 'text-green-700',
          icon: '🏃',
        };
      case 'completed':
        return {
          label: t('training.status.completed'),
          bg: 'bg-gray-400',
          lightBg: 'bg-gray-50',
          text: 'text-gray-600',
          icon: '✅',
        };
      case 'cancelled':
        return {
          label: t('training.status.cancelled'),
          bg: 'bg-red-500',
          lightBg: 'bg-red-50',
          text: 'text-red-700',
          icon: '❌',
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500',
          lightBg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: '📝',
        };
    }
  };

  const formatTime = (time: string, duration: number) => {
    const [hours, minutes] = time.split(':').map(Number);
    const endTime = new Date(2000, 0, 1, hours, minutes + duration);
    const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    return `${time} - ${endStr}`;
  };

  const formatDate = (dateStr: string) => {
    // Parse date string (format: YYYY-MM-DD) and create date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Compare dates by year, month, and day only
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    if (isToday) {
      return t('training.today');
    }
    
    // Check if tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate();
    
    if (isTomorrow) {
      return t('training.tomorrow');
    }
    
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  };

  const statusConfig = getStatusConfig(training.status);
  const canEdit = training.status === 'scheduled' || training.status === 'cancelled';

  const getInitials = (firstName: string, lastName?: string | null) => {
    const f = firstName?.charAt(0)?.toUpperCase() || '';
    const l = lastName?.charAt(0)?.toUpperCase() || '';
    return f + l || '?';
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-amber-500',
      'bg-indigo-500',
    ];
    return colors[id % colors.length];
  };

  const totalParticipants = participants.length + excusedParticipants.length;

  return (
    <div className="fixed bg-black/50 inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header with gradient */}
        <div className={`relative overflow-hidden rounded-t-3xl sm:rounded-t-2xl`}>
          <div className={`${statusConfig.bg} px-6 pt-6 pb-8`}>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{statusConfig.icon}</span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                {statusConfig.label}
              </span>
              {training.training_type === 'recurring' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                  <Repeat size={12} />
                  Серия
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-1">
              {training.section_name}
            </h2>
            {training.group_name && (
              <p className="text-white/80">{training.group_name}</p>
            )}
          </div>

          {/* Curved bottom */}
          <div className="absolute -bottom-px left-0 right-0 h-4 bg-white rounded-t-3xl" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('training.tabs.details')}
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'participants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('training.tabs.participants')}
            {totalParticipants > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === 'participants' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {totalParticipants}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'details' ? (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar size={14} />
                    <span className="text-xs uppercase tracking-wide">Дата</span>
                  </div>
                  <p className="font-semibold text-gray-900">{formatDate(training.date)}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock size={14} />
                    <span className="text-xs uppercase tracking-wide">Время</span>
                  </div>
                  <p className="font-semibold text-gray-900">{formatTime(training.time, training.duration)}</p>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Клуб</p>
                    <p className="font-medium text-gray-900">{training.club_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Тренер</p>
                    <p className="font-medium text-gray-900">{training.coach_name}</p>
                  </div>
                </div>

                {training.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Место</p>
                      <p className="font-medium text-gray-900">{training.location}</p>
                    </div>
                  </div>
                )}

                {training.max_participants && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Участники</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {training.current_participants} / {training.max_participants}
                        </p>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${(training.current_participants / training.max_participants) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {training.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Заметки</p>
                      <p className="text-gray-700">{training.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Participants Tab */
            <div className="space-y-6">
              {loadingParticipants ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : totalParticipants === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={40} className="mx-auto mb-3 text-gray-300" />
                  <p>{t('training.participants.empty')}</p>
                </div>
              ) : (
                <>
                  {/* Booked Participants */}
                  {participants.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <h4 className="text-sm font-medium text-gray-700">
                          {t('training.participants.booked')}
                        </h4>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          {participants.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {participants.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            {p.photo_url ? (
                              <img
                                src={p.photo_url}
                                alt={p.first_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full ${getAvatarColor(p.id)} flex items-center justify-center text-white font-medium text-sm`}>
                                {getInitials(p.first_name, p.last_name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {p.first_name} {p.last_name || ''}
                              </p>
                            </div>
                            <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Excused/Frozen Participants */}
                  {excusedParticipants.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Snowflake size={16} className="text-blue-500" />
                        <h4 className="text-sm font-medium text-gray-700">
                          {t('training.participants.excused')}
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {excusedParticipants.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {excusedParticipants.map((p) => (
                          <div key={p.id} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                              {p.photo_url ? (
                                <img
                                  src={p.photo_url}
                                  alt={p.first_name}
                                  className="w-10 h-10 rounded-full object-cover opacity-75"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-medium text-sm`}>
                                  {getInitials(p.first_name, p.last_name)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-700 truncate">
                                  {p.first_name} {p.last_name || ''}
                                </p>
                              </div>
                              <Snowflake size={18} className="text-blue-500 flex-shrink-0" />
                            </div>
                            {p.excuse_note && (
                              <div className="mt-2 flex items-start gap-2 pl-13">
                                <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600 italic">{p.excuse_note}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          {canEdit && (
            <button
              onClick={() => onEdit(training)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={18} />
              Редактировать
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            Новая
          </button>
        </div>
      </div>
    </div>
  );
};
