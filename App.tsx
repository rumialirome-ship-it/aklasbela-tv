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

    const roleColors: { [key in Role]: string } = {
        [Role.Admin]: 'bg-red-900/40 text-red-300 border-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.3)]',
        [Role.Dealer]: 'bg-rose-900/40 text-rose-100 border-rose-600/40 shadow-[0_0_15px_rgba(190,24,93,0.2)]',
        [Role.User]: 'bg-rose-800/20 text-rose-300 border-rose-800/40',
    };

    return (
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-rose-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
                <div className="flex items-center gap-4">
                    {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt={account.name} className="w-12 h-12 rounded-full object-cover border-2 border-rose-600/50 shadow-lg shadow-black/50" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-rose-950 border-2 border-rose-600/50 flex items-center justify-center">
                            <span className="font-bold text-xl text-rose-300">{account.name ? account.name.charAt(0) : '?'}</span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-black hidden md:block tracking-tighter uppercase">AKLASBELA-TV</h1>
                         <div className="flex items-center text-[10px] mt-1">
                            <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-widest mr-2 border ${roleColors[role] || 'bg-slate-700'}`}>{role}</span>
                            <span className="text-rose-100/60 font-bold tracking-[0.2em] uppercase">{account.name || 'TERMINAL'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                     { typeof account.wallet === 'number' && (
                        <div className="hidden md:flex items-center bg-black/20 px-5 py-2.5 rounded-xl border border-rose-900/30 shadow-inner">
                            <span className="h-4 w-4 mr-3 text-red-600">{Icons.wallet}</span>
                            <span className="font-black text-rose-50 text-xl tracking-tight font-mono">PKR {account.wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <button onClick={logout} className="bg-red-950/20 border border-red-900/50 hover:bg-red-600 hover:text-white text-red-500 font-black px-6 py-2.5 rounded-xl transition-all duration-500 text-[10px] uppercase tracking-widest">Logout</button>
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
        document.title = role ? `Terminal | AKLASBELA-TV` : `AKLASBELA-TV | Digital Exchange`;
    }, [role]);

    const parseAllDates = (data: any) => {
        if (!data) return data;
        const parseLedger = (ledger: LedgerEntry[] = []) => ledger.map(e => ({...e, timestamp: new Date(e.timestamp)}));
        if (data.users && Array.isArray(data.users)) data.users = data.users.map((u: User) => u ? ({...u, ledger: parseLedger(u.ledger)}) : null).filter(Boolean);
        if (data.dealers && Array.isArray(data.dealers)) data.dealers = data.dealers.map((d: Dealer) => d ? ({...d, ledger: parseLedger(d.ledger)}) : null).filter(Boolean);
        if (data.bets && Array.isArray(data.bets)) data.bets = data.bets.map((b: Bet) => ({...b, timestamp: new Date(b.timestamp)}));
        if (data.account && data.account.ledger) data.account.ledger = parseLedger(data.account.ledger);
        return data;
    };

    const fetchPublicData = useCallback(async () => {
        try {
            const gamesResponse = await fetch('/api/games');
            if (gamesResponse.ok) setGames(await gamesResponse.json());
        } catch (e) {}
    }, []);

    const fetchPrivateData = useCallback(async () => {
        if (!role) return;
        try {
            const endpoint = role === Role.Admin ? '/api/admin/data' : (role === Role.Dealer ? '/api/dealer/data' : '/api/user/data');
            const response = await fetchWithAuth(endpoint);
            if (response.ok) {
                const parsedData = parseAllDates(await response.json());
                if (parsedData.account) setAccount(parsedData.account);
                if (role === Role.Admin) { setUsers(parsedData.users); setDealers(parsedData.dealers); setBets(parsedData.bets); }
                else if (role === Role.Dealer) { setUsers(parsedData.users); setBets(parsedData.bets); }
                else { setBets(parsedData.bets); }
                setHasInitialFetched(true);
            }
        } catch (error) {
            console.error("Fetch error", error);
        }
    }, [role, fetchWithAuth, setAccount]);

    useEffect(() => {
        if (!loading && verifyData) {
            const parsed = parseAllDates(verifyData);
            if (parsed.users) setUsers(parsed.users);
            if (parsed.dealers) setDealers(parsed.dealers);
            if (parsed.bets) setBets(parsed.bets);
            setHasInitialFetched(true);
        }
    }, [loading, verifyData]);

    useEffect(() => {
        fetchPublicData();
        const interval = setInterval(fetchPublicData, 5000);
        return () => clearInterval(interval);
    }, [fetchPublicData]);

    useEffect(() => {
        if (role) {
            if (!hasInitialFetched) fetchPrivateData();
            const interval = setInterval(fetchPrivateData, 3000);
            return () => clearInterval(interval);
        } else {
            setHasInitialFetched(false);
            setUsers([]); setBets([]); setDealers([]);
        }
    }, [role, fetchPrivateData]);

    useEffect(() => {
        if (games.length > 0 && lastGamesRef.current.length > 0) {
            games.forEach(newGame => {
                const oldGame = lastGamesRef.current.find(g => g.id === newGame.id);
                if (newGame.winningNumber && !newGame.winningNumber.endsWith('_') && (!oldGame?.winningNumber || oldGame.winningNumber.endsWith('_'))) {
                    setActiveReveal({ name: newGame.name, number: newGame.winningNumber });
                }
            });
        }
        lastGamesRef.current = games;
    }, [games]);

    const placeBet = async (d: any) => { await fetchWithAuth('/api/user/bets', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); };
    const placeBetAsDealer = async (d: any) => { await fetchWithAuth('/api/dealer/bets/bulk', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); };
    
    const onSaveUser = async (u: any, o: any, i: any) => {
        const method = o ? 'PUT' : 'POST';
        const url = o ? `/api/dealer/users/${o}` : '/api/dealer/users';
        const response = await fetchWithAuth(url, { method, body: JSON.stringify(o ? u : { userData: u, initialDeposit: i }) });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Operation failed');
        }
        fetchPrivateData();
    };

    const onDeleteUser = async (uId: string) => {
        const response = await fetchWithAuth(`/api/dealer/users/${uId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete user");
        fetchPrivateData();
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0202]">
            <div className="text-rose-500 text-2xl font-black uppercase tracking-[0.5em] animate-pulse mb-4">AKLASBELA-TV</div>
            <div className="text-rose-900 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Network...</div>
        </div>
    );

    const visibleGames = role === Role.Admin ? games : games.filter(g => g.isActive);

    return (
        <div className="min-h-screen flex flex-col selection:bg-rose-500 selection:text-white bg-[#0a0202]">
            {!role || !account ? (
                <LandingPage games={games.filter(g => g.isActive)} />
            ) : (
                <>
                    <Header />
                    <main className="flex-grow pb-12">
                        {role === Role.User && <UserPanel user={account as User} games={visibleGames} bets={bets} placeBet={placeBet} />}
                        {role === Role.Dealer && (
                            <DealerPanel 
                                dealer={account as Dealer} users={users} 
                                onSaveUser={onSaveUser} 
                                onDeleteUser={onDeleteUser}
                                topUpUserWallet={async (id, amt) => { await fetchWithAuth('/api/dealer/topup/user', { method: 'POST', body: JSON.stringify({ userId: id, amount: amt }) }); fetchPrivateData(); }} 
                                withdrawFromUserWallet={async (id, amt) => { await fetchWithAuth('/api/dealer/withdraw/user', { method: 'POST', body: JSON.stringify({ userId: id, amount: amt }) }); fetchPrivateData(); }} 
                                toggleAccountRestriction={async (id) => { await fetchWithAuth(`/api/dealer/users/${id}/toggle-restriction`, { method: 'PUT' }); fetchPrivateData(); }} 
                                bets={bets} games={visibleGames} placeBetAsDealer={placeBetAsDealer} isLoaded={hasInitialFetched}
                            />
                        )}
                        {role === Role.Admin && (
                            <AdminPanel 
                                admin={account as Admin} dealers={dealers} 
                                onSaveDealer={async (d, o) => { const url = o ? `/api/admin/dealers/${o}` : '/api/admin/dealers'; await fetchWithAuth(url, { method: o ? 'PUT' : 'POST', body: JSON.stringify(d) }); fetchPrivateData(); }} 
                                users={users} setUsers={setUsers} games={visibleGames} bets={bets} 
                                declareWinner={async (id, num) => { await fetchWithAuth(`/api/admin/games/${id}/declare-winner`, { method: 'POST', body: JSON.stringify({ winningNumber: num }) }); fetchPrivateData(); }}
                                updateWinner={async (id, num) => { await fetchWithAuth(`/api/admin/games/${id}/update-winner`, { method: 'PUT', body: JSON.stringify({ newWinningNumber: num }) }); fetchPrivateData(); }}
                                approvePayouts={async (id) => { await fetchWithAuth(`/api/admin/games/${id}/approve-payouts`, { method: 'POST' }); fetchPrivateData(); }}
                                topUpDealerWallet={async (id, amt) => { await fetchWithAuth('/api/admin/topup/dealer', { method: 'POST', body: JSON.stringify({ dealerId: id, amount: amt }) }); fetchPrivateData(); }}
                                withdrawFromDealerWallet={async (id, amt) => { await fetchWithAuth('/api/admin/withdraw/dealer', { method: 'POST', body: JSON.stringify({ dealerId: id, amount: amt }) }); fetchPrivateData(); }}
                                toggleAccountRestriction={async (id, type) => { await fetchWithAuth(`/api/admin/accounts/${type}/${id}/toggle-restriction`, { method: 'PUT' }); fetchPrivateData(); }}
                                onPlaceAdminBets={async (d) => { await fetchWithAuth('/api/admin/bulk-bet', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); }}
                                updateGameDrawTime={async (id, time) => { await fetchWithAuth(`/api/admin/games/${id}/draw-time`, { method: 'PUT', body: JSON.stringify({ newDrawTime: time }) }); fetchPrivateData(); }}
                                onRefreshData={fetchPrivateData} 
                            />
                        )}
                    </main>
                </>
            )}
            {activeReveal && <ResultRevealOverlay gameName={activeReveal.name} winningNumber={activeReveal.number} onClose={() => setActiveReveal(null)} />}
        </div>
    );
};

function App() { return (<div className="App bg-transparent text-rose-50 h-full"><AuthProvider><AppContent /></AuthProvider></div>); }
export default App;