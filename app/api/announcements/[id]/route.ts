import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuthWithParams, handleApiError, AuthUser } from '@/lib/api-helpers';
import { sendDiscordNotification } from '@/lib/discord-webhook';
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

async function handlerPUT(request: NextRequest, user: AuthUser, params: { id: string }) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = params;

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

    const announcement = await Announcement.findOne({ _id: id });
    if (!announcement) {
      return NextResponse.json({ error: 'ไม่พบคำประกาศ' }, { status: 404 });
    }

    // Update fields
    announcement.title = body.title;
    announcement.content = body.content;
    announcement.category = body.category || announcement.category;
    
    const updatedAnnouncement = await announcement.save();

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
          oldTitle: announcement.title,
          newTitle: updatedAnnouncement.title,
          category: updatedAnnouncement.category,
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Send Discord notification
    try {
      let discordMessage = `**หัวข้อ:** ${updatedAnnouncement.title}\n`;
      discordMessage += `**เนื้อหา:** ${updatedAnnouncement.content.substring(0, 200)}${updatedAnnouncement.content.length > 200 ? '...' : ''}\n`;
      discordMessage += `**อัปเดตโดย:** ${userDoc.name || userDoc.username}\n`;
      discordMessage += `**วันที่อัปเดต:** ${new Date(updatedAnnouncement.updatedAt).toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '📝 อัปเดตคำประกาศ',
        discordMessage,
        0xf39c12, // Orange
        'withdrawals'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: updatedAnnouncement });
  } catch (error: any) {
    return handleApiError(error);
  }
}

async function handlerDELETE(request: NextRequest, user: AuthUser, params: { id: string }) {
  try {
    await connectDB();
    const { id } = params;

    const userDoc = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(user.userId) });
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    if (userDoc.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการลบคำประกาศ' }, { status: 403 });
    }

    const announcement = await Announcement.findOne({ _id: id });
    if (!announcement) {
      return NextResponse.json({ error: 'ไม่พบคำประกาศ' }, { status: 404 });
    }

    await Announcement.deleteOne({ _id: id });

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

    // Send Discord notification
    try {
      let discordMessage = `**หัวข้อ:** ${announcement.title}\n`;
      discordMessage += `**เนื้อหา:** ${announcement.content.substring(0, 200)}${announcement.content.length > 200 ? '...' : ''}\n`;
      discordMessage += `**ลบโดย:** ${userDoc.name || userDoc.username}\n`;
      discordMessage += `**วันที่ลบ:** ${new Date().toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '🗑️ ลบคำประกาศ',
        discordMessage,
        0xe74c3c, // Red
        'withdrawals'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ message: 'ลบคำประกาศเรียบร้อยแล้ว' });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const PUT = requireAuthWithParams(handlerPUT);
export const DELETE = requireAuthWithParams(handlerDELETE);
