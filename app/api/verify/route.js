import { NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function getDB() {
    return open({
        filename: './data.db',
        driver: sqlite3.Database
    });
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const hwid = searchParams.get('hwid');

    if (!key || !hwid) {
        return NextResponse.json({ success: false, message: "Missing parameters" });
    }

    try {
        const db = await getDB();
        
        // Проверяем ключ
        const keyData = await db.get(
            'SELECT * FROM keys WHERE key = ?',
            [key]
        );
        
        if (!keyData) {
            return NextResponse.json({ success: false, message: "Invalid key" });
        }
        
        // Проверяем HWID
        if (keyData.used_hwid && keyData.used_hwid !== hwid) {
            return NextResponse.json({ success: false, message: "Key already used on different device" });
        }
        
        // Проверяем время жизни ключа (9 часов)
        const createdAt = new Date(keyData.created_at).getTime();
        const now = Date.now();
        const nineHours = 9 * 60 * 60 * 1000;
        
        if (now - createdAt > nineHours) {
            return NextResponse.json({ success: false, message: "Key expired" });
        }
        
        // Генерируем токен сессии
        const sessionToken = generateSessionToken();
        const expiresAt = Date.now() + 300000; // 5 минут
        
        // Создаем сессию
        await db.run(
            'INSERT INTO sessions (token, hwid, expires_at) VALUES (?, ?, ?)',
            [sessionToken, hwid, new Date(expiresAt).toISOString()]
        );
        
        // Привязываем HWID к ключу (если еще не привязан)
        if (!keyData.used_hwid) {
            await db.run(
                'UPDATE keys SET used_hwid = ?, activated_at = CURRENT_TIMESTAMP WHERE key = ?',
                [hwid, key]
            );
        }
        
        // Удаляем старые сессии
        await db.run('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');
        
        return NextResponse.json({
            success: true,
            message: "Key activated",
            sessionToken: sessionToken,
            expiresAt: expiresAt
        });
        
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json({ success: false, message: "Server error" });
    }
}
