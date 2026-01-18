'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ChevronRight, ChevronLeft, Edit, Square, X, Plus, Trash2, ArrowUp, ArrowDown, Save, Clock } from 'lucide-react';

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
  const [isRunner, setIsRunner] = useState<boolean>(false); // Track if current user is the runner
  const [userRole, setUserRole] = useState<'doctor' | 'admin'>('doctor'); // Track current user's role
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const localStartedRef = useRef<boolean>(false); // Track if we started the queue locally
  const justUpdatedRef = useRef<boolean>(false); // Track if we just updated state locally

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

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [queueDoctors, setQueueDoctors] = useState<Doctor[]>([]);
  const [selectedRunnerName, setSelectedRunnerName] = useState<string>('');

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

  // Fetch queue status from temporary database every 2 seconds (live screen for all users)
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Skip fetch briefly if we just updated state locally (wait for server to confirm)
        if (justUpdatedRef.current) {
          return; // Don't skip for too long, just skip this one fetch
        }

        const response = await axios.get('/api/queue/status', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const status = response.data;
        
        // Get current user ID from localStorage user object
        let currentUserId: string | null = null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            currentUserId = userData._id || null;
          } catch (error) {
            console.error('Failed to parse user data:', error);
          }
        }
        
        // If queue is running on server, sync state (live screen)
        if (status.isRunning && status.doctors && status.doctors.length > 0) {
          // Check if current user is the runner by comparing runnerId from server with current userId
          const isCurrentUserRunner = status.runnerId && currentUserId && 
            status.runnerId.toString() === currentUserId.toString();
          
          // If we just started locally, also mark as runner
          const isLocalRunner = localStartedRef.current || isCurrentUserRunner;
          
          // Sync all state from server (live update)
          setIsRunning(true);
          setIsRunner(isLocalRunner);
          setCurrentQueueIndex(status.currentQueueIndex || 0);
          
          const newDoctors = status.doctors || [];
          setDoctors((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(newDoctors)) {
              return newDoctors;
            }
            return prev;
          });
          
          if (status.runnerName) {
            setRunnerName((prev) => prev !== status.runnerName ? status.runnerName : prev);
          }
          
          if (status.startTime) {
            const serverStartTime = new Date(status.startTime);
            setStartTime((prev) => {
              if (!prev || Math.abs(prev.getTime() - serverStartTime.getTime()) > 1000) {
                return serverStartTime;
              }
              return prev;
            });
          }
        } else {
          // Queue stopped on server - reset local state only if we're not the runner
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
      } catch (error) {
        console.error('Failed to fetch queue status:', error);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 2000); // Live update every 2 seconds
    
    return () => clearInterval(interval);
  }, []); // Always run - live screen for all users

  // Sync to temporary database when state changes (only if we're the runner)
  useEffect(() => {
    // Only sync if we're the runner (not viewer)
    if (!isRunning || !isRunner || doctors.length === 0 || !runnerName) return;

    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await axios.post(
          '/api/queue/status',
          {
            isRunning: true,
            currentQueueIndex,
            doctors,
            startTime: startTime?.toISOString(),
            elapsedTime,
            runnerName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error: any) {
        console.error('Failed to sync queue status:', error);
        // If unauthorized, reset runner status
        if (error.response?.status === 403) {
          setIsRunner(false);
          localStartedRef.current = false;
        }
      }
    }, 300); // Debounce with transition delay

    return () => clearTimeout(timeoutId);
  }, [isRunning, isRunner, currentQueueIndex, doctors, startTime, runnerName]);

  // Calculate elapsed time with transition effect
  useEffect(() => {
    if (isRunning && startTime) {
      const calculateElapsed = () => {
        const now = new Date();
        const elapsed = now.getTime() - startTime.getTime();
        setElapsedTime(elapsed);
      };

      calculateElapsed();
      intervalRef.current = setInterval(calculateElapsed, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedTime(0);
    }
  }, [isRunning, startTime]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (): string => {
    if (!startTime) return '00:00 - 00:00';
    const start = startTime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    if (isRunning) {
      const now = new Date();
      const end = now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${start} - ${end}`;
    }
    return `${start} - --:--`;
  };

  const handleStart = async () => {
    if (isRunning || doctors.length < 4 || !runnerName.trim()) {
      if (doctors.length < 4) {
        toast.error('กรุณาแก้ไขคิวและเลือกหมออย่างน้อย 4 คน');
      } else if (!runnerName.trim()) {
        toast.error('กรุณาใส่ชื่อผู้รัน');
      }
      return;
    }

    try {
      const startTimeNow = new Date();
      const token = localStorage.getItem('token');

      // Prevent fetchQueueStatus from overriding during update
      justUpdatedRef.current = true;

      // Update local state immediately (UI updates right away)
      setIsRunning(true);
      setIsRunner(true); // Mark as runner
      localStartedRef.current = true; // Track that we started the queue
      setCurrentQueueIndex(0);
      setStartTime(startTimeNow);
      setElapsedTime(0);

      // Sync to temporary database
      if (token) {
        await axios.post(
          '/api/queue/status',
          {
            isRunning: true,
            currentQueueIndex: 0,
            doctors,
            startTime: startTimeNow.toISOString(),
            elapsedTime: 0,
            runnerName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Clear flag after sync completes
      setTimeout(() => {
        justUpdatedRef.current = false;
      }, 1000);

      toast.success('✅ เริ่มรันคิวแล้ว');
    } catch (error: any) {
      console.error('Failed to start queue:', error);
      setIsRunning(false);
      setIsRunner(false);
      localStartedRef.current = false;
      
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.error || 'คุณไม่มีสิทธิ์เริ่มรันคิว');
      } else {
        toast.error('ไม่สามารถเริ่มรันคิวได้');
      }
    }
  };

  const handleStop = async () => {
    // Only the person who started the queue can stop it, OR admin can force stop
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) {
      toast.error('เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถจบคิวได้');
      return;
    }

    if (!isRunning) {
      toast.error('คิวไม่ได้กำลังรันอยู่');
      return;
    }

    try {
      const totalTime = formatTime(elapsedTime);
      const token = localStorage.getItem('token');

      // Prevent fetchQueueStatus from overriding during update
      justUpdatedRef.current = true;

      // Update local state immediately (UI updates right away)
      setIsRunning(false);
      setIsRunner(false);
      localStartedRef.current = false; // Clear runner flag
      setCurrentQueueIndex(0);
      setStartTime(null);
      setElapsedTime(0);

      // Delete from temporary database
      if (token) {
        await axios.post(
          '/api/queue/status',
          {
            isRunning: false,
            currentQueueIndex: 0,
            doctors: [],
            elapsedTime: 0,
            runnerName: '',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Clear flag after sync completes
      setTimeout(() => {
        justUpdatedRef.current = false;
      }, 1000);

      toast.success(`สิ้นสุดรันคิวแล้ว (รวมเวลา: ${totalTime})`);
    } catch (error: any) {
      console.error('Failed to stop queue:', error);
      
      // Revert local state on error
      setIsRunning(true);
      setIsRunner(true);
      localStartedRef.current = true;
      
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.error || 'เฉพาะผู้ที่เริ่มรันคิวเท่านั้นที่สามารถจบคิวได้');
      } else {
        toast.error('ไม่สามารถหยุดรันคิวได้');
      }
    }
  };

  const handleNext = () => {
    // Only the person who started the queue can control navigation, OR admin
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) {
      toast.error('เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถควบคุมคิวได้');
      return;
    }

    if (!isRunning || doctors.length === 0) return;
    const newIndex = currentQueueIndex < doctors.length - 1 ? currentQueueIndex + 1 : 0;
    setCurrentQueueIndex(newIndex);
  };

  const handlePrevious = () => {
    // Only the person who started the queue can control navigation, OR admin
    const isAdmin = userRole === 'admin';
    if (!isRunner && !isAdmin) {
      toast.error('เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถควบคุมคิวได้');
      return;
    }

    if (!isRunning || doctors.length === 0) return;
    const newIndex = currentQueueIndex > 0 ? currentQueueIndex - 1 : doctors.length - 1;
    setCurrentQueueIndex(newIndex);
  };

  const handleEdit = () => {
    // Only the person who started the queue can edit it (if queue is running), OR admin
    const isAdmin = userRole === 'admin';
    if (isRunning && !isRunner && !isAdmin) {
      toast.error('เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขคิวได้');
      return;
    }

    setQueueDoctors([...doctors]);
    setSelectedRunnerName(runnerName);
    setIsEditModalOpen(true);
  };

  const handleAddDoctor = (doctor: Doctor) => {
    if (!queueDoctors.find((d) => d._id === doctor._id)) {
      setQueueDoctors([...queueDoctors, doctor]);
    }
  };

  const handleRemoveDoctor = (doctorId: string) => {
    setQueueDoctors(queueDoctors.filter((d) => d._id !== doctorId));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newQueue = [...queueDoctors];
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      setQueueDoctors(newQueue);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < queueDoctors.length - 1) {
      const newQueue = [...queueDoctors];
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      setQueueDoctors(newQueue);
    }
  };

  const handleSaveQueue = () => {
    if (queueDoctors.length < 4) {
      toast.error('กรุณาเพิ่มหมออย่างน้อย 4 คน');
      return;
    }
    if (!selectedRunnerName || selectedRunnerName.trim() === '') {
      toast.error('กรุณาใส่ชื่อผู้รัน');
      return;
    }
    setDoctors([...queueDoctors]);
    setRunnerName(selectedRunnerName.trim());
    if (isRunning && currentQueueIndex >= queueDoctors.length) {
      setCurrentQueueIndex(0);
    }
    setIsEditModalOpen(false);
    toast.success('บันทึกการแก้ไขคิวเรียบร้อย');
  };

  const availableDoctors = allDoctors.filter((doctor) => !queueDoctors.find((qd) => qd._id === doctor._id));
  const currentDoctor = doctors[currentQueueIndex] || null;

  return (
    <Layout requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6 w-full">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6 transition-all duration-300">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                🔄 ระบบรันคิวหมอ
              </h1>
            </div>
          </div>

          {/* Info Cards */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              {/* ผู้รัน */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">👤 ผู้รัน</label>
                <div className="text-blue-600 font-bold text-lg truncate">
                  {runnerName || <span className="text-gray-400 text-sm">กรุณาแก้ไขคิวเพื่อตั้งชื่อผู้รัน</span>}
                </div>
              </div>

              {/* เวลา */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">🕐 เวลา</label>
                <div className="text-blue-600 font-bold text-lg">{formatTimeRange()}</div>
              </div>
            </div>
          </div>

          {/* Elapsed Time */}
          {isRunning && (
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md border border-blue-600 p-4 max-w-md w-full transition-all duration-300">
                <label className="block text-xs font-semibold text-blue-100 mb-2 uppercase tracking-wide">⏱️ รวมเวลารันคิว</label>
                <div className="text-white font-bold text-xl text-center">{formatTime(elapsedTime)}</div>
              </div>
            </div>
          )}

          {/* Current Queue */}
          {isRunning && currentDoctor && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg border-2 border-blue-600 p-6 mb-6 transform transition-all duration-300 hover:scale-[1.02] animate-fade-in">
              <label className="block text-xs font-semibold text-blue-100 mb-3 uppercase tracking-wide">🔄 คิวปัจจุบัน</label>
              <div className="text-center">
                <div className="text-white text-3xl font-bold mb-2">{currentDoctor.name}</div>
                {currentDoctor.doctorRank && (
                  <div className="text-blue-100 text-base mb-3 inline-block bg-blue-400/30 px-3 py-1 rounded-full">
                    {currentDoctor.doctorRank}
                  </div>
                )}
                <div className="text-blue-100 text-sm">
                  คิวที่ {currentQueueIndex + 1} / {doctors.length}
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {!isRunning && doctors.length < 4 && (
            <div
              className={`rounded-xl shadow-md border-2 p-4 mb-6 transition-all duration-300 ${
                doctors.length === 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-orange-50 border-orange-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`text-2xl ${doctors.length === 0 ? 'text-yellow-600' : 'text-orange-600'}`}>⚠️</span>
                <p className={`text-sm font-medium ${doctors.length === 0 ? 'text-yellow-800' : 'text-orange-800'}`}>
                  {doctors.length === 0
                    ? 'กรุณากดปุ่ม "แก้ไขคิว" เพื่อเพิ่มหมออย่างน้อย 4 คนและตั้งชื่อผู้รัน'
                    : `กรุณาเพิ่มหมออีก ${4 - doctors.length} คน (ต้องมีอย่างน้อย 4 คน)`}
                </p>
              </div>
            </div>
          )}

          {/* Doctors List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">📋 รายชื่อหมอ</label>
              {doctors.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{doctors.length} คน</span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[150px] max-h-[300px] overflow-y-auto">
              {doctors.length === 0 ? (
                <div className="text-gray-400 text-center py-12 text-sm">ยังไม่มีรายชื่อหมอ กรุณากดปุ่ม "แก้ไขคิว" เพื่อเพิ่มหมอ</div>
              ) : (
                <div className="space-y-2">
                  {doctors.map((doctor, index) => (
                    <div
                      key={doctor._id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                        index === currentQueueIndex
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-500 shadow-md transform scale-[1.02]'
                          : 'bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold text-sm ${index === currentQueueIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                          #{index + 1}
                        </span>
                        <span className={`font-medium text-sm ${index === currentQueueIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                          {doctor.name}
                        </span>
                        {doctor.doctorRank && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              index === currentQueueIndex ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {doctor.doctorRank}
                          </span>
                        )}
                      </div>
                      {index === currentQueueIndex && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full animate-pulse">🔄 กำลังรัน</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live View Indicator */}
          {isRunning && !isRunner && (
            <div className="flex justify-center mb-4 animate-pulse">
              <div className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-semibold text-sm">🔴 Live View - กำลังดูคิวแบบเรียลไทม์</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all duration-300">
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={handlePrevious}
                disabled={!isRunning || (!isRunner && userRole !== 'admin') || doctors.length === 0}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!isRunning || (!isRunner && userRole !== 'admin') || doctors.length === 0}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleEdit}
                disabled={isRunning && !isRunner && userRole !== 'admin'}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
              >
                <Edit className="w-5 h-5" />
                <span>แก้ไขคิว</span>
              </button>

              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={doctors.length < 4 || !runnerName || runnerName.trim() === ''}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                >
                  ▶️ เริ่มรันคิว
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  disabled={!isRunner && userRole !== 'admin'}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                >
                  <Square className="w-5 h-5" />
                  <span>{userRole === 'admin' && !isRunner ? '🔧 บังคับจบคิว (Admin)' : 'สิ้นสุดรันคิว'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 rounded-lg border border-cyan-400 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-cyan-400">แก้ไขคิว</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ผู้รัน */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">👤 ผู้รัน *</label>
                <input
                  type="text"
                  value={selectedRunnerName}
                  onChange={(e) => setSelectedRunnerName(e.target.value)}
                  placeholder="กรุณาใส่ชื่อผู้รัน"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* รายชื่อหมอในคิว */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-400">รายชื่อหมอในคิว</label>
                  <span className={`text-xs ${queueDoctors.length >= 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {queueDoctors.length} / 4 (ขั้นต่ำ)
                  </span>
                </div>
                <div className="space-y-2">
                  {queueDoctors.length === 0 ? (
                    <div className="text-gray-500 text-center py-8 bg-gray-700/50 rounded">ยังไม่มีหมอในคิว</div>
                  ) : (
                    queueDoctors.map((doctor, index) => (
                      <div
                        key={doctor._id}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600 transition-all duration-200 hover:border-cyan-400"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-cyan-400 font-semibold w-8">{index + 1}.</span>
                          <span className="text-white font-medium">{doctor.name}</span>
                          {doctor.doctorRank && (
                            <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">{doctor.doctorRank}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 text-cyan-400 hover:text-cyan-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === queueDoctors.length - 1}
                            className="p-1 text-cyan-400 hover:text-cyan-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveDoctor(doctor._id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="ลบออกจากคิว"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* เพิ่มหมอ */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">เพิ่มหมอเข้าไปในคิว</label>
                {availableDoctors.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableDoctors.map((doctor) => (
                      <div
                        key={doctor._id}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded border border-gray-600 hover:border-cyan-400 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-medium">{doctor.name}</span>
                          {doctor.doctorRank && (
                            <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">{doctor.doctorRank}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddDoctor(doctor)}
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="เพิ่มเข้าไปในคิว"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4 bg-gray-700/30 rounded border border-gray-600">ไม่มีหมอที่สามารถเพิ่มได้</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveQueue}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
