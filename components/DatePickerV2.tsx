'use client';

import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DatePickerV2Props {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: 'single' | 'range';
  showTime?: boolean;
  disablePastDates?: boolean;
}

export default function DatePickerV2({
  label,
  value,
  onChange,
  required = false,
  minDate,
  maxDate,
  placeholder = 'เลือกวันที่',
  className = '',
  disabled = false,
  mode = 'single',
  showTime = false,
  disablePastDates = true,
}: DatePickerV2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;
  
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Use minDate prop or today if disablePastDates is true
  const effectiveMinDate = disablePastDates 
    ? (minDate ? new Date(Math.max(new Date(minDate).getTime(), today.getTime())) : today)
    : (minDate ? new Date(minDate) : undefined);
  
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
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
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className={value ? 'text-gray-900' : 'text-gray-400'}>
              {value ? format(new Date(value), 'dd/MM/yyyy', { locale: th }) : placeholder}
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

        {isOpen && !disabled && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 pb-6 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={[
                  ...(effectiveMinDate ? [{ before: effectiveMinDate }] : []),
                  ...(maxDateObj ? [{ after: maxDateObj }] : []),
                ]}
                locale={th}
                className="rounded-lg"
                classNames={{
                  months: 'flex flex-col',
                  month: 'space-y-4',
                  month_caption: 'flex justify-center pt-1 relative items-center mb-4',
                  caption_label: 'text-lg font-semibold text-gray-900',
                  nav: 'flex items-center',
                  button_previous: 'absolute left-0 p-2 hover:bg-gray-100 rounded-lg transition-colors',
                  button_next: 'absolute right-0 p-2 hover:bg-gray-100 rounded-lg transition-colors',
                  table: 'w-full border-collapse',
                  weekdays: 'flex',
                  weekday: 'text-gray-500 rounded-md w-9 font-normal text-sm text-center',
                  week: 'flex w-full mt-2',
                  day: 'h-9 w-9 text-center text-sm p-0 relative rounded-lg',
                  day_button: 'h-9 w-9 p-0 font-normal rounded-lg hover:bg-blue-100 transition-colors',
                  selected: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 font-semibold',
                  today: 'bg-blue-100 text-blue-900 font-semibold',
                  outside: 'text-gray-400 opacity-50',
                  disabled: 'text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent',
                  hidden: 'invisible',
                }}
                components={{
                  Chevron: ({ orientation }) => {
                    if (orientation === 'left') {
                      return <ChevronLeft className="w-5 h-5 text-gray-600" />;
                    }
                    return <ChevronRight className="w-5 h-5 text-gray-600" />;
                  },
                }}
              />
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-300 pb-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="w-full h-12 px-4 text-base font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 flex items-center justify-center"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const todayDate = new Date();
                    const formattedToday = format(todayDate, 'yyyy-MM-dd');
                    onChange(formattedToday);
                    setIsOpen(false);
                  }}
                  className="w-full h-12 px-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center"
                >
                  วันนี้
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
