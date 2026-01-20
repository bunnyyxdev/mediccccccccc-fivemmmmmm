'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  Clock, 
  Plus, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  X, 
  Activity,
  History,
  Timer,
  ArrowRight
} from 'lucide-react';
import DatePickerV2 from '@/components/DatePickerV2';
import CustomTimePicker from '@/components/TimePicker';

interface TimeTrackingRecord {
  _id: string;
  caregiverName: string;
  caredForPerson: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  recordedByName: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export default function TimeTrackingPage() {
  const [records, setRecords] = useState<TimeTrackingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caregiverName: '',
    caredForPerson: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/time-tracking', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/time-tracking',
        {
          caregiverName: formData.caregiverName,
          caredForPerson: formData.caredForPerson,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกเวลาสำเร็จ');
      setFormData({
        caregiverName: '',
        caredForPerson: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        notes: '',
      });
      setShowForm(false);
      fetchRecords();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถบันทึกเวลาได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours} ชม. ${mins} นาที`;
    return `${mins} นาที`;
  };

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <History className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Time Logs</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                ประวัติการลงเวลาพี่เลี้ยง
              </h1>
              <p className="text-gray-500 mt-2 max-w-xl">
                ติดตามและตรวจสอบการปฏิบัติงานของพี่เลี้ยงและนักเรียนแพทย์ได้ที่นี่
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>ลงเวลาใหม่</span>
            </button>
          </div>

          {/* Records Grid */}
          <div className="space-y-6">
            {records.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                  <Clock className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีข้อมูลการลงเวลา</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  เริ่มบันทึกการทำงานครั้งแรกโดยกดปุ่ม "ลงเวลาใหม่" ที่มุมขวาบน
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {records.map((record, index) => (
                  <div
                    key={record._id}
                    className="group bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-emerald-100 transition-all duration-300 relative overflow-hidden"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${record.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center pl-3">
                      
                      {/* Time & Date Block */}
                      <div className="flex-shrink-0 min-w-[140px] flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-1">
                         <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">
                               {new Date(record.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                         </div>
                         <div className="hidden lg:block w-px h-8 bg-gray-200 ml-2 my-1"></div>
                         <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-800 font-mono tracking-tight">
                               {record.startTime}
                            </span>
                            {record.endTime && (
                              <>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                                <span className="text-xl font-semibold text-gray-500 font-mono">
                                  {record.endTime}
                                </span>
                              </>
                            )}
                         </div>
                      </div>

                      {/* People Info Block */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                              <User className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">พี่เลี้ยง (Caregiver)</p>
                              <p className="font-medium text-gray-900">{record.caregiverName}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600">
                              <Activity className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ดูแล (Student)</p>
                              <p className="font-medium text-gray-900">{record.caredForPerson}</p>
                           </div>
                        </div>
                      </div>

                      {/* Status & Stats Block */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2 min-w-[120px] justify-between lg:justify-center border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0">
                         {/* Duration Badge */}
                         <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                            <Timer className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{formatDuration(record.duration)}</span>
                         </div>
                         
                         {/* Status Badge */}
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            record.status === 'completed' 
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                               : 'bg-amber-50 text-amber-700 border-amber-200'
                         }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                               record.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            }`}></span>
                            {record.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                         </span>
                      </div>

                    </div>
                    
                    {/* Footer / Notes */}
                    {(record.notes || record.recordedByName) && (
                       <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 ml-3">
                          <div className="flex items-center gap-2">
                             {record.notes && (
                                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-100">
                                   <FileText className="w-3 h-3" />
                                   Note: {record.notes}
                                </span>
                             )}
                          </div>
                          <div className="flex items-center gap-1 opacity-70">
                             <CheckCircle2 className="w-3 h-3" />
                             <span>Recorded by {record.recordedByName}</span>
                          </div>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Overlay Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             {/* Backdrop */}
             <div 
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
               onClick={() => setShowForm(false)}
             />

             {/* Modal Content */}
             <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                         <Clock className="w-6 h-6 text-emerald-600" />
                         บันทึกเวลาปฏิบัติงาน
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลเพื่อบันทึกประวัติการทำงาน</p>
                   </div>
                   <button 
                     onClick={() => setShowForm(false)}
                     className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                   >
                      <X className="w-6 h-6" />
                   </button>
                </div>

                {/* Form Body */}
                <div className="p-8 max-h-[75vh] overflow-y-auto">
                   <form onSubmit={handleSubmit} className="space-y-6">
                      
                      {/* People Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">ชื่อพี่เลี้ยง <span className="text-red-500">*</span></label>
                            <input
                               type="text"
                               required
                               value={formData.caregiverName}
                               onChange={(e) => setFormData({ ...formData, caregiverName: e.target.value })}
                               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                               placeholder="ระบุชื่อพี่เลี้ยง"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">ชื่อนักเรียนแพทย์ <span className="text-red-500">*</span></label>
                            <input
                               type="text"
                               required
                               value={formData.caredForPerson}
                               onChange={(e) => setFormData({ ...formData, caredForPerson: e.target.value })}
                               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                               placeholder="ระบุชื่อนักเรียนแพทย์"
                            />
                         </div>
                      </div>

                      <div className="border-t border-gray-100"></div>

                      {/* Date & Time */}
                      <div className="space-y-5">
                         <DatePickerV2
                            label="วันที่ปฏิบัติงาน *"
                            value={formData.date}
                            onChange={(date) => setFormData({ ...formData, date })}
                            required
                            disablePastDates={false}
                         />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomTimePicker
                               label="เวลาเริ่มต้น *"
                               value={formData.startTime}
                               onChange={(time) => setFormData({ ...formData, startTime: time || '' })}
                               required
                            />
                            <CustomTimePicker
                               label="เวลาสิ้นสุด *"
                               value={formData.endTime}
                               onChange={(time) => setFormData({ ...formData, endTime: time || '' })}
                               required
                            />
                         </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                         <label className="text-sm font-semibold text-gray-700">หมายเหตุเพิ่มเติม</label>
                         <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                            placeholder="รายละเอียดอื่นๆ (ถ้ามี)..."
                         />
                      </div>

                      {/* Action Buttons */}
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
                            variant="primary" 
                            isLoading={loading}
                            className="flex-[2] py-3 shadow-lg shadow-emerald-500/20"
                          >
                            ยืนยันการบันทึก
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
