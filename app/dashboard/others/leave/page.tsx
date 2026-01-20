'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  User, 
  CalendarDays,
  CheckCircle2,
  XCircle,
  Ban,
  Heart,
  Briefcase,
  Zap,
  MoreHorizontal,
  Plus,
  X,
  CalendarRange,
  Send,
  ArrowRight,
  FileText
} from 'lucide-react';
import DatePickerV2 from '@/components/DatePickerV2';

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';
  duration: number;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

const LEAVE_TYPE_CONFIG = {
  sick: { 
    label: 'ลาป่วย', 
    icon: Heart, 
    color: 'bg-red-100 text-red-700 border-red-200',
    gradient: 'from-red-400 to-rose-500'
  },
  personal: { 
    label: 'ลาส่วนตัว', 
    icon: User, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    gradient: 'from-purple-400 to-pink-500'
  },
  vacation: { 
    label: 'ลาพักผ่อน', 
    icon: Briefcase, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    gradient: 'from-blue-400 to-cyan-500'
  },
  emergency: { 
    label: 'ลาฉุกเฉิน', 
    icon: Zap, 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    gradient: 'from-orange-400 to-amber-500'
  },
  other: { 
    label: 'อื่นๆ', 
    icon: MoreHorizontal, 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    gradient: 'from-gray-400 to-slate-500'
  },
};

const STATUS_CONFIG = {
  pending: { 
    label: 'รอดำเนินการ', 
    icon: Clock, 
    color: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  approved: { 
    label: 'อนุมัติ', 
    icon: CheckCircle2, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  rejected: { 
    label: 'ปฏิเสธ', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-700 border-red-200' 
  },
  cancelled: { 
    label: 'ยกเลิก', 
    icon: Ban, 
    color: 'bg-gray-100 text-gray-700 border-gray-200' 
  },
};

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/leave',
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          leaveType: 'other',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('แจ้งลาสำเร็จ');
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
      });
      setShowForm(false);
      fetchLeaves();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถแจ้งลาได้';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
      }
    }
    return 0;
  };

  // Filter out pending leaves
  const filteredLeaves = leaves.filter(l => l.status !== 'pending');

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50 via-indigo-50/50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <CalendarRange className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Leave Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                แจ้งลา
              </h1>
              <p className="text-gray-500 mt-2">
                ส่งคำขอลาและดูประวัติการลาของทุกคนในระบบ
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>ส่งคำขอลา</span>
            </button>
          </div>

          {/* List Header */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ประวัติการลาของทุกคน</h2>
              {filteredLeaves.length > 0 && (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  {filteredLeaves.length}
                </span>
              )}
            </div>
          </div>

          {/* Leaves List */}
          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CalendarDays className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarRange className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีการแจ้งลา</h3>
                <p className="text-gray-500 mb-6">ยังไม่มีข้อมูลการลาในระบบ</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>ส่งคำขอลาแรก</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredLeaves.map((leave) => {
                  const leaveTypeConfig = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.other;
                  const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                  const LeaveIcon = leaveTypeConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={leave._id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Leave Type Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${leaveTypeConfig.gradient} rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
                          <LeaveIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            {/* Left: Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{leave.requestedByName}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${leaveTypeConfig.color}`}>
                                  {leaveTypeConfig.label}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${statusConfig.color}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusConfig.label}
                                </span>
                              </div>
                              
                              {/* Date Range */}
                              <div className="flex items-center gap-2 mb-3 text-sm">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(leave.startDate).toLocaleDateString('th-TH', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>
                                    {new Date(leave.endDate).toLocaleDateString('th-TH', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <span className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                                  {leave.duration} วัน
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 line-clamp-2">{leave.reason}</p>
                            </div>
                            
                            {/* Right: Created Date */}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(leave.createdAt).toLocaleDateString('th-TH', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </span>
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
            
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarRange className="w-6 h-6" />
                    ส่งคำขอลา
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">กรอกข้อมูลเพื่อส่งคำขอลา</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-8 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <DatePickerV2
                      label="วันเริ่มต้นลา"
                      value={formData.startDate}
                      onChange={(date) => setFormData({ ...formData, startDate: date })}
                      required
                      placeholder="เลือกวันที่เริ่มต้นลา"
                    />
                    <DatePickerV2
                      label="วันสิ้นสุดลา"
                      value={formData.endDate}
                      onChange={(date) => setFormData({ ...formData, endDate: date })}
                      required
                      minDate={formData.startDate}
                      placeholder="เลือกวันที่สิ้นสุดลา"
                    />
                  </div>

                  {/* Duration Display */}
                  {formData.startDate && formData.endDate && calculateDuration() > 0 && (
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <CalendarDays className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">จำนวนวันลา</p>
                          <p className="text-3xl font-bold text-blue-700">{calculateDuration()} <span className="text-lg font-medium">วัน</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      เหตุผลการลา <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      rows={5}
                      placeholder="กรุณากรอกเหตุผลการลา..."
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          startDate: '',
                          endDate: '',
                          reason: '',
                        });
                      }}
                      className="flex-1 py-3"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      isLoading={submitting}
                      className="flex-[2] py-3 shadow-lg shadow-blue-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        ส่งคำขอลา
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
