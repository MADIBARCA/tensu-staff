import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Employee, Club, EmployeeRole, UpdateEmployeeData } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

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
  const isPendingInvitation = employee.invitation_id && employee.status === 'pending';
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

  // Initialize form data with only available clubs
  const initialClubIds = useMemo(() => {
    const availableClubIds = availableClubs.map(club => club.id);
    return employee.club_ids.filter(clubId => availableClubIds.includes(clubId));
  }, [employee.club_ids, availableClubs]);

  const [formData, setFormData] = useState<UpdateEmployeeData>({
    role: employee.role,
    club_ids: initialClubIds,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when employee or available clubs change
  useEffect(() => {
    const availableClubIds = availableClubs.map(club => club.id);
    const filteredClubIds = employee.club_ids.filter(clubId => availableClubIds.includes(clubId));
    setFormData(prev => ({
      ...prev,
      club_ids: filteredClubIds,
    }));
  }, [employee.club_ids, availableClubs]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.club_ids.length === 0) {
      newErrors.clubs = t('management.employees.errors.clubRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClubToggle = (clubId: number) => {
    setFormData(prev => ({
      ...prev,
      club_ids: prev.club_ids.includes(clubId)
        ? prev.club_ids.filter(id => id !== clubId)
        : [...prev.club_ids, clubId],
    }));
    setErrors({ ...errors, clubs: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Filter out clubs that are not available (where user is only coach)
      const filteredClubIds = formData.club_ids.filter(clubId => 
        availableClubs.some(club => club.id === clubId)
      );
      onSave({ ...formData, club_ids: filteredClubIds });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center bg-white justify-center *:">
      <div className="bg-white w-full max-w-md rounded-xl max-h-screen overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.employees.editTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.role')} *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
              className="w-full border border-gray-200 rounded-lg p-2"
              disabled={employee.role === 'owner'}
            >
              {employee.role === 'owner' && (
                <option value="owner">{t('management.employees.role.owner')}</option>
              )}
              <option value="coach">{t('management.employees.role.coach')}</option>
              <option value="admin">{t('management.employees.role.admin')}</option>
            </select>
          </div>

          {/* Clubs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('management.employees.clubs')} *
            </label>
            {availableClubs.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('management.employees.noClubsAvailable')}
              </p>
            ) : (
              <div className="space-y-2">
                {availableClubs.map(club => (
                  <label
                    key={club.id}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.club_ids.includes(club.id)}
                      onChange={() => handleClubToggle(club.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-900">{club.name}</span>
                  </label>
                ))}
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

        <div className={`p-4 ${isPendingInvitation && onDeleteInvitation ? '' : 'border-t border-gray-200'} flex gap-3`}>
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
