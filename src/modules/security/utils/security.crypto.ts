import * as crypto from 'crypto';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is missing in production environment!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'ihsan_rems_rotated_high_entropy_fallback_key_9381048_prod_safe';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;

  // Verify using stronger iterations (600,000)
  let hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  if (hash === originalHash) return true;

  // Fallback to legacy iterations (1,000) for backward compatibility
  hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export function generateToken(payload: any, expiresInDays: number = 7): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  const fullPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export function hashToken(token: string): string {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}
