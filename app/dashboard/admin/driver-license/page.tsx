'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { Car, Search, Check, X, Edit, Award, Shield, Users, FileText, TrendingUp, Filter, ChevronDown, Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getDoctorRankLabel } from '@/lib/doctor-ranks';

interface UserData {
  _id: string;
  username: string;
  name: string;
  doctorRank?: string;
  role: 'doctor' | 'admin';
  driverLicenseType?: '1' | '2' | '3';
}

export default function DriverLicensePage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedType, setSelectedType] = useState<'1' | '2' | '3' | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLicenseType, setFilterLicenseType] = useState<'all' | '1' | '2' | '3' | 'none'>('all');
  const [filterRank, setFilterRank] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '' && filterLicenseType === 'all' && filterRank === 'all') {
      setFilteredUsers(users);
    } else {
      let filtered = users;
      
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            user.doctorRank?.toLowerCase().includes(query)
        );
      }
      
      // License type filter
      if (filterLicenseType !== 'all') {
        if (filterLicenseType === 'none') {
          filtered = filtered.filter(user => !user.driverLicenseType);
        } else {
          filtered = filtered.filter(user => user.driverLicenseType === filterLicenseType);
        }
      }
      
      // Rank filter
      if (filterRank !== 'all') {
        filtered = filtered.filter(user => user.doctorRank === filterRank);
      }
      
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users, filterLicenseType, filterRank]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Only show doctors
      const doctors = response.data.users.filter((user: UserData) => user.role === 'doctor');
      setUsers(doctors);
      setFilteredUsers(doctors);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: UserData) => {
    setSelectedUser(user);
    setSelectedType(user.driverLicenseType || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedType('');
  };

  const handleIssueLicense = async () => {
    if (!selectedUser || !selectedType) {
      toast.error('กรุณาเลือกประเภทใบอนุญาต');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/driver-license/${selectedUser._id}`,
        { driverLicenseType: selectedType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`ออกใบอนุญาต Type ${selectedType} ให้ ${selectedUser.name} เรียบร้อยแล้ว`);
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถออกใบอนุญาตได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeLicense = async (userId: string, userName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบอนุญาตขับฮอของ ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/driver-license/${userId}`,
        { driverLicenseType: null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`ยกเลิกใบอนุญาตขับฮอของ ${userName} เรียบร้อยแล้ว`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถยกเลิกใบอนุญาตได้');
    }
  };

  const getLicenseTypeLabel = (type?: '1' | '2' | '3') => {
    if (!type) return 'ไม่มีใบอนุญาติ';
    const labels: Record<'1' | '2' | '3', string> = {
      '1': 'ขั้นพื้นฐาน',
      '2': 'ขั้นกลาง',
      '3': 'ขั้นสูง',
    };
    return labels[type];
  };

  const getLicenseTypeColor = (type?: '1' | '2' | '3') => {
    if (!type) return 'bg-gray-100 text-gray-600';
    const colors: Record<'1' | '2' | '3', string> = {
      '1': 'bg-green-100 text-green-700',
      '2': 'bg-blue-100 text-blue-700',
      '3': 'bg-purple-100 text-purple-700',
    };
    return colors[type];
  };

  // Calculate statistics
  const totalDoctors = users.length;
  const licensedDoctors = users.filter(u => u.driverLicenseType).length;
  const type1Count = users.filter(u => u.driverLicenseType === '1').length;
  const type2Count = users.filter(u => u.driverLicenseType === '2').length;
  const type3Count = users.filter(u => u.driverLicenseType === '3').length;
  const unlicensedCount = totalDoctors - licensedDoctors;

  if (loading) {
    return (
      <Layout requireAuth={true} requireRole="admin">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="w-8 h-8 text-green-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">กำลังโหลดข้อมูลใบอนุญาต...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">ออกใบอนุญาติขับฮอ</h1>
          </div>
          <p className="text-green-100 text-lg">จัดการใบอนุญาตขับฮอสำหรับแพทย์ในระบบ</p>
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
                  placeholder="ค้นหาชื่อ, username, หรือตำแหน่ง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>ตัวกรอง</span>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทใบอนุญาต</label>
                <select
                  value={filterLicenseType}
                  onChange={(e) => setFilterLicenseType(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="none">ไม่มีใบอนุญาต</option>
                  <option value="1">ขั้นพื้นฐาน</option>
                  <option value="2">ขั้นกลาง</option>
                  <option value="3">ขั้นสูง</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ยศแพทย์</label>
                <select
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="10">ผู้อำนวยการโรงพยาบาล</option>
                  <option value="09">รองผู้อำนวยการโรงพยาบาล</option>
                  <option value="08">ผู้ช่วยผู้อำนวยการโรงพยาบาล</option>
                  <option value="07">หัวหน้าแพทย์</option>
                  <option value="06">รองหัวหน้าแพทย์</option>
                  <option value="05">เลขานุการแพทย์</option>
                  <option value="04">แพทย์ชำนาญ</option>
                  <option value="03">แพทย์ปี 3</option>
                  <option value="02">แพทย์ปี 2</option>
                  <option value="01">แพทย์ปี 1</option>
                  <option value="00">นักเรียนแพทย์</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-green-600" />
              รายชื่อแพทย์ ({filteredUsers.length} รายการ)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ตำแหน่ง</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ใบอนุญาตขับฮอ</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Car className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          {searchQuery || filterLicenseType !== 'all' || filterRank !== 'all' 
                            ? 'ไม่พบแพทย์ที่ตรงกับเงื่อนไขการค้นหา' 
                            : 'ไม่พบข้อมูลแพทย์'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            {user.doctorRank && (
                              <div className="text-xs text-gray-500">{user.doctorRank}. {getDoctorRankLabel(user.doctorRank)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-600">{user.username}</div>
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
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            !user.driverLicenseType
                              ? 'bg-gray-100 text-gray-600'
                              : user.driverLicenseType === '1'
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                              : user.driverLicenseType === '2'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                          }`}
                        >
                          {user.driverLicenseType && (
                            <FileText className="w-3 h-3 mr-1" />
                          )}
                          {getLicenseTypeLabel(user.driverLicenseType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {user.driverLicenseType ? (
                            <>
                              <button
                                onClick={() => handleOpenModal(user)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200 group"
                                title="แก้ไขใบอนุญาต"
                              >
                                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => handleRevokeLicense(user._id, user.name)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 group"
                                title="ยกเลิกใบอนุญาต"
                              >
                                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-200 group"
                              title="ออกใบอนุญาต"
                            >
                              <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Issuing/Editing License */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-8 border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedUser.driverLicenseType ? 'แก้ไข' : 'ออก'}ใบอนุญาตขับฮอ
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-105"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Doctor Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  ข้อมูลแพทย์
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600">{selectedUser.username}</p>
                    {selectedUser.doctorRank && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedUser.doctorRank}. {getDoctorRankLabel(selectedUser.doctorRank)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* License Type Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-green-600" />
                  เลือกประเภทใบอนุญาต
                </h3>
                <div className="space-y-3">
                  {(['1', '2', '3'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedType === type
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="licenseType"
                        value={type}
                        checked={selectedType === type}
                        onChange={(e) => setSelectedType(e.target.value as '1' | '2' | '3')}
                        className="mr-4 w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm mr-3 ${
                            type === '1' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                            type === '2' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}>
                            {type}
                          </span>
                          <div className="font-semibold text-gray-900">
                            ขั้น{type === '1' ? 'พื้นฐาน' : type === '2' ? 'กลาง' : 'สูง'}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1 ml-11">
                          {type === '1'
                            ? 'ระดับพื้นฐานสำหรับการขับขี่รถยนต์ทั่วไป'
                            : type === '2'
                            ? 'ระดับขั้นกลางสำหรับการขับขี่รถยนต์ที่มีความซับซ้อนมากขึ้น'
                            : 'ระดับขั้นสูงสำหรับการขับขี่รถยนต์ทุกประเภท'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                  disabled={isSubmitting}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <X className="w-5 h-5" />
                    <span>ยกเลิก</span>
                  </span>
                </button>
                <button
                  onClick={handleIssueLicense}
                  disabled={isSubmitting || !selectedType}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{selectedUser.driverLicenseType ? 'บันทึกการเปลี่ยนแปลง' : 'ออกใบอนุญาต'}</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
