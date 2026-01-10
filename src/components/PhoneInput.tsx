import React, { useRef } from 'react';
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleArrowClick = () => {
    if (!wrapperRef.current) return;
    // Find the first button inside the phone input (country selector) and click it
    const btn = wrapperRef.current.querySelector('button');
    if (btn && typeof (btn as HTMLElement).click === 'function') {
      (btn as HTMLElement).click();
    }
  };
  return (
    <div 
      ref={wrapperRef}
      className={`
        w-full border rounded-lg p-2 flex items-center relative
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

      {/* Decorative dropdown arrow near the flag to indicate it's clickable */}
      <button
        type="button"
        aria-label="Open country selector"
        onClick={handleArrowClick}
        className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        // Make it non-interactive when disabled
        disabled={disabled}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
};

export default PhoneInput;
