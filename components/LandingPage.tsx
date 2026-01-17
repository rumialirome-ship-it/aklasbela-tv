
import React, { useState } from 'react';
import { Game } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { Icons, GAME_LOGOS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const formatTime12h = (time24: string) => {
    if (!time24) return '--:--';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const ResultsTicker: React.FC<{ games: Game[] }> = ({ games }) => {
    const activeWinners = games.filter(g => g.winningNumber && !g.winningNumber.endsWith('_'));
    if (activeWinners.length === 0) return null;

    return (
        <div className="bg-slate-900/80 border-b border-white/5 py-5 overflow-hidden backdrop-blur-2xl">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...activeWinners, ...activeWinners].map((game, i) => (
                    <div key={i} className="flex items-center px-12 sm:px-24 border-r border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mr-8">{game.name}</span>
                        <span className="text-3xl sm:text-5xl font-mono font-black text-white tracking-tighter">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 35s linear infinite; }
            `}</style>
        </div>
    );
};

const GameNodeOrb: React.FC<{ game: Game }> = ({ game }) => {
    const countdown = useCountdown(game.drawTime);
    const hasResult = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isClosed = !game.isMarketOpen;
    const logo = GAME_LOGOS[game.name] || '';

    return (
        <div className="group relative circular-game-card p-6 sm:p-10 md:p-12">
            {/* Pulsing ring for active sessions */}
            {!hasResult && !isClosed && countdown.status === 'OPEN' && (
                <div className="absolute inset-0 border-2 border-accent-indigo/40 rounded-full animate-pulse-glow"></div>
            )}
            
            <div className="relative mb-4 sm:mb-6 md:mb-8 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 z-10 shrink-0">
                <div className="absolute inset-0 bg-accent-indigo/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border border-white/10 p-1.5 bg-slate-900 group-hover:scale-110 transition-transform duration-700 shadow-2xl" />
            </div>

            <div className="text-center relative z-10 w-full px-2">
                <h3 className="text-xs sm:text-sm md:text-xl font-bold text-white mb-1 md:mb-2 uppercase tracking-tight group-hover:text-accent-indigo transition-colors duration-500">{game.name}</h3>
                
                {hasResult ? (
                    <div className="mt-1">
                        <span className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-accent-emerald font-black">WINNER</span>
                        <div className="text-xl sm:text-3xl md:text-5xl font-mono font-black text-white leading-none tracking-tighter">{game.winningNumber}</div>
                    </div>
                ) : isClosed ? (
                    <div className="mt-3 py-1.5 px-4 bg-white/5 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">Closed</div>
                ) : (
                    <div className="mt-1">
                        <div className={`text-base sm:text-2xl md:text-4xl font-mono font-black tracking-tighter leading-none ${countdown.status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-600'}`}>
                            {countdown.text}
                        </div>
                        <div className="text-[10px] sm:text-[12px] md:text-[14px] uppercase tracking-[0.3em] text-white font-black mt-2 opacity-90">
                           {formatTime12h(game.drawTime)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LandingPage: React.FC<{ games: Game[] }> = ({ games }) => {
    const { login } = useAuth();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginId || !password) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await login(loginId, password);
        } catch (err) {
            setError("AUTHENTICATION_FAILED: ACCESS_DENIED");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian flex flex-col selection:bg-accent-indigo/30">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-8 sm:px-12 py-16 sm:py-32 w-full flex-grow relative overflow-hidden">
                {/* Tactical Depth Glows */}
                <div className="absolute top-20 left-1/4 w-[800px] h-[800px] bg-indigo-600/[0.03] blur-[150px] rounded-full"></div>
                <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-cyan-600/[0.03] blur-[150px] rounded-full"></div>

                <header className="text-center mb-24 sm:mb-40 relative z-10 animate-fade-in">
                    <div className="inline-block px-8 py-3 rounded-full bg-slate-900 border border-white/5 text-[11px] font-black text-accent-indigo uppercase tracking-[0.6em] mb-12 shadow-2xl">
                        Aklasbela Protocol Terminal v4.2
                    </div>
                    <h1 className="text-6xl sm:text-9xl md:text-[10rem] lg:text-[14rem] font-bold tracking-tighter uppercase leading-[0.8] mb-10 text-white">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <p className="text-slate-500 font-bold tracking-[1.5em] sm:tracking-[2em] uppercase text-[10px] sm:text-base opacity-40">Decentralized Asset Node</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32 items-start relative z-10">
                    {/* Security Login Card */}
                    <div className="lg:col-span-4 order-2 lg:order-1">
                        <div className="card border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-accent-indigo opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-12 tracking-tight uppercase text-white">Identity Link</h2>
                            <form onSubmit={handleLogin} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block px-2">Node Identifier</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="h-16 sm:h-20 text-center tracking-[0.3em] font-bold uppercase text-lg" placeholder="TERMINAL_00"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block px-2">Access PIN</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="h-16 sm:h-20 text-center font-bold text-lg" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="py-5 bg-accent-rose/10 border border-accent-rose/20 rounded-2xl text-[11px] text-accent-rose font-bold text-center uppercase tracking-widest animate-pulse">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-16 sm:h-20 mt-6">
                                    {isSubmitting ? 'Syncing...' : 'Establish Secure Link'}
                                </button>
                            </form>
                            
                            <div className="mt-16 pt-10 border-t border-white/5 text-center">
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] italic">
                                    Encrypted Multi-Node Verification Active
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Market Nodes Feed */}
                    <div className="lg:col-span-8 order-1 lg:order-2">
                        <div className="flex items-center gap-10 mb-16 sm:mb-24">
                            <h2 className="text-sm sm:text-base font-black uppercase tracking-[1em] text-white whitespace-nowrap">Live Market</h2>
                            <div className="h-px flex-grow bg-white/5"></div>
                            <div className="flex items-center gap-4">
                                <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em]">ONLINE</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-16">
                            {games.map(game => (
                                <GameNodeOrb key={game.id} game={game} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="mt-48 py-20 border-t border-white/5 text-center">
                    <p className="text-[11px] sm:text-sm font-black text-slate-700 uppercase tracking-[1.5em]">
                        &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL EXCHANGE SYSTEM • PROTECTED BY OPS_CORE
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
