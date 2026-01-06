
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, User, Dealer, Admin, Game, Bet } from './types';
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
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center h-24 sm:h-32">
                <div className="flex items-center gap-4 sm:gap-10 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-accent-indigo flex items-center justify-center font-bold text-white text-xl sm:text-4xl shadow-2xl shadow-indigo-500/40 border-4 border-white transition-all group-hover:scale-105 group-hover:rotate-12">AB</div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tighter text-slate-900 hidden xs:block uppercase leading-none">AKLASBELA<span className="text-accent-indigo">.</span>TV</h1>
                        <p className="text-[10px] sm:text-[12px] font-bold text-slate-400 tracking-[0.5em] sm:tracking-[0.8em] uppercase mt-1 sm:mt-3 opacity-60">Digital Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-12">
                    <div className="hidden md:flex items-center bg-slate-50/50 px-10 py-5 rounded-full border border-slate-100 shadow-inner">
                        <span className="text-[13px] font-bold text-slate-400 font-mono tracking-[0.4em] uppercase mr-8 opacity-70">Vault</span>
                        <span className="text-xl font-bold text-slate-900 font-mono tracking-tighter">PKR {account.wallet.toLocaleString()}</span>
                    </div>
                    <button onClick={logout} className="text-[10px] sm:text-[13px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-[0.4em] transition-all flex items-center gap-3 sm:gap-5 group">
                        <span className="hidden sm:group-hover:block transition-all opacity-0 group-hover:opacity-100">LOGOUT</span>
                        <div className="p-3 sm:p-4 bg-white rounded-full border border-slate-200 group-hover:bg-rose-50 group-hover:border-rose-100 shadow-sm transition-transform group-hover:scale-110">
                            {Icons.close}
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

const AppContent: React.FC = () => {
    const { role, account, loading, fetchWithAuth, setAccount } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [activeReveal, setActiveReveal] = useState<{ name: string; number: string } | null>(null);
    const lastGamesRef = useRef<Game[]>([]);

    useEffect(() => {
        document.title = role ? `${role} Portal | AKLASBELA.TV` : `AKLASBELA.TV | Exchange`;
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-accent-indigo w-1/4 animate-shimmer-light"></div>
            </div>
            <div className="w-20 h-20 sm:w-28 sm:h-28 border-[10px] border-slate-100 border-t-accent-indigo rounded-full animate-spin mb-10 shadow-xl shadow-indigo-500/10"></div>
            <div className="text-slate-900 font-bold text-2xl sm:text-3xl tracking-[1em] uppercase animate-pulse">Syncing...</div>
        </div>
    );

    return (
        <div className="min-h-screen transition-colors duration-700">
            <div className="animated-bg"></div>
            {!role || !account ? (
                <LandingPage games={games.filter(g => g.isActive)} />
            ) : (
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow relative z-10 overflow-x-hidden">
                        {role === Role.User && <UserPanel user={account as User} games={games.filter(g => g.isActive)} bets={bets} placeBet={async d => { await fetchWithAuth('/api/user/bets', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); }} />}
                        {role === Role.Dealer && <DealerPanel dealer={account as Dealer} users={users} onSaveUser={async (u,o,i) => {}} onDeleteUser={async u => {}} topUpUserWallet={async (id,a) => {}} withdrawFromUserWallet={async (id,a) => {}} toggleAccountRestriction={u => {}} bets={bets} games={games} placeBetAsDealer={async d => {}} />}
                        {role === Role.Admin && <AdminPanel admin={account as Admin} dealers={dealers} onSaveDealer={async d => {}} users={users} setUsers={setUsers} games={games} bets={bets} declareWinner={async (i,n) => {}} updateWinner={async (i,n) => {}} approvePayouts={async i => {}} topUpDealerWallet={async (i,a) => {}} withdrawFromDealerWallet={async (i,a) => {}} toggleAccountRestriction={async (i,t) => {}} onPlaceAdminBets={async d => {}} updateGameDrawTime={async (i,t) => {}} onRefreshData={fetchPrivateData} />}
                    </main>
                </div>
            )}
            {activeReveal && <ResultRevealOverlay gameName={activeReveal.name} winningNumber={activeReveal.number} onClose={() => setActiveReveal(null)} />}
        </div>
    );
};

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
