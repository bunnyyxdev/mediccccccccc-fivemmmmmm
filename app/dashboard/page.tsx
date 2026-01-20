'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Package, 
  Clock, 
  Users, 
  Image, 
  FileText, 
  Calendar, 
  RefreshCw, 
  ArrowRight, 
  Zap,
  LayoutDashboard
} from 'lucide-react';

interface DashboardStats {
  leave: number;
  discipline: number;
  withdrawItems: number;
  timeTracking: number;
  pendingLeaves?: number;
  pendingDisciplines?: number;
  recentWithdraws?: number;
}

interface QueueStatus {
  isRunning: boolean;
  doctorCount: number;
  currentQueueNumber?: number;
  totalDoctors?: number;
  elapsedTime?: string;
  currentDoctorName?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    leave: 0,
    discipline: 0,
    withdrawItems: 0,
    timeTracking: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshInterval = 5000; 
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isRunning: false,
    doctorCount: 0,
  });

  const fetchStats = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      if (showLoading) setIsRefreshing(false);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/queue/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const status = response.data;

      if (status.isRunning && status.doctors && status.doctors.length > 0) {
        const currentDoctor = status.doctors[status.currentQueueIndex] || null;
        
        let elapsedTimeStr = '';
        if (status.startTime) {
          const startTime = new Date(status.startTime);
          const now = new Date();
          const elapsedMs = now.getTime() - startTime.getTime();
          const totalSeconds = Math.floor(elapsedMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          elapsedTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        setQueueStatus({
          isRunning: true,
          doctorCount: status.doctors.length,
          currentQueueNumber: (status.currentQueueIndex || 0) + 1,
          totalDoctors: status.doctors.length,
          elapsedTime: elapsedTimeStr,
          currentDoctorName: currentDoctor?.name || undefined,
        });
      } else {
        setQueueStatus({
          isRunning: false,
          doctorCount: 0,
          currentQueueNumber: undefined,
          totalDoctors: undefined,
          elapsedTime: undefined,
          currentDoctorName: undefined,
        });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch queue status:', error);
      }
      setQueueStatus({
        isRunning: false,
        doctorCount: 0,
      });
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchStats(true);
    fetchQueueStatus();
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
      fetchQueueStatus();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const queueInterval = setInterval(() => {
      fetchQueueStatus();
    }, 2000);
    return () => clearInterval(queueInterval);
  }, []);

  // Configuration for Cards
  const statCards = [
    {
      label: 'เบิกของในตู้',
      value: loading ? '...' : stats.withdrawItems.toLocaleString('th-TH'),
      icon: Package,
      color: 'blue',
      href: '/dashboard/withdraw-items',
      description: stats.recentWithdraws ? `${stats.recentWithdraws} รายการ 7 วันล่าสุด` : 'รายการทั้งหมด',
    },
    {
      label: 'ลงเวลาพี่เลี้ยง',
      value: loading ? '...' : stats.timeTracking.toLocaleString('th-TH'),
      icon: Clock,
      color: 'emerald',
      href: '/dashboard/time-tracking',
      description: 'บันทึกการลงเวลา',
    },
    {
      label: 'ระบบคิว',
      value: queueStatus.isRunning && queueStatus.currentDoctorName
        ? queueStatus.currentDoctorName
        : 'พร้อมใช้งาน',
      icon: Users,
      color: queueStatus.isRunning ? 'green' : 'purple',
      href: '/dashboard/queue',
      description: queueStatus.isRunning 
        ? `ลำดับที่ ${queueStatus.currentQueueNumber}/${queueStatus.totalDoctors} • ${queueStatus.elapsedTime}`
        : 'จัดการคิวหมอ',
      isActive: queueStatus.isRunning,
      isSpecial: true, // Mark as special card
    },
    {
      label: 'สตอรี่',
      value: '-',
      icon: Image,
      color: 'pink',
      href: '/dashboard/story',
      description: 'จัดการสตอรี่',
    },
    {
      label: 'การลา',
      value: loading ? '...' : stats.leave.toLocaleString('th-TH'),
      icon: Calendar,
      color: 'orange',
      href: '/dashboard/others/leave',
      description: stats.pendingLeaves ? `${stats.pendingLeaves} รอการอนุมัติ` : 'รายการทั้งหมด',
    },
    {
      label: 'โทษวินัย',
      value: loading ? '...' : stats.discipline.toLocaleString('th-TH'),
      icon: FileText,
      color: 'red',
      href: '/dashboard/discipline',
      description: stats.pendingDisciplines ? `${stats.pendingDisciplines} รอดำเนินการ` : 'รายการทั้งหมด',
    },
  ];

  // Helper function to get colors based on prop
  const getCardStyles = (color: string, isActive: boolean) => {
    const colors: any = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100', border: 'hover:border-blue-200', ring: 'focus:ring-blue-500' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100', border: 'hover:border-emerald-200', ring: 'focus:ring-emerald-500' },
      green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100', border: 'hover:border-green-200', ring: 'focus:ring-green-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100', border: 'hover:border-purple-200', ring: 'focus:ring-purple-500' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', icon: 'bg-pink-100', border: 'hover:border-pink-200', ring: 'focus:ring-pink-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100', border: 'hover:border-orange-200', ring: 'focus:ring-orange-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100', border: 'hover:border-red-200', ring: 'focus:ring-red-500' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold tracking-wider text-indigo-500 uppercase">System Overview</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                สวัสดี, {user?.name || 'Administrator'}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                จัดการข้อมูลและดูภาพรวมระบบทั้งหมดได้ที่นี่
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
               <div className="px-3 flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Last Update</span>
                  <span className="text-xs font-medium text-gray-700 tabular-nums">
                    {lastUpdated?.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
               </div>
               <button
                onClick={(e) => { e.preventDefault(); fetchStats(true); }}
                disabled={loading || isRefreshing}
                className="p-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Grid - Modern Bento Grid Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const styles = getCardStyles(stat.color, stat.isActive || false);
              
              return (
                <div
                  key={index}
                  onClick={() => router.push(stat.href)}
                  className={`
                    relative group cursor-pointer overflow-hidden
                    bg-white rounded-2xl p-6
                    border border-gray-100
                    shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)]
                    transition-all duration-300 hover:-translate-y-1
                    ${stat.isActive ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2.5 rounded-xl ${styles.icon} ${styles.text}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {stat.isActive && (
                           <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                      <h3 className={`text-2xl font-bold text-gray-900 tracking-tight ${stat.isSpecial && stat.isActive ? 'text-green-600' : ''}`}>
                        {stat.value}
                      </h3>
                    </div>
                    
                    {/* Decorative Icon Background */}
                    <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rotate-12`} />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                      {stat.description}
                    </span>
                    <div className={`p-1.5 rounded-full bg-gray-50 group-hover:bg-${stat.color}-50 transition-colors`}>
                      <ArrowRight className={`w-3.5 h-3.5 text-gray-400 group-hover:${styles.text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions (Shortcut Bar) */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              เมนูด่วน
            </h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
               <div className="flex flex-wrap gap-3">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    const styles = getCardStyles(stat.color, false);
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(stat.href)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          border border-transparent hover:border-gray-200
                          bg-gray-50 hover:bg-white
                          text-gray-600 hover:text-gray-900
                          transition-all duration-200 active:scale-95
                          flex-grow sm:flex-grow-0
                        `}
                      >
                        <Icon className={`w-4 h-4 ${styles.text}`} />
                        <span className="text-sm font-medium">{stat.label}</span>
                      </button>
                    )
                  })}
               </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
