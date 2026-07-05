// api/levels.js
module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Load credentials from environment variables or local fallback config
    let supabaseUrl = process.env.SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        try {
            const fs = require('fs');
            const path = require('path');
            const configFile = path.join(process.cwd(), 'supabase_config.json');
            if (fs.existsSync(configFile)) {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                supabaseUrl = config.SUPABASE_URL;
                supabaseKey = config.SUPABASE_KEY;
            }
        } catch (e) {}
    }

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    supabaseUrl = supabaseUrl.replace(/\/+$/, '');

    // GET: Fetch custom levels
    if (req.method === 'GET') {
        try {
            const url = `${supabaseUrl}/rest/v1/custom_levels?select=*&order=id.asc`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Supabase DB fetch failed: ${response.statusText} - ${errText}`);
            }

            const data = await response.json();
            const levels = data.map(row => ({
                id: row.id,
                title: row.title,
                originalSrc: row.original_url,
                gameSrc: row.game_url,
                answerSrc: row.answer_url || row.game_url,
                differences: row.differences,
                isCustom: true
            }));

            return res.status(200).json(levels);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // POST: Save custom levels
    if (req.method === 'POST') {
        try {
            const levels = req.body;
            if (!Array.isArray(levels)) {
                return res.status(400).json({ error: 'Invalid levels array' });
            }

            for (let i = 0; i < levels.length; i++) {
                const lv = levels[i];
                
                if (lv.originalSrc && lv.originalSrc.startsWith('data:')) {
                    lv.originalSrc = await uploadBase64ToSupabase(lv.originalSrc, lv.id, 'original', supabaseUrl, supabaseKey);
                }
                if (lv.gameSrc && lv.gameSrc.startsWith('data:')) {
                    lv.gameSrc = await uploadBase64ToSupabase(lv.gameSrc, lv.id, 'game', supabaseUrl, supabaseKey);
                }
                if (lv.answerSrc && lv.answerSrc.startsWith('data:')) {
                    lv.answerSrc = await uploadBase64ToSupabase(lv.answerSrc, lv.id, 'answer', supabaseUrl, supabaseKey);
                }

                const url = `${supabaseUrl}/rest/v1/custom_levels`;
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
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
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

            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

async function uploadBase64ToSupabase(base64Str, levelId, imageType, supabaseUrl, supabaseKey) {
    if (base64Str.startsWith('http')) return base64Str;

    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid Base64 format');
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const fileName = `level_${levelId}_${imageType}.${fileExtension}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/levels/${fileName}`;

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': mimeType,
            'x-upsert': 'true'
        },
        body: buffer
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Storage upload failed: ${response.statusText} - ${errText}`);
    }

    return `${supabaseUrl}/storage/v1/object/public/levels/${fileName}`;
}
