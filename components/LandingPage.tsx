
import React, { useState } from 'react';
import { Game } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { Icons, GAME_LOGOS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const ResultsTicker: React.FC<{ games: Game[] }> = ({ games }) => {
    const results = games.filter(g => g.winningNumber && !g.winningNumber.endsWith('_'));
    if (results.length === 0) return null;

    return (
        <div className="bg-white/40 backdrop-blur-3xl border-b border-slate-200 py-6 overflow-hidden shadow-sm">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-20 border-r border-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mr-8">{game.name}</span>
                        <span className="text-3xl font-mono font-black text-accent-indigo tracking-tighter">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee { animation: marquee 35s linear infinite; }
            `}</style>
        </div>
    );
};

const GameDisplayCard: React.FC<{ game: Game; onClick: () => void }> = ({ game, onClick }) => {
    const { status, text: countdownText } = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isMarketClosed = !game.isMarketOpen;
    const logo = GAME_LOGOS[game.name] || '';

    return (
        <button
            onClick={onClick}
            className="group relative circular-game-card glass border-white hover:border-accent-indigo/40"
        >
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative mb-4 w-24 h-24">
                <div className="absolute -inset-2 bg-gradient-to-tr from-accent-indigo/20 to-accent-cyan/20 rounded-full animate-pulse-soft blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-xl p-1 bg-white transform group-hover:rotate-12 transition-transform duration-500" />
            </div>

            <div className="relative z-10 text-center">
                <h3 className="text-xl text-slate-900 mb-1 uppercase tracking-tighter font-black group-hover:text-accent-indigo transition-colors">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-2 scale-110">
                        <div className="text-[9px] uppercase tracking-[0.4em] text-accent-emerald font-black mb-1 opacity-70">RESULT</div>
                        <div className="text-4xl font-mono font-black text-slate-900 tracking-tighter">{game.winningNumber}</div>
                    </div>
                ) : isMarketClosed ? (
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 py-1 px-4 bg-slate-100 rounded-full">Closed</div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-2xl font-mono font-black ${status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                        <div className="text-[9px] uppercase tracking-[0.5em] text-slate-400 font-bold mt-1">{formatTime12h(game.drawTime)}</div>
                    </div>
                )}
            </div>
            
            {status === 'OPEN' && !isMarketClosed && !hasFinalWinner && (
                <div className="absolute top-8 right-8 w-4 h-4 bg-accent-emerald rounded-full animate-ping opacity-40"></div>
            )}
        </button>
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
        setIsSubmitting(true);
        setError(null);
        try {
            await login(loginId, password);
        } catch (err: any) {
            setError("SECURITY ALERT: AUTHENTICATION FAILED");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent-indigo selection:text-white">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-8 w-full flex-grow flex flex-col relative py-20">
                {/* Visual Glows */}
                <div className="absolute -top-60 -left-60 w-[800px] h-[800px] bg-indigo-500/5 blur-[140px] rounded-full animate-mesh-flow"></div>
                <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] bg-cyan-500/5 blur-[140px] rounded-full animate-mesh-flow" style={{ animationDelay: '-7s' }}></div>

                <header className="pt-10 pb-24 text-center animate-fade-in relative z-10">
                    <div className="inline-block px-10 py-3 rounded-full bg-white shadow-2xl border border-slate-100 text-[11px] font-black text-accent-indigo uppercase tracking-[0.8em] mb-12 transform hover:scale-105 transition-transform cursor-default">
                        Terminal Active • v3.4.1
                    </div>
                    <h1 className="text-[10rem] md:text-[14rem] font-black mb-8 tracking-tighter uppercase text-slate-900 leading-[0.8] drop-shadow-2xl">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <p className="text-slate-400 font-black tracking-[1.2em] uppercase text-sm opacity-60 ml-4">Professional Digital Exchange Portal</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start flex-grow mb-40 relative z-10">
                    <div className="lg:col-span-4">
                        <div className="card w-full bg-white/95 border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] p-16 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-accent-indigo via-accent-cyan to-accent-indigo bg-[length:200%_auto] animate-shimmer-light"></div>
                            
                            <h2 className="text-3xl font-black text-slate-900 mb-14 uppercase tracking-tighter flex items-center gap-6">
                                <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-accent-indigo shadow-inner">{Icons.user}</span>
                                Protocol Access
                            </h2>
                            <form onSubmit={handleLogin} className="space-y-12">
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] block ml-4">Identity Key</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full text-center font-bold tracking-[0.2em] uppercase text-lg h-20" placeholder="TERMINAL_REF"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] block ml-4">Secure Pin</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full text-center font-bold text-lg h-20" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-[2rem] text-[11px] text-rose-500 font-black text-center uppercase tracking-[0.2em] animate-bounce">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-8 text-sm shadow-indigo-500/40">
                                    {isSubmitting ? 'VERIFYING...' : 'INITIATE SYNC'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-12 mb-20">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[1em] whitespace-nowrap">Live Exchange</h2>
                            <div className="h-[2px] flex-grow bg-slate-200/50 rounded-full"></div>
                            <div className="flex items-center gap-5">
                                <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse-soft"></span>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">Realtime Feed</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-12">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-24 text-center border-t border-slate-200/40">
                   <p className="text-[13px] font-black tracking-[1.2em] uppercase text-slate-300">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL NETWORK PROTOCOL
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
