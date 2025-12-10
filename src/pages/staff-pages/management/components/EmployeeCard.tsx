import React, { useMemo } from 'react';
import { Phone, MessageCircle, Edit2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Employee, Club } from '../types';
import type { ClubWithRole, CreateStaffResponse } from '@/functions/axios/responses';

interface EmployeeCardProps {
  employee: Employee;
  clubs: Club[];
  clubRoles: ClubWithRole[];
  currentUser: CreateStaffResponse | null;
  onEdit: () => void;
  onCall: () => void;
  onMessage: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  clubs,
  clubRoles,
  currentUser,
  onEdit,
  onCall,
  onMessage,
}) => {
  const { t } = useI18n();

  // Check if user can edit this employee (must be owner or admin of at least one club where employee works)
  const canEditEmployee = useMemo(() => {
    if (!currentUser) return false;
    
    // Check if user is owner or admin of any club where this employee works
    return employee.club_ids.some(clubId => {
      const clubRole = clubRoles.find(cr => cr.club.id === clubId);
      return clubRole ? (clubRole.role === 'owner' || clubRole.role === 'admin' || clubRole.is_owner) : false;
    });
  }, [employee.club_ids, clubRoles, currentUser]);

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'owner': return t('management.employees.role.owner');
      case 'admin': return t('management.employees.role.admin');
      case 'coach': return t('management.employees.role.coach');
      default: return role;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'coach': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return t('management.employees.status.active');
      case 'pending': return t('management.employees.status.pending');
      case 'deactivated': return t('management.employees.status.deactivated');
      case 'declined': return t('management.employees.status.declined');
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'deactivated': return 'bg-gray-100 text-gray-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const employeeClubs = clubs.filter(c => employee.club_ids.includes(c.id));
  
  // Check if this is a pending invitation (no name)
  const isPendingInvitation = !employee.first_name && !employee.last_name && employee.status === 'pending';
  const displayName = isPendingInvitation 
    ? t('management.employees.pendingInvitation') 
    : `${employee.first_name} ${employee.last_name}`.trim();
  const avatarLetter = isPendingInvitation ? '?' : (employee.first_name?.charAt(0)?.toUpperCase() || '?');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
          isPendingInvitation 
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
            : 'bg-gradient-to-br from-blue-400 to-blue-600'
        }`}>
          {employee.photo_url ? (
            <img src={employee.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-semibold ${isPendingInvitation ? 'text-gray-500 italic' : 'text-gray-900'}`}>
              {displayName}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(employee.role)}`}>
              {getRoleLabel(employee.role)}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
              {getStatusLabel(employee.status)}
            </span>
          </div>

          {employee.telegram_username && (
            <p className="text-sm text-gray-500 mb-1">@{employee.telegram_username}</p>
          )}

          <p className="text-sm text-gray-600 mb-2">{employee.phone}</p>

          {/* Clubs */}
          {employeeClubs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {employeeClubs.map(club => (
                <span
                  key={club.id}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {club.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onCall}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Phone size={16} />
          {t('management.employees.call')}
        </button>
        <button
          onClick={onMessage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <MessageCircle size={16} />
          {t('management.employees.message')}
        </button>
        {canEditEmployee && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          >
            <Edit2 size={16} />
            {t('management.employees.edit')}
          </button>
        )}
      </div>
    </div>
  );
};
