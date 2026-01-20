'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { Megaphone, Plus, Edit, Trash2, Copy, Search, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: 'hospital' | 'open-close' | 'general' | 'staff' | 'medical' | 'search' | 'activities' | 'blacklist' | 'access' | 'story' | 'story-announcement';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'hospital' | 'open-close' | 'general' | 'staff' | 'medical' | 'search' | 'activities' | 'blacklist' | 'access' | 'story' | 'story-announcement'>('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '' // Start empty to force selection logic
  });
  const [modalStep, setModalStep] = useState<'category' | 'content'>('category');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '' && filterCategory === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      let filtered = announcements;
      
      // Search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(announcement =>
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.createdByName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Category filter
      if (filterCategory !== 'all') {
        filtered = filtered.filter(announcement => announcement.category === filterCategory);
      }
      
      setFilteredAnnouncements(filtered);
    }
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [searchQuery, announcements, filterCategory]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAnnouncements.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnnouncements(response.data.data || []);
      setFilteredAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('ไม่สามารถโหลดข้อมูลคำประกาศได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = () => {
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: '' // Reset to empty string to show "กรุณาเลือกหมวดหมู่"
    });
    setModalStep('category');
    setIsModalOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category
    });
    setModalStep('content');
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!id) {
      toast.error('ไม่พบ ID คำประกาศ');
      return;
    }

    if (!confirm(`คุณต้องการลบคำประกาศ "${title}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const cleanId = id.trim();
      const token = localStorage.getItem('token');
      await axios.delete(`/api/announcements/${cleanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('ลบคำประกาศเรียบร้อยแล้ว');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Delete Error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถลบคำประกาศได้');
    }
  };

  const handleCopyAnnouncement = (announcement: Announcement) => {
    const textToCopy = `📢 ${announcement.title}\n\n${announcement.content}\n\n---\nประกาศโดย: ${announcement.createdByName}\nวันที่: ${new Date(announcement.createdAt).toLocaleString('th-TH')}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('คัดลอกคำประกาศเรียบร้อยแล้ว');
    }).catch(() => {
      toast.error('ไม่สามารถคัดลอกได้');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check if category is selected
    if (!formData.category) {
      toast.error('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('กรุณากรอกเนื้อหา');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        title: formData.category === 'general' ? 'ประกาศทั่วไป' : getCategoryLabel(formData.category)
      };

      if (selectedAnnouncement) {
        if (!selectedAnnouncement._id) {
            throw new Error("Missing Announcement ID");
        }
        const cleanId = selectedAnnouncement._id.trim();

        await axios.put(`/api/announcements/${cleanId}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('อัปเดตคำประกาศเรียบร้อยแล้ว');
      } else {
        await axios.post('/api/announcements', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('สร้างคำประกาศเรียบร้อยแล้ว');
      }

      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Submit Error:', error);
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกคำประกาศได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'hospital': return 'หมวดโรงพยาบาล';
      case 'open-close': return 'หมวดเปิด-ปิด โรงพยาบาล';
      case 'general': return 'ประกาศทั่วไป';
      case 'staff': return 'หมวดบุคลากร';
      case 'medical': return 'หมวดขาย/โปรโมชั่น';
      case 'search': return 'หมวดเรียก/ไม่พบ';
      case 'activities': return 'หมวดกิจกรรม';
      case 'blacklist': return 'Blacklist / การชำระ';
      case 'access': return 'เข้าถึงพื้นที่';
      case 'story': return 'Story';
      case 'story-announcement': return 'ประกาศสตอรี่';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hospital': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'open-close': return 'bg-green-100 text-green-700 border-green-200';
      case 'general': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'staff': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'medical': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'search': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'activities': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'blacklist': return 'bg-gray-800 text-white border-gray-900';
      case 'access': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'story': return 'bg-purple-600 text-white border-purple-700';
      case 'story-announcement': return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full animate-ping" />
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">กำลังโหลดข้อมูลคำประกาศ...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">จัดการคำประกาศ</h1>
          </div>
          <p className="text-blue-100 text-lg">จัดการคำประกาศสำหรับแพทย์ในระบบ</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาหัวข้อ, เนื้อหา, หรือผู้สร้าง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">ทั้งหมด</option>
                <option value="hospital">หมวดโรงพยาบาล</option>
                <option value="open-close">หมวดเปิด-ปิด โรงพยาบาล</option>
                {/* Removed General and Staff */}
                <option value="medical">หมวดขาย/โปรโมชั่น</option>
                <option value="search">หมวดเรียก/ไม่พบ</option>
                <option value="activities">หมวดกิจกรรม</option>
                <option value="blacklist">Blacklist / การชำระ</option>
                <option value="access">เข้าถึงพื้นที่</option>
                <option value="story">Story</option>
                <option value="story-announcement">ประกาศสตอรี่</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAddAnnouncement}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่มคำประกาศ</span>
          </button>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Megaphone className="w-6 h-6 mr-2 text-blue-600" />
              รายการคำประกาศ ({filteredAnnouncements.length} รายการ)
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {currentItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {searchQuery || filterCategory !== 'all'
                    ? 'ไม่พบคำประกาศที่ตรงกับเงื่อนไขการค้นหา' 
                    : 'ไม่พบข้อมูลคำประกาศ'}
                </p>
              </div>
            ) : (
              currentItems.map((announcement) => (
                <div key={announcement._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(announcement.category)}`}>
                          {getCategoryLabel(announcement.category)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                      
                      {/* Removed the 'Created By' and 'Date' section */}

                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleCopyAnnouncement(announcement)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200 group"
                        title="คัดลอก"
                      >
                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-all duration-200 group"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement._id, announcement.title)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 group"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredAnnouncements.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                แสดงหน้า <span className="font-medium">{currentPage}</span> จาก <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                     <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAnnouncement ? 'แก้ไขคำประกาศ' : 'เพิ่มคำประกาศ'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-105"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {modalStep === 'category' ? (
                <div className="p-8">
                  <div className="mb-6">
                    <p className="text-gray-600 text-center mb-8">
                      เลือกหมวดหมู่สำหรับคำประกาศของคุณ
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">เลือกหมวดหมู่</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value as any });
                          setModalStep('content');
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="" disabled>กรุณาเลือกหมวดหมู่</option>
                        <option value="hospital">หมวดโรงพยาบาล</option>
                        <option value="open-close">หมวดเปิด-ปิด โรงพยาบาล</option>
                        {/* Removed General and Staff */}
                        <option value="medical">หมวดขาย/โปรโมชั่น</option>
                        <option value="search">หมวดเรียก/ไม่พบ</option>
                        <option value="activities">หมวดกิจกรรม</option>
                        <option value="blacklist">Blacklist / การชำระ</option>
                        <option value="access">เข้าถึงพื้นที่</option>
                        <option value="story">Story</option>
                        <option value="story-announcement">ประกาศสตอรี่</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <X className="w-5 h-5" />
                        <span>ยกเลิก</span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="" disabled>กรุณาเลือกหมวดหมู่</option>
                      <option value="hospital">หมวดโรงพยาบาล</option>
                        <option value="open-close">หมวดเปิด-ปิด โรงพยาบาล</option>
                        {/* Removed General and Staff */}
                        <option value="medical">หมวดขาย/โปรโมชั่น</option>
                        <option value="search">หมวดเรียก/ไม่พบ</option>
                        <option value="activities">หมวดกิจกรรม</option>
                        <option value="blacklist">Blacklist / การชำระ</option>
                        <option value="access">เข้าถึงพื้นที่</option>
                        <option value="story">Story</option>
                        <option value="story-announcement">ประกาศสตอรี่</option>
                      </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">เนื้อหาคำประกาศ</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[200px]"
                      placeholder="กรอกเนื้อหาคำประกาศของคุณ..."
                      rows={8}
                    />
                  </div>
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <X className="w-5 h-5" />
                        <span>ยกเลิก</span>
                      </span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin"></div>
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>{selectedAnnouncement ? 'อัปเดต' : 'บันทึก'}</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}