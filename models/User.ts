import mongoose, { Schema, Document } from 'mongoose';

export type DoctorRank = 
  | '10' // ผู้อำนวยการโรงพยาบาล
  | '09' // รองผู้อำนวยการโรงพยาบาล
  | '08' // ผู้ช่วยผู้อำนวยการโรงพยาบาล
  | '07' // หัวหน้าแพทย์
  | '06' // รองหัวหน้าแพทย์
  | '05' // เลขานุการแพทย์
  | '04' // แพทย์ชำนาญ
  | '03' // แพทย์ปี 3
  | '02' // แพทย์ปี 2
  | '01' // แพทย์ปี 1
  | '00'; // นักเรียนแพทย์

export type DriverLicenseType = '1' | '2' | '3'; // Type 1 - พื้นฐาน, Type 2 - ขั้นกลาง, Type 3 - ขั้นสูง

export interface IUser extends Document {
  username: string;
  password: string;
  name: string;
  doctorRank?: DoctorRank;
  profileImage?: string;
  driverLicense?: string; // หมายเลขใบขับขี่
  driverLicenseType?: DriverLicenseType; // Type ของใบอนุญาตขับฮอ
  role: 'doctor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      index: true,
    },
    doctorRank: {
      type: String,
      enum: ['10', '09', '08', '07', '06', '05', '04', '03', '02', '01', '00'],
      trim: true,
      index: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    driverLicense: {
      type: String,
      trim: true,
    },
    driverLicenseType: {
      type: String,
      enum: ['1', '2', '3'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['doctor', 'admin'],
      default: 'doctor',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserSchema.index({ createdAt: -1 });
UserSchema.index({ role: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
