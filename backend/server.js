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
const PORT = process.env.PORT || 3000;

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

// --- HEALTH & STATUS ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        port: PORT,
        dbConnected: true,
        uptime: process.uptime(), 
        timestamp: new Date().toISOString()
    });
});

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
        console.error('Login Error:', e);
        res.status(500).json({ message: 'Server error during login' });
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
        console.error('Verify Error:', e);
        res.status(500).json({ message: 'Verification error' });
    }
});

// --- PUBLIC DATA ---
app.get('/api/games', (req, res) => {
    try { res.json(database.getAllFromTable('games')); }
    catch (e) { 
        console.error('API Error /api/games:', e);
        res.status(500).json({ message: 'Failed to fetch games' }); 
    }
});

// --- USER PRIVATE ROUTES ---
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

// --- DEALER PRIVATE ROUTES ---
app.get('/api/dealer/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try {
        res.json({ 
            account: database.findAccountById(req.user.id, 'dealers'), 
            users: database.findUsersByDealerId(req.user.id), 
            bets: database.findBetsByDealerId(req.user.id) 
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/dealer/users', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.status(201).json(database.createUser(req.body.userData, req.user.id, req.body.initialDeposit)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.put('/api/dealer/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.json(database.updateUser(req.body, req.params.id, req.user.id)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.delete('/api/dealer/users/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.json(database.deleteUserByDealer(req.params.id, req.user.id)); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

app.post('/api/dealer/topup/user', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try {
        database.runInTransaction(() => {
            database.addLedgerEntry(req.user.id, 'DEALER', `Transfer to ${req.body.userId}`, req.body.amount, 0);
            database.addLedgerEntry(req.body.userId, 'USER', `Deposit from Dealer`, 0, req.body.amount);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/dealer/withdraw/user', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try {
        database.runInTransaction(() => {
            database.addLedgerEntry(req.body.userId, 'USER', `Withdrawal by Dealer`, req.body.amount, 0);
            database.addLedgerEntry(req.user.id, 'DEALER', `Collection from ${req.body.userId}`, 0, req.body.amount);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/dealer/users/:id/toggle-restriction', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.json(database.toggleUserRestrictionByDealer(req.params.id, req.user.id)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/dealer/bets/bulk', authMiddleware, (req, res) => {
    if (req.user.role !== 'DEALER') return res.sendStatus(403);
    try { res.status(201).json(database.placeBulkBets(req.body.userId, req.body.gameId, req.body.betGroups, 'DEALER')); }
    catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

// --- ADMIN PRIVATE ROUTES ---
app.get('/api/admin/data', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        res.json({ 
            account: database.findAccountById(req.user.id, 'admins'), 
            dealers: database.getAllFromTable('dealers', true), 
            users: database.getAllFromTable('users', true), 
            games: database.getAllFromTable('games'), 
            bets: database.getAllFromTable('bets') 
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/summary', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.getFinancialSummary()); }
    catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/admin/dealers', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.status(201).json(database.createDealer(req.body)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/admin/dealers/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.updateDealer(req.body, req.params.id)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/admin/topup/dealer', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        database.runInTransaction(() => {
            database.addLedgerEntry(req.user.id, 'ADMIN', `Deposit for ${req.body.dealerId}`, req.body.amount, 0);
            database.addLedgerEntry(req.body.dealerId, 'DEALER', `Deposit from Admin`, 0, req.body.amount);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/admin/withdraw/dealer', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        database.runInTransaction(() => {
            database.addLedgerEntry(req.body.dealerId, 'DEALER', `Withdrawal by Admin`, req.body.amount, 0);
            database.addLedgerEntry(req.user.id, 'ADMIN', `Collection from ${req.body.dealerId}`, 0, req.body.amount);
        });
        res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/admin/accounts/:type/:id/toggle-restriction', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.toggleAccountRestrictionByAdmin(req.params.id, req.params.type)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/admin/games/:id/declare-winner', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.declareWinnerForGame(req.params.id, req.body.winningNumber)); }
    catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

app.put('/api/admin/games/:id/update-winner', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.updateWinningNumber(req.params.id, req.body.newWinningNumber)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/admin/games/:id/approve-payouts', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.approvePayoutsForGame(req.params.id)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

app.put('/api/admin/games/:id/draw-time', authMiddleware, (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { res.json(database.updateGameDrawTime(req.params.id, req.body.newDrawTime)); }
    catch (e) { res.status(400).json({ message: e.message }); }
});

// --- STATIC FILES (FRONTEND) ---
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

console.log(`[INFO] Static files directory: ${distPath}`);
if (fs.existsSync(distPath)) {
    console.log(`[INFO] 'dist' folder found.`);
} else {
    console.warn(`[WARNING] 'dist' folder NOT FOUND at ${distPath}. Front-end will not load!`);
}

app.use(express.static(distPath));

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(500).send(`
            <html>
                <body style="font-family: sans-serif; background: #0a0202; color: #fecdd3; padding: 50px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh;">
                    <div style="max-width: 600px; border: 1px solid #881337; padding: 40px; border-radius: 24px; background: #450a0a20;">
                        <h1 style="color: #e11d48; font-size: 3rem; margin-bottom: 10px;">500 Internal Error</h1>
                        <h2 style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 1rem; color: #fda4af;">Missing UI Build Files</h2>
                        <hr style="border: none; border-top: 1px solid #881337; margin: 30px 0;" />
                        <p style="text-align: left; line-height: 1.6;">The backend is running, but it cannot find the website files at:</p>
                        <code style="display: block; background: black; padding: 15px; border-radius: 8px; font-family: monospace; color: #fb7185; margin: 15px 0; word-break: break-all;">${indexPath}</code>
                        <p style="font-weight: bold; margin-top: 30px; color: white;">⚡ QUICK FIX:</p>
                        <ol style="text-align: left; padding-left: 20px;">
                            <li>SSH into your VPS.</li>
                            <li>Navigate to the project root: <code>cd /var/www/html/aklasbela-tv/backend</code></li>
                            <li>Run: <code style="color: #f43f5e">npm run build</code></li>
                            <li>Then reload the app: <code>pm2 reload aklasbela-backend</code></li>
                        </ol>
                    </div>
                </body>
            </html>
        `);
    }
});

// --- DATABASE INIT ---
try {
    database.connect();
    database.verifySchema();
} catch (err) {
    console.error('FATAL Database Startup Error:', err);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AKLASBELA-TV] Operational on Port ${PORT}`);
});