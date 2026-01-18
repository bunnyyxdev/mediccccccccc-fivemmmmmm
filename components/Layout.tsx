'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { verifyToken } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'doctor' | 'admin';
}

export default function Layout({ children, requireAuth = true, requireRole }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run auth check on initial mount or when requireAuth/requireRole changes
    // Skip if already initialized to prevent flickering on route changes
    if (initializedRef.current) {
      // Only validate role if it's required and user doesn't match
      if (requireRole && user && user.role !== requireRole) {
        router.push('/dashboard');
      }
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
      if (!initializedRef.current) {
        router.push('/login');
      }
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      const decoded = verifyToken(token);

      // Compare userId as strings to handle ObjectId conversion
      const tokenUserId = String(decoded?.userId || '');
      const userDataId = String(userData._id || '');

      if (!decoded || tokenUserId !== userDataId) {
        console.log('Token verification failed in Layout:', {
          hasDecoded: !!decoded,
          tokenUserId,
          userDataId,
          match: tokenUserId === userDataId
        });
        if (!initializedRef.current) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
        return;
      }

      if (requireRole && userData.role !== requireRole) {
        if (!initializedRef.current) {
          router.push('/dashboard');
        }
        return;
      }

      setUser(userData);
      setLoading(false);
      initializedRef.current = true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      if (!initializedRef.current) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  }, [router, requireAuth, requireRole]); // Removed pathname from dependencies

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={userRole} onLogout={handleLogout} />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0 animate-fade-in transition-smooth">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
