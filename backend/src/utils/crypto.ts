import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKeyFromEnv(): Buffer | null {
  const k = process.env.REFRESH_TOKEN_ENC_KEY;
  if (!k) return null;
  // Expect base64 encoded 32 bytes
  return Buffer.from(k, 'base64');
}

export function encryptText(plain: string): string | null {
  const key = getKeyFromEnv();
  if (!key) return null;
  const iv = crypto.randomBytes(12); // 96-bit for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv:tag:cipher in base64
  const payload = Buffer.concat([iv, tag, enc]).toString('base64');
  return payload;
}

export function decryptText(payloadB64: string): string {
  const key = getKeyFromEnv();
  if (!key) throw new Error('REFRESH_TOKEN_ENC_KEY not set');
  const data = Buffer.from(payloadB64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const enc = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return decrypted.toString('utf8');
}
