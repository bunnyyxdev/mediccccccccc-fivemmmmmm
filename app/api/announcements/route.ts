import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
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

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { createdByName: { $regex: search, $options: 'i' } }
      ];
    }

    // Show all announcements
    // No filtering needed as we removed status and expiresAt

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return NextResponse.json({
      data: announcements,
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

async function handlerPOST(request: NextRequest, user: any) {
  try {
    await connectDB();
    const body = await request.json();

    const userDoc = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(user.userId) });
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('API - User found:', userDoc);
    console.log('API - User role:', userDoc.role);

    // Check if user is admin
    if (userDoc.role !== 'admin') {
      console.log('API - Access denied: User is not admin');
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ในการสร้างคำประกาศ' }, { status: 403 });
    }

    console.log('API - Access granted: User is admin');

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อและเนื้อหา)' },
        { status: 400 }
      );
    }

    const announcement = new Announcement({
      title: body.title,
      content: body.content,
      category: body.category || 'general',
      createdBy: new mongoose.Types.ObjectId(user.userId),
      createdByName: userDoc.name || userDoc.username,
    });

    await announcement.save();

    // Log activity
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logActivity({
        action: 'create',
        entityType: 'Announcement',
        entityId: announcement._id.toString(),
        entityName: `คำประกาศ: ${announcement.title}`,
        performedBy: user.userId,
        performedByName: userDoc.name || userDoc.username,
        metadata: {
          title: announcement.title,
          category: announcement.category,
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
      discordMessage += `**หมวดหมู่:** ${getCategoryLabel(announcement.category)}\n`;
      discordMessage += `**เนื้อหา:** ${announcement.content.substring(0, 200)}${announcement.content.length > 200 ? '...' : ''}\n`;
      discordMessage += `**สร้างโดย:** ${userDoc.name || userDoc.username}\n`;
      discordMessage += `**วันที่สร้าง:** ${new Date(announcement.createdAt).toLocaleString('th-TH')}\n`;

      await sendDiscordNotification(
        '📢 คำประกาศใหม่',
        discordMessage,
        0x3498db, // Blue
        'withdrawals'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return NextResponse.json({ data: announcement }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
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

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
