
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

// --- DIAGNOSTICS ---
const DB_FILE = path.join(__dirname, 'database.sqlite');
const DIST_PATH = path.resolve(__dirname, '../dist');
const INDEX_HTML = path.join(DIST_PATH, 'index.html');

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
        timestamp: new Date().toISOString(),
        database: fs.existsSync(DB_FILE) ? 'CONNECTED' : 'MISSING',
        ui_files: fs.existsSync(INDEX_HTML) ? 'READY' : 'NOT_FOUND'
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
        res.status(500).json({ message: 'Server error' });
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
app.use(express.static(DIST_PATH));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API Route Not Found' });

    if (fs.existsSync(INDEX_HTML)) {
        res.sendFile(INDEX_HTML);
    } else {
        res.status(500).send(`
            <div style="background:#020617; color:#f43f5e; padding:60px; font-family:sans-serif; border:1px solid #1e293b; border-radius: 40px; margin: 60px; box-shadow: 0 40px 100px rgba(0,0,0,0.8); text-align: center;">
                <h1 style="letter-spacing: -2px; margin-bottom: 30px; font-size: 3rem; color: #fff;">PROTOCOL_FAILURE: NO_UI_BUILD</h1>
                <p style="color: #64748b; font-size: 1.2rem; max-width: 600px; margin: 0 auto 40px;">The server is active on Port <b>${PORT}</b> but the frontend static files (dist/) are missing from the node directory.</p>
                <div style="background: rgba(0,0,0,0.4); padding: 30px; border-radius: 20px; margin: 40px 0; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; color: #94a3b8; font-size: 0.9rem; margin-bottom: 15px;"><b>REQUIRED INITIALIZATION COMMAND:</b></p>
                    <code style="display: block; color: #6366f1; font-family: monospace; font-size: 1.2rem;">npm run build</code>
                </div>
                <p style="font-size: 12px; opacity: 0.4; color: #fff;">Expected Node: ${INDEX_HTML}</p>
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
    console.log(`🚀 AKLASBELA-TV REPLICA NODE ACTIVATED`);
    console.log(`📡 PORT: ${PORT}`);
    console.log(`🆔 PID:  ${process.pid}`);
    console.log(`📊 DB:   ${fs.existsSync(DB_FILE) ? 'OK' : 'MISSING'}`);
    console.log('--------------------------------------------------');
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ PORT ${PORT} IN USE. RUN: sudo kill -9 $(sudo lsof -t -i:${PORT})`);
        process.exit(1);
    }
});
