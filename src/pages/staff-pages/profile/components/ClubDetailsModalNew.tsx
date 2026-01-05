import React, { useState, useMemo, useEffect } from 'react';
import { X, MapPin, Phone, Clock, Users, Calendar, ChevronDown, ChevronUp, AlertTriangle, Power, Building2, User, Edit2, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { EditClubModal } from './EditClubModal';
import { analyticsApi } from '@/functions/axios/axiosFunctions';
import type { Club, ClubAnalytics, PaymentHistory, Section } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface ClubDetailsModalProps {
  club: Club;
  analytics: ClubAnalytics;
  paymentHistory: PaymentHistory[];
  clubRoles: ClubWithRole[];
  currentUser?: CreateStaffResponse | null;
  onClose: () => void;
  onPayment: () => void;
  onDeactivate: () => void;
  onRefresh?: () => void;
}

export const ClubDetailsModalNew: React.FC<ClubDetailsModalProps> = ({
  club,
  analytics: initialAnalytics,
  paymentHistory,
  clubRoles,
  currentUser,
  onClose,
  onPayment,
  onDeactivate,
  onRefresh,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'analytics' | 'membership'>('analytics');
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [analytics, setAnalytics] = useState<ClubAnalytics>(initialAnalytics);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch real analytics on mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        if (!token) {
          setLoadingAnalytics(false);
          return;
        }

        const response = await analyticsApi.getClubAnalytics(club.id, 30, token);
        const data = response.data;
        
        // Transform to local analytics format
        const sections: Section[] = data.sections.map(s => ({
          id: s.id,
          club_id: club.id,
          name: s.name,
          students_count: s.students_count,
          coach_id: undefined, // API doesn't return coach_id for sections
        }));

        setAnalytics({
          club_id: data.club_id,
          sections,
          total_students: data.total_students,
          trainings_this_month: data.trainings_this_month,
          trainings_conducted: data.trainings_conducted,
          trainings_scheduled: data.trainings_scheduled,
          trainings_cancelled: data.trainings_cancelled,
        });
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Keep initial analytics on error
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [club.id]);

  // Get user's role for THIS specific club
  const userRoleInThisClub = useMemo(() => {
    const clubRole = clubRoles.find(cr => cr.club.id === club.id);
    return clubRole?.role || null;
  }, [club.id, clubRoles]);

  // Check if user is owner of THIS specific club
  const isOwnerOfThisClub = useMemo(() => {
    const clubRole = clubRoles.find(cr => cr.club.id === club.id);
    return clubRole ? (clubRole.role === 'owner' || clubRole.is_owner) : false;
  }, [club.id, clubRoles]);

  // Check if user is owner or admin of THIS specific club
  const isOwnerOrAdminOfThisClub = useMemo(() => {
    return userRoleInThisClub === 'owner' || userRoleInThisClub === 'admin';
  }, [userRoleInThisClub]);

  // Filter sections for coaches - show only their sections
  const filteredSections = useMemo((): Section[] => {
    if (isOwnerOrAdminOfThisClub) {
      return analytics.sections;
    }
    // For coaches, filter to only show their sections
    if (currentUser && userRoleInThisClub === 'coach') {
      return analytics.sections.filter(section => section.coach_id === currentUser.id);
    }
    return [];
  }, [analytics.sections, isOwnerOrAdminOfThisClub, currentUser, userRoleInThisClub]);

  // Calculate analytics for filtered sections (for coaches)
  const filteredAnalytics = useMemo(() => {
    if (isOwnerOrAdminOfThisClub) {
      return {
        total_students: analytics.total_students,
        trainings_this_month: analytics.trainings_this_month,
        trainings_conducted: analytics.trainings_conducted,
        trainings_scheduled: analytics.trainings_scheduled,
        trainings_cancelled: analytics.trainings_cancelled,
      };
    }
    // For coaches, sum up only their sections' students
    const coachStudents = filteredSections.reduce((sum, s) => sum + s.students_count, 0);
    // Note: For trainings, we'd need section-level breakdown which may not be available
    // For now, show the coach's sections' student count
    return {
      total_students: coachStudents,
      trainings_this_month: analytics.trainings_this_month, // TODO: filter by section when data available
      trainings_conducted: analytics.trainings_conducted,
      trainings_scheduled: analytics.trainings_scheduled,
      trainings_cancelled: analytics.trainings_cancelled,
    };
  }, [analytics, isOwnerOrAdminOfThisClub, filteredSections]);

  const canViewMembership = isOwnerOrAdminOfThisClub;
  const canDeactivate = isOwnerOfThisClub;
  const showPayButton = club.membership && club.membership.days_until_expiry <= 7;

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return t('profile.club.status.active');
      case 'frozen':
        return t('profile.club.status.frozen');
      case 'pending':
        return t('profile.club.status.pending');
      case 'deactivated':
        return t('profile.club.status.deactivated');
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'deactivated':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="bg-white w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 mt-20">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{club.name}</h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(club.status)}`}>
                  {getStatusLabel(club.status)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{club.city}, {club.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isOwnerOrAdminOfThisClub && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title={t('common.edit')}
                >
                  <Edit2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Club Info */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>{club.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{club.working_hours}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span>{t('profile.club.activationDate')}: {formatDate(club.activation_date)}</span>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('profile.club.tabs.analytics')}
            </button>
            {canViewMembership && (
              <button
                onClick={() => setActiveTab('membership')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'membership'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('profile.club.tabs.membership')}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'analytics' ? (
            loadingAnalytics ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
            <div className="space-y-4">
              {/* Analytics Scope Indicator */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                isOwnerOrAdminOfThisClub 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                {isOwnerOrAdminOfThisClub ? (
                  <>
                    <Building2 size={18} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {t('profile.club.analyticsScope.club')}
                      </p>
                      <p className="text-xs text-blue-600">
                        {t('profile.club.analyticsScope.clubDescription')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <User size={18} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {t('profile.club.analyticsScope.coach')}
                      </p>
                      <p className="text-xs text-amber-600">
                        {filteredSections.length > 0 
                          ? t('profile.club.analyticsScope.coachDescription', { count: filteredSections.length })
                          : t('profile.club.analyticsScope.noSections')
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-700">{filteredAnalytics.total_students}</p>
                  <p className="text-sm text-blue-600">{t('profile.club.totalStudents')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-700">{filteredAnalytics.trainings_this_month}</p>
                  <p className="text-sm text-green-600">{t('profile.club.trainingsMonth')}</p>
                </div>
              </div>

              {/* Trainings Breakdown */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-3">{t('profile.club.trainingsBreakdown')}</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-green-600">{filteredAnalytics.trainings_conducted}</p>
                    <p className="text-xs text-gray-500">{t('profile.club.conducted')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-blue-600">{filteredAnalytics.trainings_scheduled}</p>
                    <p className="text-xs text-gray-500">{t('profile.club.scheduled')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-600">{filteredAnalytics.trainings_cancelled}</p>
                    <p className="text-xs text-gray-500">{t('profile.club.cancelled')}</p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              {filteredSections.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    {isOwnerOrAdminOfThisClub 
                      ? t('profile.club.sections') 
                      : t('profile.club.mySections')
                    }
                  </h4>
                  <div className="space-y-2">
                    {filteredSections.map((section) => (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between p-3 bg-white border rounded-lg ${
                          !isOwnerOrAdminOfThisClub 
                            ? 'border-amber-200 bg-amber-50/30' 
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="text-gray-900">{section.name}</span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users size={14} />
                          <span>{section.students_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User size={40} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">{t('profile.club.noSectionsAssigned')}</p>
                </div>
              )}
            </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Membership Info */}
              {club.membership && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('profile.club.tariff')}</span>
                      <span className="font-medium text-gray-900">{club.membership.tariff_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('profile.club.price')}</span>
                      <span className="font-medium text-gray-900">{club.membership.price.toLocaleString()} ₸</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('profile.club.validUntil')}</span>
                      <span className="font-medium text-gray-900">{formatDate(club.membership.end_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('profile.club.paymentMethod')}</span>
                      <span className="font-medium text-gray-900">{club.membership.payment_method}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('profile.club.membershipStatus')}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        club.membership.status === 'active' ? 'bg-green-100 text-green-700' :
                        club.membership.status === 'expiring' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {club.membership.status === 'active' && t('profile.membership.active')}
                        {club.membership.status === 'expiring' && t('profile.membership.expiring')}
                        {club.membership.status === 'expired' && t('profile.membership.expired')}
                      </span>
                    </div>
                  </div>

                  {/* Payment Warning */}
                  {club.membership.days_until_expiry <= 7 && club.membership.days_until_expiry > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle size={18} className="text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        {t('profile.club.expiresIn', { days: club.membership.days_until_expiry })}
                      </span>
                    </div>
                  )}

                  {/* Pay Button */}
                  {showPayButton && (
                    <button
                      onClick={onPayment}
                      className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      {t('profile.club.payNow')}
                    </button>
                  )}
                </>
              )}

              {/* Payment History */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {t('profile.club.paymentHistory')}
                    </span>
                  </div>
                  {showPaymentHistory ? (
                    <ChevronUp size={18} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-600" />
                  )}
                </button>
                {showPaymentHistory && (
                  <div className="max-h-48 overflow-y-auto">
                    {paymentHistory.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 text-center">
                        {t('profile.club.noPayments')}
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} className="p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {formatDate(payment.date)}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {payment.amount.toLocaleString()} ₸
                              </span>
                            </div>
                            <p className="text-gray-600">{payment.tariff_name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Deactivate Button (Only for Owner) */}
        {canDeactivate && club.status !== 'deactivated' && (
          <div className="p-4 border-t border-gray-200 mb-20">
            <button
              onClick={onDeactivate}
              className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Power size={18} />
              {t('profile.club.deactivate')}
            </button>
          </div>
        )}
      </div>

      {/* Edit Club Modal */}
      {showEditModal && (
        <EditClubModal
          club={club}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};
