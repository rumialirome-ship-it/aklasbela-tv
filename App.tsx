
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, User, Dealer, Admin, Game, Bet, LedgerEntry, SubGameType, PrizeRates } from './types';
import { Icons, GAME_LOGOS } from './constants';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import DealerPanel from './components/DealerPanel';
import UserPanel from './components/UserPanel';
import ResultRevealOverlay from './components/ResultRevealOverlay';
import { AuthProvider, useAuth } from './hooks/useAuth';

const Header: React.FC = () => {
    const { role, account, logout } = useAuth();
    if (!role || !account) return null;

    return (
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-3xl border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center h-28">
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-full bg-accent-indigo flex items-center justify-center font-black text-white text-3xl shadow-2xl shadow-indigo-500/30 border-4 border-white transition-transform hover:scale-110">A</div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900 hidden md:block uppercase leading-none">AKLASBELA<span className="text-accent-indigo">.</span>TV</h1>
                        <p className="text-[11px] font-black text-slate-400 tracking-[0.6em] uppercase mt-2">{role} ENVIRONMENT</p>
                    </div>
                </div>
                <div className="flex items-center gap-12">
                    <div className="hidden sm:flex items-center bg-slate-50 px-10 py-4 rounded-full border border-slate-100 shadow-inner">
                        <span className="text-[13px] font-black text-slate-400 font-mono tracking-[0.3em] uppercase mr-6 opacity-80">Credits</span>
                        <span className="text-xl font-black text-slate-900 font-mono tracking-tight">PKR {account.wallet.toLocaleString()}</span>
                    </div>
                    <button onClick={logout} className="text-[12px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-[0.4em] transition-all flex items-center gap-4 group">
                        <span className="hidden group-hover:block transition-all opacity-0 group-hover:opacity-100">LOGOUT</span>
                        <div className="p-3 bg-white rounded-full border border-slate-200 group-hover:bg-rose-50 group-hover:border-rose-100 shadow-sm">
                            {Icons.close}
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

const AppContent: React.FC = () => {
    const { role, account, loading, fetchWithAuth, verifyData, setAccount } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [hasInitialFetched, setHasInitialFetched] = useState(false);
    const [activeReveal, setActiveReveal] = useState<{ name: string; number: string } | null>(null);
    const lastGamesRef = useRef<Game[]>([]);

    useEffect(() => {
        document.title = role ? `${role} Terminal | AKLASBELA.TV` : `AKLASBELA.TV | Digital Exchange`;
    }, [role]);

    const fetchPublicData = useCallback(async () => {
        try {
            const res = await fetch('/api/games');
            if (res.ok) {
                const data = await res.json();
                setGames(data);
            }
        } catch (e) {}
    }, []);

    const fetchPrivateData = useCallback(async () => {
        if (!role) return;
        try {
            const endpoint = role === Role.Admin ? '/api/admin/data' : (role === Role.Dealer ? '/api/dealer/data' : '/api/user/data');
            const res = await fetchWithAuth(endpoint);
            if (res.ok) {
                const data = await res.json();
                if (data.account) setAccount(data.account);
                if (data.users) setUsers(data.users);
                if (data.dealers) setDealers(data.dealers);
                if (data.bets) setBets(data.bets);
                setHasInitialFetched(true);
            }
        } catch (e) {}
    }, [role, fetchWithAuth, setAccount]);

    useEffect(() => {
        fetchPublicData();
        const i = setInterval(fetchPublicData, 10000);
        return () => clearInterval(i);
    }, [fetchPublicData]);

    useEffect(() => {
        if (role) {
            fetchPrivateData();
            const i = setInterval(fetchPrivateData, 5000);
            return () => clearInterval(i);
        }
    }, [role, fetchPrivateData]);

    useEffect(() => {
        if (games.length > 0 && lastGamesRef.current.length > 0) {
            games.forEach(ng => {
                const og = lastGamesRef.current.find(g => g.id === ng.id);
                // Simple check for new winners
                if (ng.winningNumber && !ng.winningNumber.endsWith('_') && (!og?.winningNumber || og.winningNumber.endsWith('_'))) {
                    setActiveReveal({ name: ng.name, number: ng.winningNumber });
                }
            });
        }
        lastGamesRef.current = games;
    }, [games]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/10">
                <div className="h-full bg-indigo-500 w-1/4 animate-shimmer-light"></div>
            </div>
            <div className="w-24 h-24 border-8 border-slate-100 border-t-accent-indigo rounded-full animate-spin mb-10 shadow-2xl shadow-indigo-500/10"></div>
            <div className="text-slate-900 font-black text-3xl tracking-[1em] uppercase animate-pulse drop-shadow-sm">Synchronizing Node...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-brand-500 selection:text-white transition-colors duration-1000">
            <div className="animated-bg"></div>
            {!role || !account ? (
                <LandingPage games={games.filter(g => g.isActive)} />
            ) : (
                <>
                    <Header />
                    <main className="relative z-10">
                        {role === Role.User && <UserPanel user={account as User} games={games.filter(g => g.isActive)} bets={bets} placeBet={async d => { await fetchWithAuth('/api/user/bets', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); }} />}
                        {role === Role.Dealer && <DealerPanel dealer={account as Dealer} users={users} onSaveUser={async (u,o,i) => {}} onDeleteUser={async u => {}} topUpUserWallet={async (id,a) => {}} withdrawFromUserWallet={async (id,a) => {}} toggleAccountRestriction={u => {}} bets={bets} games={games} placeBetAsDealer={async d => {}} />}
                        {role === Role.Admin && <AdminPanel admin={account as Admin} dealers={dealers} onSaveDealer={async d => {}} users={users} setUsers={setUsers} games={games} bets={bets} declareWinner={async (i,n) => {}} updateWinner={async (i,n) => {}} approvePayouts={async i => {}} topUpDealerWallet={async (i,a) => {}} withdrawFromDealerWallet={async (i,a) => {}} toggleAccountRestriction={async (i,t) => {}} onPlaceAdminBets={async d => {}} updateGameDrawTime={async (i,t) => {}} onRefreshData={fetchPrivateData} />}
                    </main>
                </>
            )}
            {activeReveal && <ResultRevealOverlay gameName={activeReveal.name} winningNumber={activeReveal.number} onClose={() => setActiveReveal(null)} />}
        </div>
    );
};

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
