import React from 'react';
import PhoneInputLib from 'react-phone-number-input';
import type { FlagProps } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Convert country code to emoji flag
// Each letter is converted to regional indicator symbol (A=🇦, B=🇧, etc.)
const countryCodeToEmoji = (countryCode: string): string => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Custom emoji flag component
const EmojiFlag: React.FC<FlagProps> = ({ country }) => {
  if (!country) return null;
  return (
    <span 
      className="text-xl leading-none" 
      role="img" 
      aria-label={country}
    >
      {countryCodeToEmoji(country)}
    </span>
  );
};

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
        flagComponent={EmojiFlag}
      />
    </div>
  );
};

export default PhoneInput;
