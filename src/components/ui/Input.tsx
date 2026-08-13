// src/components/ui/Input.tsx
'use client';

import { useState } from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  icon,
  className = '',
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: '#374151' }}
        >
          {label}
          {required && <span style={{ color: '#EF6C00' }}> *</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pr-10 ${isPassword ? 'pl-12' : 'pl-4'} py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 ${className}`}
          style={{
            backgroundColor: '#FDFBF7',
            border: error ? '2px solid #DC2626' : '2px solid #E5E7EB',
            color: '#374151'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#2E7D32';
              e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.1)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 left-0 pl-3 flex items-center"
            style={{ color: '#374151' }}
          >
            <span className="text-sm">
              {showPassword ? '🙈' : '👁️'}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
    </div>
  );
}