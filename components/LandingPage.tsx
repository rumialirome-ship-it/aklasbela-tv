
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
        <div className="bg-slate-950/90 border-b border-white/5 py-6 overflow-hidden backdrop-blur-3xl sticky top-0 z-50">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...activeWinners, ...activeWinners].map((game, i) => (
                    <div key={i} className="flex items-center px-16 sm:px-32 border-r border-white/10 group">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mr-8 group-hover:text-accent-indigo transition-colors">{game.name}</span>
                        <span className="text-3xl sm:text-6xl font-mono font-black text-white tracking-tighter text-glow">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 40s linear infinite; }
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
        <div className="group relative circular-game-card p-10 sm:p-14 lg:p-16 animate-fade-in">
            {/* Draw Time Header Badge */}
            <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-slate-950/80 border border-white/10 px-6 py-2 rounded-full shadow-2xl backdrop-blur-xl group-hover:border-accent-indigo/50 transition-colors">
                    <p className="text-[11px] sm:text-[13px] font-black text-accent-indigo uppercase tracking-[0.3em] leading-none">
                        {formatTime12h(game.drawTime)}
                    </p>
                </div>
            </div>

            {/* Pulsing ring for active sessions */}
            {!hasResult && !isClosed && countdown.status === 'OPEN' && (
                <div className="absolute inset-0 border-[4px] border-accent-indigo/20 rounded-full animate-pulse-glow"></div>
            )}
            
            <div className="relative mb-8 sm:mb-12 w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 z-10 shrink-0 mt-8">
                <div className="absolute inset-0 bg-accent-indigo/40 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border border-white/10 p-2.5 bg-slate-900 group-hover:scale-105 transition-transform duration-1000 shadow-2xl object-cover" />
            </div>

            <div className="text-center relative z-10 w-full px-6">
                <h3 className="text-lg sm:text-xl md:text-3xl font-black text-white mb-2 md:mb-4 uppercase tracking-tighter group-hover:text-accent-indigo transition-colors duration-700 line-clamp-1">{game.name}</h3>
                
                {hasResult ? (
                    <div className="mt-2">
                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.6em] text-accent-emerald font-black">WINNER_PUSHED</span>
                        <div className="text-3xl sm:text-6xl md:text-8xl font-mono font-black text-white leading-none tracking-tighter mt-2 text-glow">{game.winningNumber}</div>
                    </div>
                ) : isClosed ? (
                    <div className="mt-6 py-2.5 px-8 bg-white/5 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border border-white/5">Market Offline</div>
                ) : (
                    <div className="mt-2">
                        <p className="text-[10px] sm:text-[12px] text-slate-500 font-bold uppercase tracking-[0.5em] mb-3">Next Draw In</p>
                        <div className={`text-2xl sm:text-4xl md:text-6xl font-mono font-black tracking-tighter leading-none ${countdown.status === 'OPEN' ? 'text-white' : 'text-slate-600'}`}>
                            {countdown.text}
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
        <div className="min-h-screen bg-obsidian-950 flex flex-col selection:bg-accent-indigo/40">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-8 sm:px-16 py-20 sm:py-40 w-full flex-grow relative overflow-hidden">
                {/* Tactical Dynamic Background Effects */}
                <div className="absolute top-20 left-1/4 w-[1000px] h-[1000px] bg-accent-indigo/[0.05] blur-[180px] rounded-full animate-mesh-flow"></div>
                <div className="absolute bottom-20 right-1/4 w-[800px] h-[800px] bg-accent-violet/[0.05] blur-[180px] rounded-full animate-mesh-flow" style={{ animationDelay: '-10s' }}></div>

                <header className="text-center mb-32 sm:mb-52 relative z-10 animate-fade-in">
                    <div className="inline-block px-10 py-4 rounded-full bg-slate-900/50 border border-white/10 text-[11px] font-black text-accent-indigo uppercase tracking-[0.7em] mb-16 shadow-2xl backdrop-blur-2xl">
                        Aklasbela Protocol Terminal v4.2
                    </div>
                    <h1 className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[15rem] font-black tracking-tighter uppercase leading-[0.8] mb-12 text-white">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <div className="flex items-center justify-center gap-6 opacity-40">
                        <div className="h-px w-12 bg-slate-500"></div>
                        <p className="text-slate-400 font-bold tracking-[2.5em] uppercase text-xs">Decentralized Asset Node</p>
                        <div className="h-px w-12 bg-slate-500"></div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32 items-start relative z-10">
                    {/* Security Login Card */}
                    <div className="lg:col-span-5 order-2 lg:order-1">
                        <div className="card relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-indigo to-accent-violet"></div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-16 tracking-tight uppercase text-white">Identity Link</h2>
                            <form onSubmit={handleLogin} className="space-y-12">
                                <div className="space-y-5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] block px-3">Node Identifier</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="h-18 sm:h-22 text-center tracking-[0.4em] font-bold uppercase text-xl placeholder:opacity-20" placeholder="TERMINAL_00"
                                    />
                                </div>
                                <div className="space-y-5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] block px-3">Access PIN</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="h-18 sm:h-22 text-center font-bold text-xl placeholder:opacity-20" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="py-6 bg-accent-rose/10 border border-accent-rose/20 rounded-3xl text-[11px] text-accent-rose font-black text-center uppercase tracking-[0.4em] animate-shake">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-20 sm:h-24 mt-8 text-base">
                                    {isSubmitting ? 'Syncing...' : 'Establish Secure Link'}
                                </button>
                            </form>
                            
                            <div className="mt-20 pt-12 border-t border-white/5 text-center">
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] italic flex items-center justify-center gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
                                    Encrypted Multi-Node Verification Active
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Market Nodes Feed */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <div className="flex items-center gap-12 mb-20">
                            <h2 className="text-sm font-black uppercase tracking-[1.2em] text-white whitespace-nowrap">Live Market Nodes</h2>
                            <div className="h-px flex-grow bg-white/10"></div>
                            <div className="flex items-center gap-6">
                                <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></span>
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">SYSTEM_OK</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-20">
                            {games.map(game => (
                                <GameNodeOrb key={game.id} game={game} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="mt-64 py-24 border-t border-white/5 text-center">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-[2em] opacity-50">
                        &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL EXCHANGE SYSTEM • PROTECTED BY OPS_CORE
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
