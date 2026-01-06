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
const PORT = process.env.PORT || 3005; // Changed default to 3005

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
        processId: process.pid,
        timestamp: new Date().toISOString() 
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

app.get('/api/user/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    try {
        res.json({ 
            account: database.findAccountById(req.user.id, 'users'), 
            games: database.getAllFromTable('games'), 
            bets: database.findBetsByUserId(req.user.id) 
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
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
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API Route Not Found' });

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send(`
            <div style="background:#000; color:#f43f5e; padding:40px; font-family:monospace; border:2px solid #f43f5e;">
                <h1>[SYSTEM ERROR] UI FILES NOT FOUND</h1>
                <p>Path: ${indexPath}</p>
                <p>Solution: Run <b>npm run build</b> in the root folder.</p>
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
    console.log(`[AKLASBELA-EXCHANGE] PID:${process.pid} LIVE ON PORT ${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${PORT} is already taken by another process!`);
        console.error(`[HELP] Try running: fuser -k ${PORT}/tcp`);
        process.exit(1);
    }
});