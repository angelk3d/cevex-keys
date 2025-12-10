import { NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function getDB() {
    return open({
        filename: './data.db',
        driver: sqlite3.Database
    });
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const hwid = searchParams.get('hwid');

    if (!token || !hwid) {
        return NextResponse.json({ valid: false, reason: "Missing parameters" });
    }

    try {
        const db = await getDB();
        
        // Проверяем сессию
        const session = await db.get(
            'SELECT * FROM sessions WHERE token = ? AND hwid = ? AND expires_at > CURRENT_TIMESTAMP',
            [token, hwid]
        );
        
        if (!session) {
            return NextResponse.json({ valid: false, reason: "Invalid or expired session" });
        }
        
        // Удаляем сессию после проверки (одноразовая)
        await db.run('DELETE FROM sessions WHERE token = ?', [token]);
        
        return NextResponse.json({ valid: true });
        
    } catch (error) {
        console.error('CheckSession error:', error);
        return NextResponse.json({ valid: false, reason: "Server error" });
    }
}
