'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  format?: '24h' | '12h';
  minTime?: string;
  maxTime?: string;
}

export default function CustomTimePicker({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'เลือกเวลา',
  className = '',
  disabled = false,
  format = '24h',
  minTime,
  maxTime,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse value on mount and when value changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h?.padStart(2, '0') || '00');
      setMinutes(m?.padStart(2, '0') || '00');
    } else {
      setHours('00');
      setMinutes('00');
    }
  }, [value]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const dropdownHeight = 280;
        const dropdownWidth = 288;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Check if dropdown would go below viewport
        const spaceBelow = viewportHeight - rect.bottom;
        const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
        
        // Check if dropdown would go outside right edge
        let left = rect.left;
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        
        setDropdownPosition({
          top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
          left: Math.max(8, left),
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const handleTimeSelect = (newHours: string, newMinutes: string) => {
    const formattedTime = `${newHours}:${newMinutes}`;
    onChange(formattedTime);
  };

  const incrementHours = () => {
    const newHours = ((parseInt(hours) + 1) % 24).toString().padStart(2, '0');
    setHours(newHours);
    handleTimeSelect(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = ((parseInt(hours) - 1 + 24) % 24).toString().padStart(2, '0');
    setHours(newHours);
    handleTimeSelect(newHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = ((parseInt(minutes) + 5) % 60).toString().padStart(2, '0');
    setMinutes(newMinutes);
    handleTimeSelect(hours, newMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = ((parseInt(minutes) - 5 + 60) % 60).toString().padStart(2, '0');
    setMinutes(newMinutes);
    handleTimeSelect(hours, newMinutes);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const dropdownContent = isOpen && !disabled && mounted && (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 99998 }}
        onClick={() => setIsOpen(false)}
      />
      <div 
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
        style={{
          zIndex: 99999,
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: '288px',
        }}
      >
        {/* Time Spinners */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={incrementHours}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-16 h-14 flex items-center justify-center bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-2xl font-bold text-blue-600">{hours}</span>
            </div>
            <button
              type="button"
              onClick={decrementHours}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 mt-1">ชั่วโมง</span>
          </div>

          <span className="text-3xl font-bold text-gray-400 mb-6">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={incrementMinutes}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-16 h-14 flex items-center justify-center bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-2xl font-bold text-blue-600">{minutes}</span>
            </div>
            <button
              type="button"
              onClick={decrementMinutes}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 mt-1">นาที</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ล้าง
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 border border-gray-300 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            bg-white text-gray-900 placeholder-gray-400
            flex items-center justify-between
            transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              {value || placeholder}
            </span>
          </div>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </button>

        {mounted && createPortal(dropdownContent, document.body)}
      </div>
    </div>
  );
}
