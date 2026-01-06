
import React, { useState } from 'react';
import { Game } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { Icons, GAME_LOGOS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const ResultsTicker: React.FC<{ games: Game[] }> = ({ games }) => {
    const results = games.filter(g => g.winningNumber && !g.winningNumber.endsWith('_'));
    if (results.length === 0) return null;

    return (
        <div className="bg-white/40 backdrop-blur-3xl border-b border-slate-200/50 py-4 overflow-hidden shadow-sm">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-12 sm:px-24 border-r border-slate-200/20">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mr-6">{game.name}</span>
                        <span className="text-2xl sm:text-4xl font-mono font-bold text-slate-900 tracking-tighter">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee { animation: marquee 30s linear infinite; }
            `}</style>
        </div>
    );
};

const GameDisplayCard: React.FC<{ game: Game; onClick: () => void }> = ({ game, onClick }) => {
    const countdown = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isMarketClosed = !game.isMarketOpen;
    const logo = GAME_LOGOS[game.name] || '';

    return (
        <button
            onClick={onClick}
            className="group relative circular-game-card glass border-white active:scale-95 transition-transform"
        >
            <div className="absolute inset-0 bg-accent-indigo/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Outer decorative ring */}
            <div className={`absolute inset-0 border-2 border-dashed border-slate-200 rounded-full opacity-30 group-hover:opacity-60 group-hover:animate-spin-slow transition-all`}></div>

            <div className="relative mb-3 sm:mb-4 w-20 h-20 sm:w-28 sm:h-28">
                <div className="absolute -inset-3 bg-gradient-to-tr from-accent-indigo/20 to-accent-cyan/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-soft"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-xl p-1 bg-white group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="relative z-10 text-center px-2">
                <h3 className="text-sm sm:text-xl text-slate-900 mb-0.5 sm:mb-1 uppercase tracking-tight font-bold group-hover:text-accent-indigo transition-colors">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-1">
                        <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-accent-emerald font-bold mb-0.5 opacity-70">RESULT</div>
                        <div className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tighter font-mono">{game.winningNumber}</div>
                    </div>
                ) : isMarketClosed ? (
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 py-1.5 px-4 bg-slate-100 rounded-full">Closed</div>
                ) : (
                    <div className="mt-1">
                        <div className={`text-lg sm:text-3xl font-mono font-bold leading-tight ${countdown.status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-400'}`}>
                            {countdown.text}
                        </div>
                        <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-slate-400 font-bold mt-1">
                            {formatTime12h(game.drawTime)}
                        </div>
                    </div>
                )}
            </div>
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
            setError("LINK ERROR: CREDENTIALS NOT RECOGNIZED");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full flex-grow flex flex-col relative py-12 sm:py-20">
                {/* Visual Depth Glows */}
                <div className="absolute -top-60 -left-60 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-mesh-flow"></div>
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full animate-mesh-flow" style={{ animationDelay: '-10s' }}></div>

                <header className="pt-6 pb-12 sm:pt-10 sm:pb-24 text-center animate-fade-in relative z-10">
                    <div className="inline-block px-8 py-3 rounded-full bg-white shadow-xl border border-slate-100 text-[10px] sm:text-[12px] font-bold text-accent-indigo uppercase tracking-[0.6em] mb-8 sm:mb-16 hover:scale-105 transition-transform cursor-default">
                        Institutional Exchange Node
                    </div>
                    <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[13rem] font-bold mb-6 sm:mb-10 tracking-tighter uppercase text-slate-900 leading-[0.8] drop-shadow-2xl">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <p className="text-slate-400 font-bold tracking-[1em] sm:tracking-[1.5em] uppercase text-[10px] sm:text-sm opacity-50">The Future of Digital Assets</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-24 items-start flex-grow mb-24 sm:mb-40 relative z-10">
                    <div className="lg:col-span-4 order-2 lg:order-1">
                        <div className="card w-full bg-white/95 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-8 sm:p-14 relative overflow-hidden rounded-[3rem]">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-accent-indigo to-accent-cyan animate-shimmer-light bg-[length:200%_auto]"></div>
                            
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 uppercase tracking-tighter">Terminal Access</h2>
                            <form onSubmit={handleLogin} className="space-y-8 sm:space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] block ml-3">Identity Code</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="text-center font-bold tracking-[0.2em] uppercase text-lg sm:text-xl py-5" placeholder="REF_ID"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] block ml-3">Secure Pass</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="text-center font-bold text-lg sm:text-xl py-5" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-500 font-bold text-center uppercase tracking-[0.2em] animate-bounce">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-6 text-sm">
                                    {isSubmitting ? 'ESTABLISHING...' : 'START EXCHANGE'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8 order-1 lg:order-2">
                        <div className="flex items-center gap-6 sm:gap-12 mb-12 sm:mb-20">
                            <h2 className="text-[11px] sm:text-sm font-bold text-slate-900 uppercase tracking-[0.8em] sm:tracking-[1em] whitespace-nowrap">Live Market</h2>
                            <div className="h-[2px] flex-grow bg-slate-200/50 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-indigo w-1/4 animate-shimmer-light"></div>
                            </div>
                            <div className="hidden sm:flex items-center gap-4">
                                <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse-soft"></span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em]">Operational</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-12">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-16 sm:py-24 text-center border-t border-slate-200/40">
                   <p className="text-[11px] sm:text-[13px] font-bold tracking-[0.8em] sm:tracking-[1.2em] uppercase text-slate-300">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL ASSET PROTECTION
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
