// api/checkSession.js
import clientPromise from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, hwid } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db('cevex');
    
    // Find session in database
    const session = await db.collection('sessions').findOne({ 
      token: token 
    });

    if (!session) {
      return res.json({ valid: false });
    }

    // Check if session expired
    if (new Date() > new Date(session.expires)) {
      // Clean up expired session
      await db.collection('sessions').deleteOne({ token: token });
      return res.json({ valid: false });
    }

    // Check HWID match
    if (session.hwid !== hwid) {
      return res.json({ valid: false });
    }

    return res.json({ valid: true });

  } catch (error) {
    console.error('CheckSession error:', error);
    return res.json({ valid: false });
  }
}
