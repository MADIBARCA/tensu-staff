import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Employee, Club, EmployeeRole, UpdateEmployeeData } from '../types';

interface EditEmployeeModalProps {
  employee: Employee;
  clubs: Club[];
  onClose: () => void;
  onSave: (data: UpdateEmployeeData) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  clubs,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<UpdateEmployeeData>({
    first_name: employee.first_name,
    last_name: employee.last_name,
    role: employee.role,
    club_ids: employee.club_ids,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('management.employees.errors.firstNameRequired');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('management.employees.errors.lastNameRequired');
    }
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
      onSave(formData);
    }
  };

  const activeClubs = clubs.filter(c => c.status === 'active');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.employees.editTitle')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.firstName')} *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => {
                setFormData({ ...formData, first_name: e.target.value });
                setErrors({ ...errors, first_name: '' });
              }}
              className={`w-full border rounded-lg p-2 ${
                errors.first_name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.lastName')} *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => {
                setFormData({ ...formData, last_name: e.target.value });
                setErrors({ ...errors, last_name: '' });
              }}
              className={`w-full border rounded-lg p-2 ${
                errors.last_name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
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
              <option value="trainer">{t('management.employees.role.trainer')}</option>
              <option value="admin">{t('management.employees.role.admin')}</option>
            </select>
          </div>

          {/* Clubs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('management.employees.clubs')} *
            </label>
            <div className="space-y-2">
              {activeClubs.map(club => (
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
            {errors.clubs && <p className="text-red-500 text-xs mt-1">{errors.clubs}</p>}
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t('management.employees.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};
