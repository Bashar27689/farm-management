import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: string; username: string; role: string }) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: string;
    };
  } catch (error) {
    return null;
  }
}

export function getCurrentUser(request: Request) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  
  const tokenCookie = cookie.split(';').find(c => c.trim().startsWith('token='));
  if (!tokenCookie) return null;
  
  const token = tokenCookie.split('=')[1];
  return verifyToken(token);
}