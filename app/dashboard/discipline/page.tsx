'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Filter, 
  Search, 
  X, 
  Calendar, 
  User, 
  AlertCircle,
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Shield,
  Gavel,
  ChevronDown
} from 'lucide-react';
import DatePickerV2 from '@/components/DatePickerV2';
import Select from '@/components/Select';

interface Doctor {
  _id: string;
  name: string;
  username: string;
  doctorRank?: string;
}

interface DisciplineRecord {
  _id: string;
  doctorName: string;
  doctorId?: string;
  violation: string;
  violationDate?: string;
  issuedByName: string;
  status: 'pending' | 'issued' | 'appealed' | 'resolved';
  notes?: string;
  createdAt: string;
}

const VIOLATION_OPTIONS = [
  'ลาออก / ถูกปลดออกก่อนอายุการทำงานครบ 30 วัน',
  'ขาดงานเกิน 5 วัน หรือเวลาทำงานต่ำกว่า 10 ช.ม./สัปดาห์ (โดยไม่มีการแจ้งลา)',
  'ไม่เปลี่ยนชื่อ Steam เป็นชื่อ IC และมี Tag [MD] ด้านหน้าชื่อ',
  'ใส่ชุดของหน่วยงานแพทย์ไปทำอย่างอื่น นอกเหนือจากการทำงาน',
  'รับฝากสิ่งของผิดกฏหมาย (ทุกประเภท)',
  'ใช้คำพูดไม่เหมาะสม (หยาบคาย , ด่าทอ)',
  'แพทย์พูดจายุยง ปลุกปั่นให้เกิดสตอรี่ต่าง ๆ',
  'อุ้มปชช. แก๊งค์ หรือครอบครัว รวมถึงแพทย์ด้วยกันในระหว่างเข้าเวร (ยกเว้น เพื่อการรักษา)',
  'นำรถ , ฮอของหน่วยงานแพทย์ ไปใช้นอกเหนือจากการทำงาน',
  'นำเรื่องภายในหน่วยงาน ข้อมูลต่าง ๆ ที่มีผลต่อองค์กร หรือสตอรี่ ไปเผยแพร่ด้านนอก',
  'ทำรถแพทย์หลุด / ทำฮอแพทย์หลุด',
  'AFK , Warzone , เลี้ยงสัตว์ , ทำงานขาว ในขณะเข้าเวร',
  'ทำงานดำ , เล่นลูปต่าง ๆ ในขณะเข้าเวร',
  'ละเลยการปฏิบัติหน้าที่ เช่น เข้าเวรยืนประจำหน้าโรงพยาบาล แต่ยืนเหม่อ',
  'เหม่อในขณะเข้าเวร เกิน 15 นาที',
  'ทำผิดกฎต่าง ๆ ที่ห้ามประชาชนทำ (เกี่ยวกับหน่วยงานแพทย์) หรือการทำผิดกฎการใช้โรงพยาบาล เช่น กดเคสมาแล้วชุบกันเองตอนออกเวร',
];

const STATUS_CONFIG = {
  pending: { label: 'รอดำเนินการ', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
  issued: { label: 'ออกแล้ว', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText },
  appealed: { label: 'อุทธรณ์', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: MessageSquare },
  resolved: { label: 'แก้ไขแล้ว', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
};

export default function DisciplinePage() {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
  });
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    violation: '',
    violationDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doctorList = response.data.users.filter((user: any) => user.role === 'doctor');
      setDoctors(doctorList);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/discipline?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/discipline',
        {
          doctorId: formData.doctorId,
          doctorName: formData.doctorName,
          violation: formData.violation,
          violationDate: formData.violationDate,
          notes: formData.notes || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกโทษวินัยสำเร็จ');
      setFormData({
        doctorId: '',
        doctorName: '',
        violation: '',
        violationDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
      fetchRecords();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'ไม่สามารถบันทึกโทษวินัยได้';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-50 via-amber-50/50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-orange-600">
                <Scale className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Discipline Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                โทษวินัยแพทย์
              </h1>
              <p className="text-gray-500 mt-2">
                บันทึกและติดตามโทษวินัยของแพทย์
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>บันทึกโทษวินัย</span>
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  <Filter className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-900">ตัวกรอง</span>
                {(filters.search || filters.startDate || filters.endDate) && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    กำลังใช้งาน
                  </span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilters && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">ค้นหา</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        placeholder="ค้นหาชื่อแพทย์, ความผิด"
                      />
                    </div>
                  </div>
                  <DatePickerV2
                    label="วันที่เริ่มต้น"
                    value={filters.startDate}
                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                    disablePastDates={false}
                  />
                  <DatePickerV2
                    label="วันที่สิ้นสุด"
                    value={filters.endDate}
                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                    minDate={filters.startDate}
                    disablePastDates={false}
                  />
                </div>
                {(filters.search || filters.startDate || filters.endDate) && (
                  <button
                    onClick={() => setFilters({ search: '', startDate: '', endDate: '' })}
                    className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Records List */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <Gavel className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ประวัติโทษวินัย</h2>
              {records.length > 0 && (
                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                  {records.length}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Scale className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีบันทึกโทษวินัย</h3>
                <p className="text-gray-500 mb-6">ยังไม่มีการบันทึกโทษวินัยแพทย์</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกโทษวินัยแรก</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {records.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={record._id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {record.doctorName.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900">{record.doctorName}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${statusConfig.color}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusConfig.label}
                                </span>
                              </div>
                              
                              <div className="flex items-start gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-600">{record.violation}</p>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                {record.violationDate && (
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>วันที่กระทำผิด: {new Date(record.violationDate).toLocaleDateString('th-TH', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <User className="w-4 h-4" />
                                  <span>ออกโดย: {record.issuedByName}</span>
                                </div>
                              </div>
                              
                              {record.notes && (
                                <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-700">หมายเหตุ:</span> {record.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="lg:w-32 flex lg:flex-col items-center lg:items-end gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(record.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
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
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    บันทึกโทษวินัย
                  </h2>
                  <p className="text-orange-100 text-sm mt-1">กรอกข้อมูลเพื่อบันทึกโทษวินัยใหม่</p>
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
                  {/* Doctor Selection */}
                  <div>
                    <Select
                      label="ชื่อแพทย์"
                      value={formData.doctorId}
                      onChange={(value) => {
                        const selectedDoctor = doctors.find(d => d._id === value);
                        setFormData({ 
                          ...formData, 
                          doctorId: value,
                          doctorName: selectedDoctor?.name || ''
                        });
                      }}
                      options={doctors.map(doctor => ({
                        value: doctor._id,
                        label: `${doctor.name} ${doctor.doctorRank ? `(${doctor.doctorRank})` : ''} ${doctor.username ? `[${doctor.username}]` : ''}`
                      }))}
                      required
                      placeholder="เลือกแพทย์"
                      searchable={true}
                    />
                  </div>

                  {/* Violation Date */}
                  <DatePickerV2
                    label="วันที่กระทำผิด"
                    value={formData.violationDate}
                    onChange={(date) => setFormData({ ...formData, violationDate: date })}
                    required
                    placeholder="เลือกวันที่กระทำผิด"
                    disablePastDates={false}
                  />

                  {/* Violation Type */}
                  <Select
                    label="ความผิด"
                    value={formData.violation}
                    onChange={(value) => setFormData({ ...formData, violation: value })}
                    options={VIOLATION_OPTIONS.map((violation) => ({
                      value: violation,
                      label: violation
                    }))}
                    required
                    placeholder="เลือกความผิด"
                    searchable={true}
                  />

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      หมายเหตุ <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                      rows={4}
                      placeholder="กรอกหมายเหตุ (ถ้ามี)"
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
                          doctorId: '',
                          doctorName: '',
                          violation: '',
                          violationDate: new Date().toISOString().split('T')[0],
                          notes: '',
                        });
                      }}
                      className="flex-1 py-3"
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      type="submit" 
                      variant="warning" 
                      isLoading={loading}
                      className="flex-[2] py-3 shadow-lg shadow-orange-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" />
                        บันทึกโทษวินัย
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
