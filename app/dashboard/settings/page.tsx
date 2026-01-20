'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { Settings, X, User, Camera, Check, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import { isPasswordTooSimilar } from '@/lib/auth';

// --- (Logic ส่วนเดิมทั้งหมด คงไว้เหมือนเดิม) ---
const COMMON_PASSWORDS = [
  '12345678', '123456789', '1234567890', '12345678901', '123456789012',
  '1234', '12345', '123456', '1234567', '87654321', '987654321',
  'password', 'password1', 'password12', 'password123', 'password1234',
  'admin', 'admin1', 'admin12', 'admin123', 'admin1234',
  'welcome', 'welcome1', 'welcome12', 'welcome123', 'welcome1234',
  'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwerty1234',
  'letmein', 'letmein1', 'letmein12', 'letmein123',
  'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football',
  'iloveyou', 'trustno1', 'baseball', 'shadow', 'superman',
  'michael', 'jordan', 'tigger', 'hunter', 'buster', 'thomas',
  'hockey', 'ranger', 'daniel', 'hannah', 'maggie', 'jessie',
  '123456', 'password', 'admin', 'welcome',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty', 'abc123',
  '11111111', '00000000', '88888888', '99999999',
  'aaaaaa', 'aaaaaaa', 'aaaaaaaa', 'bbbbbb', 'cccccc',
];

const isCommonPassword = (password: string): boolean => {
  if (!password || password.length < 4) return false;
  const lowerPassword = password.toLowerCase();
  const trimmedPassword = lowerPassword.trim();
  if (COMMON_PASSWORDS.includes(trimmedPassword)) return true;
  if (COMMON_PASSWORDS.some(common => {
    if (common.length < 4) return false;
    return trimmedPassword.includes(common) || common.includes(trimmedPassword);
  })) return true;
  if (/^(.)\1+$/.test(trimmedPassword)) return true;
  if (/^[0-9]+$/.test(trimmedPassword)) {
    const isSequential = trimmedPassword.split('').every((char, index, arr) => {
      if (index === 0) return true;
      const prev = parseInt(arr[index - 1]);
      const curr = parseInt(char);
      return Math.abs(curr - prev) === 1 || (prev === 9 && curr === 0) || (prev === 0 && curr === 9);
    });
    if (isSequential && trimmedPassword.length >= 6) return true;
  }
  if (/^[a-z]+$/.test(trimmedPassword) && trimmedPassword.length >= 6) {
    const isSequential = trimmedPassword.split('').every((char, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1].charCodeAt(0);
      const curr = char.charCodeAt(0);
      return Math.abs(curr - prev) === 1;
    });
    if (isSequential) return true;
  }
  return false;
};

const getPasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
    notCommon: !isCommonPassword(password),
  };
};

const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (isCommonPassword(password)) score = Math.max(0, score - 2);
  
  if (score <= 2) return { score, label: 'อ่อนแอ', color: 'bg-red-500' };
  else if (score <= 4) return { score, label: 'ปานกลาง', color: 'bg-yellow-500' };
  else if (score <= 6) return { score, label: 'แข็งแกร่ง', color: 'bg-emerald-500' };
  else return { score, label: 'แข็งแกร่งมาก', color: 'bg-emerald-600' };
};

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  doctorRank?: string;
  role: 'doctor' | 'admin';
  profileImage?: string;
  driverLicense?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: '', color: '' });
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
    notCommon: true,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let userData: UserData;
      if (userStr) {
        userData = JSON.parse(userStr);
      } else {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      setUser(userData);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์เกิน 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกรูปภาพเท่านั้น');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);
      const uploadResponse = await axios.post('/api/upload/image?folder=profiles', formDataToUpload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.data.url;
      const updateResponse = await axios.put('/api/auth/me', { profileImage: imageUrl }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      setImagePreview(null);
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: updateResponse.data.user.profileImage } }));
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file upload
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put('/api/auth/me', { profileImage: '' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('ลบรูปโปรไฟล์สำเร็จ');
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: '' } }));
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      toast.error('ไม่สามารถลบรูปภาพได้');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (isPasswordTooSimilar(passwordData.newPassword, passwordData.currentPassword)) {
      toast.error('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบันอย่างน้อย 30%');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put('/api/auth/me', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength({ score: 0, label: '', color: '' }); // Reset strength
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
             <div className="h-16 w-16 rounded-full border-b-2 border-indigo-600 animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
         {/* Decorative Background */}
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 to-transparent -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
                 <Settings className="w-8 h-8 text-white" />
              </div>
              ตั้งค่าบัญชี
            </h1>
            <p className="text-gray-500 mt-3 text-lg ml-14">จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Profile Image (Span 4) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden group">
                 
                 {/* Background Pattern */}
                 <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 -z-0"></div>

                 <div className="relative z-10 mt-4 mb-6">
                    <div className="relative group/image">
                      {/* Avatar Image */}
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 relative">
                        {user.profileImage || imagePreview ? (
                          <img
                            src={imagePreview || user.profileImage}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-500">
                             <User className="w-16 h-16" />
                          </div>
                        )}
                        
                        {/* Loading Overlay */}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}

                        {/* Hover Overlay for Upload */}
                        <label 
                          htmlFor="profile-upload" 
                          className={`absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-[2px] ${uploading ? 'pointer-events-none' : ''}`}
                        >
                           <Camera className="w-8 h-8 text-white mb-1" />
                           <span className="text-xs text-white font-medium">เปลี่ยนรูป</span>
                        </label>
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>

                      {/* Remove Button (Only if image exists) */}
                      {user.profileImage && !imagePreview && (
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-transform hover:scale-110 z-20"
                          title="ลบรูปโปรไฟล์"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                 </div>

                 <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                 <p className="text-sm text-gray-500 mb-4">@{user.username}</p>
                 <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'แพทย์'}
                 </div>

                 <p className="text-xs text-gray-400 mt-6">
                   รองรับไฟล์: JPG, PNG, GIF (Max 5MB)
                 </p>
              </div>
            </div>

            {/* Right Column: Password Change (Span 8) */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                        <p className="text-sm text-gray-500">แนะนำให้ใช้รหัสผ่านที่รัดกุมเพื่อความปลอดภัย</p>
                      </div>
                   </div>
                </div>
                
                <div className="p-8">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-1">
                       <PasswordInput
                          label="รหัสผ่านปัจจุบัน"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          placeholder="••••••••"
                        />
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* New Password Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                          <PasswordInput
                            label="รหัสผ่านใหม่"
                            value={passwordData.newPassword}
                            onChange={(e) => {
                              const newPassword = e.target.value;
                              setPasswordData({ ...passwordData, newPassword });
                              setPasswordStrength(calculatePasswordStrength(newPassword));
                              setPasswordRequirements(getPasswordRequirements(newPassword));
                            }}
                            required
                            placeholder="อย่างน้อย 8 ตัวอักษร"
                            minLength={8}
                          />
                          
                          <PasswordInput
                            label="ยืนยันรหัสผ่านใหม่"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                            placeholder="••••••••"
                            minLength={8}
                          />

                           {/* Match Validation Feedback */}
                           {passwordData.confirmPassword && (
                              <div className={`text-xs flex items-center gap-1.5 font-medium ${
                                passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-500'
                              }`}>
                                 {passwordData.newPassword === passwordData.confirmPassword ? (
                                    <><Check className="w-3.5 h-3.5" /> รหัสผ่านตรงกัน</>
                                 ) : (
                                    <><X className="w-3.5 h-3.5" /> รหัสผ่านไม่ตรงกัน</>
                                 )}
                              </div>
                           )}
                       </div>

                       {/* Password Strength & Requirements (Right Side on large screens) */}
                       <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                          {/* Strength Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-end mb-2">
                               <span className="text-xs font-semibold text-gray-700">ความปลอดภัย</span>
                               <span className={`text-xs font-bold transition-colors ${
                                  passwordStrength.score <= 2 ? 'text-red-500' :
                                  passwordStrength.score <= 4 ? 'text-yellow-500' : 'text-emerald-600'
                               }`}>
                                  {passwordStrength.label || '...'}
                               </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full transition-all duration-500 ease-out ${passwordStrength.color}`}
                                  style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                               ></div>
                            </div>
                          </div>

                          {/* Requirements List */}
                          <div className="space-y-2">
                             {[
                               { check: passwordRequirements.minLength, label: 'อย่างน้อย 8 ตัวอักษร' },
                               { check: passwordRequirements.hasLowercase, label: 'ตัวพิมพ์เล็ก (a-z)' },
                               { check: passwordRequirements.hasUppercase, label: 'ตัวพิมพ์ใหญ่ (A-Z)' },
                               { check: passwordRequirements.hasNumber, label: 'ตัวเลข (0-9)' },
                               { check: passwordRequirements.hasSpecial, label: 'อักขระพิเศษ (!@#$)' },
                               { check: passwordRequirements.notCommon, label: 'ไม่ใช่รหัสผ่านทั่วไป', alert: true },
                             ].map((req, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                   <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                      req.check ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                                   } ${req.alert && !req.check ? 'bg-red-100 text-red-500' : ''}`}>
                                      {req.check ? <Check className="w-2.5 h-2.5" /> : req.alert ? <X className="w-2.5 h-2.5" /> : <div className="w-1 h-1 bg-current rounded-full" />}
                                   </div>
                                   <span className={`text-xs ${req.check ? 'text-gray-700 font-medium' : req.alert && !req.check ? 'text-red-500' : 'text-gray-500'}`}>
                                      {req.label}
                                   </span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => router.push('/dashboard/profile')}
                          disabled={saving}
                          className="px-6"
                        >
                          ยกเลิก
                        </Button>
                        <Button 
                           type="submit" 
                           variant="primary" 
                           isLoading={saving}
                           className="px-6 shadow-lg shadow-indigo-500/20"
                        >
                           <span className="flex items-center whitespace-nowrap">
                              <KeyRound className="w-4 h-4 mr-2 shrink-0" />
                              บันทึกรหัสผ่าน
                           </span>
                        </Button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
