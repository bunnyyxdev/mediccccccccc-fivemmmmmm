import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, parseQueryParams } from '@/lib/api-helpers';
import { saveLogStoryToSheet } from '@/lib/google-sheets-helpers';
import StoryLog from '@/models/StoryLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

async function handlerGET(request: NextRequest, user: any) {
  try {
    await connectDB();
    const { page, limit, skip, sort, search } = parseQueryParams(request);

    const query: any = {};

    if (search) {
      query.$or = [
        { 'teamA.name': { $regex: search, $options: 'i' } },
        { 'teamB.name': { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { recordedByName: { $regex: search, $options: 'i' } },
      ];
    }

    // All users can see all story logs

    const [logs, total] = await Promise.all([
      (StoryLog as any).find(query)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (StoryLog as any).countDocuments(query),
    ]);

    return NextResponse.json({
      data: logs,
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

    const userDoc = await (User as any).findById(user.userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save to database
    const storyLog = await (StoryLog as any).create({
      teamA: {
        type: body.teamAType || '',
        name: body.teamAName || '',
      },
      teamB: {
        type: body.teamBType || '',
        name: body.teamBName || '',
      },
      status: body.status || '',
      negotiation: {
        date: body.negotiationDate || '',
        observerMedic: body.negotiationObserverMedic || '',
        explainMedic: body.negotiationExplainMedic || '',
        entourageMedic: body.negotiationEntourageMedic || '',
      },
      fieldWork: {
        startDate: body.fieldWorkStartDate || '',
        endDate: body.fieldWorkEndDate || '',
        observerMedic: body.fieldWorkObserverMedic || '',
        headStory: [
          body.headStory1 || '',
          body.headStory2 || '',
          body.headStory3 || '',
        ].filter(Boolean),
        internStory: [
          body.internStory1 || '',
          body.internStory2 || '',
          body.internStory3 || '',
        ].filter(Boolean),
      },
      recordedBy: user.userId,
      recordedByName: userDoc.name || 'ไม่ระบุ',
    });

    // Backup to Google Sheets
    try {
      await saveLogStoryToSheet({
        teamAType: body.teamAType || '',
        teamAName: body.teamAName || '',
        teamBType: body.teamBType || '',
        teamBName: body.teamBName || '',
        status: body.status || '',
        negotiationDate: body.negotiationDate || '',
        negotiationObserverMedic: body.negotiationObserverMedic || '',
        negotiationExplainMedic: body.negotiationExplainMedic || '',
        negotiationEntourageMedic: body.negotiationEntourageMedic || '',
        fieldWorkStartDate: body.fieldWorkStartDate || '',
        fieldWorkEndDate: body.fieldWorkEndDate || '',
        fieldWorkObserverMedic: body.fieldWorkObserverMedic || '',
        headStory1: body.headStory1 || '',
        headStory2: body.headStory2 || '',
        headStory3: body.headStory3 || '',
        internStory1: body.internStory1 || '',
        internStory2: body.internStory2 || '',
        internStory3: body.internStory3 || '',
        recordedByName: userDoc.name || 'ไม่ระบุ',
      });
    } catch (error) {
      console.error('Failed to save to Google Sheets:', error);
      // Don't fail the request if Google Sheets save fails
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกสตอรี่สำเร็จ',
      data: storyLog,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export const GET = requireAuth(handlerGET);
export const POST = requireAuth(handlerPOST);
