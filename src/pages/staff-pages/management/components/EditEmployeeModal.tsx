import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Loader2, Crown, Shield, Dumbbell, Clock, UserMinus } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { teamApi } from '@/functions/axios/axiosFunctions';
import { useTelegram } from '@/hooks/useTelegram';
import type { Employee, Club, EmployeeRole, UpdateEmployeeData } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';
import { useStickyState } from '@/hooks/useStickyState';

interface ClubRoleState {
  club_id: number;
  role: EmployeeRole;
  status: 'active' | 'pending';
  enabled: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
}

interface EditEmployeeModalProps {
  employee: Employee;
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onClose: () => void;
  onSave: (data: UpdateEmployeeData) => void;
  onDeleteInvitation?: (invitationId: number) => Promise<void>;
  onRemoveFromClub?: (clubId: number, userId: number) => Promise<void>;
  onRoleChanged?: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  clubs,
  clubRoles,
  currentUser,
  onClose,
  onSave,
  onDeleteInvitation,
  onRemoveFromClub,
  onRoleChanged,
}) => {
  const { t } = useI18n();
  const { initDataRaw } = useTelegram();
  
  // Check if this is a pending invitation
  const isPendingInvitation = employee.invitation_id && employee.status === 'pending' && !employee.first_name;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clubToRemove, setClubToRemove] = useState<number | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<number | null>(null);
  const [savingRole, setSavingRole] = useState<number | null>(null);

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

  // Check permissions for each club
  const getClubPermissions = (clubId: number): { canDelete: boolean; canChangeRole: boolean } => {
    const clubRole = clubRoles.find(cr => cr.club.id === clubId);
    const isOwner = clubRole?.role === 'owner' || clubRole?.is_owner;
    const isAdmin = clubRole?.role === 'admin';
    const employeeRoleInClub = employee.club_roles?.find(cr => cr.club_id === clubId)?.role || employee.role;
    
    return {
      canDelete: (isOwner && employeeRoleInClub !== 'owner') || (isAdmin && employeeRoleInClub === 'coach'),
      canChangeRole: Boolean(isOwner && employeeRoleInClub !== 'owner'),
    };
  };

  // Initialize per-club role state
  const [clubRoleStates, setClubRoleStates] = useState<ClubRoleState[]>(() => {
    return availableClubs.map(club => {
      const existingClubRole = employee.club_roles?.find(cr => cr.club_id === club.id);
      const isInClub = employee.club_ids.includes(club.id);
      const permissions = getClubPermissions(club.id);
      
      return {
        club_id: club.id,
        role: existingClubRole?.role || employee.role || 'coach',
        status: normalizeStatus(existingClubRole?.status, isInClub),
        enabled: isInClub,
        ...permissions,
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
        const permissions = getClubPermissions(club.id);
        
        return {
          club_id: club.id,
          role: existingClubRole?.role || employee.role || 'coach',
          status: normalizeStatus(existingClubRole?.status, isInClub),
          enabled: isInClub,
          ...permissions,
        };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleRoleChange = async (clubId: number, role: EmployeeRole) => {
    if (!initDataRaw || !employee.id) return;
    
    setSavingRole(clubId);
    try {
      await teamApi.changeRole(clubId, employee.id, role, initDataRaw);
      
      // Update local state
      setClubRoleStates(prev => prev.map(state => 
        state.club_id === clubId 
          ? { ...state, role }
          : state
      ));
      
      // Notify parent to refresh
      onRoleChanged?.();
      
      window.Telegram?.WebApp?.showAlert(t('management.employees.roleChanged'));
    } catch (error) {
      console.error('Error changing role:', error);
      window.Telegram?.WebApp?.showAlert(t('management.employees.errors.roleChangeFailed'));
    } finally {
      setSavingRole(null);
    }
  };

  const handleRemoveFromClub = async (clubId: number) => {
    if (!initDataRaw || !employee.id) return;
    
    setClubToRemove(clubId);
    setShowRemoveConfirm(null);
    
    try {
      await teamApi.removeMember(clubId, employee.id, initDataRaw);
      
      // Update local state
      setClubRoleStates(prev => prev.map(state => 
        state.club_id === clubId 
          ? { ...state, enabled: false }
          : state
      ));
      
      // Notify parent
      onRemoveFromClub?.(clubId, employee.id);
      
      // Check if employee is removed from all clubs
      const remainingClubs = clubRoleStates.filter(s => s.enabled && s.club_id !== clubId);
      if (remainingClubs.length === 0) {
        onClose();
      }
      
      window.Telegram?.WebApp?.showAlert(t('management.employees.removedFromClub'));
    } catch (error) {
      console.error('Error removing from club:', error);
      window.Telegram?.WebApp?.showAlert(t('management.employees.errors.removeFailed'));
    } finally {
      setClubToRemove(null);
    }
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

  const { isSticky, sentinelRef, stickyRef } = useStickyState(true);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Sentinel for sticky detection */}
        <div ref={sentinelRef} className="h-0" />
        
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div 
          ref={stickyRef}
          className={`sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 transition-all duration-200 ${
            isSticky ? 'mt-20' : ''
          }`}
        >
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
                  const canDelete = clubState?.canDelete || false;
                  const canChangeRole = clubState?.canChangeRole || false;
                  const RoleIcon = getRoleIcon(currentRole);
                  const isRemoving = clubToRemove === club.id;
                  const isSavingThisRole = savingRole === club.id;
                  
                  if (!isEnabled) return null;
                  
                  return (
                    <div 
                      key={club.id}
                      className={`border rounded-xl overflow-hidden transition-all ${getRoleColor(currentRole)}`}
                    >
                      {/* Club Header */}
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
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
                      </div>
                      
                      {/* Role Selector - shown when can change role */}
                      {canChangeRole && !isOwnerRole && (
                        <div className="px-3 pb-3 pt-1 border-t border-white/50">
                          <label className="block text-xs text-gray-600 mb-2">
                            {t('management.employees.roleInThisClub')}
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRoleChange(club.id, 'coach')}
                              disabled={isSavingThisRole}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                currentRole === 'coach'
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-white/70 text-gray-600 hover:bg-white'
                              }`}
                            >
                              {isSavingThisRole && currentRole !== 'coach' ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Dumbbell size={14} />
                              )}
                              {t('management.employees.role.coach')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRoleChange(club.id, 'admin')}
                              disabled={isSavingThisRole}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                                currentRole === 'admin'
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'bg-white/70 text-gray-600 hover:bg-white'
                              }`}
                            >
                              {isSavingThisRole && currentRole !== 'admin' ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Shield size={14} />
                              )}
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
                      
                      {/* Remove from club button */}
                      {canDelete && !isPending && (
                        <div className="px-3 pb-3 border-t border-white/50">
                          {showRemoveConfirm === club.id ? (
                            <div className="bg-red-50 rounded-lg p-3">
                              <div className="flex items-start gap-2 mb-3">
                                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">
                                    {t('management.employees.removeConfirmTitle')}
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    {t('management.employees.removeConfirmMessage', { 
                                      name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || t('management.employees.thisEmployee'),
                                      club: club.name 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowRemoveConfirm(null)}
                                  disabled={isRemoving}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                                >
                                  {t('common.cancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromClub(club.id)}
                                  disabled={isRemoving}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {isRemoving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <UserMinus size={14} />
                                  )}
                                  {t('common.delete')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowRemoveConfirm(club.id)}
                              disabled={isRemoving}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserMinus size={14} />
                              )}
                              {t('management.employees.removeFromClub')}
                            </button>
                          )}
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
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
