
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { countries, Country } from '@/utils/countryCodes';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput = ({ value = '', onChange, placeholder = "Enter phone number", className }: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.code === 'US') || countries[0]);
  const [phoneNumber, setPhoneNumber] = useState(value.replace(/^\+\d+\s*/, '') || '');

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const fullNumber = phoneNumber ? `${country.dial_code} ${phoneNumber}` : country.dial_code;
      onChange?.(fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only numbers, spaces, hyphens, and parentheses
    const cleanedInput = input.replace(/[^\d\s\-\(\)]/g, '');
    setPhoneNumber(cleanedInput);
    const fullNumber = cleanedInput ? `${selectedCountry.dial_code} ${cleanedInput}` : selectedCountry.dial_code;
    onChange?.(fullNumber);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[120px] bg-white">
          <SelectValue>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900">{selectedCountry.dial_code}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto bg-white z-50">
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">{country.code}</span>
                <span className="font-medium text-gray-900">{country.dial_code}</span>
                <span className="text-sm text-gray-600 truncate">{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className="flex-1 bg-white"
        pattern="[0-9\s\-\(\)]*"
      />
    </div>
  );
};
