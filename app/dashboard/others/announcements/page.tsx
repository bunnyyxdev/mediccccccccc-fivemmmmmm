'use client';

import { useState, useEffect } from 'react';
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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch ALL announcements from database - all users can see all announcements
      const response = await axios.get('/api/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnnouncements(response.data.announcements || []);
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดคำประกาศได้');
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      if (editingId) {
        // Update existing
        await axios.put(
          `/api/announcements/${editingId}`,
          {
            title: formData.title,
            content: formData.content,
            category: formData.category || undefined,
            tags: tagsArray,
            isActive: formData.isActive,
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
            title: formData.title,
            content: formData.content,
            category: formData.category || undefined,
            tags: tagsArray,
            isActive: formData.isActive,
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
        tags: '',
        isActive: true,
      });
      fetchAnnouncements();
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
      tags: announcement.tags?.join(', ') || '',
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
      fetchAnnouncements();
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">สำหรับคำประกาศหมอ</h1>
              <p className="text-sm text-gray-600">จัดการและคัดลอกคำประกาศสำหรับหมอ</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="primary"
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    content: '',
                    category: '',
                    tags: '',
                    isActive: true,
                  });
                }
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              {showForm ? 'ยกเลิก' : 'เพิ่มคำประกาศ'}
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'แก้ไขคำประกาศ' : 'เพิ่มคำประกาศใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หัวข้อ *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  placeholder="กรอกหัวข้อคำประกาศ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหา *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input w-full min-h-[150px]"
                  placeholder="กรอกเนื้อหาคำประกาศ"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    <option value="คำประกาศโรงพยาบาล">คำประกาศโรงพยาบาล</option>
                    <option value="คำประกาศสตอรี่">คำประกาศสตอรี่</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    แท็ก (คั่นด้วย comma)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input w-full"
                    placeholder="เช่น: สำคัญ, ด่วน, ทั่วไป"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  เปิดใช้งาน
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button type="submit" variant="primary">
                  <Save className="w-5 h-5 mr-2" />
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      title: '',
                      content: '',
                      category: '',
                      tags: '',
                      isActive: true,
                    });
                  }}
                >
                  <X className="w-5 h-5 mr-2" />
                  ยกเลิก
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ยังไม่มีคำประกาศ</p>
              <p className="text-gray-400 text-sm mt-2">คลิกปุ่ม "เพิ่มคำประกาศ" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement._id}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${
                  !announcement.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      {/* Title */}
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 flex-1">
                          {announcement.title || 'ไม่มีหัวข้อ'}
                        </h3>
                        {!announcement.isActive && (
                          <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full whitespace-nowrap">
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>
                      
                      {/* Category and Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {announcement.category && (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                            {announcement.category}
                          </span>
                        )}
                        {announcement.tags && announcement.tags.length > 0 && (
                          <>
                            {announcement.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
                              >
                                <Tag className="w-3 h-3 mr-1.5" />
                                {tag}
                              </span>
                            ))}
                          </>
                        )}
                        {(!announcement.category && (!announcement.tags || announcement.tags.length === 0)) && (
                          <span className="text-xs text-gray-400 italic">ไม่มีหมวดหมู่และแท็ก</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(announcement.content, announcement._id)}
                        className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 border border-transparent hover:border-green-200"
                        title="คัดลอกเนื้อหา"
                      >
                        {copiedId === announcement._id ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
                        title="แก้ไข"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-5 mb-4 border border-gray-100">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {announcement.content || 'ไม่มีเนื้อหา'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <span className="font-medium">สร้างโดย: <span className="text-gray-700">{announcement.createdByName}</span></span>
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
