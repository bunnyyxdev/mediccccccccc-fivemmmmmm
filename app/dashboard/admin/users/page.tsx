'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit, Trash2, Shield, User, X, Award, Upload, Search, Filter, Users, Calendar, Activity, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PasswordInput from '@/components/PasswordInput';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getDoctorRankLabel, DOCTOR_RANKS } from '@/lib/doctor-ranks';

interface UserData {
  _id: string;
  username: string;
  name: string;
  email?: string;
  doctorRank?: string;
  role: 'doctor' | 'admin';
  profileImage?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failedUserIds, setFailedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'doctor' | 'admin'>('all');
  const [filterRank, setFilterRank] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Clear any stale failed user IDs on mount (allow them to be checked again)
    // This helps recover if database was cleaned up
    setFailedUserIds(new Set());
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Prevent multiple simultaneous fetches
    if (refreshing) {
      return;
    }
    
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Log database name for debugging
      if (response.data._dbName) {
        // Database name is in the response - check MongoDB Compass for this database
        // The "admin" database is a system database, not where your app data is stored
      }

      // Ensure all user IDs are valid strings and filter out previously failed users
      const allUsers = (response.data.users || []).filter((user: UserData) => {
        return user && 
               user._id && 
               typeof user._id === 'string' && 
               user._id.length === 24;
      });

      // Filter out failed users (keep them filtered even if API returns them)
      const validUsers = allUsers.filter((user: UserData) => !failedUserIds.has(user._id));

      setUsers(validUsers);
      
      // Only remove failed IDs if the user was successfully validated (not just returned by API)
      // This prevents deleted users from reappearing
      // Failed users stay in the set until they're successfully fetched individually
      // We don't clear failedUserIds here - they persist across refreshes
    } catch (error: any) {
      // More detailed error handling
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error;
      
      // Handle different error types
      if (status === 401) {
        toast.error('ไม่มีสิทธิ์เข้าถึง - กรุณาเข้าสู่ระบบใหม่');
      } else if (status === 403) {
        toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้');
      } else if (status === 503 || error.message?.includes('MongoDB') || error.message?.includes('connect')) {
        toast.error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ - กรุณาตรวจสอบการเชื่อมต่อ');
      } else if (status >= 500) {
        toast.error('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ - กรุณาลองใหม่อีกครั้ง');
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else if (error.message) {
        toast.error(`ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${error.message}`);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ - กรุณาลองใหม่อีกครั้ง');
      }
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    name: '',
    doctorRank: '' as string,
    role: 'doctor' as 'doctor' | 'admin',
    profileImage: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleEditClick = async (user: UserData) => {
    // Prevent multiple clicks while fetching
    if (editFetching) {
      return;
    }
    
    // Check if this user has already failed before
    if (failedUserIds.has(user._id)) {
      // Remove from list and refresh
      setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
      toast.error('ผู้ใช้ไม่พบในระบบ - ถูกลบออกจากรายการแล้ว');
      if (!refreshing) {
        fetchUsers();
      }
      return;
    }
    
    // Check if user still exists in the list (might have been removed)
    const userExists = users.some(u => u._id === user._id);
    if (!userExists) {
      toast.error('ผู้ใช้ถูกลบออกจากระบบแล้ว');
      return;
    }
    
    setSelectedUser(user);
    setShowEditModal(true);
    setEditFetching(true);
    
    // Always fetch fresh data from database to ensure sync
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/users/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Suppress console errors for 404s (expected for deleted users)
        validateStatus: (status) => status < 500,
      });

      // Populate form with fresh data from database
      const userData = response.data.user;
      setEditFormData({
        username: userData.username || '',
        password: '',
        name: userData.name || '',
        doctorRank: userData.doctorRank || '',
        role: userData.role || 'doctor',
        profileImage: userData.profileImage || '',
      });
      
      // Set image preview from database
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      } else {
        setImagePreview(null);
      }
    } catch (error: any) {
      const status = error.response?.status;
      
      // If user not found (404), mark as failed and close modal
      if (status === 404) {
        // Mark this user ID as failed to prevent future requests
        setFailedUserIds(prev => new Set(prev).add(user._id));
        
        // Remove user from local state immediately
        setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
        
        // Close modal before showing toast
        setShowEditModal(false);
        setSelectedUser(null);
        
        toast.error('ผู้ใช้ไม่พบในระบบ - ถูกลบออกจากรายการแล้ว');
        
        // Refresh the user list in the background (will filter out failed users)
        if (!refreshing) {
          setTimeout(() => fetchUsers(), 100); // Small delay to ensure state updates
        }
        return; // Exit early to prevent further processing
      } else {
        // For other errors, show error and close modal
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้';
        toast.error(errorMessage);
        setShowEditModal(false);
      }
    } finally {
      setEditFetching(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const updateData: any = {
        name: editFormData.name,
        username: editFormData.username,
        doctorRank: editFormData.doctorRank || undefined,
        role: editFormData.role,
        profileImage: editFormData.profileImage || undefined,
      };

      if (editFormData.password && editFormData.password.length > 0) {
        updateData.password = editFormData.password;
      }

      await axios.put(
        `/api/admin/users/${selectedUser._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
      setShowEditModal(false);
      setSelectedUser(null);
      setImagePreview(null);
      
      // Refresh user list from database to sync with latest changes
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
    } finally {
      setEditLoading(false);
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
      setEditFormData({ ...editFormData, profileImage: imageUrl });
      setImagePreview(imageUrl);
      toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
      
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพโหลดรูปภาพได้');
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditFormData({ ...editFormData, profileImage: '' });
    setImagePreview(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')) {
      return;
    }

    setDeleteLoading(userId);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    // Double confirmation
    const firstConfirm = window.confirm(
      '⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ทั้งหมด?\n\nการดำเนินการนี้จะลบผู้ใช้ทั้งหมดยกเว้นบัญชีของคุณเอง\n\nกด "OK" เพื่อยืนยัน'
    );
    
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      '⚠️ การยืนยันครั้งสุดท้าย\n\nคุณแน่ใจ 100% ว่าต้องการลบผู้ใช้ทั้งหมดหรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!'
    );

    if (!secondConfirm) {
      return;
    }

    setDeleteAllLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await axios.delete('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add cache-busting
        params: {
          _t: Date.now()
        }
      });

      if (response.data && response.data.deletedCount !== undefined) {
        toast.success(`ลบผู้ใช้ทั้งหมดสำเร็จ (${response.data.deletedCount} รายการ)`);
        setUsers([]); // Clear the list immediately
        setFailedUserIds(new Set()); // Clear failed user IDs
        
        // Wait a bit before refreshing to ensure DB is updated
        setTimeout(async () => {
          await fetchUsers(); // Refresh to show only the current admin
        }, 500);
      } else {
        toast.error('ไม่ได้รับข้อมูลการลบจากเซิร์ฟเวอร์');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || error.message || 'ไม่สามารถลบผู้ใช้ทั้งหมดได้';
      
      // Handle specific error cases
      if (status === 401) {
        if (errorData?.code === 'INVALID_TOKEN') {
          errorMessage = 'Token ไม่ถูกต้อง - กรุณาเข้าสู่ระบบใหม่';
          // Redirect to login after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }, 2000);
        } else {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
        }
      } else if (status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
      } else if (status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ - กรุณาลองอีกครั้ง';
      }
      
      toast.error(errorMessage);
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete all users error:', {
          status,
          data: errorData,
          message: error.message,
          fullError: error
        });
      }
    } finally {
      setDeleteAllLoading(false);
    }
  };


  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    const matchesRank = filterRank === 'all' || user.doctorRank === filterRank;
    
    return matchesSearch && matchesRole && matchesRank;
  });

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const doctorCount = users.filter(u => u.role === 'doctor').length;
  const recentUsers = users.filter(u => {
    const createdAt = new Date(u.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  }).length;

  if (loading) {
    return (
      <Layout requireAuth={true} requireRole="admin">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">กำลังโหลดข้อมูลผู้ใช้...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <Users className="w-10 h-10 mr-3" />
                จัดการผู้ใช้
              </h1>
              <p className="text-blue-100 text-lg">เพิ่ม แก้ไข และจัดการบัญชีแพทย์ในระบบ</p>
            </div>
            <div className="flex items-center space-x-3">
              {users.length > 1 && (
                <Button
                  variant="danger"
                  onClick={handleDeleteAll}
                  disabled={deleteAllLoading || deleteLoading !== null}
                  description="ลบผู้ใช้ทั้งหมด (ยกเว้นบัญชีของคุณ)"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <span className="flex items-center space-x-2">
                    <Trash2 className="w-5 h-5" />
                    <span>{deleteAllLoading ? 'กำลังลบ...' : 'ลบทั้งหมด'}</span>
                  </span>
                </Button>
              )}
              <Button
                variant="success"
                onClick={() => router.push('/dashboard/admin/users/create')}
                description="เพิ่มบัญชีแพทย์ใหม่"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <span className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>เพิ่มแพทย์</span>
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">แพทย์</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{doctorCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">ผู้ดูแลระบบ</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">เพิ่มล่าสุด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{recentUsers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือ User หมอ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <span className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>ตัวกรอง</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </span>
            </Button>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="doctor">แพทย์</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ยศแพทย์</label>
                <select
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  {DOCTOR_RANKS.map((rank) => (
                    <option key={rank.value} value={rank.value}>
                      {rank.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              รายชื่อผู้ใช้ ({filteredUsers.length} รายการ)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">รูปโปรไฟล์</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User หมอ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ยศแพทย์</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ชื่อ - นามสกุล IC</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">วันที่สร้าง</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          {searchTerm || filterRole !== 'all' || filterRank !== 'all' 
                            ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา' 
                            : 'ไม่มีผู้ใช้ในระบบ'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profileImage ? (
                          <div className="relative group">
                            <img
                              src={user.profileImage}
                              alt={user.name || user.username}
                              className="w-12 h-12 rounded-full object-cover border-3 border-blue-200 cursor-pointer hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => {
                                window.open(user.profileImage, '_blank');
                              }}
                              title="คลิกเพื่อดูรูปเต็ม"
                            />
                            <div className="absolute inset-0 rounded-full bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-3 border-blue-200 shadow-sm">
                            <span className="text-lg font-bold text-white">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.doctorRank ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                            <Award className="w-3 h-3 mr-1" />
                            {user.doctorRank}. {getDoctorRankLabel(user.doctorRank)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              แพทย์
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            disabled={editFetching || deleteLoading === user._id || failedUserIds.has(user._id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                            title={failedUserIds.has(user._id) ? 'ผู้ใช้ไม่พบในระบบ' : 'แก้ไขผู้ใช้'}
                          >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={deleteLoading === user._id}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all duration-200 group"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 flex items-center justify-between sticky top-0 z-10 rounded-t-3xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">แก้ไขข้อมูลผู้ใช้</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setImagePreview(null);
                    setEditFormData({
                      username: '',
                      password: '',
                      name: '',
                      doctorRank: '',
                      role: 'doctor',
                      profileImage: '',
                    });
                  }}
                  className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200 hover:scale-105"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              {editFetching ? (
                <div className="flex items-center justify-center h-64">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-8">
                  {/* Profile Image Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-blue-600" />
                      รูปโปรไฟล์
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="relative group">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt={editFormData.name || 'Profile'}
                              className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-200"
                            />
                            {editFormData.profileImage && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                                title="ลบรูปภาพ"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <div className="absolute inset-0 rounded-2xl bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-200">
                            <span className="text-4xl font-bold text-white">
                              {editFormData.name ? editFormData.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={uploading}
                            id="edit-profile-image-upload"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => document.getElementById('edit-profile-image-upload')?.click()}
                            isLoading={uploading}
                            disabled={uploading}
                            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300"
                          >
                            <span className="flex items-center space-x-2">
                              <Upload className="w-4 h-4" />
                              <span>{editFormData.profileImage ? 'เปลี่ยนรูป' : 'อัพโหลดรูป'}</span>
                            </span>
                          </Button>
                        </label>
                        <p className="text-sm text-gray-500 mt-3">
                          รองรับไฟล์ PNG, JPG, GIF (สูงสุด 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          <span>ตำแหน่งแพทย์ในโรงพยาบาล</span>
                        </span>
                      </label>
                      <select
                        value={editFormData.doctorRank}
                        onChange={(e) => setEditFormData({ ...editFormData, doctorRank: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="">เลือกตำแหน่งแพทย์ (ไม่บังคับ)</option>
                        {DOCTOR_RANKS.map((rank) => (
                          <option key={rank.value} value={rank.value}>
                            {rank.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <span>ชื่อ - นามสกุล IC *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="กรอกชื่อ-นามสกุลตามบัตรประชาชน"
                      />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <span>User หมอ *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="กรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                      />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center space-x-2">
                          <EyeOff className="w-5 h-5 text-blue-600" />
                          <span>รหัส Login หมอ (ไม่บังคับ - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)</span>
                        </span>
                      </label>
                      <PasswordInput
                        minLength={8}
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        placeholder="กรอกรหัสผ่านใหม่ (ขั้นต่ำ 8 ตัวอักษร) - ปล่อยว่างถ้าไม่ต้องการเปลี่ยน"
                        autoComplete="new-password"
                        className="bg-white"
                      />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <span>บทบาท *</span>
                        </span>
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'doctor' | 'admin' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        <option value="doctor">แพทย์</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={editLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <Edit className="w-5 h-5" />
                          <span>บันทึกการแก้ไข</span>
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedUser(null);
                          setImagePreview(null);
                          setEditFormData({
                            username: '',
                            password: '',
                            name: '',
                            doctorRank: '',
                            role: 'doctor',
                            profileImage: '',
                          });
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <X className="w-5 h-5" />
                          <span>ยกเลิก</span>
                        </span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
