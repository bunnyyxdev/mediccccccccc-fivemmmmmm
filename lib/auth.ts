import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, role: string): string {
  if (!userId || !role) {
    throw new Error('generateToken: userId and role are required');
  }

  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
    console.warn('Warning: Using fallback JWT_SECRET. Please set JWT_SECRET in .env file.');
  }

  const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  
  // Validate the generated token
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('generateToken: Generated token is invalid');
  }

  console.log('Token generated successfully. Length:', token.length, 'Parts:', tokenParts.length);
  
  return token;
}

// Client-side token decoding (no verification - verification happens on server)
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    if (!token) {
      console.log('verifyToken: No token provided');
      return null;
    }

    // Clean the token - remove any whitespace and "Bearer " prefix if present
    const cleanedToken = token.trim().replace(/^Bearer\s+/i, '');
    
    // Validate token format (JWT should have 3 parts separated by dots)
    if (!cleanedToken || cleanedToken.split('.').length !== 3) {
      console.log('verifyToken: Invalid token format - should have 3 parts separated by dots');
      console.log('Token length:', cleanedToken?.length, 'Token preview:', cleanedToken?.substring(0, 20));
      return null;
    }

    // Decode token without verification (for client-side use)
    // Full verification happens on the server
    let decoded: any;
    try {
      // Use decode instead of verify for client-side (no secret needed)
      decoded = jwt.decode(cleanedToken, { complete: false });
    } catch (jwtError: any) {
      console.log('verifyToken: JWT decode error:', jwtError.message || jwtError);
      return null;
    }
    
    // Type check and validate structure
    if (!decoded || typeof decoded !== 'object') {
      console.log('verifyToken: Decoded token is not an object', typeof decoded);
      return null;
    }

    const typedDecoded = decoded as { userId?: string; role?: string; exp?: number };
    
    // Check if token is expired (basic check)
    if (typedDecoded.exp && typedDecoded.exp < Date.now() / 1000) {
      console.log('verifyToken: Token has expired');
      return null;
    }
    
    if (!typedDecoded.userId || !typedDecoded.role) {
      console.log('verifyToken: Invalid token structure - missing userId or role', typedDecoded);
      return null;
    }

    return {
      userId: String(typedDecoded.userId),
      role: String(typedDecoded.role),
    };
  } catch (error: any) {
    console.log('verifyToken error:', error.message || error);
    console.log('Error type:', error?.name || typeof error);
    console.log('Token preview:', token?.substring(0, 50));
    return null;
  }
}

// Server-side token verification (with secret)
export function verifyTokenServer(token: string): { userId: string; role: string } | null {
  try {
    if (!token) {
      console.log('verifyTokenServer: No token provided');
      return null;
    }

    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
      console.error('verifyTokenServer: JWT_SECRET is not defined or using fallback');
      return null;
    }

    const cleanedToken = token.trim().replace(/^Bearer\s+/i, '');
    
    if (!cleanedToken || cleanedToken.split('.').length !== 3) {
      console.log('verifyTokenServer: Invalid token format - expected 3 parts');
      return null;
    }

    const decoded = jwt.verify(cleanedToken, JWT_SECRET) as { userId: string; role: string };
    
    if (!decoded || !decoded.userId || !decoded.role) {
      console.log('verifyTokenServer: Invalid token structure - missing userId or role', decoded);
      return null;
    }

    return {
      userId: String(decoded.userId),
      role: String(decoded.role),
    };
  } catch (error: any) {
    console.error('verifyTokenServer error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT verification failed - token may be invalid or JWT_SECRET mismatch');
    } else if (error.name === 'TokenExpiredError') {
      console.error('JWT token has expired');
    }
    return null;
  }
}
