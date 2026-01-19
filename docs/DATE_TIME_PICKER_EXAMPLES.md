# Date & Time Picker Components - Usage Examples

## 📅 DatePickerV2 (Modern Calendar)

ใช้ `react-day-picker` - Modern, accessible, และ Tailwind-friendly

### Basic Usage:
```tsx
import DatePickerV2 from '@/components/DatePickerV2';

<DatePickerV2
  label="เลือกวันที่"
  value={dateValue}
  onChange={(date) => setDateValue(date)}
  placeholder="เลือกวันที่"
  required
/>
```

### With Min/Max Date:
```tsx
<DatePickerV2
  label="วันเริ่มต้น"
  value={startDate}
  onChange={(date) => setStartDate(date)}
  minDate="2024-01-01"
  maxDate="2024-12-31"
/>
```

### Range Selection:
```tsx
<DatePickerV2
  label="ช่วงวันที่"
  value={dateRange}
  onChange={(range) => setDateRange(range)}
  mode="range"
/>
```

---

## ⏰ TimePicker

ใช้ `react-time-picker` - Simple และ lightweight

### Basic Usage:
```tsx
import TimePicker from '@/components/TimePicker';

<TimePicker
  label="เลือกเวลา"
  value={timeValue}
  onChange={(time) => setTimeValue(time)}
  placeholder="เลือกเวลา"
  format="24h" // or "12h"
/>
```

### With Min/Max Time:
```tsx
<TimePicker
  label="เวลาเริ่มต้น"
  value={startTime}
  onChange={(time) => setStartTime(time)}
  minTime="09:00"
  maxTime="18:00"
/>
```

---

## 📅⏰ DateTimePicker (Combined)

รวม Date และ Time picker ใน component เดียว

### Basic Usage:
```tsx
import DateTimePicker from '@/components/DateTimePicker';

<DateTimePicker
  label="วันที่และเวลา"
  dateValue={dateValue}
  timeValue={timeValue}
  onDateChange={(date) => setDateValue(date)}
  onTimeChange={(time) => setTimeValue(time)}
  showTime={true}
/>
```

### Date Only:
```tsx
<DateTimePicker
  label="เลือกวันที่"
  dateValue={dateValue}
  timeValue=""
  onDateChange={(date) => setDateValue(date)}
  onTimeChange={() => {}}
  showTime={false}
/>
```

---

## ✨ Features Comparison

| Feature | react-datepicker (Old) | react-day-picker (New) |
|---------|------------------------|------------------------|
| **Size** | ~50KB | ~15KB (Smaller) |
| **Accessibility** | Good | Excellent (ARIA) |
| **Tailwind Support** | Limited | Full Support |
| **Modern Design** | Basic | Modern & Beautiful |
| **TypeScript** | Good | Excellent |
| **Mobile Support** | Good | Excellent |
| **Range Selection** | Yes | Yes (Better) |

---

## 🎨 Styling

Components ทั้งหมดรองรับ Tailwind CSS และมี styling ที่สวยงาม:
- ✅ Hover effects
- ✅ Focus states
- ✅ Animations
- ✅ Responsive design
- ✅ Dark mode ready (สามารถเพิ่มได้)

---

## 📝 Migration Guide

### จาก DatePicker เดิมไป DatePickerV2:

**Before:**
```tsx
import DatePicker from '@/components/DatePicker';

<DatePicker
  label="วันที่"
  value={date}
  onChange={setDate}
/>
```

**After:**
```tsx
import DatePickerV2 from '@/components/DatePickerV2';

<DatePickerV2
  label="วันที่"
  value={date}
  onChange={setDate}
/>
```

API เหมือนกัน! แค่เปลี่ยน import เท่านั้น

---

## 🚀 Advanced Features

### Custom Styling:
```tsx
<DatePickerV2
  className="custom-class"
  // ... other props
/>
```

### Disabled State:
```tsx
<DatePickerV2
  disabled={true}
  // ... other props
/>
```

### Required Field:
```tsx
<DatePickerV2
  required={true}
  // ... other props
/>
```
