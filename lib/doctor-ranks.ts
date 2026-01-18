/**
 * Doctor Rank/Position definitions for hospital/medical city system
 */

export interface DoctorRankOption {
  value: string;
  label: string;
  description: string;
}

export const DOCTOR_RANKS: DoctorRankOption[] = [
  {
    value: '10',
    label: 'ผู้อำนวยการโรงพยาบาล',
    description: 'Hospital Director',
  },
  {
    value: '09',
    label: 'รองผู้อำนวยการโรงพยาบาล',
    description: 'Deputy Hospital Director',
  },
  {
    value: '08',
    label: 'ผู้ช่วยผู้อำนวยการโรงพยาบาล',
    description: 'Assistant Hospital Director',
  },
  {
    value: '07',
    label: 'หัวหน้าแพทย์',
    description: 'Head Doctor',
  },
  {
    value: '06',
    label: 'รองหัวหน้าแพทย์',
    description: 'Deputy Head Doctor',
  },
  {
    value: '05',
    label: 'เลขานุการแพทย์',
    description: 'Medical Secretary',
  },
  {
    value: '04',
    label: 'แพทย์ชำนาญ',
    description: 'Expert Doctor / Specialist Doctor',
  },
  {
    value: '03',
    label: 'แพทย์ปี 3',
    description: 'Doctor Year 3',
  },
  {
    value: '02',
    label: 'แพทย์ปี 2',
    description: 'Doctor Year 2',
  },
  {
    value: '01',
    label: 'แพทย์ปี 1',
    description: 'Doctor Year 1',
  },
  {
    value: '00',
    label: 'นักเรียนแพทย์',
    description: 'Medical Student',
  },
];

/**
 * Get doctor rank label by value
 */
export function getDoctorRankLabel(value: string | undefined | null): string {
  if (!value) return '-';
  const rank = DOCTOR_RANKS.find((r) => r.value === value);
  return rank ? rank.label : value;
}

/**
 * Get doctor rank description by value
 */
export function getDoctorRankDescription(value: string | undefined | null): string {
  if (!value) return '';
  const rank = DOCTOR_RANKS.find((r) => r.value === value);
  return rank ? rank.description : '';
}
