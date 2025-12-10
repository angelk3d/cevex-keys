// key/page.js
import clientPromise from '@/lib/db';

export default async function handler(req, res) {
  const { service } = req.query;
  
  try {
    const client = await clientPromise;
    const db = client.db('cevex');
    
    // Generate unique key
    let key;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const prefix = service === 'lootlabs' ? 'LL' : 'LV';
      const key = `${prefix}-${randomString(4)}-${randomString(2)}`;
      
      // Check if key already exists
      const existingKey = await db.collection('keys').findOne({ key: key });
      
      if (!existingKey) {
        isUnique = true;
        
        // Save key to database
        await db.collection('keys').insertOne({
          key: key,
          type: prefix,
          service: service,
          generatedAt: new Date(),
          expires: new Date(Date.now() + 9 * 60 * 60 * 1000), // 9 hours
          used: false,
          hwid: null,
          usedAt: null,
          generatedFrom: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        
        // Log generation
        await db.collection('generations').insertOne({
          key: key,
          service: service,
          timestamp: new Date(),
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>CEVEX Key Generator</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                padding: 20px;
              }
              .container {
                background: rgba(30, 30, 30, 0.95);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0, 122, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
              }
              h1 { 
                color: #007aff;
                font-size: 32px;
                margin-bottom: 20px;
                text-align: center;
              }
              .key-box {
                background: rgba(0, 122, 255, 0.1);
                border: 2px solid #007aff;
                border-radius: 12px;
                padding: 25px;
                margin: 30px 0;
                text-align: center;
                font-family: monospace;
                font-size: 28px;
                letter-spacing: 2px;
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              .key-box:hover {
                background: rgba(0, 122, 255, 0.2);
                transform: translateY(-2px);
              }
              .instructions {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
              }
              .instructions h3 {
                color: #007aff;
                margin-bottom: 10px;
              }
              .instructions ul {
                list-style: none;
                padding-left: 10px;
              }
              .instructions li {
                margin: 8px 0;
                padding-left: 20px;
                position: relative;
              }
              .instructions li:before {
                content: "•";
                color: #007aff;
                position: absolute;
                left: 0;
              }
              .copy-btn {
                background: #007aff;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 20px;
                width: 100%;
                transition: background 0.3s ease;
              }
              .copy-btn:hover {
                background: #0056cc;
              }
              .timer {
                color: #ff9500;
                text-align: center;
                margin-top: 15px;
                font-size: 14px;
              }
              .note {
                color: #8e8e93;
                font-size: 12px;
                text-align: center;
                margin-top: 20px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎮 Your CEVEX Key</h1>
              <div class="key-box" id="keyDisplay" onclick="copyKey()">
                ${key}
              </div>
              
              <button class="copy-btn" onclick="copyKey()">
                📋 Copy Key to Clipboard
              </button>
              
              <div class="timer" id="timer">
                ⏰ Key expires in: <span id="countdown">09:00:00</span>
              </div>
              
              <div class="instructions">
                <h3>How to use:</h3>
                <ul>
                  <li>Copy the key above</li>
                  <li>Open CEVEX Loader in Roblox</li>
                  <li>Paste the key in activation field</li>
                  <li>Click "ACTIVATE" button</li>
                  <li>The script will load automatically</li>
                </ul>
              </div>
              
              <div class="note">
                ⚠️ This key is valid for 9 hours and can only be used on one device.<br>
                Do not share this key with others. It's tied to your hardware ID.
              </div>
            </div>
            
            <script>
              let hours = 9, minutes = 0, seconds = 0;
              let totalSeconds = hours * 3600;
              
              function updateTimer() {
                totalSeconds--;
                if (totalSeconds < 0) {
                  document.getElementById('keyDisplay').innerText = 'KEY EXPIRED';
                  document.getElementById('keyDisplay').style.color = '#ff3b30';
                  document.getElementById('countdown').innerText = 'EXPIRED';
                  return;
                }
                
                hours = Math.floor(totalSeconds / 3600);
                minutes = Math.floor((totalSeconds % 3600) / 60);
                seconds = totalSeconds % 60;
                
                document.getElementById('countdown').innerText = 
                  \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
              }
              
              setInterval(updateTimer, 1000);
              
              function copyKey() {
                const key = "${key}";
                navigator.clipboard.writeText(key).then(() => {
                  const btn = document.querySelector('.copy-btn');
                  btn.innerText = '✅ Copied!';
                  btn.style.background = '#34c759';
                  setTimeout(() => {
                    btn.innerText = '📋 Copy Key to Clipboard';
                    btn.style.background = '#007aff';
                  }, 2000);
                });
              }
            </script>
          </body>
          </html>
        `);
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).send('Failed to generate unique key');
    }
    
  } catch (error) {
    console.error('Key generation error:', error);
    return res.status(500).send('Internal Server Error');
  }
}

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
