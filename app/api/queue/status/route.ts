import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QueueStatus from '@/models/QueueStatus';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    
    // Get the latest active queue status
    const queueStatus = await (QueueStatus as any).findOne({ isRunning: true })
      .sort({ lastUpdated: -1 })
      .lean();

    if (!queueStatus) {
      return NextResponse.json({
        isRunning: false,
        currentQueueIndex: 0,
        doctors: [],
        currentDoctor: null,
      });
    }

    const currentDoctor = queueStatus.doctors[queueStatus.currentQueueIndex] || null;

    return NextResponse.json({
      isRunning: queueStatus.isRunning,
      currentQueueIndex: queueStatus.currentQueueIndex,
      doctors: queueStatus.doctors,
      currentDoctor,
      startTime: queueStatus.startTime,
      elapsedTime: queueStatus.elapsedTime,
      runnerName: queueStatus.runnerName,
      runnerId: queueStatus.runnerId, // Include runnerId so frontend can check if current user is the runner
      lastUpdated: queueStatus.lastUpdated,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerPOST(request: NextRequest, user: any) {
  try {
    await connectDB();
    const body = await request.json();

    // If stopping the queue (isRunning: false), DELETE the document instead of updating
    if (body.isRunning === false) {
      // Check if there's a running queue and verify the user is the runner
      const existingQueue = await (QueueStatus as any).findOne({ isRunning: true })
        .sort({ lastUpdated: -1 })
        .lean();

      if (existingQueue) {
        // Only the person who started the queue can stop it, OR admin can force stop
        const isAdmin = user.role === 'admin';
        const isRunner = existingQueue.runnerId && existingQueue.runnerId.toString() === user.userId.toString();
        
        if (!isRunner && !isAdmin) {
          return NextResponse.json(
            { error: 'เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถจบคิวได้' },
            { status: 403 }
          );
        }
      }

      // Delete all running queue documents (temporary database - delete when queue ends)
      const deleteResult = await (QueueStatus as any).deleteMany({ isRunning: true });
      
      return NextResponse.json({
        success: true,
        message: 'Queue stopped and temporary database deleted',
        deletedCount: deleteResult.deletedCount || 0,
      });
    }

    // If starting or updating the queue (isRunning: true), create or update document
    // Check if there's already a running queue
    const existingQueue = await (QueueStatus as any).findOne({ isRunning: true })
      .sort({ lastUpdated: -1 })
      .lean();

    if (existingQueue) {
      // If updating an existing queue, verify the user is the runner OR admin
      const isAdmin = user.role === 'admin';
      const isRunner = existingQueue.runnerId && existingQueue.runnerId.toString() === user.userId.toString();
      
      if (!isRunner && !isAdmin) {
        return NextResponse.json(
          { error: 'เฉพาะผู้ที่เริ่มรันคิวหรือผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตคิวได้' },
          { status: 403 }
        );
      }
    }

    // Delete any existing running queue to ensure only one active queue
    await (QueueStatus as any).deleteMany({ isRunning: true });

    // Now create a new queue status document (temporary database - created when queue starts)
    const updateData: any = {
      isRunning: true,
      currentQueueIndex: body.currentQueueIndex !== undefined ? body.currentQueueIndex : 0,
      elapsedTime: body.elapsedTime !== undefined ? body.elapsedTime : 0,
      runnerId: user.userId,
      runnerName: body.runnerName || user.name || 'ไม่ระบุ',
      lastUpdated: new Date(),
    };

    // Set doctors if provided
    if (body.doctors !== undefined) {
      updateData.doctors = body.doctors;
    } else {
      updateData.doctors = [];
    }

    // Set startTime if provided
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime ? new Date(body.startTime) : new Date();
    } else {
      updateData.startTime = new Date();
    }

    // Create new queue status document
    const queueStatus = await (QueueStatus as any).create(updateData);

    return NextResponse.json({
      success: true,
      queueStatus,
      message: 'Queue status created in temporary database',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
