import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { EmployeeCard } from './EmployeeCard';
import { AddEmployeeModal } from './AddEmployeeModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import type { Employee, Club, EmployeeFilters, CreateEmployeeData, UpdateEmployeeData, EmployeeRole } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface EmployeesTabProps {
  employees: Employee[];
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onAddEmployee: (data: CreateEmployeeData) => void;
  onEditEmployee: (id: number, data: UpdateEmployeeData) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  clubs,
  clubRoles,
  currentUser,
  onAddEmployee,
  onEditEmployee,
}) => {
  const { t } = useI18n();
  const [filters, setFilters] = useState<EmployeeFilters>({ search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
        const phone = employee.phone.replace(/\s/g, '');
        const searchPhone = filters.search.replace(/\s/g, '');
        
        if (!fullName.includes(searchLower) && !phone.includes(searchPhone)) {
          return false;
        }
      }

      // Role filter
      if (filters.role && employee.role !== filters.role) {
        return false;
      }

      // Club filter
      if (filters.club_id && !employee.club_ids.includes(filters.club_id)) {
        return false;
      }

      return true;
    });
  }, [employees, filters]);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\s/g, '')}`, '_blank');
  };

  const handleMessage = (username?: string) => {
    if (username) {
      window.open(`https://t.me/${username}`, '_blank');
    }
  };

  const handleAddEmployee = (data: CreateEmployeeData) => {
    onAddEmployee(data);
    setShowAddModal(false);
  };

  const handleEditEmployee = (data: UpdateEmployeeData) => {
    if (editingEmployee) {
      onEditEmployee(editingEmployee.id, data);
      setEditingEmployee(null);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const hasActiveFilters = filters.role || filters.club_id;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t('management.employees.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 border rounded-lg transition-colors ${
            hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={20} />
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
        >
          <Plus size={18} />
          {t('management.employees.addStaff')}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{t('management.employees.filters')}</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t('common.reset')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('management.employees.role')}
              </label>
              <select
                value={filters.role || ''}
                onChange={(e) => setFilters({ ...filters, role: e.target.value as EmployeeRole || undefined })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              >
                <option value="">{t('management.employees.allRoles')}</option>
                <option value="owner">{t('management.employees.role.owner')}</option>
                <option value="admin">{t('management.employees.role.admin')}</option>
                <option value="trainer">{t('management.employees.role.trainer')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('management.employees.club')}
              </label>
              <select
                value={filters.club_id || ''}
                onChange={(e) => setFilters({ ...filters, club_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              >
                <option value="">{t('management.employees.allClubs')}</option>
                {clubs.filter(c => c.status === 'active').map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Employee Count */}
      <div className="text-sm text-gray-500">
        {filteredEmployees.length} {t('management.employees.count')}
      </div>

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('management.employees.notFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              clubs={clubs}
              clubRoles={clubRoles}
              currentUser={currentUser}
              onEdit={() => setEditingEmployee(employee)}
              onCall={() => handleCall(employee.phone)}
              onMessage={() => handleMessage(employee.telegram_username)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          clubs={clubs}
          existingEmployees={employees}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEmployee}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          clubs={clubs}
          onClose={() => setEditingEmployee(null)}
          onSave={handleEditEmployee}
        />
      )}
    </div>
  );
};
