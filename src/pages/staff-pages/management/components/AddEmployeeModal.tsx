import React, { useState, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { CreateEmployeeData, Club, EmployeeRole, Employee } from '../types';

interface AddEmployeeModalProps {
  clubs: Club[];
  existingEmployees: Employee[];
  onClose: () => void;
  onAdd: (data: CreateEmployeeData) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  clubs,
  existingEmployees,
  onClose,
  onAdd,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateEmployeeData>({
    first_name: '',
    last_name: '',
    phone: '+7',
    role: 'trainer',
    club_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const phoneExists = useMemo(() => {
    if (formData.phone.length < 12) return false;
    const cleanPhone = formData.phone.replace(/\s/g, '');
    return existingEmployees.some(e => e.phone.replace(/\s/g, '') === cleanPhone);
  }, [formData.phone, existingEmployees]);

  const isPhoneValid = useMemo(() => {
    const cleanPhone = formData.phone.replace(/[^0-9+]/g, '');
    return cleanPhone.length === 12; // +7 + 10 digits
  }, [formData.phone]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('management.employees.errors.firstNameRequired');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('management.employees.errors.lastNameRequired');
    }
    if (!isPhoneValid) {
      newErrors.phone = t('management.employees.errors.phoneInvalid');
    }
    if (phoneExists) {
      newErrors.phone = t('management.employees.errors.phoneExists');
    }
    if (formData.club_ids.length === 0) {
      newErrors.clubs = t('management.employees.errors.clubRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    // Keep +7 prefix
    if (!value.startsWith('+7')) {
      value = '+7' + value.replace(/^\+7/, '');
    }
    // Remove non-numeric characters except +
    const cleaned = '+7' + value.slice(2).replace(/[^0-9]/g, '');
    // Limit to +7 + 10 digits
    const limited = cleaned.slice(0, 12);
    
    setFormData({ ...formData, phone: limited });
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
      onAdd(formData);
    }
  };

  const activeClubs = clubs.filter(c => c.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl max-h-screen overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('management.employees.addTitle')}
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

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('management.employees.phone')} *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`w-full border rounded-lg p-2 ${
                errors.phone || phoneExists ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="+7 XXX XXX XX XX"
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
            disabled={phoneExists}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            + {t('management.employees.add')}
          </button>
        </div>
      </div>
    </div>
  );
};
