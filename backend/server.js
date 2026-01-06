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

const JWT_SECRET = process.env.JWT_SECRET || 'aklasbela_tv_secure_salt_2024';
const PORT = process.env.PORT || 3005;

// --- DATABASE INTEGRITY CHECK ---
const DB_FILE = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(DB_FILE)) {
    console.error('--------------------------------------------------');
    console.error('❌ FATAL: database.sqlite NOT FOUND!');
    console.error('💡 RUN: "node setup-database.js" in the backend folder.');
    console.error('--------------------------------------------------');
    // We don't exit here so the process stays up and we can see logs
}

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

scheduleNextGameReset();

// --- API ROUTES ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        port: PORT,
        pid: process.pid,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        node: process.version,
        database: fs.existsSync(DB_FILE) ? 'CONNECTED' : 'MISSING'
    });
});

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
        res.status(500).json({ message: 'Server error: Ensure DB is setup.' });
    }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
    try {
        const role = req.user.role;
        const table = role.toLowerCase() + 's';
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

app.get('/api/games', (req, res) => {
    try { res.json(database.getAllFromTable('games')); }
    catch (e) { res.status(500).json({ message: 'Failed to fetch games' }); }
});

app.post('/api/user/bets', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    try { res.status(201).json(database.placeBulkBets(req.user.id, req.body.gameId, req.body.betGroups, 'USER')); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

// --- STATIC FILES ---
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

app.use(express.static(distPath));

app.get('*', (req, res) => {
    // If it's an API request that reached here, it's a 404
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API Route Not Found' });

    // Try to serve index.html for SPA routing
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // This is a common cause of 500 errors if the build wasn't run
        res.status(500).send(`
            <div style="background:#050101; color:#f43f5e; padding:40px; font-family:monospace; border:4px solid #f43f5e; border-radius: 20px; margin: 40px; box-shadow: 0 0 50px rgba(244,63,94,0.3);">
                <h1 style="text-transform: uppercase; letter-spacing: 2px;">[SYSTEM ERROR] UI FILES NOT FOUND</h1>
                <p>The backend is running, but the <b>dist</b> folder is missing.</p>
                <hr style="border: 1px solid #f43f5e; opacity: 0.2; margin: 20px 0;">
                <p><b>Solution:</b></p>
                <ol>
                    <li>Go to your project root: <code>cd /var/www/html/aklasbela-tv</code></li>
                    <li>Run the build command: <code>npm run build</code></li>
                    <li>Check that the folder exists: <code>ls -d dist</code></li>
                </ol>
                <p style="font-size: 12px; opacity: 0.6;">Path: ${indexPath}</p>
            </div>
        `);
    }
});

// --- DATABASE & STARTUP ---
try {
    database.connect();
    database.verifySchema();
} catch (err) {
    console.error('[DB-FAIL]', err);
}

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 AKLASBELA-TV EXCHANGE IS LIVE`);
    console.log(`📡 PORT: ${PORT}`);
    console.log(`🆔 PID:  ${process.pid}`);
    console.log(`🌐 URL:  https://aklasbela-tv.com`);
    console.log('--------------------------------------------------');
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('--------------------------------------------------');
        console.error(`❌ FATAL: Port ${PORT} is already in use.`);
        console.error(`💡 FIX: "sudo lsof -i :${PORT}" and then "sudo kill -9 <PID>"`);
        console.error('--------------------------------------------------');
        process.exit(1);
    }
});