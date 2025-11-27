import { useState, useRef, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  name?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  readOnly = false,
  className = '',
  name,
}: CurrencyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number to currency display (2 decimal places)
  const formatDisplay = (num: number): string => {
    if (num === 0) return '';
    return num.toFixed(2);
  };

  // Update input value when value prop changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatDisplay(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value for editing
    setInputValue(value ? String(value) : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Parse and format on blur
    const parsed = parseFloat(inputValue) || 0;
    onChange(parsed);
    setInputValue(formatDisplay(parsed));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty, numbers, and one decimal point
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      setInputValue(newValue);
      // Update parent with parsed value
      const parsed = parseFloat(newValue) || 0;
      onChange(parsed);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      name={name}
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    />
  );
};
