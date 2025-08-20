
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { sanitizeInput } from '@/utils/security';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  sanitize?: boolean;
  showSecurityIndicator?: boolean;
  onSecureChange?: (value: string) => void;
}

export const SecureInput = ({ 
  label, 
  sanitize = true, 
  showSecurityIndicator = false,
  onSecureChange,
  onChange,
  type = 'text',
  ...props 
}: SecureInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (sanitize) {
      value = sanitizeInput(value);
    }
    
    // Create sanitized event
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value
      }
    };
    
    onChange?.(sanitizedEvent);
    onSecureChange?.(value);
  }, [sanitize, onChange, onSecureChange]);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className="relative space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
          {label}
          {showSecurityIndicator && (
            <Shield className="h-3 w-3 text-green-600" />
          )}
        </label>
      )}
      <div className="relative">
        <Input
          {...props}
          type={inputType}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            bg-white border-gray-300 text-gray-900
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            ${isPasswordType ? 'pr-10' : ''}
            ${props.className || ''}
          `}
          autoComplete={isPasswordType ? 'current-password' : props.autoComplete}
        />
        {isPasswordType && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
