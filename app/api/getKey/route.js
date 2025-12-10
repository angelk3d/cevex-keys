import { NextResponse } from 'next/server';
import crypto from 'crypto';

const keysDB = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'direct';
  
  const prefix = service === 'lootlabs' ? 'LL-' : 
                 service === 'linkvertise' ? 'LV-' : 'CEVEX-';
  const key = prefix + 
              crypto.randomBytes(3).toString('hex').toUpperCase() + '-' +
              crypto.randomBytes(2).toString('hex').toUpperCase();
  
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000);
  
  keysDB.set(key, {
    service,
    createdAt,
    expiresAt,
    hwid: null,
    activated: false,
    usesLeft: 1
  });
  
  console.log(`[${service}] Key: ${key}`);
  
  return NextResponse.json({
    success: true,
    key: key,
    expires: expiresAt.toISOString(),
    message: 'Valid for 9 hours'
  });
}
