
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
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-24">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-accent-indigo flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30">A</div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter text-slate-900 hidden md:block uppercase">AKLASBELA-TV</h1>
                        <p className="text-[10px] font-black text-accent-indigo tracking-[0.4em] uppercase">{role} ACCESS</p>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="hidden sm:flex items-center bg-slate-50 px-8 py-3 rounded-full border border-slate-100 shadow-inner">
                        <span className="text-[12px] font-black text-slate-400 font-mono tracking-widest uppercase mr-4 opacity-70">Credits</span>
                        <span className="text-base font-black text-slate-900 font-mono">PKR {account.wallet.toLocaleString()}</span>
                    </div>
                    <button onClick={logout} className="text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-all flex items-center gap-3 group">
                        <span className="hidden group-hover:block transition-all">TERMINATE SESSION</span>
                        <div className="p-2 bg-slate-50 rounded-full border border-slate-100 group-hover:bg-rose-50 group-hover:border-rose-100">
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
        document.title = role ? `${role} | Terminal` : `AKLASBELA-TV EXCHANGE`;
    }, [role]);

    const fetchPublicData = useCallback(async () => {
        try {
            const res = await fetch('/api/games');
            if (res.ok) setGames(await res.json());
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
                if (ng.winningNumber && !ng.winningNumber.endsWith('_') && (!og?.winningNumber || og.winningNumber.endsWith('_'))) {
                    setActiveReveal({ name: ng.name, number: ng.winningNumber });
                }
            });
        }
        lastGamesRef.current = games;
    }, [games]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-8 border-brand-100 border-t-brand-500 rounded-full animate-spin mb-6"></div>
            <div className="text-slate-900 font-black text-2xl tracking-[0.8em] uppercase animate-pulse">Establishing Node Link...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-brand-500 selection:text-white">
            <div className="animated-bg"></div>
            {!role || !account ? (
                <LandingPage games={games.filter(g => g.isActive)} />
            ) : (
                <>
                    <Header />
                    <main>
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
