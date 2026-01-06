require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');
const database = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTOMATIC GAME RESET SCHEDULER (4:00 PM PKT) ---
const PKT_OFFSET_HOURS = 5;
const RESET_HOUR_PKT = 16; 

function scheduleNextGameReset() {
    const now = new Date();
    const resetHourUTC = RESET_HOUR_PKT - PKT_OFFSET_HOURS;
    let resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHourUTC, 0, 5, 0));
    if (now >= resetTime) resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    const delay = resetTime.getTime() - now.getTime();
    setTimeout(() => {
        try { 
            database.resetAllGames(); 
            console.log('[SCHEDULER] Daily market reset executed.');
        } catch (e) { 
            console.error('[SCHEDULER] Reset error:', e); 
        }
        scheduleNextGameReset();
    }, delay);
}

const JWT_SECRET = process.env.JWT_SECRET || 'aklasbela_tv_secure_salt_2024';
const PORT = 3000;

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        port: PORT,
        uptime: process.uptime(), 
        timestamp: new Date().toISOString()
    });
});

scheduleNextGameReset();

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
    const { loginId, password } = req.body;
    try {
        const { account, role } = database.findAccountForLogin(loginId);
        if (account && account.password === password) {
            const fullAccount = database.findAccountById(account.id, role.toLowerCase() + 's');
            const token = jwt.sign({ id: account.id, role }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ token, role, account: fullAccount });
        }
        res.status(401).json({ message: 'Invalid credentials.' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
    const role = req.user.role;
    const table = role.toLowerCase() + 's';
    try {
        const account = database.findAccountById(req.user.id, table);
        if (!account) return res.status(404).json({ message: 'Account not found.' });
        let extra = {};
        if (role === 'DEALER') {
            extra.users = database.findUsersByDealerId(req.user.id);
            extra.bets = database.findBetsByDealerId(req.user.id);
        } else if (role === 'USER') {
            extra.bets = database.findBetsByUserId(req.user.id);
        } else if (role === 'ADMIN') {
            extra.dealers = database.getAllFromTable('dealers', true);
            extra.users = database.getAllFromTable('users', true);
            extra.bets = database.getAllFromTable('bets');
        }
        res.json({ account, role, ...extra });
    } catch (e) {
        res.status(500).json({ message: 'Verification error' });
    }
});

// --- API ---
app.get('/api/games', (req, res) => {
    try { res.json(database.getAllFromTable('games')); }
    catch (e) { 
        console.error('API Error /api/games:', e);
        res.status(500).json({ message: 'Failed to fetch games' }); 
    }
});

// --- SERVE FRONTEND ---
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

// Log status of the dist folder on startup
if (!fs.existsSync(distPath)) {
    console.error(`[CRITICAL] Frontend directory NOT FOUND at: ${distPath}`);
    console.error(`Please run 'npm run build' in the project root.`);
} else if (!fs.existsSync(indexPath)) {
    console.warn(`[WARNING] index.html NOT FOUND at: ${indexPath}`);
}

app.use(express.static(distPath));

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
    // Prevent catching API routes that don't exist
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }

    // Check if index.html exists before sending
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send(`
            <html>
                <body style="font-family: sans-serif; background: #1a0505; color: #f7dee2; padding: 50px; text-align: center;">
                    <h1>System Error: UI Missing</h1>
                    <p>The backend is running, but the frontend files (dist folder) are missing.</p>
                    <p>Run <code>npm run build</code> on the VPS to fix this.</p>
                </body>
            </html>
        `);
    }
});

// Initialize DB and start
try {
    database.connect();
    database.verifySchema();
} catch (err) {
    console.error('Startup Error:', err);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKLASBELA-TV] Operational on Port ${PORT}`);
});