'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Ban, 
  Plus, 
  X, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  CheckCircle, 
  XCircle,
  DollarSign,
  UserX,
  Shield,
  Clock
} from 'lucide-react';
import { BLACKLIST_CHARGES } from '@/lib/blacklist-charges';
import DatePickerV2 from '@/components/DatePickerV2';

interface BlacklistItem {
  _id: string;
  name: string;
  reason: string;
  fineAmount?: number;
  paymentStatus?: 'unpaid' | 'paid';
  paidAt?: string;
  paidByName?: string;
  incidentDate?: string;
  createdAt: string;
  addedByName: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    charge: '',
    reason: '',
    fineAmount: '',
    incidentDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const fetchBlacklist = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/blacklist', {
        headers: { Authorization: `Bearer ${token}` },
        params: { _t: Date.now() },
      });

      setBlacklist(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('ไม่สามารถโหลดรายการ Blacklist ได้');
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.post(
        '/api/blacklist',
        {
          name: formData.name,
          charge: formData.charge,
          reason: formData.reason,
          fineAmount: formData.fineAmount || undefined,
          incidentDate: formData.incidentDate || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('เพิ่มในแบล็คลิสสำเร็จ');
      setFormData({ name: '', charge: '', reason: '', fineAmount: '', incidentDate: '' });
      setShowForm(false);
      fetchBlacklist();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถเพิ่มในแบล็คลิสได้';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากแบล็คลิส?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.delete(`/api/blacklist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('ลบออกจากแบล็คลิสแล้ว');
      fetchBlacklist();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถลบรายการได้';
      toast.error(errorMsg);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, currentStatus: 'unpaid' | 'paid' | undefined) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const confirmMessage = newStatus === 'paid' 
      ? 'ยืนยันการอัปเดตสถานะเป็น "ชำระค่าปรับแล้ว"?'
      : 'ยืนยันการอัปเดตสถานะเป็น "ยังไม่ชำระค่าปรับ"?';

    if (!confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ');
        return;
      }

      await axios.put(
        `/api/blacklist/${id}`,
        { paymentStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(newStatus === 'paid' ? 'อัปเดตสถานะเป็นชำระค่าปรับแล้ว' : 'อัปเดตสถานะเป็นยังไม่ชำระค่าปรับ');
      fetchBlacklist();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'ไม่สามารถอัปเดตสถานะได้';
      toast.error(errorMsg);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const itemsWithFine = blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0);
    if (selectedItems.size === itemsWithFine.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itemsWithFine.map((item) => item._id)));
    }
  };

  const handleBulkUpdatePaymentStatus = async (status: 'paid' | 'unpaid') => {
    if (selectedItems.size === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการอัปเดต');
      return;
    }

    const confirmMessage = status === 'paid'
      ? `ยืนยันการอัปเดตสถานะเป็น "ชำระค่าปรับแล้ว" สำหรับ ${selectedItems.size} รายการ?`
      : `ยืนยันการอัปเดตสถานะเป็น "ยังไม่ชำระค่าปรับ" สำหรับ ${selectedItems.size} รายการ?`;

    if (!confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบ');
      setBulkActionLoading(false);
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.put(`/api/blacklist/${id}`, { paymentStatus: status }, { headers: { Authorization: `Bearer ${token}` } });
          successCount++;
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`อัปเดตสถานะสำเร็จ ${successCount} รายการ${failCount > 0 ? ` (ล้มเหลว ${failCount} รายการ)` : ''}`);
      } else {
        toast.error('ไม่สามารถอัปเดตสถานะได้');
      }

      setSelectedItems(new Set());
      fetchBlacklist();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการลบ');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${selectedItems.size} รายการออกจากแบล็คลิส?`)) return;

    setBulkActionLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบ');
      setBulkActionLoading(false);
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`/api/blacklist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          successCount++;
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`ลบรายการสำเร็จ ${successCount} รายการ${failCount > 0 ? ` (ล้มเหลว ${failCount} รายการ)` : ''}`);
      } else {
        toast.error('ไม่สามารถลบรายการได้');
      }

      setSelectedItems(new Set());
      fetchBlacklist();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Stats
  const totalFines = blacklist.reduce((sum, item) => sum + (item.fineAmount || 0), 0);
  const unpaidCount = blacklist.filter(item => item.fineAmount && item.paymentStatus !== 'paid').length;
  const paidCount = blacklist.filter(item => item.fineAmount && item.paymentStatus === 'paid').length;

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-red-50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-red-600">
                <Shield className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Blacklist Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                แบล็คลิส
              </h1>
              <p className="text-gray-500 mt-2">
                จัดการรายชื่อและค่าปรับของบุคคลที่ถูกขึ้นบัญชีดำ
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>เพิ่มรายการ</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <UserX className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">รายการทั้งหมด</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{blacklist.length}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">ค่าปรับรวม</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalFines.toLocaleString()} <span className="text-sm font-normal text-gray-500">บาท</span></p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">ยังไม่ชำระ</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{unpaidCount}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">ชำระแล้ว</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedItems.size > 0 && (
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg border border-blue-100 sticky top-4 z-20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    เลือกแล้ว <span className="text-blue-600 font-bold">{selectedItems.size}</span> รายการ
                  </span>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    disabled={bulkActionLoading}
                  >
                    ล้างการเลือก
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkUpdatePaymentStatus('paid')}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>ชำระแล้ว</span>
                  </button>
                  <button
                    onClick={() => handleBulkUpdatePaymentStatus('unpaid')}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl border border-orange-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ยังไม่ชำระ</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List Header */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">รายการแบล็คลิส</h2>
            </div>
            
            {blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0).length > 0 && (
              <button
                onClick={handleSelectAll}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
              >
                {selectedItems.size === blacklist.filter((item) => item.fineAmount !== undefined && item.fineAmount > 0).length 
                  ? 'ยกเลิกเลือกทั้งหมด' 
                  : 'เลือกทั้งหมด'}
              </button>
            )}
          </div>

          {/* Blacklist Items */}
          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Ban className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : blacklist.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีรายการในแบล็คลิส</h3>
                <p className="text-gray-500">ยังไม่มีใครถูกเพิ่มในรายการแบล็คลิส</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blacklist.map((item, index) => {
                  const isSelected = selectedItems.has(item._id);
                  const canSelect = item.fineAmount !== undefined && item.fineAmount > 0;
                  
                  return (
                    <div
                      key={item._id}
                      className={`p-6 transition-all duration-200 ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        {canSelect && (
                          <div className="pt-1">
                            <button
                              onClick={() => handleToggleSelection(item._id)}
                              disabled={bulkActionLoading}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
                                isSelected
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            {/* Left: Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-100 rounded-xl">
                                  <Ban className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                                {item.paymentStatus === 'paid' ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    ชำระแล้ว
                                  </span>
                                ) : item.fineAmount && item.fineAmount > 0 ? (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                    ยังไม่ชำระ
                                  </span>
                                ) : null}
                              </div>
                              
                              <div className="flex items-start gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-600">{item.reason}</p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3">
                                {item.fineAmount !== undefined && item.fineAmount > 0 && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-sm font-semibold">
                                      {item.fineAmount.toLocaleString('th-TH')} บาท
                                    </span>
                                  </div>
                                )}
                                
                                {item.incidentDate && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">
                                      {new Date(item.incidentDate).toLocaleDateString('th-TH', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                                
                                <span className="text-xs text-gray-500">
                                  เพิ่มโดย {item.addedByName}
                                </span>
                              </div>
                            </div>
                            
                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                              <span className="text-xs text-gray-400">
                                {new Date(item.createdAt).toLocaleDateString('th-TH', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {item.fineAmount !== undefined && item.fineAmount > 0 && (
                                  <button
                                    onClick={() => handleUpdatePaymentStatus(item._id, item.paymentStatus)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                      item.paymentStatus === 'paid'
                                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                                        : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                                    }`}
                                  >
                                    {item.paymentStatus === 'paid' ? (
                                      <><XCircle className="w-4 h-4" /><span>ยังไม่ชำระ</span></>
                                    ) : (
                                      <><CheckCircle className="w-4 h-4" /><span>ชำระแล้ว</span></>
                                    )}
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleRemove(item._id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowForm(false)}
            />
            
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-500 to-rose-600">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Ban className="w-6 h-6" />
                    เพิ่มรายการแบล็คลิส
                  </h2>
                  <p className="text-red-100 text-sm mt-1">กรอกข้อมูลเพื่อเพิ่มรายการใหม่</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        placeholder="กรอกชื่อ"
                      />
                    </div>
                    <DatePickerV2
                      label="วันที่เกิดเหตุ"
                      value={formData.incidentDate}
                      onChange={(date) => setFormData({ ...formData, incidentDate: date })}
                      placeholder="เลือกวันที่เกิดเหตุ"
                      disablePastDates={false}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">ข้อหา <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.charge}
                        onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none"
                      >
                        <option value="">-- เลือกข้อหา --</option>
                        {BLACKLIST_CHARGES.map((charge, index) => (
                          <option key={index} value={charge}>{charge}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      รายละเอียดเพิ่มเติม <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                      rows={3}
                      placeholder="กรอกรายละเอียดเพิ่มเติม (ถ้ามี)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      ราคาค่าปรับ <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.fineAmount}
                        onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit" 
                      variant="danger" 
                      isLoading={loading}
                      className="flex-[2] py-3 shadow-lg shadow-red-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        เพิ่มรายการ
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
