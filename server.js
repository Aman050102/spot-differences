const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DB_FILE = path.join(__dirname, 'custom_levels.json');
const CONFIG_FILE = path.join(__dirname, 'supabase_config.json');

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Load Supabase Config
let supabaseConfig = null;
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (config.SUPABASE_URL && config.SUPABASE_KEY) {
            // Trim slashes from end of URL
            config.SUPABASE_URL = config.SUPABASE_URL.replace(/\/+$/, '');
            supabaseConfig = config;
            console.log('⚡ Supabase Config detected: Levels will sync to the cloud!');
        }
    } catch (e) {
        console.warn('Could not parse supabase_config.json:', e);
    }
}

// MIME types mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// --- SUPABASE STORAGE AND DATABASE API ---

async function uploadBase64ToSupabase(base64Str, levelId, imageType) {
    if (!supabaseConfig) return null;
    if (base64Str.startsWith('http')) return base64Str; // Already uploaded

    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 format');
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const fileName = `level_${levelId}_${imageType}.${fileExtension}`;
    const uploadUrl = `${supabaseConfig.SUPABASE_URL}/storage/v1/object/levels/${fileName}`;

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseConfig.SUPABASE_KEY}`,
            'apikey': supabaseConfig.SUPABASE_KEY,
            'Content-Type': mimeType,
            'x-upsert': 'true'
        },
        body: buffer
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Storage upload failed: ${response.statusText} - ${errText}`);
    }

    return `${supabaseConfig.SUPABASE_URL}/storage/v1/object/public/levels/${fileName}`;
}

async function getLevelsFromSupabase() {
    if (!supabaseConfig) return [];
    
    const url = `${supabaseConfig.SUPABASE_URL}/rest/v1/custom_levels?select=*&order=id.asc`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${supabaseConfig.SUPABASE_KEY}`,
            'apikey': supabaseConfig.SUPABASE_KEY
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase DB fetch failed: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.map(row => ({
        id: row.id,
        title: row.title,
        originalSrc: row.original_url,
        gameSrc: row.game_url,
        answerSrc: row.answer_url || row.game_url,
        differences: row.differences,
        isCustom: true
    }));
}

async function saveLevelsToSupabase(levels) {
    if (!supabaseConfig) return;

    for (let i = 0; i < levels.length; i++) {
        const lv = levels[i];
        
        if (lv.originalSrc && lv.originalSrc.startsWith('data:')) {
            lv.originalSrc = await uploadBase64ToSupabase(lv.originalSrc, lv.id, 'original');
        }
        if (lv.gameSrc && lv.gameSrc.startsWith('data:')) {
            lv.gameSrc = await uploadBase64ToSupabase(lv.gameSrc, lv.id, 'game');
        }
        if (lv.answerSrc && lv.answerSrc.startsWith('data:')) {
            lv.answerSrc = await uploadBase64ToSupabase(lv.answerSrc, lv.id, 'answer');
        }

        const url = `${supabaseConfig.SUPABASE_URL}/rest/v1/custom_levels`;
        const payload = {
            id: lv.id,
            title: lv.title,
            original_url: lv.originalSrc,
            game_url: lv.gameSrc,
            answer_url: lv.answerSrc || lv.gameSrc,
            differences: lv.differences
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseConfig.SUPABASE_KEY}`,
                'apikey': supabaseConfig.SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase DB upsert failed: ${response.statusText} - ${errText}`);
        }
    }
}

async function deleteLevelFromSupabase(levelId) {
    if (!supabaseConfig) return;

    const dbUrl = `${supabaseConfig.SUPABASE_URL}/rest/v1/custom_levels?id=eq.${levelId}`;
    const dbRes = await fetch(dbUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${supabaseConfig.SUPABASE_KEY}`,
            'apikey': supabaseConfig.SUPABASE_KEY
        }
    });

    if (!dbRes.ok) {
        const errText = await dbRes.text();
        console.warn(`Supabase DB delete failed: ${dbRes.statusText} - ${errText}`);
    }

    const storageUrl = `${supabaseConfig.SUPABASE_URL}/storage/v1/object/levels`;
    const deletePayload = {
        prefixes: [
            `level_${levelId}_original.jpg`,
            `level_${levelId}_game.jpg`,
            `level_${levelId}_answer.jpg`,
            `level_${levelId}_original.png`,
            `level_${levelId}_game.png`,
            `level_${levelId}_answer.png`
        ]
    };

    await fetch(storageUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${supabaseConfig.SUPABASE_KEY}`,
            'apikey': supabaseConfig.SUPABASE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(deletePayload)
    }).catch(err => {
        console.warn('Failed to delete Supabase storage files:', err);
    });
}

function serveLocalLevels(res) {
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Failed to read database' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    });
}

// --- SERVER HTTP HANDLER ---

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // GET /api/levels - Load all custom levels
    if (pathname === '/api/levels' && req.method === 'GET') {
        if (supabaseConfig) {
            getLevelsFromSupabase()
                .then(data => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                })
                .catch(err => {
                    console.error('Supabase fetch failed, falling back to local file:', err);
                    serveLocalLevels(res);
                });
        } else {
            serveLocalLevels(res);
        }
        return;
    }

    // POST /api/levels - Save all custom levels
    if (pathname === '/api/levels' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const levels = JSON.parse(body);
                fs.writeFileSync(DB_FILE, JSON.stringify(levels, null, 2), 'utf8');

                if (supabaseConfig) {
                    try {
                        await saveLevelsToSupabase(levels);
                        // Save updated references locally as backup
                        fs.writeFileSync(DB_FILE, JSON.stringify(levels, null, 2), 'utf8');
                    } catch (err) {
                        console.error('Failed to save to Supabase:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to save to cloud storage: ' + err.message }));
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
        return;
    }

    // POST /api/levels/delete - Delete a level by ID
    if (pathname === '/api/levels/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { id } = JSON.parse(body);
                
                if (supabaseConfig) {
                    try {
                        await deleteLevelFromSupabase(id);
                    } catch (err) {
                        console.error('Failed to delete from Supabase:', err);
                    }
                }

                fs.readFile(DB_FILE, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Database read error' }));
                    }
                    let levels = JSON.parse(data);
                    levels = levels.filter(lvl => lvl.id !== id);
                    fs.writeFile(DB_FILE, JSON.stringify(levels, null, 2), 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ error: 'Database write error' }));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    });
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request data' }));
            }
        });
        return;
    }

    // --- STATIC FILES SERVING ---
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end('<h1>404 Not Found</h1><p>ไม่พบไฟล์ที่ต้องการเข้าถึง</p>');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🎮  Spot the Difference server is running!`);
    console.log(`🌐  Open http://localhost:${PORT} in your browser`);
    console.log(`💾  Custom levels database: ${DB_FILE}`);
    if (supabaseConfig) {
        console.log(`☁️   Supabase Sync Active!`);
    } else {
        console.log(`⚠️   Supabase credentials not configured yet.`);
    }
    console.log(`==================================================`);
});
