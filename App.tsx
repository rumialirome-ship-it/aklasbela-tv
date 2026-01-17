
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
        <header className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 flex justify-between items-center h-20 sm:h-28">
                <div className="flex items-center gap-4 sm:gap-8 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-2xl bg-accent-indigo flex items-center justify-center font-bold text-white text-lg sm:text-3xl shadow-2xl shadow-accent-indigo/30 border border-white/10 transition-all group-hover:scale-105 group-hover:rotate-6">AB</div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tighter text-white hidden xs:block uppercase leading-none">AKLASBELA<span className="text-accent-indigo">.</span>TV</h1>
                        <p className="text-[9px] sm:text-[11px] font-bold text-slate-500 tracking-[0.6em] uppercase mt-1.5 opacity-60">Authorized Access: {role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-10">
                    <div className="hidden md:flex items-center bg-slate-900/80 px-8 py-4 rounded-xl border border-white/5 shadow-inner">
                        <span className="text-[11px] font-bold text-slate-600 font-mono tracking-widest uppercase mr-6 opacity-70">Vault</span>
                        <span className="text-lg font-bold text-white font-mono tracking-tighter">PKR {account.wallet.toLocaleString()}</span>
                    </div>
                    <button onClick={logout} className="text-[10px] sm:text-[12px] font-bold text-slate-500 hover:text-accent-rose uppercase tracking-[0.4em] transition-all flex items-center gap-3 sm:gap-5 group">
                        <span className="hidden sm:group-hover:block transition-all opacity-0 group-hover:opacity-100 text-rose-500">Disconnect</span>
                        <div className="p-2.5 sm:p-3 bg-slate-900 rounded-xl border border-white/5 group-hover:bg-accent-rose/10 group-hover:border-accent-rose/20 shadow-sm transition-transform group-hover:scale-110">
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
        document.title = role ? `${role} Portal | AKLASBELA.TV` : `AKLASBELA.TV | Institutional Exchange`;
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

    // --- HANDLERS ---
    const handleSaveUser = async (u: User, originalId?: string, initialDeposit?: number) => {
        const method = originalId ? 'PUT' : 'POST';
        const url = originalId ? `/api/dealer/users/${originalId}` : '/api/dealer/users';
        await fetchWithAuth(url, { 
            method, 
            body: JSON.stringify({ user: u, initialDeposit }) 
        });
        fetchPrivateData();
    };

    const handleDeleteUser = async (uId: string) => {
        if (!confirm('Permanent deletion of agent record?')) return;
        await fetchWithAuth(`/api/dealer/users/${uId}`, { method: 'DELETE' });
        fetchPrivateData();
    };

    const handleWalletUpdate = async (type: 'USER' | 'DEALER', id: string, amount: number, action: 'TOPUP' | 'WITHDRAW') => {
        const endpoint = `/api/${role.toLowerCase()}/wallet/${action.toLowerCase()}`;
        await fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify({ accountId: id, accountType: type, amount })
        });
        fetchPrivateData();
    };

    const handleToggleRestriction = async (id: string, type: 'user' | 'dealer') => {
        await fetchWithAuth(`/api/${role.toLowerCase()}/restrict/${type}/${id}`, { method: 'POST' });
        fetchPrivateData();
    };

    const handleDealerTerminalBet = async (details: any) => {
        await fetchWithAuth('/api/dealer/bets', {
            method: 'POST',
            body: JSON.stringify(details)
        });
        fetchPrivateData();
    };

    const handleDeclareWinner = async (gameId: string, num: string) => {
        await fetchWithAuth('/api/admin/games/winner', {
            method: 'POST',
            body: JSON.stringify({ gameId, winningNumber: num })
        });
        fetchPublicData();
        fetchPrivateData();
    };

    const handleApprovePayouts = async (gameId: string) => {
        await fetchWithAuth('/api/admin/games/approve', {
            method: 'POST',
            body: JSON.stringify({ gameId })
        });
        fetchPublicData();
        fetchPrivateData();
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <div className="h-full bg-accent-indigo w-1/4 animate-shimmer"></div>
            </div>
            <div className="w-16 h-16 sm:w-24 sm:h-24 border-[8px] border-white/5 border-t-accent-indigo rounded-full animate-spin mb-10 shadow-xl shadow-accent-indigo/10"></div>
            <div className="text-white font-bold text-xl sm:text-2xl tracking-[0.8em] uppercase animate-pulse">Syncing Mainframe...</div>
        </div>
    );

    return (
        <div className="min-h-screen transition-colors duration-700 bg-obsidian">
            <div className="animated-bg"></div>
            {!role || !account ? (
                <LandingPage games={games.filter(g => g.isActive)} />
            ) : (
                <div className="flex flex-col min-h-screen relative z-10">
                    <Header />
                    <main className="flex-grow">
                        {role === Role.User && (
                            <UserPanel 
                                user={account as User} 
                                games={games.filter(g => g.isActive)} 
                                bets={bets} 
                                placeBet={async d => { await fetchWithAuth('/api/user/bets', { method: 'POST', body: JSON.stringify(d) }); fetchPrivateData(); }} 
                            />
                        )}
                        {role === Role.Dealer && (
                            <DealerPanel 
                                dealer={account as Dealer} 
                                users={users} 
                                onSaveUser={handleSaveUser} 
                                onDeleteUser={handleDeleteUser} 
                                topUpUserWallet={(id, a) => handleWalletUpdate('USER', id, a, 'TOPUP')} 
                                withdrawFromUserWallet={(id, a) => handleWalletUpdate('USER', id, a, 'WITHDRAW')} 
                                toggleAccountRestriction={(id) => handleToggleRestriction(id, 'user')} 
                                bets={bets} 
                                games={games.filter(g => g.isActive)} 
                                placeBetAsDealer={handleDealerTerminalBet} 
                            />
                        )}
                        {role === Role.Admin && (
                            <AdminPanel 
                                admin={account as Admin} 
                                dealers={dealers} 
                                onSaveDealer={async (d, o) => { 
                                    const method = o ? 'PUT' : 'POST';
                                    await fetchWithAuth(`/api/admin/dealers${o ? `/${o}` : ''}`, { method, body: JSON.stringify(d) });
                                    fetchPrivateData();
                                }} 
                                users={users} 
                                setUsers={setUsers} 
                                games={games} 
                                bets={bets} 
                                declareWinner={handleDeclareWinner} 
                                updateWinner={handleDeclareWinner} 
                                approvePayouts={handleApprovePayouts} 
                                topUpDealerWallet={(id, a) => handleWalletUpdate('DEALER', id, a, 'TOPUP')} 
                                withdrawFromDealerWallet={(id, a) => handleWalletUpdate('DEALER', id, a, 'WITHDRAW')} 
                                toggleAccountRestriction={handleToggleRestriction} 
                                onPlaceAdminBets={async d => {}} 
                                updateGameDrawTime={async (id, time) => {
                                    await fetchWithAuth(`/api/admin/games/${id}/time`, { method: 'POST', body: JSON.stringify({ drawTime: time }) });
                                    fetchPublicData();
                                }} 
                                onRefreshData={fetchPrivateData} 
                            />
                        )}
                    </main>
                </div>
            )}
            {activeReveal && <ResultRevealOverlay gameName={activeReveal.name} winningNumber={activeReveal.number} onClose={() => setActiveReveal(null)} />}
        </div>
    );
};

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
