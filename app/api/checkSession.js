const { db } = require('./db');

module.exports = async (req, res) => {
    const { token, hwid } = req.query;
    
    if (!token || !hwid) {
        return res.json({ valid: false, reason: "Missing parameters" });
    }
    
    try {
        const session = await db.get(
            'SELECT * FROM sessions WHERE token = ? AND hwid = ? AND expires_at > CURRENT_TIMESTAMP',
            [token, hwid]
        );
        
        if (!session) {
            return res.json({ valid: false, reason: "Invalid or expired session" });
        }
        
        await db.run('DELETE FROM sessions WHERE token = ?', [token]);
        
        res.json({ valid: true });
        
    } catch (error) {
        console.error(error);
        res.json({ valid: false, reason: "Server error" });
    }
};
