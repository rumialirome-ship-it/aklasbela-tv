require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');
const { GoogleGenAI } = require('@google/genai');
const database = require('./database');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTOMATIC GAME RESET SCHEDULER ---
const PKT_OFFSET_HOURS = 5;
const RESET_HOUR_PKT = 16; // 4:00 PM PKT

function scheduleNextGameReset() {
    const now = new Date();
    const resetHourUTC = RESET_HOUR_PKT - PKT_OFFSET_HOURS;

    let resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHourUTC, 0, 5, 0));

    if (now >= resetTime) {
        resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    }

    const delay = resetTime.getTime() - now.getTime();
    setTimeout(() => {
        try { database.resetAllGames(); } catch (e) { console.error('Reset error:', e); }
        scheduleNextGameReset();
    }, delay);
}

const JWT_SECRET = process.env.JWT_SECRET;
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3002; // Updated to default to 3002 as requested
let ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Initialize Scheduler
scheduleNextGameReset();

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/login', (req, res) => {
    const { loginId, password } = req.body;
    const { account, role } = database.findAccountForLogin(loginId);
    if (account && account.password === password) {
        const fullAccount = database.findAccountById(account.id, role.toLowerCase() + 's');
        const token = jwt.sign({ id: account.id, role }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role, account: fullAccount });
    }
    res.status(401).json({ message: 'Invalid Account ID or Password.' });
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
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
});

app.post('/api/auth/reset-password', (req, res) => {
    const { accountId, contact, newPassword } = req.body;
    if (database.updatePassword(accountId, contact, newPassword)) res.json({ message: 'Success' });
    else res.status(404).json({ message: 'Invalid credentials' });
});

// --- PUBLIC DATA ---
app.get('/api/games', (req, res) => {
    res.json(database.getAllFromTable('games'));
});

// --- DATA ROUTES ---
app.get('/api/user/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    res.json({ 
        account: database.findAccountById(req.user.id, 'users'),
        games: database.getAllFromTable('games'), 
        bets: database.findBetsByUserId(req.user.id) 
    });
});

app.get('/api/dealer/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    res.json({ 
        account: database.findAccountById(req.user.id, 'dealers'),
        users: database.findUsersByDealerId(req.user.id), 
        bets: database.findBetsByDealerId(req.user.id) 
    });
});

app.get('/api/admin/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    res.json({
        account: database.findAccountById(req.user.id, 'admins'),
        dealers: database.getAllFromTable('dealers', true),
        users: database.getAllFromTable('users', true),
        games: database.getAllFromTable('games'),
        bets: database.getAllFromTable('bets')
    });
});

// --- ACTION ROUTES ---
app.post('/api/user/bets', authMiddleware, (req, res) => {
    if (req.user.role !== 'USER') return res.sendStatus(403);
    try { res.status(201).json(database.placeBulkBets(req.user.id, req.body.gameId, req.body.betGroups, 'USER')); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.post('/api/dealer/bets/bulk', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    if (!database.findUserByDealer(req.body.userId, req.user.id)) return res.status(403).json({ message: "Invalid user" });
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
    const userId = req.params.id;
    const dealerId = req.user.id;
    if (!userId) return res.status(400).json({ message: "User ID is required" });
    try { 
        const updatedUser = database.updateUser(req.body, userId, dealerId);
        res.json(updatedUser); 
    }
    catch (e) { 
        res.status(e.status || 500).json({ message: e.message }); 
    }
});

app.put('/api/admin/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { 
        const updatedUser = database.updateUserByAdmin(req.body, req.params.id);
        res.json(updatedUser); 
    }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.delete('/api/dealer/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { database.deleteUserByDealer(req.params.id, req.user.id); res.sendStatus(204); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/dealer/topup/user', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try {
        const dealer = database.findAccountById(req.user.id, 'dealers');
        const user = database.findUserByDealer(req.body.userId, req.user.id);
        if (!user || dealer.wallet < req.body.amount) throw { status: 400, message: "Invalid request" };
        database.runInTransaction(() => {
            database.addLedgerEntry(dealer.id, 'DEALER', `Top-Up for ${user.name}`, req.body.amount, 0);
            database.addLedgerEntry(user.id, 'USER', `Top-up from Dealer`, 0, req.body.amount);
        });
        res.json({ message: "Success" });
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/dealer/withdraw/user', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try {
        const dealer = database.findAccountById(req.user.id, 'dealers');
        const user = database.findUserByDealer(req.body.userId, req.user.id);
        if (!user || user.wallet < req.body.amount) throw { status: 400, message: "Invalid request" };
        database.runInTransaction(() => {
            database.addLedgerEntry(user.id, 'USER', `Withdrawal by Dealer`, req.body.amount, 0);
            database.addLedgerEntry(dealer.id, 'DEALER', `Withdrawn from ${user.name}`, 0, req.body.amount);
        });
        res.json({ message: "Success" });
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/dealer/users/:id/toggle-restriction', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.json(database.toggleUserRestrictionByDealer(req.params.id, req.user.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.get('/api/admin/summary', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    res.json(database.getFinancialSummary());
});

app.get('/api/admin/number-summary', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    res.json(database.getNumberStakeSummary(req.query));
});

app.post('/api/admin/dealers', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.status(201).json(database.createDealer(req.body)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/admin/dealers/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.updateDealer(req.body, req.params.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
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

app.put('/api/admin/games/:id/toggle-status', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.toggleGameStatus(req.params.id)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.post('/api/admin/topup/dealer', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        const admin = database.findAccountById('Guru', 'admins');
        const dealer = database.findAccountById(req.body.dealerId, 'dealers');
        if (!dealer) throw { status: 400, message: "Invalid dealer" };
        database.runInTransaction(() => {
            database.addLedgerEntry(admin.id, 'ADMIN', `Deposit for ${dealer.name}`, req.body.amount, 0);
            database.addLedgerEntry(dealer.id, 'DEALER', `Deposit from Admin`, 0, req.body.amount);
        });
        res.json({ message: "Success" });
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/admin/accounts/:type/:id/toggle-restriction', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.toggleAccountRestrictionByAdmin(req.params.id, req.params.type)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Database Connection and Server Start
database.connect();
database.verifySchema();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});