import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyTokenServer } from '@/lib/auth';
import Leave from '@/models/Leave';
import Discipline from '@/models/Discipline';
import WithdrawItem from '@/models/WithdrawItem';
import TimeTracking from '@/models/TimeTracking';
import Blacklist from '@/models/Blacklist';
import User from '@/models/User';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '6months'; // 1month, 3months, 6months, 1year, all
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Calculate date range
    let dateRange: { start: Date; end: Date };
    const now = new Date();
    
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    } else {
      switch (period) {
        case '1month':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: now,
          };
          break;
        case '3months':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
            end: now,
          };
          break;
        case '6months':
          dateRange = {
            start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            end: now,
          };
          break;
        case '1year':
          dateRange = {
            start: new Date(now.getFullYear() - 1, now.getMonth(), 1),
            end: now,
          };
          break;
        default: // all
          dateRange = {
            start: new Date(2000, 0, 1),
            end: now,
          };
      }
    }

    const queryDateRange = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };

    // Get all statistics
    const [
      // Counts
      totalLeaves,
      totalDisciplines,
      totalWithdraws,
      totalTimeTracking,
      totalBlacklist,
      totalUsers,
      
      // Status breakdowns
      leaveByStatus,
      disciplineByStatus,
      withdrawByStatus,
      blacklistByPaymentStatus,
      
      // Monthly trends
      monthlyData,
      
      // Top performers
      topDoctorsByTimeTracking,
      topDoctorsByLeave,
      
      // Recent activity
      recentLeaves,
      recentDisciplines,
      recentWithdraws,
    ] = await Promise.all([
      // Total counts
      (Leave as any).countDocuments({ createdAt: queryDateRange }),
      (Discipline as any).countDocuments({ createdAt: queryDateRange }),
      (WithdrawItem as any).countDocuments({ createdAt: queryDateRange }),
      (TimeTracking as any).countDocuments({ createdAt: queryDateRange }),
      (Blacklist as any).countDocuments({ createdAt: queryDateRange }),
      (User as any).countDocuments(),
      
      // Leave by status
      (Leave as any).aggregate([
        { $match: { createdAt: queryDateRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      
      // Discipline by status
      (Discipline as any).aggregate([
        { $match: { createdAt: queryDateRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      
      // Withdraw by status
      (WithdrawItem as any).aggregate([
        { $match: { createdAt: queryDateRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      
      // Blacklist by payment status
      (Blacklist as any).aggregate([
        { $match: { createdAt: queryDateRange, fineAmount: { $exists: true, $gt: 0 } } },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      
      // Monthly trends - get last 12 months
      (async () => {
        const months = [];
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        
        const monthsToShow = Math.min(12, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1);
        
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const date = new Date(dateRange.end);
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
          
          const [leaves, disciplines, withdraws, timeTracking, blacklist] = await Promise.all([
            (Leave as any).countDocuments({
              createdAt: { $gte: monthStart, $lte: monthEnd },
            }),
            (Discipline as any).countDocuments({
              createdAt: { $gte: monthStart, $lte: monthEnd },
            }),
            (WithdrawItem as any).countDocuments({
              createdAt: { $gte: monthStart, $lte: monthEnd },
            }),
            (TimeTracking as any).countDocuments({
              createdAt: { $gte: monthStart, $lte: monthEnd },
            }),
            (Blacklist as any).countDocuments({
              createdAt: { $gte: monthStart, $lte: monthEnd },
            }),
          ]);
          
          months.push({
            month: `${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`,
            leaves,
            disciplines,
            withdraws,
            timeTracking,
            blacklist,
          });
        }
        
        return months;
      })(),
      
      // Top doctors by time tracking (last 30 days)
      (TimeTracking as any).aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: '$doctorId',
            count: { $sum: 1 },
            doctorName: { $first: '$doctorName' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      
      // Top doctors by leave
      (Leave as any).aggregate([
        {
          $match: {
            createdAt: queryDateRange,
          },
        },
        {
          $group: {
            _id: '$requestedBy',
            count: { $sum: 1 },
            doctorName: { $first: '$requestedByName' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      
      // Recent activity
      (Leave as any)
        .find({ createdAt: queryDateRange })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      (Discipline as any)
        .find({ createdAt: queryDateRange })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      (WithdrawItem as any)
        .find({ createdAt: queryDateRange })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Format status breakdowns
    const formatStatusBreakdown = (data: any[]) => {
      const result: any = {};
      data.forEach((item) => {
        result[item._id || 'unknown'] = item.count;
      });
      return result;
    };

    return NextResponse.json({
      summary: {
        totalLeaves,
        totalDisciplines,
        totalWithdraws,
        totalTimeTracking,
        totalBlacklist,
        totalUsers,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      },
      breakdowns: {
        leaveByStatus: formatStatusBreakdown(leaveByStatus),
        disciplineByStatus: formatStatusBreakdown(disciplineByStatus),
        withdrawByStatus: formatStatusBreakdown(withdrawByStatus),
        blacklistByPaymentStatus: formatStatusBreakdown(blacklistByPaymentStatus),
      },
      trends: {
        monthly: monthlyData,
      },
      topPerformers: {
        timeTracking: topDoctorsByTimeTracking.map((d: any) => ({
          doctorName: d.doctorName || 'ไม่ระบุ',
          count: d.count,
        })),
        leave: topDoctorsByLeave.map((d: any) => ({
          doctorName: d.doctorName || 'ไม่ระบุ',
          count: d.count,
        })),
      },
      recentActivity: {
        leaves: recentLeaves.slice(0, 10),
        disciplines: recentDisciplines.slice(0, 10),
        withdraws: recentWithdraws.slice(0, 10),
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
