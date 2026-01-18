import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QueueHistory from '@/models/QueueHistory';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);
    
    const runnerId = searchParams.get('runnerId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};

    if (runnerId) {
      query.runnerId = runnerId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.startTime.$lte = endDateObj;
      }
    }

    const [histories, total] = await Promise.all([
      (QueueHistory as any).find(query)
        .sort(sort || '-startTime')
        .skip(skip)
        .limit(limit)
        .lean()
        .populate('runnerId', 'name username')
        .populate('stoppedBy', 'name username'),
      (QueueHistory as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: histories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
