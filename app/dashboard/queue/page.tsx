'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  ChevronRight, 
  ChevronLeft, 
  Edit, 
  Square, 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Clock, 
  User, 
  Users, 
  Activity, 
  Play,
  MoreVertical,
  Stethoscope
} from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  username: string;
  doctorRank?: string;
}

export default function QueuePage() {
  // Core state
  const [isRunning, setIsRunning] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [runnerName, setRunnerName] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunner, setIsRunner] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'doctor' | 'admin'>('doctor');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const localStartedRef = useRef<boolean>(false);
  const justUpdatedRef = useRef<boolean>(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [queueDoctors, setQueueDoctors] = useState<Doctor[]>([]);
  const [selectedRunnerName, setSelectedRunnerName] = useState<string>('');

  // Get user role from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.role === 'admin' || userData.role === 'doctor') {
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // Fetch doctors from database
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const doctorList = response.data.users.filter((user: any) => user.username !== 'administrator');
          setAllDoctors(doctorList);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch queue status (Live Update Logic - Keep existing logic)
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (justUpdatedRef.current) return;

        const response = await axios.get('/api/queue/status', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const status = response.data;
        
        let currentUserId: string | null = null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            currentUserId = userData._id || null;
          } catch (error) { console.error(error); }
        }
        
        if (status.isRunning && status.doctors && status.doctors.length > 0) {
          const isCurrentUserRunner = status.runnerId && currentUserId && status.runnerId.toString() === currentUserId.toString();
          const isLocalRunner = localStartedRef.current || isCurrentUserRunner;
          
          setIsRunning(true);
          setIsRunner(isLocalRunner);
          
          const newDoctors = status.doctors || [];
          const safeIndex = Math.max(0, Math.min(status.currentQueueIndex || 0, Math.max(0, newDoctors.length - 1)));
          setCurrentQueueIndex(safeIndex);
          
          setDoctors((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(newDoctors)) return newDoctors;
            return prev;
          });
          
          if (status.runnerName) setRunnerName((prev) => prev !== status.runnerName ? status.runnerName : prev);
          
          if (status.startTime) {
            const serverStartTime = new Date(status.startTime);
            setStartTime((prev) => {
              if (!prev || Math.abs(prev.getTime() - serverStartTime.getTime()) > 1000) return serverStartTime;
              return prev;
            });
          }
          
          if (status.elapsedTime !== undefined && !isLocalRunner) setElapsedTime(status.elapsedTime);
        } else {
          if (!localStartedRef.current) {
            setIsRunning(false);
            setIsRunner(false);
            setCurrentQueueIndex(0);
            setDoctors([]);
            setStartTime(null);
            setElapsedTime(0);
            setRunnerName('');
          }
        }
      } catch (error) { console.error('Failed to fetch queue status:', error); }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sync runner state (Logic - Keep existing)
  useEffect(() => {
    if (!isRunning || !isRunner || doctors.length === 0 || !runnerName) return;
    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await axios.post('/api/queue/status', {
            isRunning: true,
            currentQueueIndex,
            doctors,
            startTime: startTime?.toISOString(),
            runnerName,
          }, { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error: any) {
        if (error.response?.status === 403) {
          setIsRunner(false);
          localStartedRef.current = false;
        }
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [isRunning, isRunner, currentQueueIndex, doctors, startTime, runnerName]);

  // Elapsed Time Timer
  useEffect(() => {
    if (isRunning && startTime && isRunner) {
      const calculateElapsed = () => {
        const now = new Date();
        setElapsedTime(now.getTime() - startTime.getTime());
      };
      calculateElapsed();
      intervalRef.current = setInterval(calculateElapsed, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isRunning) setElapsedTime(0);
    }
  }, [isRunning, startTime, isRunner]);

  // Helper Functions
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (): string => {
    if (!startTime) return '--:-- - --:--';
    const start = startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isRunning) {
      const now = new Date();
      const end = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${start} - ${end}`;
    }
    return `${start} - --:--`;
  };

  // Handlers (Keep logic identical)
  const handleStart = async () => {
    if (isRunning || doctors.length < 4 || !runnerName.trim()) {
      if (doctors.length < 4) toast.error('กรุณาแก้ไขคิวและเลือกหมออย่างน้อย 4 คน');
      else if (!runnerName.trim()) toast.error('กรุณาใส่ชื่อผู้รัน');
      return;
    }
    try {
      const startTimeNow = new Date();
      const token = localStorage.getItem('token');
      justUpdatedRef.current = true;
      setIsRunning(true);
      setIsRunner(true);
      localStartedRef.current = true;
      setCurrentQueueIndex(0);
      setStartTime(startTimeNow);
      setElapsedTime(0);

      if (token) {
        await axios.post('/api/queue/status', {
          isRunning: true, currentQueueIndex: 0, doctors, startTime: startTimeNow.toISOString(), runnerName,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setTimeout(() => { justUpdatedRef.current = false; }, 1000);
      toast.success('✅ เริ่มรันคิวแล้ว');
    } catch (error: any) {
      setIsRunning(false); setIsRunner(false); localStartedRef.current = false;
      toast.error('ไม่สามารถเริ่มรันคิวได้');
    }
  };

  const handleStop = async () => {
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) { toast.error('ไม่มีสิทธิ์จบคิว'); return; }
    if (!isRunning) return;

    try {
      const totalTime = formatTime(elapsedTime);
      const token = localStorage.getItem('token');
      justUpdatedRef.current = true;
      setIsRunning(false); setIsRunner(false); localStartedRef.current = false;
      setCurrentQueueIndex(0); setStartTime(null); setElapsedTime(0);

      if (token) {
        await axios.post('/api/queue/status', {
          isRunning: false, currentQueueIndex: 0, doctors: [], runnerName: '',
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setTimeout(() => { justUpdatedRef.current = false; }, 1000);
      toast.success(`สิ้นสุดรันคิวแล้ว (รวมเวลา: ${totalTime})`);
    } catch (error) { toast.error('ไม่สามารถหยุดรันคิวได้'); }
  };

  const handleNext = () => {
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) return;
    if (!isRunning || doctors.length === 0) return;
    const safeIndex = Math.max(0, Math.min(currentQueueIndex, doctors.length - 1));
    const newIndex = safeIndex < doctors.length - 1 ? safeIndex + 1 : 0;
    setCurrentQueueIndex(newIndex);
  };

  const handlePrevious = () => {
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) return;
    if (!isRunning || doctors.length === 0) return;
    const safeIndex = Math.max(0, Math.min(currentQueueIndex, doctors.length - 1));
    const newIndex = safeIndex > 0 ? safeIndex - 1 : doctors.length - 1;
    setCurrentQueueIndex(newIndex);
  };

  const handleEdit = () => {
    const isAdmin = userRole === 'admin';
    if (isRunning && !isRunner && !isAdmin) { toast.error('ไม่มีสิทธิ์แก้ไขคิว'); return; }
    setQueueDoctors([...doctors]);
    setSelectedRunnerName(runnerName);
    setIsEditModalOpen(true);
  };

  const handleAddDoctor = (doctor: Doctor) => {
    if (!queueDoctors.find((d) => d._id === doctor._id)) setQueueDoctors([...queueDoctors, doctor]);
  };
  const handleRemoveDoctor = (doctorId: string) => setQueueDoctors(queueDoctors.filter((d) => d._id !== doctorId));
  const handleMoveUp = (index: number) => {
    if (index > 0) { const newQ = [...queueDoctors]; [newQ[index - 1], newQ[index]] = [newQ[index], newQ[index - 1]]; setQueueDoctors(newQ); }
  };
  const handleMoveDown = (index: number) => {
    if (index < queueDoctors.length - 1) { const newQ = [...queueDoctors]; [newQ[index], newQ[index + 1]] = [newQ[index + 1], newQ[index]]; setQueueDoctors(newQ); }
  };
  const handleSaveQueue = () => {
    if (queueDoctors.length < 4) { toast.error('กรุณาเพิ่มหมออย่างน้อย 4 คน'); return; }
    if (!selectedRunnerName || selectedRunnerName.trim() === '') { toast.error('กรุณาใส่ชื่อผู้รัน'); return; }
    const safeIndex = isRunning ? Math.max(0, Math.min(currentQueueIndex, queueDoctors.length - 1)) : 0;
    setDoctors([...queueDoctors]);
    setRunnerName(selectedRunnerName.trim());
    setCurrentQueueIndex(safeIndex);
    setIsEditModalOpen(false);
    toast.success('บันทึกการแก้ไขคิวเรียบร้อย');
  };

  const availableDoctors = allDoctors.filter((doctor) => !queueDoctors.find((qd) => qd._id === doctor._id));
  const safeCurrentIndex = doctors.length > 0 ? Math.max(0, Math.min(currentQueueIndex, doctors.length - 1)) : 0;
  const currentDoctor = doctors.length > 0 && safeCurrentIndex < doctors.length ? doctors[safeCurrentIndex] : null;

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gray-50/50">
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 to-transparent -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Activity className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wider uppercase">Live Queue System</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ระบบรันคิวหมอ</h1>
              <p className="text-gray-500 mt-1">จัดการลำดับและเวลาการปฏิบัติงานของแพทย์</p>
            </div>
            
            {isRunning && (
               <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="text-sm font-semibold text-green-700">LIVE</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200"></div>
                  <div className="text-sm font-mono font-medium text-gray-600">
                    {formatTime(elapsedTime)}
                  </div>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Col: Info Cards */}
            <div className="lg:col-span-1 space-y-4">
               {/* Runner Card */}
               <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <User className="w-5 h-5" />
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">ผู้รัน (Runner)</h3>
                  </div>
                  <p className={`text-xl font-bold truncate ${runnerName ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                     {runnerName || 'ยังไม่ระบุ'}
                  </p>
               </div>

               {/* Time Card */}
               <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Clock className="w-5 h-5" />
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">ช่วงเวลา (Time)</h3>
                  </div>
                  <p className="text-xl font-bold text-gray-900 font-mono">
                     {formatTimeRange()}
                  </p>
               </div>

               {/* Queue Stats */}
               <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Users className="w-5 h-5" />
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">จำนวนหมอ</h3>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                     {doctors.length} <span className="text-sm font-normal text-gray-500">คนในคิว</span>
                  </p>
               </div>
            </div>

            {/* Right Col: Active Queue Display */}
            <div className="lg:col-span-2">
               {isRunning && currentDoctor ? (
                  <div className="h-full bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-center items-center text-center">
                     {/* Decorative Circles */}
                     <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                     <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
                     
                     <div className="relative z-10">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium mb-6">
                           คิวปัจจุบัน (ลำดับที่ {safeCurrentIndex + 1}/{doctors.length})
                        </span>
                        
                        <h2 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
                           {currentDoctor.name}
                        </h2>
                        
                        {currentDoctor.doctorRank && (
                           <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-lg font-medium backdrop-blur-sm">
                              <Stethoscope className="w-5 h-5" />
                              {currentDoctor.doctorRank}
                           </div>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className={`h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all ${
                     doctors.length < 4 
                        ? 'border-yellow-300 bg-yellow-50 text-yellow-800' 
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                     {doctors.length < 4 ? (
                        <>
                           <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                              <span className="text-3xl">⚠️</span>
                           </div>
                           <h3 className="text-lg font-bold mb-2">จำนวนหมอยังไม่ครบ</h3>
                           <p className="max-w-xs mx-auto text-sm opacity-90">
                              กรุณาเพิ่มหมออย่างน้อย 4 คน และตั้งชื่อผู้รันก่อนเริ่มใช้งาน
                           </p>
                        </>
                     ) : (
                        <>
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                              <Play className="w-8 h-8 ml-1" />
                           </div>
                           <h3 className="text-lg font-bold text-gray-500 mb-2">ระบบพร้อมใช้งาน</h3>
                           <p className="max-w-xs mx-auto text-sm text-gray-400">
                              กดปุ่ม "เริ่มรันคิว" ด้านล่างเพื่อเริ่มต้น
                           </p>
                        </>
                     )}
                  </div>
               )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-8 sticky bottom-6 z-20">
             <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Navigation */}
                <div className="flex items-center gap-2">
                   <button
                      onClick={handlePrevious}
                      disabled={!isRunning || (!isRunner && userRole !== 'admin') || doctors.length === 0}
                      className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                      <ChevronLeft className="w-6 h-6" />
                   </button>
                   <div className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-500 border border-gray-100 min-w-[100px] text-center">
                      {isRunning ? `คิวที่ ${safeCurrentIndex + 1}` : '-'}
                   </div>
                   <button
                      onClick={handleNext}
                      disabled={!isRunning || (!isRunner && userRole !== 'admin') || doctors.length === 0}
                      className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                   >
                      <ChevronRight className="w-6 h-6" />
                   </button>
                </div>

                {/* Edit & Main Action */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <button
                      onClick={handleEdit}
                      disabled={isRunning && !isRunner && userRole !== 'admin'}
                      className="flex-1 md:flex-none px-5 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                   >
                      <Edit className="w-4 h-4" />
                      แก้ไขคิว
                   </button>

                   {!isRunning ? (
                      <button
                         onClick={handleStart}
                         disabled={doctors.length < 4 || !runnerName || runnerName.trim() === ''}
                         className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                         <Play className="w-5 h-5 fill-current" />
                         เริ่มรันคิว
                      </button>
                   ) : (
                      <button
                         onClick={handleStop}
                         disabled={!isRunner && userRole !== 'admin'}
                         className="flex-1 md:flex-none px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                         <Square className="w-5 h-5 fill-current" />
                         {userRole === 'admin' && !isRunner ? 'บังคับจบคิว' : 'สิ้นสุดคิว'}
                      </button>
                   )}
                </div>
             </div>
          </div>

          {/* Queue List (Visual) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               <MoreVertical className="w-5 h-5 text-gray-400" />
               ลำดับคิวทั้งหมด
             </h3>
             
             {doctors.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                   ยังไม่มีรายชื่อหมอ
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {doctors.map((doctor, index) => {
                      const isCurrent = isRunning && index === safeCurrentIndex;
                      return (
                         <div 
                           key={doctor._id}
                           className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${
                              isCurrent 
                                 ? 'bg-indigo-50 border-indigo-200 shadow-md scale-[1.02]' 
                                 : 'bg-white border-gray-100 hover:border-gray-200'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                               isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                               {index + 1}
                            </div>
                            <div>
                               <p className={`font-semibold ${isCurrent ? 'text-indigo-900' : 'text-gray-900'}`}>
                                  {doctor.name}
                               </p>
                               {doctor.doctorRank && (
                                  <span className="text-xs text-gray-500">{doctor.doctorRank}</span>
                               )}
                            </div>
                            {isCurrent && (
                               <div className="ml-auto">
                                  <span className="relative flex h-2 w-2">
                                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                     <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                  </span>
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Modern Light Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
               <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Edit className="w-5 h-5 text-indigo-600" />
                     จัดการคิวและผู้รัน
                  </h2>
               </div>
               <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
               {/* Runner Input */}
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อผู้รัน (Runner Name) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={selectedRunnerName}
                    onChange={(e) => setSelectedRunnerName(e.target.value)}
                    placeholder="กรอกชื่อผู้รับผิดชอบการรันคิว..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
               </div>

               {/* Queue Management */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Queue List */}
                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">ลำดับในคิว</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${queueDoctors.length >= 4 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                           {queueDoctors.length}/4 คน
                        </span>
                     </div>
                     
                     <div className="bg-white rounded-xl border border-gray-200 min-h-[300px] max-h-[400px] overflow-y-auto p-2 space-y-2 shadow-inner">
                        {queueDoctors.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                              <p className="text-sm">ยังไม่มีหมอในคิว</p>
                              <p className="text-xs mt-1">เลือกจากรายการทางขวา</p>
                           </div>
                        ) : (
                           queueDoctors.map((doctor, index) => (
                              <div key={doctor._id} className="group flex items-center justify-between p-2.5 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all shadow-sm">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                                       {index + 1}
                                    </span>
                                    <div className="truncate">
                                       <p className="text-sm font-medium text-gray-900 truncate">{doctor.name}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30">
                                       <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleMoveDown(index)} disabled={index === queueDoctors.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30">
                                       <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleRemoveDoctor(doctor._id)} className="p-1 text-gray-400 hover:text-red-500">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

                  {/* Available Doctors List */}
                  <div className="space-y-3">
                     <h3 className="font-semibold text-gray-700">เลือกหมอเพิ่ม</h3>
                     <div className="bg-white rounded-xl border border-gray-200 min-h-[300px] max-h-[400px] overflow-y-auto p-2 space-y-2 shadow-inner">
                        {availableDoctors.length === 0 ? (
                           <div className="text-center py-10 text-gray-400 text-sm">
                              ไม่มีรายชื่อหมอเพิ่มเติม
                           </div>
                        ) : (
                           availableDoctors.map((doctor) => (
                              <div key={doctor._id} className="flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer group" onClick={() => handleAddDoctor(doctor)}>
                                 <div>
                                    <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                                    {doctor.doctorRank && <p className="text-xs text-gray-500">{doctor.doctorRank}</p>}
                                 </div>
                                 <button className="p-1 bg-gray-100 text-gray-400 group-hover:bg-indigo-500 group-hover:text-white rounded-md transition-all">
                                    <Plus className="w-4 h-4" />
                                 </button>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
               <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                  ยกเลิก
               </button>
               <button onClick={handleSaveQueue} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  บันทึกข้อมูล
               </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
