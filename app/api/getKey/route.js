import { NextResponse } from 'next/server';
import crypto from 'crypto';

const keysDB = new Map(); // Все ключи
const userSessions = new Map(); // Сессии пользователей

// Генерация браузерного отпечатка (fingerprint)
function generateBrowserFingerprint(request) {
  const headers = request.headers;
  
  const data = [
    headers.get('user-agent') || '',
    headers.get('accept-language') || '',
    headers.get('accept-encoding') || '',
    headers.get('sec-ch-ua') || '',
    headers.get('sec-ch-ua-platform') || '',
    headers.get('sec-ch-ua-mobile') || '?0'
  ].join('|');
  
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// Получение ID пользователя
function getUserId(request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Приоритет: ClickID от CPA сети
  const clickId = searchParams.get('clickid');
  if (clickId) return `click:${clickId}`;
  
  // 2. SubID от других сервисов
  const subId = searchParams.get('subid');
  if (subId) return `sub:${subId}`;
  
  // 3. Браузерный fingerprint
  const browserFingerprint = generateBrowserFingerprint(request);
  return `fingerprint:${browserFingerprint}`;
}

export async function GET(request) {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'direct';
  
  // Проверяем, получал ли этот пользователь ключ
  const now = new Date();
  const userSession = userSessions.get(userId);
  
  // 🎯 ИЗМЕНЕНИЕ: 9 часов вместо 24
  if (userSession) {
    const lastIssued = new Date(userSession.timestamp);
    const hoursSinceLast = (now - lastIssued) / (1000 * 60 * 60);
    
    // Один ключ в 9 часов на пользователя
    if (hoursSinceLast < 9) {
      const existingKey = userSession.key;
      const keyData = keysDB.get(existingKey);
      
      if (keyData && now < keyData.expiresAt) {
        return NextResponse.json({
          success: true,
          key: existingKey,
          expires: keyData.expiresAt.toISOString(),
          message: 'Your existing key',
          existing: true
        });
      }
    }
  }
  
  // Генерация нового ключа
  const prefix = service === 'lootlabs' ? 'LL-' : 
                 service === 'linkvertise' ? 'LV-' : 'CEVEX-';
  const key = prefix + 
              crypto.randomBytes(3).toString('hex').toUpperCase() + '-' +
              crypto.randomBytes(2).toString('hex').toUpperCase();
  
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000); // 9 часов
  
  keysDB.set(key, {
    service,
    createdAt,
    expiresAt,
    hwid: null,
    activated: false,
    usesLeft: 1,
    userId: userId
  });
  
  // Запоминаем сессию
  userSessions.set(userId, {
    key: key,
    timestamp: now.toISOString(),
    service: service,
    fingerprint: userId.includes('fingerprint:') ? userId : null
  });
  
  // 🎯 ИЗМЕНЕНИЕ: Очистка старых сессий (18 часов вместо 48)
  for (const [uid, session] of userSessions.entries()) {
    const sessionTime = new Date(session.timestamp);
    if ((now - sessionTime) > 18 * 60 * 60 * 1000) {
      userSessions.delete(uid);
    }
  }
  
  console.log(`[${service}] Issued key: ${key} to user: ${userId.substring(0, 20)}...`);
  
  return NextResponse.json({
    success: true,
    key: key,
    expires: expiresAt.toISOString(),
    message: 'Valid for 9 hours',
    existing: false
  });
}
