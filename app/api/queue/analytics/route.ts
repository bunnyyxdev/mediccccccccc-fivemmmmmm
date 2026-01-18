import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QueueHistory from '@/models/QueueHistory';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d', '1y', 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateQuery: any = {};
    const now = new Date();

    if (startDate && endDate) {
      dateQuery.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      switch (period) {
        case '7d':
          dateQuery.startTime = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case '30d':
          dateQuery.startTime = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case '90d':
          dateQuery.startTime = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
          break;
        case '1y':
          dateQuery.startTime = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
          break;
        case 'all':
        default:
          dateQuery = {}; // No date filter
          break;
      }
    }

    // Total queue sessions
    const totalSessions = await (QueueHistory as any).countDocuments(dateQuery);

    // Status breakdown
    const statusBreakdown = await (QueueHistory as any).aggregate([
      { $match: dateQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top runners (most queue sessions)
    const topRunners = await (QueueHistory as any).aggregate([
      { $match: dateQuery },
      { $group: { _id: '$runnerId', count: { $sum: 1 }, name: { $first: '$runnerName' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Average statistics
    const avgStats = await (QueueHistory as any).aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          avgDoctors: { $avg: '$totalDoctors' },
          avgCompleted: { $avg: '$completedDoctors' },
          totalDuration: { $sum: '$duration' },
          totalDoctors: { $sum: '$totalDoctors' },
          totalCompleted: { $sum: '$completedDoctors' },
        },
      },
    ]);

    // Daily trends (last 30 days)
    const dailyTrends = await getDailyTrends(dateQuery);

    // Hourly distribution (when queues are started)
    const hourlyDistribution = await (QueueHistory as any).aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Longest and shortest queue sessions
    const longestSession = await (QueueHistory as any).findOne(dateQuery)
      .sort({ duration: -1 })
      .lean()
      .populate('runnerId', 'name username');

    const shortestSession = await (QueueHistory as any).findOne(dateQuery)
      .sort({ duration: 1 })
      .lean()
      .populate('runnerId', 'name username');

    return NextResponse.json({
      summary: {
        totalSessions,
        period,
      },
      averages: avgStats[0] || {
        avgDuration: 0,
        avgDoctors: 0,
        avgCompleted: 0,
        totalDuration: 0,
        totalDoctors: 0,
        totalCompleted: 0,
      },
      breakdowns: {
        byStatus: statusBreakdown,
      },
      trends: {
        daily: dailyTrends,
        hourly: hourlyDistribution,
      },
      topRunners,
      records: {
        longest: longestSession,
        shortest: shortestSession,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function getDailyTrends(dateQuery: any) {
  const now = new Date();
  const days = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayQuery = {
      ...dateQuery,
      startTime: {
        ...(dateQuery.startTime || {}),
        $gte: date,
        $lt: nextDate,
      },
    };
    
    const count = await (QueueHistory as any).countDocuments(dayQuery);
    
    days.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }
  
  return days;
}

export const GET = requireAuth(handlerGET);
