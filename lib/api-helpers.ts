import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthUser {
  userId: string;
  role: 'doctor' | 'admin';
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  // Validate role is either 'doctor' or 'admin'
  if (decoded.role !== 'doctor' && decoded.role !== 'admin') {
    return null;
  }

  return {
    userId: decoded.userId,
    role: decoded.role as 'doctor' | 'admin',
  };
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, user);
  };
}

export function requireAuthWithParams(handler: (request: NextRequest, user: AuthUser, params: any) => Promise<NextResponse>) {
  return async (request: NextRequest, params: any) => {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, user, params);
  };
}

export function requireAdmin(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(request, user);
  };
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    return NextResponse.json({ error: 'Duplicate entry' }, { status: 400 });
  }

  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: error.status || 500 }
  );
}

export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sort = searchParams.get('sort') || '-createdAt';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    sort,
    search,
    status,
    category,
    skip: (page - 1) * limit,
  };
}
