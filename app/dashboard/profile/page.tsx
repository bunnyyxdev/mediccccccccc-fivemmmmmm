'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DoctorIDCard from '@/components/DoctorIDCard';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { getDoctorRankLabel } from '@/lib/doctor-ranks';
import { 
  UserCircle, 
  Shield, 
  Award, 
  Car, 
  Calendar, 
  Info, 
  CreditCard,
  Copy,
  CheckCircle2,
  Fingerprint
} from 'lucide-react';

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  doctorRank?: string;
  role: 'doctor' | 'admin';
  profileImage?: string;
  driverLicense?: string;
  driverLicenseType?: '1' | '2' | '3';
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error: any) {
      const status = error?.response?.status;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try { setUser(JSON.parse(userStr)); } catch (e) {}
      } else if (status !== 404) {
        toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail?.profileImage !== undefined) {
        setUser((prev) => prev ? { ...prev, profileImage: event.detail.profileImage } : prev);
      } else {
        fetchUserProfile();
      }
    };
    
    const handleStorageChange = () => fetchUserProfile();
    const handleFocus = () => fetchUserProfile();
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('คัดลอก User ID แล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-b-2 border-indigo-600 animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600">
               <UserCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout requireAuth={true}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
            <Info className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูลผู้ใช้</h3>
          <p className="text-gray-500 mt-2">กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-1/3 h-96 bg-gradient-to-bl from-indigo-100/40 via-purple-100/20 to-transparent -z-10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Header Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                <UserCircle className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">My Profile</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                ข้อมูลส่วนตัว
              </h1>
              <p className="text-gray-500 mt-2 max-w-xl text-sm md:text-base">
                จัดการข้อมูลบัญชี ตรวจสอบสถานะ และดูบัตรประจำตัวแพทย์ของคุณได้ที่นี่
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: ID Card Showcase (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden relative group">
                {/* Header of Card */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                       <h2 className="font-bold text-gray-900">บัตรประจำตัวแพทย์</h2>
                       <p className="text-xs text-gray-500">Digital Doctor ID Card</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium border border-green-100 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Active
                  </div>
                </div>

                {/* Card Showcase Area */}
                <div className="p-8 md:p-12 bg-gray-50/50 relative flex items-center justify-center min-h-[400px]">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 opacity-[0.03]" 
                        style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                   </div>
                   
                   {/* Glow Effect behind card */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 bg-indigo-500/20 blur-[80px] rounded-full"></div>

                   <div className="transform transition-transform duration-500 group-hover:scale-[1.02] z-10 w-full max-w-md">
                      <DoctorIDCard
                        name={user.name}
                        doctorRank={user.doctorRank}
                        username={user.username}
                        email={user.email}
                        role={user.role}
                        profileImage={user.profileImage}
                        driverLicenseType={user.driverLicenseType}
                        createdAt={user.createdAt}
                        className="shadow-2xl mx-auto"
                      />
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Info Grid (Span 5) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Role & Rank Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">ข้อมูลตำแหน่ง</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 group-hover:bg-indigo-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                          <Shield className="w-5 h-5" />
                       </div>
                       <span className="text-sm font-medium text-gray-600">บทบาทระบบ</span>
                    </div>
                    <span className="font-bold text-gray-900 capitalize px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-100">
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'แพทย์'}
                    </span>
                  </div>

                  {user.doctorRank && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 group-hover:bg-amber-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">ตำแหน่งแพทย์</span>
                      </div>
                      <div className="text-right">
                         <span className="block font-bold text-gray-900 text-sm">{user.doctorRank}</span>
                         <span className="text-xs text-gray-500">{getDoctorRankLabel(user.doctorRank)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* License Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">ใบอนุญาตขับขี่</h3>
                   <Car className="w-4 h-4 text-emerald-500" />
                </div>
                
                <div className="flex items-end justify-between">
                   <div>
                      {user.driverLicenseType ? (
                        <>
                          <p className="text-3xl font-bold text-gray-900 mb-1">
                            Type {user.driverLicenseType}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">
                            {user.driverLicenseType === '1' ? 'ระดับพื้นฐาน (Basic)' : 
                             user.driverLicenseType === '2' ? 'ระดับกลาง (Intermediate)' : 
                             user.driverLicenseType === '3' ? 'ระดับสูง (Advanced)' : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-gray-400">
                          ไม่มีใบอนุญาต
                        </p>
                      )}
                   </div>
                   {user.driverLicense && (
                      <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                         <p className="text-xs text-emerald-700 font-mono font-semibold tracking-wide">
                            {user.driverLicense}
                         </p>
                      </div>
                   )}
                </div>
              </div>

              {/* Account Meta & Technical Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">ข้อมูลบัญชี</h3>
                
                <div className="space-y-4">
                  {/* Created At */}
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Calendar className="w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-xs text-gray-500">วันที่สร้างบัญชี</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', { 
                            day: 'numeric', month: 'long', year: 'numeric' 
                          }) : '-'}
                        </p>
                     </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-gray-50"></div>

                  {/* User ID (Copyable) */}
                  <div className="flex items-center gap-3 group relative">
                     <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <Fingerprint className="w-4 h-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">System User ID</p>
                        <p className="text-xs font-mono font-medium text-gray-700 truncate pr-4">
                           {user._id}
                        </p>
                     </div>
                     <button 
                        onClick={() => copyToClipboard(user._id)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Copy ID"
                     >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                     </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
