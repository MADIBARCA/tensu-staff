import React from 'react';
import PhoneInputLib from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '+7 XXX XXX XX XX',
  className = '',
  hasError = false,
  disabled = false,
}) => {
  return (
    <div 
      className={`
        w-full border rounded-lg p-2 flex items-center
        ${hasError ? 'border-red-500' : 'border-gray-200'}
        ${disabled ? 'bg-gray-50' : 'bg-white'}
        ${className}
      `}
    >
      <PhoneInputLib
        international
        countryCallingCodeEditable={false}
        defaultCountry="KZ"
        value={value}
        onChange={(val) => onChange(val || '')}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

export default PhoneInput;
