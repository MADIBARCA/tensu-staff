import React, { useState, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, Crown, Shield, Dumbbell } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'libphonenumber-js';
import type { CreateEmployeeData, Club, EmployeeRole, Employee } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface AddEmployeeModalProps {
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  existingEmployees: Employee[];
  onClose: () => void;
  onAdd: (data: CreateEmployeeData) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  clubs,
  clubRoles,
  currentUser,
  existingEmployees,
  onClose,
  onAdd,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateEmployeeData>({
    phone: '',
    role: 'coach',
    club_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Find existing employee by phone
  const existingEmployeeByPhone = useMemo(() => {
    if (formData.phone.length < 12) return null;
    const cleanPhone = formData.phone.replace(/\s/g, '');
    return existingEmployees.find(e => e.phone.replace(/\s/g, '') === cleanPhone) || null;
  }, [formData.phone, existingEmployees]);

  const phoneExists = !!existingEmployeeByPhone;

  // Check which selected clubs already have this person
  const conflictingClubs = useMemo(() => {
    if (!existingEmployeeByPhone) return [];
    
    return formData.club_ids
      .filter(clubId => existingEmployeeByPhone.club_ids.includes(clubId))
      .map(clubId => {
        const club = clubs.find(c => c.id === clubId);
        const clubRole = existingEmployeeByPhone.club_roles?.find(cr => cr.club_id === clubId);
        return {
          id: clubId,
          name: club?.name || '',
          role: clubRole?.role || existingEmployeeByPhone.role,
        };
      });
  }, [existingEmployeeByPhone, formData.club_ids, clubs]);

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
      case 'owner': return 'text-purple-600';
      case 'admin': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };

  const isPhoneValid = useMemo(() => {
    if (!formData.phone) return false;
    try {
      return isValidPhoneNumber(formData.phone);
    } catch {
      return false;
    }
  }, [formData.phone]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isPhoneValid) {
      newErrors.phone = t('management.employees.errors.phoneInvalid');
    }
    if (formData.club_ids.length === 0) {
      newErrors.clubs = t('management.employees.errors.clubRequired');
    }
    // Check for conflicting clubs (person already has role in selected clubs)
    if (conflictingClubs.length > 0) {
      newErrors.clubs = t('management.employees.errors.alreadyInClub');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    setErrors({ ...errors, phone: '' });
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
      onAdd({ ...formData, club_ids: filteredClubIds });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full w-full max-w-md mx-auto flex flex-col">
        {/* Header with mt-20 to avoid Telegram UI buttons */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.employees.addTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.phone')} *
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={handlePhoneChange}
              hasError={!!errors.phone || phoneExists}
              placeholder={t('management.employees.phonePlaceholder') || 'Введите номер телефона'}
            />
            {(errors.phone || phoneExists) && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle size={14} className="text-red-500" />
                <p className="text-red-500 text-xs">
                  {errors.phone || t('management.employees.errors.phoneExists')}
                </p>
              </div>
            )}
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
            >
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
                {availableClubs.map(club => {
                  // Check if this person already has a role in this club
                  const existingRole = existingEmployeeByPhone?.club_roles?.find(
                    cr => cr.club_id === club.id
                  );
                  const hasRoleInClub = existingRole || 
                    (existingEmployeeByPhone?.club_ids.includes(club.id) && existingEmployeeByPhone);
                  const roleInClub = existingRole?.role || existingEmployeeByPhone?.role;
                  const RoleIcon = roleInClub ? getRoleIcon(roleInClub) : null;
                  
                  return (
                    <div key={club.id}>
                      <label
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          hasRoleInClub && formData.club_ids.includes(club.id)
                            ? 'border-amber-300 bg-amber-50'
                            : formData.club_ids.includes(club.id)
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.club_ids.includes(club.id)}
                          onChange={() => handleClubToggle(club.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="flex-1 text-gray-900">{club.name}</span>
                        {hasRoleInClub && RoleIcon && (
                          <div className="flex items-center gap-1">
                            <RoleIcon size={14} className={getRoleColor(roleInClub || '')} />
                            <span className={`text-xs ${getRoleColor(roleInClub || '')}`}>
                              {t(`management.employees.role.${roleInClub}`)}
                            </span>
                          </div>
                        )}
                      </label>
                      
                      {/* Warning for clubs where person already has role */}
                      {hasRoleInClub && formData.club_ids.includes(club.id) && (
                        <div className="mt-1 ml-6 flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">
                            {t('management.employees.alreadyHasRole', {
                              name: existingEmployeeByPhone?.first_name || t('management.employees.thisPerson'),
                              role: t(`management.employees.role.${roleInClub}`),
                              club: club.name,
                            })}
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

        {/* Footer with safe bottom padding */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-3 pb-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={conflictingClubs.length > 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            + {t('management.employees.add')}
          </button>
        </div>
      </div>
    </div>
  );
};
