'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  Users, 
  Package, 
  Clock, 
  Ban, 
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  summary: {
    totalLeaves: number;
    totalDisciplines: number;
    totalWithdraws: number;
    totalTimeTracking: number;
    totalBlacklist: number;
    totalUsers: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  breakdowns: {
    leaveByStatus: Record<string, number>;
    disciplineByStatus: Record<string, number>;
    withdrawByStatus: Record<string, number>;
    blacklistByPaymentStatus: Record<string, number>;
  };
  trends: {
    monthly: Array<{
      month: string;
      leaves: number;
      disciplines: number;
      withdraws: number;
      timeTracking: number;
      blacklist: number;
    }>;
  };
  topPerformers: {
    timeTracking: Array<{ doctorName: string; count: number }>;
    leave: Array<{ doctorName: string; count: number }>;
  };
  recentActivity: {
    leaves: any[];
    disciplines: any[];
    withdraws: any[];
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'1month' | '3months' | '6months' | '1year' | 'all'>('6months');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      params.append('period', period);
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const response = await axios.get(`/api/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const csv = [
      ['รายงานสถิติ', 'Preview City Medic System'],
      ['ช่วงเวลา', `${new Date(data.summary.dateRange.start).toLocaleDateString('th-TH')} - ${new Date(data.summary.dateRange.end).toLocaleDateString('th-TH')}`],
      [],
      ['สรุปยอดรวม'],
      ['การลา', data.summary.totalLeaves],
      ['โทษวินัย', data.summary.totalDisciplines],
      ['เบิกของ', data.summary.totalWithdraws],
      ['ลงเวลา', data.summary.totalTimeTracking],
      ['แบล็คลิส', data.summary.totalBlacklist],
      ['ผู้ใช้ทั้งหมด', data.summary.totalUsers],
      [],
      ['รายละเอียดตามสถานะ'],
      ['การลา - ตามสถานะ'],
      ...Object.entries(data.breakdowns.leaveByStatus).map(([status, count]) => [status, count]),
      [],
      ['โทษวินัย - ตามสถานะ'],
      ...Object.entries(data.breakdowns.disciplineByStatus).map(([status, count]) => [status, count]),
      [],
      ['แนวโน้มรายเดือน'],
      ['เดือน', 'การลา', 'โทษวินัย', 'เบิกของ', 'ลงเวลา', 'แบล็คลิส'],
      ...data.trends.monthly.map(m => [m.month, m.leaves, m.disciplines, m.withdraws, m.timeTracking, m.blacklist]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('ส่งออกข้อมูลเป็น CSV สำเร็จ');
  };

  if (loading && !data) {
    return (
      <Layout requireAuth={true} requireRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout requireAuth={true} requireRole="admin">
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูล</p>
        </div>
      </Layout>
    );
  }

  // Chart component - Simple bar chart using CSS
  const BarChart = ({ data, labels, colors, title }: { data: number[]; labels: string[]; colors: string[]; title: string }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((value, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-gray-600 truncate">{labels[index]}</div>
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                        className={`h-full ${colors[index % colors.length]} transition-smooth flex items-center justify-end pr-2`}
                    style={{ width: `${(value / max) * 100}%` }}
                  >
                    {value > 0 && <span className="text-xs font-medium text-white">{value}</span>}
                  </div>
                </div>
              </div>
              <div className="w-12 text-sm font-semibold text-gray-900 text-right">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Pie chart representation using percentages
  const PieChartDisplay = ({ data, title }: { data: Record<string, number>; title: string }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const entries = Object.entries(data).filter(([_, val]) => val > 0);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {total === 0 ? (
          <p className="text-gray-500 text-center py-8">ไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {entries.map(([label, value], index) => {
              const percentage = (value / total) * 100;
              return (
                <div key={label} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${colors[index % colors.length]} rounded-full`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index % colors.length]} transition-smooth`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout requireAuth={true} requireRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                📊 Advanced Reports & Analytics
              </h1>
              <p className="text-sm text-gray-500">สถิติและรายงานแบบละเอียดสำหรับระบบ Preview City</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-smooth hover-lift button-press disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-smooth hover-lift button-press flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออก CSV</span>
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">ช่วงเวลา:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1month">1 เดือนล่าสุด</option>
              <option value="3months">3 เดือนล่าสุด</option>
              <option value="6months">6 เดือนล่าสุด</option>
              <option value="1year">1 ปีล่าสุด</option>
              <option value="all">ทั้งหมด</option>
            </select>
            {dateRange && (
              <span className="text-sm text-gray-500">
                {new Date(dateRange.start).toLocaleDateString('th-TH')} - {new Date(dateRange.end).toLocaleDateString('th-TH')}
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-blue-100 text-sm mb-1">การลา</p>
            <p className="text-3xl font-bold">{data.summary.totalLeaves.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-red-100 text-sm mb-1">โทษวินัย</p>
            <p className="text-3xl font-bold">{data.summary.totalDisciplines.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-green-100 text-sm mb-1">เบิกของ</p>
            <p className="text-3xl font-bold">{data.summary.totalWithdraws.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-purple-100 text-sm mb-1">ลงเวลา</p>
            <p className="text-3xl font-bold">{data.summary.totalTimeTracking.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Ban className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-orange-100 text-sm mb-1">แบล็คลิส</p>
            <p className="text-3xl font-bold">{data.summary.totalBlacklist.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-indigo-100 text-sm mb-1">ผู้ใช้ทั้งหมด</p>
            <p className="text-3xl font-bold">{data.summary.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trends Chart */}
          <div className="lg:col-span-2">
            <BarChart
              data={data.trends.monthly.map(m => m.leaves + m.disciplines + m.withdraws + m.timeTracking)}
              labels={data.trends.monthly.map(m => m.month)}
              colors={['bg-blue-500']}
              title="📈 แนวโน้มรวมทั้งหมด (รายเดือน)"
            />
          </div>

          {/* Status Breakdowns */}
          <PieChartDisplay data={data.breakdowns.leaveByStatus} title="🥧 การลา - ตามสถานะ" />
          <PieChartDisplay data={data.breakdowns.disciplineByStatus} title="🥧 โทษวินัย - ตามสถานะ" />
          <PieChartDisplay data={data.breakdowns.withdrawByStatus} title="🥧 เบิกของ - ตามสถานะ" />
          <PieChartDisplay data={data.breakdowns.blacklistByPaymentStatus} title="🥧 แบล็คลิส - สถานะการชำระเงิน" />
        </div>

        {/* Detailed Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BarChart
            data={data.trends.monthly.map(m => m.leaves)}
            labels={data.trends.monthly.map(m => m.month)}
            colors={['bg-blue-500']}
            title="📊 แนวโน้มการลา (รายเดือน)"
          />
          <BarChart
            data={data.trends.monthly.map(m => m.disciplines)}
            labels={data.trends.monthly.map(m => m.month)}
            colors={['bg-red-500']}
            title="📊 แนวโน้มโทษวินัย (รายเดือน)"
          />
          <BarChart
            data={data.trends.monthly.map(m => m.withdraws)}
            labels={data.trends.monthly.map(m => m.month)}
            colors={['bg-green-500']}
            title="📊 แนวโน้มเบิกของ (รายเดือน)"
          />
          <BarChart
            data={data.trends.monthly.map(m => m.timeTracking)}
            labels={data.trends.monthly.map(m => m.month)}
            colors={['bg-purple-500']}
            title="📊 แนวโน้มลงเวลา (รายเดือน)"
          />
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ หมอที่ลงเวลาบ่อยที่สุด (30 วันล่าสุด)</h3>
            <div className="space-y-3">
              {data.topPerformers.timeTracking.length === 0 ? (
                <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
              ) : (
                data.topPerformers.timeTracking.map((doctor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{doctor.doctorName}</span>
                    </div>
                    <span className="text-blue-600 font-semibold">{doctor.count} ครั้ง</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ หมอที่ลาเยอะที่สุด</h3>
            <div className="space-y-3">
              {data.topPerformers.leave.length === 0 ? (
                <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
              ) : (
                data.topPerformers.leave.map((doctor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{doctor.doctorName}</span>
                    </div>
                    <span className="text-orange-600 font-semibold">{doctor.count} ครั้ง</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 สรุปสถิติ</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">อัตราการลาเฉลี่ย/เดือน</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.trends.monthly.length > 0
                  ? (data.summary.totalLeaves / data.trends.monthly.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">อัตราโทษวินัยเฉลี่ย/เดือน</p>
              <p className="text-2xl font-bold text-red-600">
                {data.trends.monthly.length > 0
                  ? (data.summary.totalDisciplines / data.trends.monthly.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">อัตราเบิกของเฉลี่ย/เดือน</p>
              <p className="text-2xl font-bold text-green-600">
                {data.trends.monthly.length > 0
                  ? (data.summary.totalWithdraws / data.trends.monthly.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">อัตราลงเวลาเฉลี่ย/เดือน</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.trends.monthly.length > 0
                  ? (data.summary.totalTimeTracking / data.trends.monthly.length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
