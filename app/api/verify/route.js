import { supabase } from '@/lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { key, hwid } = req.query;
  const normalizedKey = key?.toUpperCase().replace(/\s+/g, '') || '';

  try {
    // Проверяем ключ
    const { data: keyData, error } = await supabase
      .from('keys')
      .select('*')
      .eq('key', normalizedKey)
      .single();

    if (error || !keyData) {
      return res.json({ valid: false, reason: "Key not found" });
    }

    // Проверяем срок
    const now = new Date();
    const expires = new Date(keyData.expires);
    if (now > expires) {
      return res.json({ valid: false, reason: "Key expired" });
    }

    // Проверяем использован ли
    if (keyData.used && keyData.hwid !== hwid) {
      return res.json({ valid: false, reason: "Already used on another device" });
    }

    // Обновляем если не использован
    if (!keyData.used) {
      await supabase
        .from('keys')
        .update({ used: true, hwid: hwid, used_at: new Date().toISOString() })
        .eq('key', normalizedKey);
    }

    // Генерируем сессию
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    await supabase.from('sessions').insert({
      token: sessionToken,
      hwid: hwid,
      key: normalizedKey,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

    res.json({ valid: true, session: sessionToken });

  } catch (error) {
    res.json({ valid: false, reason: "Server error" });
  }
}
