'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Activity, Clock, User, Package, FileText, Ban, Calendar } from 'lucide-react';

interface ActivityItem {
  _id: string;
  action: string;
  entityType: string;
  entityName: string;
  performedByName: string;
  createdAt: string;
}

interface LiveActivityFeedProps {
  token?: string;
  limit?: number;
}

export default function LiveActivityFeed({ token, limit = 10 }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivities = async () => {
    if (!token) return;

    try {
      const response = await axios.get('/api/activity-log', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, sort: '-createdAt' },
      });

      const newActivities = response.data.data || [];
      
      // Only update if there are truly new activities
      setActivities((prev) => {
        const currentIds = new Set(prev.map(a => a._id));
        const newIds = new Set(newActivities.map((a: any) => a._id));
        
        // Check if there are new items
        if (newActivities.length > 0 && !newActivities.every((a: any) => currentIds.has(a._id))) {
          // Add animation for new items
          return newActivities;
        }
        
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchActivities();

    // Poll every 3 seconds for real-time updates
    pollingIntervalRef.current = setInterval(() => {
      fetchActivities();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [token, limit]);

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'User':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'WithdrawItem':
        return <Package className="w-4 h-4 text-green-500" />;
      case 'Discipline':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'Blacklist':
        return <Ban className="w-4 h-4 text-orange-500" />;
      case 'Leave':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'border-green-200 bg-green-50';
      case 'update':
        return 'border-blue-200 bg-blue-50';
      case 'delete':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return date.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900">📡 Live Activity Feed</h3>
        </div>
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>กำลังอัปเดต...</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ไม่พบกิจกรรมล่าสุด</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity._id}
              className={`p-3 rounded-lg border-l-4 transition-smooth animate-fade-in hover-lift ${getActivityColor(activity.action)}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getActivityIcon(activity.entityType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{activity.performedByName}</span>
                    <span className="text-xs text-gray-500">
                      {activity.action === 'create' && 'สร้าง'}
                      {activity.action === 'update' && 'อัปเดต'}
                      {activity.action === 'delete' && 'ลบ'}
                    </span>
                    <span className="text-xs text-gray-700 font-medium">{activity.entityType}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{activity.entityName}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{formatTimeAgo(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
