'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { Settings, Upload, X, User, Mail, Award, Save, Car, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { DOCTOR_RANKS, getDoctorRankLabel } from '@/lib/doctor-ranks';
import PasswordInput from '@/components/PasswordInput';

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      setUser(userData);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      console.error('Profile error:', error);
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

      // Upload image
      const uploadResponse = await axios.post(
        '/api/upload/image?folder=profiles',
        formDataToUpload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const imageUrl = uploadResponse.data.data.url;

      // Update user profile
      const updateResponse = await axios.put(
        '/api/auth/me',
        { profileImage: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      setImagePreview(null);
      
      // Trigger custom event to notify profile page
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: updateResponse.data.user.profileImage } 
      }));
      
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put(
        '/api/auth/me',
        { profileImage: '' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('ลบรูปโปรไฟล์สำเร็จ');
      
      // Trigger custom event to notify profile page
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: updateResponse.data.user.profileImage || '' } 
      }));
      
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      console.error('Remove image error:', error);
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

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const updateResponse = await axios.put(
        '/api/auth/me',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(updateResponse.data.user);
      localStorage.setItem('user', JSON.stringify(updateResponse.data.user));
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout requireAuth={true}>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
            <Settings className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ตั้งค่า
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">จัดการข้อมูลโปรไฟล์และตั้งค่าบัญชี</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Image Section */}
          <div className="animate-fade-in-delay">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">รูปโปรไฟล์</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    {user.profileImage || imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || user.profileImage}
                          alt={user.name}
                          className="w-40 h-40 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                        />
                        {user.profileImage && !imagePreview && (
                          <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                            title="ลบรูปภาพ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
                        <span className="text-5xl font-bold text-indigo-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={uploading}
                        id="profile-image-upload"
                      />
                      <Button
                        variant="primary"
                        onClick={() => document.getElementById('profile-image-upload')?.click()}
                        isLoading={uploading}
                        disabled={uploading}
                        className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5" />
                          <span>{user.profileImage ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}</span>
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      รองรับไฟล์ PNG, JPG, GIF (สูงสุด 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="animate-fade-in-delay" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <PasswordInput
                      label="รหัสผ่านปัจจุบัน"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                    />
                  </div>

                  <div>
                    <PasswordInput
                      label="รหัสผ่านใหม่"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      minLength={8}
                    />
                  </div>

                  <div>
                    <PasswordInput
                      label="ยืนยันรหัสผ่านใหม่"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      minLength={8}
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" variant="primary" isLoading={saving} className="flex-1">
                      <span className="flex items-center justify-center space-x-2">
                        <Lock className="w-5 h-5" />
                        <span>เปลี่ยนรหัสผ่าน</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/dashboard/profile')}
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
