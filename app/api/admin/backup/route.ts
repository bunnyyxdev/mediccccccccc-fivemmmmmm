import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/api-helpers';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/activity-log';

async function handlerPOST(request: NextRequest, user: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Get all collections
    const collections = await db.listCollections().toArray();
    const backupData: Record<string, any[]> = {};

    // Backup all collections
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await db.collection(collectionName).find({}).toArray();
      backupData[collectionName] = data;
    }

    const userDoc = await (User as any).findById(user.userId);
    const userName = userDoc?.name || 'Unknown';

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      createdBy: user.userId,
      createdByName: userName,
      collections: backupData,
    };

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Database',
        entityName: 'Database Backup',
        performedBy: user.userId,
        performedByName: userName,
        metadata: {
          collections: collections.length,
          version: backup.version,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({
      success: true,
      backup,
      message: `สำรองข้อมูลสำเร็จ: ${collections.length} collections`,
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const POST = requireAuth(handlerPOST);
