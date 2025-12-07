import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { StudentResponse } from '@/functions/axios/responses';

interface EditProfileModalProps {
  student: StudentResponse;
  onClose: () => void;
  onSave: (data: { first_name: string; last_name?: string }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(student.first_name);
  const [lastName, setLastName] = useState(student.last_name || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!firstName.trim()) {
      setError('Имя не может быть пустым');
      return;
    }

    onSave({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Редактировать профиль</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError('');
              }}
              className={`w-full border rounded-lg p-2 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Введите имя"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2"
              placeholder="Введите фамилию"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="text"
              value={student.phone_number}
              disabled
              className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Номер телефона нельзя изменить</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
