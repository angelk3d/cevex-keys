const { db } = require('./db');
const crypto = require('crypto');

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = async (req, res) => {
    const { key, hwid } = req.query;
    
    if (!key || !hwid) {
        return res.json({ success: false, message: "Missing parameters" });
    }
    
    try {
        const keyData = await db.get('SELECT * FROM keys WHERE key = ?', [key]);
        
        if (!keyData) {
            return res.json({ success: false, message: "Invalid key" });
        }
        
        if (keyData.used_hwid && keyData.used_hwid !== hwid) {
            return res.json({ success: false, message: "Key already used on different device" });
        }
        
        if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
            return res.json({ success: false, message: "Key expired" });
        }
        
        const sessionToken = generateSessionToken();
        const expiresAt = Date.now() + 300000;
        
        await db.run(
            'INSERT INTO sessions (token, hwid, expires_at) VALUES (?, ?, ?)',
            [sessionToken, hwid, new Date(expiresAt).toISOString()]
        );
        
        if (!keyData.used_hwid) {
            await db.run(
                'UPDATE keys SET used_hwid = ?, activated_at = CURRENT_TIMESTAMP WHERE key = ?',
                [hwid, key]
            );
        }
        
        await db.run('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');
        
        res.json({
            success: true,
            message: "Key activated",
            sessionToken: sessionToken,
            expiresAt: expiresAt
        });
        
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error" });
    }
};
