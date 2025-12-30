require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const PORT = 3000; // STRICTLY 3000. DO NOT USE 3001 (OCCUPIED BY OTHER SITE)

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

// --- GAMES & DATA ---
app.get('/api/games', (req, res) => {
    try { res.json(database.getAllFromTable('games')); }
    catch (e) { res.status(500).json({ message: 'Failed to fetch games' }); }
});

app.get('/api/user/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    res.json({ account: database.findAccountById(req.user.id, 'users'), games: database.getAllFromTable('games'), bets: database.findBetsByUserId(req.user.id) });
});

app.get('/api/dealer/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    res.json({ account: database.findAccountById(req.user.id, 'dealers'), users: database.findUsersByDealerId(req.user.id), bets: database.findBetsByDealerId(req.user.id) });
});

app.get('/api/admin/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    res.json({ account: database.findAccountById(req.user.id, 'admins'), dealers: database.getAllFromTable('dealers', true), users: database.getAllFromTable('users', true), games: database.getAllFromTable('games'), bets: database.getAllFromTable('bets') });
});

// --- ACTIONS ---
app.post('/api/user/bets', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    try { res.status(201).json(database.placeBulkBets(req.user.id, req.body.gameId, req.body.betGroups, 'USER')); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.post('/api/dealer/bets/bulk', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.status(201).json(database.placeBulkBets(req.body.userId, req.body.gameId, req.body.betGroups, 'DEALER')); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.post('/api/dealer/users', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.status(201).json(database.createUser(req.body.userData, req.user.id, req.body.initialDeposit)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/dealer/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.json(database.updateUser(req.body, req.params.id, req.user.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.get('/api/admin/summary', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    res.json(database.getFinancialSummary());
});

app.post('/api/admin/games/:id/declare-winner', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.declareWinnerForGame(req.params.id, req.body.winningNumber)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/admin/games/:id/approve-payouts', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.approvePayoutsForGame(req.params.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Start Server
try {
    database.connect();
    database.verifySchema();
} catch (err) {
    console.error('Critical database failure:', err);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKLASBELA-TV] Operational on port ${PORT}`);
});