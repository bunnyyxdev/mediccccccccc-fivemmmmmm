'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import { X, FileText, Users, Calendar, Info } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import axios from 'axios';

const TEAM_TYPES = [
  { value: 'Group', label: 'Group' },
  { value: 'Family', label: 'Family' },
  { value: 'Gang', label: 'Gang' },
  { value: 'MC Family', label: 'MC Family' },
  { value: 'MC Gang', label: 'MC Gang' },
];

const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'กำลังจะเกิดขึ้น' },
  { value: 'Batting', label: 'กำลังตี' },
  { value: 'Judging', label: 'กำลังตัดสิน' },
  { value: 'Ended', label: 'จบแล้ว' },
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
      
      // บันทึกลง Google Sheets via API
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
          // Continue anyway - don't block the form submission
        }
      }
      
      toast.success('บันทึกสตอรี่สำเร็จ');
      setShowLogStoryModal(false);
      
      // Reset form
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

      // Refresh logs
      fetchLogs();
    } catch (error: any) {
      toast.error('ไม่สามารถบันทึกสตอรี่ได้');
    } finally {
      setLogStoryLoading(false);
    }
  };

  return (
    <Layout requireAuth={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  สตอรี่
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">บันทึกข้อมูลสตอรี่</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="primary" 
                onClick={() => setShowLogStoryModal(true)}
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>บันทึกสตอรี่</span>
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">ประวัติสตอรี่</h2>
                {logs.length > 0 && (
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                    {logs.length} รายการ
                  </span>
                )}
              </div>
            </div>

            {fetching ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Info className="w-10 h-10 text-gray-400 animate-pulse" />
                </div>
                <p className="text-gray-500">กำลังโหลด...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-4">
                  <Info className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีบันทึกสตอรี่</h3>
                <p className="text-gray-500">เริ่มต้นด้วยการบันทึกสตอรี่ใหม่</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log, index) => {
                  const statusLabel = STATUS_OPTIONS.find(s => s.value === log.status)?.label || log.status;
                  return (
                    <div
                      key={log._id}
                      className="p-6 hover:bg-gray-50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Main Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {log.teamA.name} vs {log.teamB.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                  {log.teamA.type}
                                </span>
                                <span className="text-gray-400">vs</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                  {log.teamB.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">สถานะ:</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
                                {statusLabel}
                              </span>
                            </div>

                            {log.negotiation.date && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">การเจรจา:</span> {log.negotiation.date}
                                {log.negotiation.observerMedic && (
                                  <> • ผู้สังเกตการณ์: {log.negotiation.observerMedic}</>
                                )}
                              </div>
                            )}

                            {(log.fieldWork.startDate || log.fieldWork.endDate) && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">งานภาคสนาม:</span>
                                {log.fieldWork.startDate && <> เริ่ม: {log.fieldWork.startDate}</>}
                                {log.fieldWork.endDate && <> • สิ้นสุด: {log.fieldWork.endDate}</>}
                              </div>
                            )}

                            {log.fieldWork.headStory.filter(Boolean).length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">หัวหน้าสตอรี่:</span>{' '}
                                {log.fieldWork.headStory.filter(Boolean).join(', ')}
                              </div>
                            )}

                            {log.fieldWork.internStory.filter(Boolean).length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">นักเรียนแพทย์สตอรี่:</span>{' '}
                                {log.fieldWork.internStory.filter(Boolean).join(', ')}
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                              บันทึกโดย: {log.recordedByName}
                            </div>
                          </div>
                        </div>

                        {/* Date Section */}
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(log.createdAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
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

        {/* Log Story Modal */}
        {showLogStoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white">บันทึกสตอรี่</h2>
                <button
                  onClick={() => setShowLogStoryModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleLogStorySubmit} className="p-6 space-y-6">
                {/* Team A & B Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TEAM A */}
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-500 pb-2">ทีม A</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท *</label>
                      <select
                        value={logStoryData.teamA.type}
                        onChange={(e) => setLogStoryData({ ...logStoryData, teamA: { ...logStoryData.teamA, type: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        required
                      >
                        <option value="">เลือกประเภท</option>
                        {TEAM_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ *</label>
                      <input
                        type="text"
                        value={logStoryData.teamA.name}
                        onChange={(e) => setLogStoryData({ ...logStoryData, teamA: { ...logStoryData.teamA, name: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        required
                        placeholder="กรอกชื่อทีม A"
                      />
                    </div>
                  </div>

                  {/* TEAM B */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-indigo-500 pb-2">ทีม B</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท *</label>
                      <select
                        value={logStoryData.teamB.type}
                        onChange={(e) => setLogStoryData({ ...logStoryData, teamB: { ...logStoryData.teamB, type: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                        required
                      >
                        <option value="">เลือกประเภท</option>
                        {TEAM_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ *</label>
                      <input
                        type="text"
                        value={logStoryData.teamB.name}
                        onChange={(e) => setLogStoryData({ ...logStoryData, teamB: { ...logStoryData.teamB, name: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                        required
                        placeholder="กรอกชื่อทีม B"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ *</label>
                  <select
                    value={logStoryData.status}
                    onChange={(e) => setLogStoryData({ ...logStoryData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    required
                  >
                    <option value="">เลือกสถานะ</option>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {/* Negotiation Section */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">----- การเจรจา -----</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ *</label>
                      <DatePicker
                        value={logStoryData.negotiation.date}
                        onChange={(date) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, date } })}
                        placeholder="เลือกวันที่การเจรจา"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">แพทย์ผู้สังเกตการณ์</label>
                      <input
                        type="text"
                        value={logStoryData.negotiation.observerMedic}
                        onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, observerMedic: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="กรอกชื่อแพทย์ผู้สังเกตการณ์"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">แพทย์ผู้อธิบาย</label>
                      <input
                        type="text"
                        value={logStoryData.negotiation.explainMedic}
                        onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, explainMedic: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="กรอกชื่อแพทย์ผู้อธิบาย"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">แพทย์ผู้ติดตาม</label>
                      <input
                        type="text"
                        value={logStoryData.negotiation.entourageMedic}
                        onChange={(e) => setLogStoryData({ ...logStoryData, negotiation: { ...logStoryData.negotiation, entourageMedic: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="กรอกชื่อแพทย์ผู้ติดตาม"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Work Section */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">------- งานภาคสนาม ---------</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                        <DatePicker
                          value={logStoryData.fieldWork.startDate}
                          onChange={(date) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, startDate: date } })}
                          placeholder="เลือกวันที่เริ่มต้น"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                        <DatePicker
                          value={logStoryData.fieldWork.endDate}
                          onChange={(date) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, endDate: date } })}
                          placeholder="เลือกวันที่สิ้นสุด"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">แพทย์ผู้สังเกตการณ์</label>
                      <input
                        type="text"
                        value={logStoryData.fieldWork.observerMedic}
                        onChange={(e) => setLogStoryData({ ...logStoryData, fieldWork: { ...logStoryData.fieldWork, observerMedic: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="กรอกชื่อแพทย์ผู้สังเกตการณ์"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">หัวหน้าสตอรี่ (3 คน / ไม่บังคับ)</label>
                      <div className="space-y-2">
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
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder={`หัวหน้าสตอรี่ ${index + 1} (ไม่บังคับ)`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">นักเรียนแพทย์สตอรี่ (3 คน / ไม่บังคับ)</label>
                      <div className="space-y-2">
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
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder={`นักเรียนแพทย์สตอรี่ ${index + 1} (ไม่บังคับ)`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowLogStoryModal(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    isLoading={logStoryLoading}
                  >
                    บันทึกสตอรี่
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
