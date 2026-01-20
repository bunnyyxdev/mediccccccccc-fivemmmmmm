import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuthWithParams, handleApiError, AuthUser } from '@/lib/api-helpers';
import { logActivity } from '@/lib/activity-log';
import mongoose from 'mongoose';

// Define interfaces
interface IAnnouncement {
  title: string;
  content: string;
  category: 'hospital' | 'open-close' | 'general' | 'staff' | 'medical' | 'search' | 'activities' | 'blacklist' | 'access' | 'story' | 'story-announcement';
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper function to get category label
function getCategoryLabel(category: string): string {
  switch (category) {
    case 'hospital': return 'หมวดโรงพยาบาล';
    case 'open-close': return 'หมวดเปิด-ปิด โรงพยาบาล';
    case 'general': return 'หมวดทั่วไป';
    case 'staff': return 'หมวดบุคลากร';
    case 'medical': return 'หมวดขาย/โปรโมชั่น';
    case 'search': return 'หมวดเรียก/ไม่พบ';
    case 'activities': return 'หมวดกิจกรรม';
    case 'blacklist': return 'Blacklist / การชำระ';
    case 'access': return 'เข้าถึงพื้นที่';
    case 'story': return 'Story';
    case 'story-announcement': return 'ประกาศสตอรี่';
    default: return category;
  }
}

// Announcement schema
const AnnouncementSchema = new mongoose.Schema<IAnnouncement>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['hospital', 'open-close', 'general', 'staff', 'medical', 'search', 'activities', 'blacklist', 'access', 'story', 'story-announcement'],
    default: 'general'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Announcement = (mongoose.models.Announcement as mongoose.Model<IAnnouncement>) || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

// Helper to safely extract ID from params or URL
async function getIdFromRequest(request: Request, params: Promise<any>) {
  // 1. Try to get from params
  const resolvedParams = await params;
  let id = resolvedParams?.id || resolvedParams?.announcementId;

  // 2. Fallback: Extract from URL path if params failed
  if (!id) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    id = pathSegments.pop(); // Get the last segment
  }
  
  return id?.trim();
}

// ==========================================
// PUT HANDLER
// ==========================================
async function handlerPUT(request: NextRequest, user: AuthUser, params: Promise<any>) {
  try {
    // 1. Get ID safely
    const id = await getIdFromRequest(request, params);
    
    // 2. Parse Body
    const body = await request.json();

    await connectDB();

    const userDoc = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(user.userId) });
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    if (userDoc.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการแก้ไขคำประกาศ' }, { status: 403 });
    }

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อและเนื้อหา)' },
        { status: 400 }
      );
    }

    // 3. Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid ID format", 
        debug_id: id 
      }, { status: 400 });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    if (!updatedAnnouncement) {
      return NextResponse.json({ error: "ไม่พบคำประกาศ" }, { status: 404 });
    }

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'update',
        entityType: 'Announcement',
        entityId: updatedAnnouncement._id.toString(),
        entityName: `คำประกาศ: ${updatedAnnouncement.title}`,
        performedBy: user.userId,
        performedByName: userDoc.name || userDoc.username,
        metadata: {
          oldTitle: updatedAnnouncement.title,
          newTitle: updatedAnnouncement.title,
          category: updatedAnnouncement.category,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedAnnouncement,
      message: 'อัปเดตคำประกาศเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ==========================================
// DELETE HANDLER
// ==========================================
async function handlerDELETE(request: NextRequest, user: AuthUser, params: Promise<any>) {
  try {
    await connectDB();
    
    // 1. Get ID safely (Bulletproof method)
    const id = await getIdFromRequest(request, params);

    // Debug log
    console.log(`DELETE Request - Final Extracted ID: ${id}`);

    // 2. Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid announcement ID format",
        debug_id: id
      }, { status: 400 });
    }

    const userDoc = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(user.userId) });
    
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    if (userDoc.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการลบคำประกาศ' }, { status: 403 });
    }

    // Find and Delete
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return NextResponse.json({ error: "ไม่พบคำประกาศ หรืออาจถูกลบไปแล้ว" }, { status: 404 });
    }

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'delete',
        entityType: 'Announcement',
        entityId: announcement._id.toString(),
        entityName: `คำประกาศ: ${announcement.title}`,
        performedBy: user.userId,
        performedByName: userDoc.name || userDoc.username,
        metadata: {
          deletedTitle: announcement.title,
          deletedCategory: announcement.category,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return NextResponse.json({ message: 'ลบคำประกาศเรียบร้อยแล้ว' });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const PUT = requireAuthWithParams(handlerPUT);
export const DELETE = requireAuthWithParams(handlerDELETE);