'use client';

import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import TimePicker from 'react-time-picker';
import { Calendar, Clock, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import 'react-time-picker/dist/TimePicker.css';

interface DateTimePickerProps {
  label?: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTime?: boolean;
}

export default function DateTimePicker({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  required = false,
  minDate,
  maxDate,
  placeholder = 'เลือกวันที่และเวลา',
  className = '',
  disabled = false,
  showTime = true,
}: DateTimePickerProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const selectedDate = dateValue ? new Date(dateValue) : undefined;
  const minDateObj = minDate ? new Date(minDate) : undefined;
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onDateChange(formattedDate);
      setIsDateOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange('');
    onTimeChange('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="space-y-3">
        {/* Date Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsDateOpen(!isDateOpen)}
            disabled={disabled}
            className={`
              w-full px-4 py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              bg-white text-gray-900 placeholder-gray-400
              flex items-center justify-between
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
              ${isDateOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className={dateValue ? 'text-gray-900' : 'text-gray-400'}>
                {dateValue ? format(new Date(dateValue), 'dd/MM/yyyy', { locale: th }) : 'เลือกวันที่'}
              </span>
            </div>
            {dateValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </button>

          {isDateOpen && !disabled && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDateOpen(false)}
              />
              <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={[
                    ...(minDateObj ? [{ before: minDateObj }] : []),
                    ...(maxDateObj ? [{ after: maxDateObj }] : []),
                  ]}
                  locale={th}
                  className="rounded-lg"
                  classNames={{
                    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                    month: 'space-y-4',
                    caption: 'flex justify-center pt-1 relative items-center mb-4',
                    caption_label: 'text-lg font-semibold text-gray-900',
                    nav: 'space-x-1 flex items-center',
                    nav_button: 'h-7 w-7 bg-transparent p-0 rounded-lg hover:bg-gray-100 transition-colors',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell: 'text-gray-500 rounded-md w-9 font-normal text-sm',
                    row: 'flex w-full mt-2',
                    cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-50 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-blue-100 transition-colors',
                    day_selected: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 font-semibold',
                    day_today: 'bg-blue-100 text-blue-900 font-semibold',
                    day_outside: 'day-outside text-gray-400 opacity-50 aria-selected:bg-gray-50 aria-selected:text-gray-400 aria-selected:opacity-30',
                    day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent',
                    day_range_middle: 'aria-selected:bg-blue-50 aria-selected:text-blue-900',
                    day_hidden: 'invisible',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Time Picker */}
        {showTime && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <TimePicker
              onChange={(time) => onTimeChange(time || '')}
              value={timeValue || null}
              format="24h"
              disableClock={false}
              clearIcon={null}
              className={`
                w-full px-4 py-2 pl-12 pr-10 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                bg-white text-gray-900 placeholder-gray-400
                transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                [&_.react-time-picker__wrapper]:border-none
                [&_.react-time-picker__inputGroup]:gap-1
                [&_.react-time-picker__inputGroup__input]:text-gray-900
                [&_.react-time-picker__inputGroup__input]:font-medium
                [&_.react-time-picker__inputGroup__divider]:text-gray-400
                [&_.react-time-picker__button]:hidden
              `}
              disabled={disabled}
            />
            {timeValue && !disabled && (
              <button
                type="button"
                onClick={() => onTimeChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
