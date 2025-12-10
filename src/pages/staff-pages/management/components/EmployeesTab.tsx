import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Crown, Shield, Dumbbell, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
  onDeleteInvitation?: (invitationId: number) => Promise<void>;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  clubs,
  clubRoles,
  currentUser,
  onAddEmployee,
  onEditEmployee,
  onDeleteInvitation,
}) => {
  const { t } = useI18n();
  const [filters, setFilters] = useState<EmployeeFilters>({ search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showRoleLegend, setShowRoleLegend] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Exclude current user from the list
      if (currentUser && employee.id === currentUser.id) {
        return false;
      }

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
  }, [employees, filters, currentUser]);

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

  // Check if user can add employees (must be owner or admin of at least one club)
  const canAddEmployee = useMemo(() => {
    if (!currentUser) return false;
    
    return clubRoles.some(clubRole => 
      clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner
    );
  }, [clubRoles, currentUser]);

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
        {canAddEmployee && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
          >
            <Plus size={18} />
            {t('management.employees.addStaff')}
          </button>
        )}
      </div>

      {/* Role Legend Toggle */}
      <button
        onClick={() => setShowRoleLegend(!showRoleLegend)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Info size={16} />
        <span>{t('management.employees.roleLegend')}</span>
        {showRoleLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Role Legend Panel */}
      {showRoleLegend && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {t('management.employees.roleIconsTitle')}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {/* Owner */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Crown size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-purple-700 text-sm">
                  {t('management.employees.role.owner')}
                </h5>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('management.employees.roleDescription.owner')}
                </p>
              </div>
            </div>
            
            {/* Admin */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-blue-700 text-sm">
                  {t('management.employees.role.admin')}
                </h5>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('management.employees.roleDescription.admin')}
                </p>
              </div>
            </div>
            
            {/* Coach */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Dumbbell size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-green-700 text-sm">
                  {t('management.employees.role.coach')}
                </h5>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('management.employees.roleDescription.coach')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <option value="coach">{t('management.employees.role.coach')}</option>
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
          clubRoles={clubRoles}
          currentUser={currentUser}
          existingEmployees={employees}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEmployee}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          clubs={clubs}
          clubRoles={clubRoles}
          currentUser={currentUser}
          onClose={() => setEditingEmployee(null)}
          onSave={handleEditEmployee}
          onDeleteInvitation={onDeleteInvitation}
        />
      )}
    </div>
  );
};
