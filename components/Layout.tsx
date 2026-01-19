'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { verifyToken } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'doctor' | 'admin';
}

export default function Layout({ children, requireAuth = true, requireRole }: LayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    if (!requireAuth) {
      setLoading(false);
      initializedRef.current = true;
      return;
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setLoading(false);
      initializedRef.current = true;
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      const decoded = verifyToken(token);

      const tokenUserId = String(decoded?.userId || '');
      const userDataId = String(userData._id || '');

      if (!decoded || tokenUserId !== userDataId) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        initializedRef.current = true;
        router.push('/login');
        return;
      }

      // Check role if required
      if (requireRole && userData.role !== requireRole) {
        setLoading(false);
        initializedRef.current = true;
        router.push('/dashboard');
        return;
      }

      setUser(userData);
      setLoading(false);
      initializedRef.current = true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      initializedRef.current = true;
      router.push('/login');
    }
  }, [requireAuth, requireRole, router]); // Only run when auth requirements change

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 animate-pulse-slow">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  // Ensure role is set correctly - default to 'doctor' if not set
  const userRole = (user?.role === 'admin' || user?.role === 'doctor') ? user.role : 'doctor';

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ minHeight: '100dvh' }}>
      <Sidebar role={userRole} onLogout={handleLogout} />
      <main className="flex-1 lg:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-8">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
