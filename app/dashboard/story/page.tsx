'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import { 
  X, 
  FileText, 
  Users, 
  Calendar, 
  BookOpen,
  Swords,
  UserCheck,
  Clock,
  MapPin,
  ChevronDown,
  Sparkles,
  Target,
  Zap,
  Eye,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import DatePickerV2 from '@/components/DatePickerV2';
import axios from 'axios';

const TEAM_TYPES = [
  { value: 'Group', label: 'Group', icon: '👥' },
  { value: 'Family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'Gang', label: 'Gang', icon: '🔥' },
  { value: 'MC Family', label: 'MC Family', icon: '🏍️' },
  { value: 'MC Gang', label: 'MC Gang', icon: '⚡' },
];

const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'กำลังจะเกิดขึ้น', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Batting', label: 'กำลังตี', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'Judging', label: 'กำลังตัดสิน', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'Ended', label: 'จบแล้ว', color: 'bg-green-100 text-green-700 border-green-200' },
];

interface StoryLog {
  _id: string;
  teamA: { type: string; name: string };
  teamB: { type: string; name: string };
  status: string;
  negotiation: {
    date?: string;
    observerMedic?: string;
    explainMedic?: string;
    entourageMedic?: string;
  };
  fieldWork: {
    startDate?: string;
    endDate?: string;
    observerMedic?: string;
    headStory: string[];
    internStory: string[];
  };
  recordedByName: string;
  createdAt: string;
}

export default function StoryPage() {
  const [showLogStoryModal, setShowLogStoryModal] = useState(false);
  const [logStoryData, setLogStoryData] = useState({
    teamA: { type: '', name: '' },
    teamB: { type: '', name: '' },
    status: '',
    negotiation: {
      date: '',
      observerMedic: '',
      explainMedic: '',
      entourageMedic: '',
    },
    fieldWork: {
      startDate: '',
      endDate: '',
      observerMedic: '',
      headStory: ['', '', ''],
      internStory: ['', '', ''],
    },
  });
  const [logStoryLoading, setLogStoryLoading] = useState(false);
  const [logs, setLogs] = useState<StoryLog[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/story/log', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch story logs:', error);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleLogStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogStoryLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          await axios.post(
            '/api/story/log',
            {
              teamAType: logStoryData.teamA.type,
              teamAName: logStoryData.teamA.name,
              teamBType: logStoryData.teamB.type,
              teamBName: logStoryData.teamB.name,
              status: logStoryData.status,
              negotiationDate: logStoryData.negotiation.date || '',
              negotiationObserverMedic: logStoryData.negotiation.observerMedic || '',
              negotiationExplainMedic: logStoryData.negotiation.explainMedic || '',
              negotiationEntourageMedic: logStoryData.negotiation.entourageMedic || '',
              fieldWorkStartDate: logStoryData.fieldWork.startDate || '',
              fieldWorkEndDate: logStoryData.fieldWork.endDate || '',
              fieldWorkObserverMedic: logStoryData.fieldWork.observerMedic || '',
              headStory1: logStoryData.fieldWork.headStory[0] || '',
              headStory2: logStoryData.fieldWork.headStory[1] || '',
              headStory3: logStoryData.fieldWork.headStory[2] || '',
              internStory1: logStoryData.fieldWork.internStory[0] || '',
              internStory2: logStoryData.fieldWork.internStory[1] || '',
              internStory3: logStoryData.fieldWork.internStory[2] || '',
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (error) {
          console.error('Failed to save to Google Sheets:', error);
        }
      }
      
      toast.success('บันทึกสตอรี่สำเร็จ');
      setShowLogStoryModal(false);
      
      setLogStoryData({
        teamA: { type: '', name: '' },
        teamB: { type: '', name: '' },
        status: '',
        negotiation: {
          date: '',
          observerMedic: '',
          explainMedic: '',
          entourageMedic: '',
        },
        fieldWork: {
          startDate: '',
          endDate: '',
          observerMedic: '',
          headStory: ['', '', ''],
          internStory: ['', '', ''],
        },
      });

      fetchLogs();
    } catch (error: any) {
      toast.error('ไม่สามารถบันทึกสตอรี่ได้');
    } finally {
      setLogStoryLoading(false);
    }
  };

  // Stats
  const upcomingCount = logs.filter(l => l.status === 'Upcoming').length;
  const battingCount = logs.filter(l => l.status === 'Batting').length;
  const judgingCount = logs.filter(l => l.status === 'Judging').length;
  const endedCount = logs.filter(l => l.status === 'Ended').length;

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 via-purple-50/50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Story Management</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                สตอรี่
              </h1>
              <p className="text-gray-500 mt-2">
                บันทึกและติดตามสตอรี่ระหว่างทีม
              </p>
            </div>
            
            <button
              onClick={() => setShowLogStoryModal(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
              <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>บันทึกสตอรี่</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">กำลังจะเกิดขึ้น</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">กำลังตี</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{battingCount}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">กำลังตัดสิน</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{judgingCount}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">จบแล้ว</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{endedCount}</p>
            </div>
          </div>

          {/* List Header */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ประวัติสตอรี่</h2>
              {logs.length > 0 && (
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                  {logs.length}
                </span>
              )}
            </div>
          </div>

          {/* Story List */}
          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Swords className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีบันทึกสตอรี่</h3>
                <p className="text-gray-500 mb-6">เริ่มต้นด้วยการบันทึกสตอรี่ใหม่</p>
                <button
                  onClick={() => setShowLogStoryModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>บันทึกสตอรี่แรก</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const statusOption = STATUS_OPTIONS.find(s => s.value === log.status);
                  const teamAType = TEAM_TYPES.find(t => t.value === log.teamA.type);
                  const teamBType = TEAM_TYPES.find(t => t.value === log.teamB.type);
                  
                  return (
                    <div
                      key={log._id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Teams Battle Card */}
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            {/* Team A */}
                            <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{teamAType?.icon || '👥'}</span>
                                <span className="text-xs font-medium text-blue-600 uppercase">{log.teamA.type}</span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">{log.teamA.name}</h3>
                            </div>
                            
                            {/* VS Badge */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                                <Swords className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            
                            {/* Team B */}
                            <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{teamBType?.icon || '👥'}</span>
                                <span className="text-xs font-medium text-purple-600 uppercase">{log.teamB.type}</span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">{log.teamB.name}</h3>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${statusOption?.color || 'bg-gray-100 text-gray-700'}`}>
                              {statusOption?.label || log.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              บันทึกโดย {log.recordedByName}
                            </span>
                          </div>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Negotiation Info */}
                            {log.negotiation.date && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <MessageSquare className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-semibold text-gray-700">การเจรจา</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{log.negotiation.date}</span>
                                  </div>
                                  {log.negotiation.observerMedic && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>ผู้สังเกตการณ์: {log.negotiation.observerMedic}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Field Work Info */}
                            {(log.fieldWork.startDate || log.fieldWork.endDate) && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-semibold text-gray-700">งานภาคสนาม</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  {log.fieldWork.startDate && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>เริ่ม: {log.fieldWork.startDate}</span>
                                    </div>
                                  )}
                                  {log.fieldWork.endDate && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>สิ้นสุด: {log.fieldWork.endDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Head Story */}
                            {log.fieldWork.headStory.filter(Boolean).length > 0 && (
                              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm font-semibold text-amber-700">หัวหน้าสตอรี่</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {log.fieldWork.headStory.filter(Boolean).map((name, i) => (
                                    <span key={i} className="px-2 py-1 bg-white text-amber-700 text-xs rounded-lg border border-amber-200">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Intern Story */}
                            {log.fieldWork.internStory.filter(Boolean).length > 0 && (
                              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <UserPlus className="w-4 h-4 text-teal-600" />
                                  <span className="text-sm font-semibold text-teal-700">นักเรียนแพทย์สตอรี่</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {log.fieldWork.internStory.filter(Boolean).map((name, i) => (
                                    <span key={i} className="px-2 py-1 bg-white text-teal-700 text-xs rounded-lg border border-teal-200">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="lg:w-40 flex lg:flex-col items-center lg:items-end gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs">
                            {new Date(log.createdAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
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

        {/* Log Story Modal */}
        {showLogStoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowLogStoryModal(false)}
            />
            
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    บันทึกสตอรี่
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">กรอกข้อมูลเพื่อบันทึกสตอรี่ใหม่</p>
                </div>
                <button 
                  onClick={() => setShowLogStoryModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-8 overflow-y-auto flex-1">
                <form onSubmit={handleLogStorySubmit} className="space-y-10">
                  {/* Team A & B Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* TEAM A */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <h3 className="text-lg font-bold text-blue-700 mb-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md">A</div>
                        ทีม A
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">ประเภท *</label>
                          <div className="relative">
                            <select
                              value={logStoryData.teamA.type}
                              onChange={(e) => setLogStoryData({ ...logStoryData, teamA: { ...logStoryData.teamA, type: e.target.value } })}
                              className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                              required
                            >
                              <option value="">เลือกประเภท</option>
                              {TEAM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">ชื่อ *</label>
                          <input
                            type="text"
                            value={logStoryData.teamA.name}
                            onChange={(e) => setLogStoryData({ ...logStoryData, teamA: { ...logStoryData.teamA, name: e.target.value } })}
                            className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            required
                            placeholder="กรอกชื่อทีม A"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TEAM B */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <h3 className="text-lg font-bold text-purple-700 mb-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md">B</div>
                        ทีม B
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">ประเภท *</label>
                          <div className="relative">
                            <select
                              value={logStoryData.teamB.type}
                              onChange={(e) => setLogStoryData({ ...logStoryData, teamB: { ...logStoryData.teamB, type: e.target.value } })}
                              className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none"
                              required
                            >
                              <option value="">เลือกประเภท</option>
                              {TEAM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">ชื่อ *</label>
                          <input
                            type="text"
                            value={logStoryData.teamB.name}
                            onChange={(e) => setLogStoryData({ ...logStoryData, teamB: { ...logStoryData.teamB, name: e.target.value } })}
                            className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            required
                            placeholder="กรอกชื่อทีม B"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">สถานะ *</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {STATUS_OPTIONS.map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setLogStoryData({ ...logStoryData, status: status.value })}
                          className={`px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            logStoryData.status === status.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negotiation Section */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      การเจรจา
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <DatePickerV2
                        label="วันที่ *"
                        value={logStoryData.negotiation.date}
                        onChange={(date) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, date } })}
                        placeholder="เลือกวันที่การเจรจา"
                        required
                      />
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">แพทย์ผู้สังเกตการณ์</label>
                        <input
                          type="text"
                          value={logStoryData.negotiation.observerMedic}
                          onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, observerMedic: e.target.value } })}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="กรอกชื่อ"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">แพทย์ผู้อธิบาย</label>
                        <input
                          type="text"
                          value={logStoryData.negotiation.explainMedic}
                          onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, explainMedic: e.target.value } })}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="กรอกชื่อ"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">แพทย์ผู้ติดตาม</label>
                        <input
                          type="text"
                          value={logStoryData.negotiation.entourageMedic}
                          onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, entourageMedic: e.target.value } })}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="กรอกชื่อ"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field Work Section */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      งานภาคสนาม
                    </h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <DatePickerV2
                          label="วันที่เริ่มต้น"
                          value={logStoryData.fieldWork.startDate}
                          onChange={(date) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, startDate: date } })}
                          placeholder="เลือกวันที่เริ่มต้น"
                        />
                        <DatePickerV2
                          label="วันที่สิ้นสุด"
                          value={logStoryData.fieldWork.endDate}
                          onChange={(date) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, endDate: date } })}
                          placeholder="เลือกวันที่สิ้นสุด"
                          minDate={logStoryData.fieldWork.startDate}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">แพทย์ผู้สังเกตการณ์</label>
                        <input
                          type="text"
                          value={logStoryData.fieldWork.observerMedic}
                          onChange={(e) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, observerMedic: e.target.value } })}
                          className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          placeholder="กรอกชื่อ"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-3 block">หัวหน้าสตอรี่ (3 คน / ไม่บังคับ)</label>
                          <div className="space-y-3">
                            {[0, 1, 2].map((index) => (
                              <input
                                key={index}
                                type="text"
                                value={logStoryData.fieldWork.headStory[index]}
                                onChange={(e) => {
                                  const newHeadStory = [...logStoryData.fieldWork.headStory];
                                  newHeadStory[index] = e.target.value;
                                  setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, headStory: newHeadStory } });
                                }}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                placeholder={`หัวหน้าสตอรี่ ${index + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-3 block">นักเรียนแพทย์สตอรี่ (3 คน / ไม่บังคับ)</label>
                          <div className="space-y-3">
                            {[0, 1, 2].map((index) => (
                              <input
                                key={index}
                                type="text"
                                value={logStoryData.fieldWork.internStory[index]}
                                onChange={(e) => {
                                  const newInternStory = [...logStoryData.fieldWork.internStory];
                                  newInternStory[index] = e.target.value;
                                  setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, internStory: newInternStory } });
                                }}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                placeholder={`นักเรียนแพทย์สตอรี่ ${index + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center gap-4 pt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowLogStoryModal(false)}
                      className="flex-1 py-3"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={logStoryLoading}
                      className="flex-[2] py-3 shadow-lg shadow-indigo-200"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" />
                        บันทึกสตอรี่
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
