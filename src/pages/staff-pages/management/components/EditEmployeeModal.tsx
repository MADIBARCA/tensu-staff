import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Loader2, Crown, Shield, Dumbbell, Clock } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Employee, Club, EmployeeRole, UpdateEmployeeData } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface ClubRoleState {
  club_id: number;
  role: EmployeeRole;
  status: 'active' | 'pending';
  enabled: boolean;
}

interface EditEmployeeModalProps {
  employee: Employee;
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onClose: () => void;
  onSave: (data: UpdateEmployeeData) => void;
  onDeleteInvitation?: (invitationId: number) => Promise<void>;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  clubs,
  clubRoles,
  currentUser,
  onClose,
  onSave,
  onDeleteInvitation,
}) => {
  const { t } = useI18n();
  
  // Check if this is a pending invitation
  const isPendingInvitation = employee.invitation_id && employee.status === 'pending' && !employee.first_name;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter clubs to show only those where user is owner or admin
  const availableClubs = useMemo(() => {
    if (!currentUser) return [];
    
    return clubs.filter(club => {
      if (club.status !== 'active') return false;
      
      const clubRole = clubRoles.find(cr => cr.club.id === club.id);
      if (!clubRole) return false;
      
      // Show only if user is owner or admin
      return clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner;
    });
  }, [clubs, clubRoles, currentUser]);

  // Helper to normalize status to only 'active' or 'pending'
  const normalizeStatus = (status: string | undefined, isInClub: boolean): 'active' | 'pending' => {
    if (status === 'active') return 'active';
    if (status === 'pending') return 'pending';
    return isInClub ? 'active' : 'pending';
  };

  // Initialize per-club role state
  const [clubRoleStates, setClubRoleStates] = useState<ClubRoleState[]>(() => {
    return availableClubs.map(club => {
      // Check if employee has a role in this club
      const existingClubRole = employee.club_roles?.find(cr => cr.club_id === club.id);
      const isInClub = employee.club_ids.includes(club.id);
      
      return {
        club_id: club.id,
        role: existingClubRole?.role || employee.role || 'coach',
        status: normalizeStatus(existingClubRole?.status, isInClub),
        enabled: isInClub,
      };
    });
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update club role states when employee or available clubs change
  useEffect(() => {
    setClubRoleStates(
      availableClubs.map(club => {
        const existingClubRole = employee.club_roles?.find(cr => cr.club_id === club.id);
        const isInClub = employee.club_ids.includes(club.id);
        
        return {
          club_id: club.id,
          role: existingClubRole?.role || employee.role || 'coach',
          status: normalizeStatus(existingClubRole?.status, isInClub),
          enabled: isInClub,
        };
      })
    );
  }, [employee, availableClubs]);

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      default: return Dumbbell;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 border-purple-200';
      case 'admin': return 'bg-blue-100 border-blue-200';
      default: return 'bg-green-100 border-green-200';
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const enabledClubs = clubRoleStates.filter(s => s.enabled);
    if (enabledClubs.length === 0) {
      newErrors.clubs = t('management.employees.errors.clubRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClubToggle = (clubId: number) => {
    setClubRoleStates(prev => prev.map(state => 
      state.club_id === clubId 
        ? { ...state, enabled: !state.enabled }
        : state
    ));
    setErrors({ ...errors, clubs: '' });
  };

  const handleRoleChange = (clubId: number, role: EmployeeRole) => {
    setClubRoleStates(prev => prev.map(state => 
      state.club_id === clubId 
        ? { ...state, role }
        : state
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const enabledStates = clubRoleStates.filter(s => s.enabled);
      
      // Determine primary role (highest priority)
      const rolePriority = { owner: 3, admin: 2, coach: 1 };
      const primaryRole = enabledStates.reduce((highest, current) => {
        const currentPriority = rolePriority[current.role as keyof typeof rolePriority] || 0;
        const highestPriority = rolePriority[highest as keyof typeof rolePriority] || 0;
        return currentPriority > highestPriority ? current.role : highest;
      }, 'coach' as EmployeeRole);
      
      onSave({
        role: primaryRole,
        club_ids: enabledStates.map(s => s.club_id),
        club_role_updates: enabledStates.map(s => ({
          club_id: s.club_id,
          role: s.role,
        })),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.employees.editTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          {/* Pending Invitation Banner */}
          {isPendingInvitation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {t('management.employees.pendingInvitationInfo')}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {t('management.employees.pendingInvitationHint')}
                  </p>
                </div>
              </div>
          </div>
          )}

          {/* Name (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.name')}
            </label>
            {isPendingInvitation ? (
              <div className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-400 italic">
                {t('management.employees.nameNotAvailable')}
              </div>
            ) : (
            <input
              type="text"
                value={`${employee.first_name} ${employee.last_name}`}
                readOnly
                className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-500"
              />
            )}
          </div>

          {/* Phone (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.phone')}
            </label>
            <input
              type="tel"
              value={employee.phone}
              readOnly
              className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">{t('management.employees.phoneReadOnly')}</p>
          </div>

          {/* Per-Club Role Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('management.employees.clubsAndRoles')} *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {t('management.employees.clubsAndRolesHint')}
            </p>
            
            {availableClubs.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('management.employees.noClubsAvailable')}
              </p>
            ) : (
              <div className="space-y-3">
                {availableClubs.map(club => {
                  const clubState = clubRoleStates.find(s => s.club_id === club.id);
                  const isEnabled = clubState?.enabled || false;
                  const currentRole = clubState?.role || 'coach';
                  const isPending = clubState?.status === 'pending';
                  const isOwnerRole = currentRole === 'owner';
                  const RoleIcon = getRoleIcon(currentRole);
                  
                  return (
                    <div 
                  key={club.id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isEnabled 
                          ? getRoleColor(currentRole) 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Club Header with Toggle */}
                      <div 
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => !isOwnerRole && handleClubToggle(club.id)}
                >
                  <input
                    type="checkbox"
                          checked={isEnabled}
                    onChange={() => handleClubToggle(club.id)}
                          disabled={isOwnerRole}
                          className="w-4 h-4 text-blue-600 rounded disabled:cursor-not-allowed"
                          onClick={(e) => e.stopPropagation()}
                  />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                              {club.name}
                            </span>
                            {isPending && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                <Clock size={10} />
                                {t('management.employees.status.pending')}
                              </span>
                            )}
                          </div>
                        </div>
                        {isEnabled && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                            currentRole === 'owner' ? 'bg-purple-200 text-purple-700' :
                            currentRole === 'admin' ? 'bg-blue-200 text-blue-700' :
                            'bg-green-200 text-green-700'
                          }`}>
                            <RoleIcon size={14} />
                            <span className="text-xs font-medium">
                              {t(`management.employees.role.${currentRole}`)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Role Selector - shown when enabled */}
                      {isEnabled && !isOwnerRole && (
                        <div className="px-3 pb-3 pt-1 border-t border-white/50">
                          <label className="block text-xs text-gray-600 mb-2">
                            {t('management.employees.roleInThisClub')}
                </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRoleChange(club.id, 'coach')}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentRole === 'coach'
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-white/70 text-gray-600 hover:bg-white'
                              }`}
                            >
                              <Dumbbell size={14} />
                              {t('management.employees.role.coach')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRoleChange(club.id, 'admin')}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentRole === 'admin'
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'bg-white/70 text-gray-600 hover:bg-white'
                              }`}
                            >
                              <Shield size={14} />
                              {t('management.employees.role.admin')}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Owner role note */}
                      {isOwnerRole && (
                        <div className="px-3 pb-3 pt-1 border-t border-white/50">
                          <p className="text-xs text-purple-600 flex items-center gap-1">
                            <Crown size={12} />
                            {t('management.employees.ownerCannotChange')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            )}
            {errors.clubs && <p className="text-red-500 text-xs mt-1">{errors.clubs}</p>}
          </div>
        </form>

        {/* Delete Invitation Button for pending invitations */}
        {isPendingInvitation && onDeleteInvitation && (
          <div className="p-4 border-t border-gray-200">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                {t('management.employees.deleteInvitation')}
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-800 text-center mb-3">
                  {t('management.employees.deleteInvitationConfirm')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (employee.invitation_id && onDeleteInvitation) {
                        setDeleting(true);
                        try {
                          await onDeleteInvitation(employee.invitation_id);
                          onClose();
                        } catch (error) {
                          console.error('Error deleting invitation:', error);
                        } finally {
                          setDeleting(false);
                        }
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer with safe bottom padding */}
        <div className={`sticky bottom-0 bg-white p-4 pb-8 ${isPendingInvitation && onDeleteInvitation ? '' : 'border-t border-gray-200'} flex gap-3`}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          {!isPendingInvitation && (
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('management.employees.saveChanges')}
          </button>
          )}
        </div>
      </div>
    </div>
  );
};
