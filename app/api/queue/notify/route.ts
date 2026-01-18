import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordNotification } from '@/lib/discord-webhook';
import { verifyTokenServer } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyTokenServer(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user name (IC/username) from database to ensure we have the correct name
    let runnerName = 'ไม่ระบุ';
    try {
      await connectDB();
      const User = (await import('@/models/User')).default;
      const user = await (User as any).findById(decoded.userId).select('name username');
      // Use name (IC) if available, fallback to username
      if (user && user.name) {
        runnerName = user.name;
      } else if (user && user.username) {
        runnerName = user.username;
      }
    } catch (error) {
      console.error('Failed to fetch user name for webhook:', error);
      // Fallback to using data.runnerName if provided
    }

    const { type, data, messageId } = await request.json();
    
    // Use server-fetched runnerName if not provided or if it's "ไม่ระบุ"
    const finalRunnerName = runnerName !== 'ไม่ระบุ' ? runnerName : (data.runnerName || runnerName);

    let title = '';
    let message = '';
    let color = 0x3498db; // Default blue

    switch (type) {
      case 'start':
        title = '🔄 เริ่มรันคิว';
        message = `**👤 ผู้รัน:** ${finalRunnerName}\n`;
        message += `**👨‍⚕️ จำนวนหมอ:** ${data.doctorCount} คน\n`;
        message += `**📋 รายชื่อหมอ:**\n${data.doctors.map((d: any, i: number) => `${i + 1}. ${d.name}${d.doctorRank ? ` (${d.doctorRank})` : ''}`).join('\n')}\n`;
        message += `**🕐 เวลาเริ่มต้น:** ${new Date().toLocaleString('th-TH')}`;
        color = 0x2ecc71; // Green
        break;

      case 'stop':
        title = '⏹️ สิ้นสุดรันคิว';
        message = `**👤 ผู้รัน:** ${finalRunnerName}\n`;
        message += `**⏱️ รวมเวลา:** ${data.totalTime}\n`;
        message += `**👨‍⚕️ จำนวนหมอที่รัน:** ${data.doctorCount} คน\n`;
        message += `**🕐 เวลาสิ้นสุด:** ${new Date().toLocaleString('th-TH')}`;
        color = 0xe74c3c; // Red
        break;

      case 'next':
      case 'previous':
        // Update format when running - show current status
        title = '🔄 กำลังรันคิว';
        message = `**👤 ผู้รัน:** ${finalRunnerName}\n`;
        message += `**📍 คิวปัจจุบัน:** ${data.currentQueueNumber}/${data.totalDoctors || '?'}\n`;
        message += `**👨‍⚕️ หมอปัจจุบัน:** ${data.currentDoctorName}${data.currentDoctorRank ? ` (${data.currentDoctorRank})` : ''}\n`;
        if (data.elapsedTime) {
          message += `**⏱️ เวลาที่รัน:** ${data.elapsedTime}\n`;
        }
        message += `**🕐 อัพเดทเมื่อ:** ${new Date().toLocaleString('th-TH')}`;
        color = 0x3498db; // Blue
        break;

      case 'update':
        title = '✏️ แก้ไขคิว';
        message = `**ผู้แก้ไข:** ${finalRunnerName}\n`;
        message += `**จำนวนหมอ:** ${data.doctorCount} คน\n`;
        message += `**รายชื่อหมอ:**\n${data.doctors.map((d: any, i: number) => `${i + 1}. ${d.name}${d.doctorRank ? ` (${d.doctorRank})` : ''}`).join('\n')}\n`;
        message += `**เวลา:** ${new Date().toLocaleString('th-TH')}`;
        color = 0xf39c12; // Orange
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Send notification - will update existing message if messageId is provided
    const result = await sendDiscordNotification(title, message, color, 'queues', undefined, messageId);
    
    // Return the message ID for future updates
    return NextResponse.json({ 
      success: true,
      messageId: result?.messageId || null 
    });
  } catch (error: any) {
    console.error('Queue notification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
