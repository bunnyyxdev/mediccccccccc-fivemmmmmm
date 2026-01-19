'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
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
  const lastLoggedPathnameRef = useRef<string | null>(null);
  const redirectingRef = useRef(false);
  const lastAuthCheckRef = useRef<{ requireAuth: boolean; requireRole?: string; userId?: string } | null>(null);

  useEffect(() => {
    // Only run auth check on initial mount - NEVER re-run this after initialization
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
      // Don't redirect here - let the role check effect handle it
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        initializedRef.current = true;
        // Don't redirect here - let the role check effect handle it
        return;
      }

      // Only update user if it's different (prevent unnecessary re-renders)
      setUser((prevUser: any) => {
        if (prevUser && prevUser._id === userData._id && JSON.stringify(prevUser) === JSON.stringify(userData)) {
          return prevUser; // Return same reference if data hasn't changed
        }
        return userData;
      });
      setLoading(false);
      initializedRef.current = true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      initializedRef.current = true;
      // Don't redirect here - let the role check effect handle it
    }
  }, []); // ONLY run on mount - never re-run
  
  // Separate effect for authentication and role validation - ONLY runs when auth state changes
  useEffect(() => {
    // Wait for initialization to complete
    if (!initializedRef.current || loading || redirectingRef.current) return;

    // Create a key for this auth check (without pathname) to prevent duplicate checks
    const authCheckKey = JSON.stringify({
      requireAuth,
      requireRole,
      userId: user?._id,
    });

    // Skip if we already checked this exact auth state
    if (lastAuthCheckRef.current && JSON.stringify(lastAuthCheckRef.current) === authCheckKey) {
      return;
    }

    // Store this check (without pathname)
    lastAuthCheckRef.current = {
      requireAuth,
      requireRole: requireRole || undefined,
      userId: user?._id,
    };

    // Read current pathname from the hook (not from dependencies)
    const currentPath = pathname;

    // Check if authentication is required
    if (requireAuth && !user) {
      // No user and auth required - redirect to login
      if (currentPath !== '/login') {
        redirectingRef.current = true;
        router.push('/login');
        setTimeout(() => {
          redirectingRef.current = false;
        }, 3000);
      }
      return;
    }

    // Check role if required
    if (requireRole && user && user.role !== requireRole) {
      // Role doesn't match - redirect to dashboard
      if (currentPath !== '/dashboard') {
        redirectingRef.current = true;
        router.push('/dashboard');
        setTimeout(() => {
          redirectingRef.current = false;
        }, 3000);
      }
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAuth, requireRole, user?._id, loading]); // DON'T include pathname or router to prevent loops

  // Log IP address when user accesses the page
  // All hooks must be before any early returns per React Rules of Hooks
  useEffect(() => {
    if (initializedRef.current && user) {
      // Only log if pathname has changed (avoid duplicate logs)
      if (lastLoggedPathnameRef.current === pathname) {
        return;
      }
      
      lastLoggedPathnameRef.current = pathname;
      
      const logIP = async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await axios.post(
              '/api/ip-log',
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          }
        } catch (error) {
          // Silently fail - don't interrupt user experience
          console.log('IP logging failed:', error);
        }
      };

      // Log IP on mount and when pathname changes
      logIP();
    }
    // Only depend on pathname and user ID, not the entire user object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user?._id]);

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
