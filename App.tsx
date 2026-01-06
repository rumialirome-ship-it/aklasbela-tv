
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
        <header className="sticky top-0 z-40 bg-obsidian-950/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-black text-white text-xs">A</div>
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-white hidden md:block uppercase">AKLASBELA-TV</h1>
                        <p className="text-[9px] font-bold text-brand-500 tracking-widest uppercase">{role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        <span className="text-[10px] font-black text-white font-mono">PKR {account.wallet.toLocaleString()}</span>
                    </div>
                    <button onClick={logout} className="text-[10px] font-black text-obsidian-400 hover:text-red-500 uppercase tracking-widest transition-colors">Terminate</button>
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
        document.title = role ? `${role} | Terminal` : `AKLASBELA-TV Exchange`;
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
        <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
            <div className="text-white font-black text-xl animate-pulse tracking-widest uppercase">Initializing Exchange...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-obsidian-950 selection:bg-brand-600 selection:text-white">
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
