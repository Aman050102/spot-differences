// api/delete.js
module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
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

    // DELETE a level
    if (req.method === 'POST') {
        try {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Missing level ID' });
            }

            // Delete from Supabase Database
            const dbUrl = `${supabaseUrl}/rest/v1/custom_levels?id=eq.${id}`;
            const dbRes = await fetch(dbUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                }
            });

            if (!dbRes.ok) {
                const errText = await dbRes.text();
                throw new Error(`Supabase DB delete failed: ${dbRes.statusText} - ${errText}`);
            }

            // Delete files from Supabase Storage
            const storageUrl = `${supabaseUrl}/storage/v1/object/levels`;
            const deletePayload = {
                prefixes: [
                    `level_${id}_original.jpg`,
                    `level_${id}_game.jpg`,
                    `level_${id}_answer.jpg`,
                    `level_${id}_original.png`,
                    `level_${id}_game.png`,
                    `level_${id}_answer.png`
                ]
            };

            await fetch(storageUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deletePayload)
            }).catch(err => {
                console.warn('Failed to delete Supabase storage files:', err);
            });

            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
