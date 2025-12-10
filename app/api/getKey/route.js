import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

function generateKey(service) {
    const prefix = service === 'lootlabs' ? 'LL' : 'LV';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = prefix + '-';
    
    for (let i = 0; i < 8; i++) {
        if (i === 4) key += '-';
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || 'lootlabs';
    
    try {
        const db = await getDB();
        
        // Генерируем уникальный ключ
        let key;
        let exists = true;
        
        while (exists) {
            key = generateKey(service);
            const existing = await db.get('SELECT * FROM keys WHERE key = ?', [key]);
            exists = !!existing;
        }
        
        // Сохраняем ключ
        await db.run(
            'INSERT INTO keys (key, service) VALUES (?, ?)',
            [key, service]
        );
        
        // Обновляем статистику
        await db.run(`
            INSERT INTO stats (action, count) 
            VALUES ('keys_generated', 1)
            ON CONFLICT(action) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
        `);
        
        return NextResponse.json({ 
            success: true, 
            key: key,
            expires: 9 // 9 часов
        });
        
    } catch (error) {
        console.error('GetKey error:', error);
        return NextResponse.json({ success: false, message: "Server error" });
    }
}
