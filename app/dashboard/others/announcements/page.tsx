'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Megaphone,
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  X,
  Save,
  Tag,
  RefreshCw,
} from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const formData = useState({
    title: '',
    content: '',
    category: '',
    isActive: true,
  });
  const [formDataState, setFormData] = formData;
  
  // Use refs to track previous state for change detection
  const previousAnnouncementsRef = useRef<string>('');
  const previousCountRef = useRef<number>(0);
  const announcementsRef = useRef<Announcement[]>([]);
  const isFetchingRef = useRef<boolean>(false);
  const hasInitialFetchRef = useRef<boolean>(false);

  // Memoize fetchAnnouncements to prevent infinite loops
  const fetchAnnouncements = useCallback(async (showLoading = true, force = false) => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log('🚫 Blocked: Already fetching');
      return;
    }
    
    // Prevent automatic calls after initial fetch (only allow manual refreshes)
    if (!force && hasInitialFetchRef.current) {
      console.log('🚫 Blocked: Initial fetch already done, force=false');
      return;
    }
    
    console.log('✅ Fetching announcements', { force, hasInitialFetch: hasInitialFetchRef.current });
    isFetchingRef.current = true;
    
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const token = localStorage.getItem('token');
      // Fetch ALL announcements from database - all users can see all announcements
      const response = await axios.get('/api/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const newAnnouncements = response.data.announcements || [];
      
      // Create a checksum from announcement IDs and updatedAt timestamps for accurate change detection
      const newChecksum = JSON.stringify(
        newAnnouncements.map(a => ({ id: a._id, updatedAt: a.updatedAt }))
      );
      const previousChecksum = previousAnnouncementsRef.current;
      
      // Detect changes: new announcements, updates, or deletions
      const hasChanges = previousChecksum !== '' && newChecksum !== previousChecksum;
      const previousCount = previousCountRef.current;
      const newCount = newAnnouncements.length;
      
      // Detect new announcements (count increased)
      if (!showLoading && hasChanges && newCount > previousCount && previousCount > 0) {
        const newAnnouncement = newAnnouncements[0]; // Most recent one
        toast.success(`📢 มีคำประกาศใหม่: ${newAnnouncement.title}`, {
          duration: 5000,
          icon: '📢',
          position: 'top-right',
        });
      }
      
      // Detect updates to existing announcements
      if (!showLoading && hasChanges && newCount === previousCount && previousChecksum !== '') {
        // Check if any announcement was updated (not just reordered)
        const previousAnnouncements = announcementsRef.current;
        const updatedAnnouncement = newAnnouncements.find((newAnn: Announcement) => {
          const oldAnn = previousAnnouncements.find((old: Announcement) => old._id === newAnn._id);
          return oldAnn && oldAnn.updatedAt !== newAnn.updatedAt;
        });
        
        if (updatedAnnouncement) {
          toast(`✏️ คำประกาศถูกอัปเดต: ${updatedAnnouncement.title}`, {
            duration: 4000,
            position: 'top-right',
            icon: '✏️',
          });
        }
      }
      
      // Detect deletions
      if (!showLoading && hasChanges && newCount < previousCount && previousCount > 0) {
        toast('🗑️ มีคำประกาศถูกลบ', {
          duration: 3000,
          position: 'top-right',
          icon: '🗑️',
        });
      }
      
      // Update state and refs
      setAnnouncements(newAnnouncements);
      announcementsRef.current = newAnnouncements;
      previousAnnouncementsRef.current = newChecksum;
      previousCountRef.current = newCount;
      hasInitialFetchRef.current = true; // Mark that initial fetch is complete
    } catch (error: any) {
      if (showLoading) {
        toast.error('ไม่สามารถโหลดคำประกาศได้');
      }
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []); // Empty dependency array - function doesn't depend on any state

  useEffect(() => {
    // Only fetch on initial mount, prevent React Strict Mode double calls
    if (!hasInitialFetchRef.current) {
      fetchAnnouncements(true, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main');
    
    // Completely disable scrolling
    html.style.overflow = 'hidden';
    html.style.height = '100vh';
    html.style.maxHeight = '100vh';
    html.style.position = 'fixed';
    html.style.width = '100%';
    
    body.style.overflow = 'hidden';
    body.style.height = '100vh';
    body.style.maxHeight = '100vh';
    body.style.position = 'fixed';
    body.style.width = '100%';
    
    if (main) {
      (main as HTMLElement).style.overflow = 'hidden';
      (main as HTMLElement).style.height = '100vh';
      (main as HTMLElement).style.maxHeight = '100vh';
    }
    
    return () => {
      html.style.overflow = '';
      html.style.height = '';
      html.style.maxHeight = '';
      html.style.position = '';
      html.style.width = '';
      body.style.overflow = '';
      body.style.height = '';
      body.style.maxHeight = '';
      body.style.position = '';
      body.style.width = '';
      if (main) {
        (main as HTMLElement).style.overflow = '';
        (main as HTMLElement).style.height = '';
        (main as HTMLElement).style.maxHeight = '';
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDataState.title.trim() || !formDataState.content.trim()) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        // Update existing
        await axios.put(
          `/api/announcements/${editingId}`,
          {
            title: formDataState.title,
            content: formDataState.content,
            category: formDataState.category || undefined,
            isActive: formDataState.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success('อัปเดตคำประกาศสำเร็จ');
      } else {
        // Create new
        await axios.post(
          '/api/announcements',
          {
            title: formDataState.title,
            content: formDataState.content,
            category: formDataState.category || undefined,
            isActive: formDataState.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success('เพิ่มคำประกาศสำเร็จ');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        category: '',
        isActive: true,
      });
      // Immediately refresh after create/update to show changes to all users
      await fetchAnnouncements(true, true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
      console.error('Error saving announcement:', error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement._id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category || '',
      isActive: announcement.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำประกาศนี้?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/announcements/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('ลบคำประกาศสำเร็จ');
      // Immediately refresh after delete to show changes to all users
      await fetchAnnouncements(true, true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
      console.error('Error deleting announcement:', error);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกได้');
      console.error('Error copying:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 overflow-hidden lg:left-64" style={{ top: 0, bottom: 0, left: 0, right: 0, height: '100vh', width: '100vw', maxWidth: '100vw', overflow: 'hidden', position: 'fixed' }}>
        <div className="flex-shrink-0 space-y-4 overflow-hidden p-4">
          {/* Header Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              <div className="flex items-center justify-between gap-6 relative z-10">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg flex-shrink-0 transform hover:scale-110 transition-transform duration-300 hover:rotate-3">
                    <Megaphone className="w-8 h-8 text-white animate-pulse-slow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-bold text-white mb-1 truncate animate-in fade-in slide-in-from-left duration-700">สำหรับคำประกาศหมอ</h1>
                    <p className="text-blue-100 text-sm truncate animate-in fade-in slide-in-from-left duration-700 delay-100">
                      จัดการและคัดลอกคำประกาศสำหรับหมอ
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => {
                      fetchAnnouncements(true, true);
                    }}
                    disabled={refreshing || loading}
                    className="inline-flex items-center px-4 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold whitespace-nowrap border-2 border-white/30 hover:border-white/50 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="รีเฟรชคำประกาศ"
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 flex-shrink-0 transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="whitespace-nowrap hidden sm:inline">{refreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(!showForm);
                      if (showForm) {
                        setEditingId(null);
                        setFormData({
                          title: '',
                          content: '',
                          category: '',
                          isActive: true,
                        });
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold whitespace-nowrap border-2 border-white/30 hover:border-white/50 transform hover:scale-105 active:scale-95"
                  >
                    <Plus className={`w-5 h-5 mr-2 flex-shrink-0 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
                    <span className="whitespace-nowrap">{showForm ? 'ยกเลิก' : 'เพิ่มคำประกาศ'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="flex-shrink-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 animate-in fade-in slide-in-from-top-4 scale-in-95">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <h2 className="text-2xl font-bold text-white relative z-10 animate-in fade-in slide-in-from-left duration-500">
                  {editingId ? '✏️ แก้ไขคำประกาศ' : '➕ เพิ่มคำประกาศใหม่'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="animate-in fade-in slide-in-from-left duration-500 delay-100">
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                    หัวข้อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDataState.title}
                    onChange={(e) => setFormData({ ...formDataState, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 outline-none bg-white hover:border-blue-400 focus:shadow-lg focus:shadow-blue-200"
                    placeholder="กรอกหัวข้อคำประกาศ"
                    required
                  />
                </div>

                <div className="animate-in fade-in slide-in-from-left duration-500 delay-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    เนื้อหา <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formDataState.content}
                    onChange={(e) => setFormData({ ...formDataState, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 outline-none min-h-[180px] resize-y hover:border-gray-300 focus:shadow-lg focus:shadow-blue-200"
                    placeholder="กรอกเนื้อหาคำประกาศ"
                    required
                  />
                </div>

                <div className="animate-in fade-in slide-in-from-left duration-500 delay-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    หมวดหมู่
                  </label>
                  <select
                    value={formDataState.category}
                    onChange={(e) => setFormData({ ...formDataState, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 outline-none bg-white hover:border-gray-300 focus:shadow-lg focus:shadow-blue-200 cursor-pointer"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    <option value="คำประกาศโรงพยาบาล">คำประกาศโรงพยาบาล</option>
                    <option value="คำประกาศสตอรี่">คำประกาศสตอรี่</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-left duration-500 delay-400 hover:bg-gray-100 transition-colors duration-300">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formDataState.isActive}
                    onChange={(e) => setFormData({ ...formDataState, isActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transform hover:scale-110 transition-transform duration-200"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors duration-200">
                    เปิดใช้งานคำประกาศนี้
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-bottom duration-500 delay-500">
                  <button
                    type="submit"
                    className="flex-1 flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 hover:-translate-y-1"
                  >
                    <Save className="w-6 h-6 mb-2 animate-bounce-slow" />
                    <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกคำประกาศ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        title: '',
                        content: '',
                        category: '',
                        isActive: true,
                      });
                    }}
                    className="flex-1 flex flex-col items-center justify-center px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 hover:-translate-y-1"
                  >
                    <X className="w-6 h-6 mb-2" />
                    <span>ยกเลิก</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="flex-1 overflow-hidden px-4 pb-4 min-h-0">
          <div className="space-y-6 h-full overflow-hidden">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full mb-6">
                  <Megaphone className="w-12 h-12 text-blue-500" />
                </div>
                <p className="text-gray-700 text-xl font-semibold mb-2">ยังไม่มีคำประกาศ</p>
                <p className="text-gray-400 text-sm">คลิกปุ่ม "เพิ่มคำประกาศ" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={announcement._id}
                  className={`bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] ${
                    !announcement.isActive ? 'opacity-60' : ''
                  } animate-in fade-in slide-in-from-bottom duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header Section */}
                  <div className={`px-8 py-6 ${
                    announcement.category === 'คำประกาศโรงพยาบาล' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                      : announcement.category === 'คำประกาศสตอรี่'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        {/* Title */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Megaphone className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                              {announcement.title || 'ไม่มีหัวข้อ'}
                            </h3>
                            {!announcement.isActive && (
                              <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/30 text-white rounded-full backdrop-blur-sm">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Category and Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {announcement.category && (
                            <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30">
                              {announcement.category}
                            </span>
                          )}
                          {announcement.tags && announcement.tags.length > 0 && (
                            <>
                              {announcement.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30"
                                >
                                  <Tag className="w-3 h-3 mr-1.5" />
                                  {tag}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleCopy(announcement.content, announcement._id)}
                          className="p-3 text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-white/50 hover:scale-110"
                          title="คัดลอกเนื้อหา"
                        >
                          {copiedId === announcement._id ? (
                            <Check className="w-5 h-5 text-green-200" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-3 text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-white/50 hover:scale-110"
                          title="แก้ไข"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement._id)}
                          className="p-3 text-white hover:bg-red-500/30 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-red-400/50 hover:scale-110"
                          title="ลบ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-8">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 mb-6 border border-gray-200 shadow-inner">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                        {announcement.content || 'ไม่มีเนื้อหา'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {announcement.createdByName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          สร้างโดย <span className="text-gray-900">{announcement.createdByName}</span>
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{formatDate(announcement.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </Layout>
  );
}
