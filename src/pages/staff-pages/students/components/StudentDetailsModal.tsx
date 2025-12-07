import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, ChevronDown, ChevronUp, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { Student, AttendanceRecord, PaymentRecord } from '../types';
import { generateAttendanceRecords, generatePaymentRecords } from '../mockData';

interface StudentDetailsModalProps {
  student: Student;
  onClose: () => void;
  onExtend: () => void;
  onFreeze: () => void;
  onMarkAttendance: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  onClose,
  onExtend,
  onFreeze,
  onMarkAttendance,
}) => {
  const { t } = useI18n();
  const [showAttendance, setShowAttendance] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    // Load attendance and payment records
    setAttendanceRecords(generateAttendanceRecords(student.id));
    setPaymentRecords(generatePaymentRecords(student.id));
  }, [student.id]);

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return t('students.status.active');
      case 'frozen':
        return t('students.status.frozen');
      case 'expired':
        return t('students.status.expired');
      case 'new':
        return t('students.status.new');
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
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'new':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAttendanceStatusColor = (status: string): string => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'late':
        return 'bg-yellow-100 text-yellow-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentTypeLabel = (type: string): string => {
    switch (type) {
      case 'purchase':
        return t('students.payment.purchase');
      case 'renewal':
        return t('students.payment.renewal');
      case 'freeze':
        return t('students.payment.freeze');
      case 'refund':
        return t('students.payment.refund');
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleCall = () => {
    window.location.href = `tel:${student.phone_number.replace(/\s/g, '')}`;
  };

  const handleMessage = () => {
    if (student.username) {
      window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${student.username}`);
    }
  };

  const canFreeze = student.membership?.freeze_available && 
    student.membership.freeze_days_used < student.membership.freeze_days_total &&
    student.membership.status === 'active';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('students.details.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
              {student.first_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {student.first_name} {student.last_name}
              </h3>
              <p className="text-sm text-gray-600">{student.phone_number}</p>
              {student.membership && (
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    student.membership.status
                  )}`}
                >
                  {getStatusLabel(student.membership.status)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCall}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              >
                <Phone size={20} />
              </button>
              {student.username && (
                <button
                  onClick={handleMessage}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <MessageCircle size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Group/Section Info */}
          {(student.section_name || student.group_name) && (
            <div className="bg-gray-50 rounded-lg p-3">
              {student.section_name && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('students.details.section')}:</span>{' '}
                  {student.section_name}
                </p>
              )}
              {student.group_name && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('students.details.group')}:</span>{' '}
                  {student.group_name}
                </p>
              )}
              {student.trainer_name && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('students.details.trainer')}:</span>{' '}
                  {student.trainer_name}
                </p>
              )}
            </div>
          )}

          {/* Membership Info */}
          {student.membership && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('students.details.tariff')}:</span>{' '}
                {student.membership.tariff_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('students.details.period')}:</span>{' '}
                {formatDate(student.membership.start_date)} — {formatDate(student.membership.end_date)}
              </p>
              {student.membership.freeze_available && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('students.details.freezeDays')}:</span>{' '}
                  {student.membership.freeze_days_total - student.membership.freeze_days_used} / {student.membership.freeze_days_total}
                </p>
              )}
            </div>
          )}

          {/* Attendance History */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAttendance(!showAttendance)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                  {t('students.details.attendanceHistory')}
                </span>
              </div>
              {showAttendance ? (
                <ChevronUp size={18} className="text-gray-600" />
              ) : (
                <ChevronDown size={18} className="text-gray-600" />
              )}
            </button>
            {showAttendance && (
              <div className="max-h-48 overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500 text-center">
                    {t('students.details.noAttendance')}
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {formatShortDate(record.date)} {record.time}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getAttendanceStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status === 'present' && t('students.attendance.present')}
                            {record.status === 'late' && t('students.attendance.late')}
                            {record.status === 'absent' && t('students.attendance.absent')}
                          </span>
                        </div>
                        <p className="text-gray-600">{record.training_type}</p>
                        <p className="text-gray-500 text-xs">{record.trainer_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPayments(!showPayments)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-gray-600" />
                <span className="font-medium text-gray-900">
                  {t('students.details.paymentHistory')}
                </span>
              </div>
              {showPayments ? (
                <ChevronUp size={18} className="text-gray-600" />
              ) : (
                <ChevronDown size={18} className="text-gray-600" />
              )}
            </button>
            {showPayments && (
              <div className="max-h-48 overflow-y-auto">
                {paymentRecords.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500 text-center">
                    {t('students.details.noPayments')}
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paymentRecords.map((record) => (
                      <div key={record.id} className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {formatShortDate(record.date)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {record.amount.toLocaleString()} ₸
                          </span>
                        </div>
                        <p className="text-gray-600">{getPaymentTypeLabel(record.operation_type)}</p>
                        <p className="text-gray-500 text-xs">{record.tariff_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onExtend}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Calendar size={18} />
            {t('students.action.extend')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onFreeze}
              disabled={!canFreeze}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('students.action.freeze')}
            </button>
            <button
              onClick={onMarkAttendance}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle size={18} />
              {t('students.action.markAttendance')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
