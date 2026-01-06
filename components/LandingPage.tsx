
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
        <div className="bg-white/60 backdrop-blur-3xl border-b border-slate-200/50 py-5 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-24 border-r border-slate-200/30">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em] mr-8">{game.name}</span>
                        <span className="text-4xl font-mono font-bold text-slate-900 tracking-tighter">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee { animation: marquee 40s linear infinite; }
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
            className="group relative circular-game-card glass border-white hover:scale-110"
        >
            <div className="absolute inset-0 bg-accent-indigo/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Outer spinning ring */}
            <div className={`absolute inset-0 border-2 border-dashed border-slate-200 rounded-full opacity-40 group-hover:opacity-100 group-hover:animate-spin-slow`}></div>

            <div className="relative mb-4 w-28 h-28">
                <div className="absolute -inset-4 bg-gradient-to-tr from-accent-indigo/20 to-accent-cyan/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-soft"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-2xl p-1 bg-white transform group-hover:scale-110 transition-transform duration-700" />
            </div>

            <div className="relative z-10 text-center px-4">
                <h3 className="text-xl text-slate-900 mb-1 uppercase tracking-tight font-bold group-hover:text-accent-indigo transition-colors">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-2 scale-110">
                        <div className="text-[9px] uppercase tracking-[0.4em] text-accent-emerald font-bold mb-1 opacity-70">FINAL RESULT</div>
                        <div className="text-4xl font-bold text-slate-900 tracking-tighter font-mono">{game.winningNumber}</div>
                    </div>
                ) : isMarketClosed ? (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-4 py-2 px-5 bg-slate-100 rounded-full">Closed</div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-3xl font-mono font-bold ${status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                        <div className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold mt-2">{formatTime12h(game.drawTime)}</div>
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
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 selection:bg-accent-indigo selection:text-white">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-8 w-full flex-grow flex flex-col relative py-20">
                {/* Visual Depth Glows */}
                <div className="absolute -top-80 -left-80 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[160px] rounded-full animate-mesh-flow"></div>
                <div className="absolute top-1/2 -right-80 w-[800px] h-[800px] bg-cyan-500/5 blur-[160px] rounded-full animate-mesh-flow" style={{ animationDelay: '-6s' }}></div>

                <header className="pt-10 pb-28 text-center animate-fade-in relative z-10">
                    <div className="inline-block px-12 py-4 rounded-full bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] border border-slate-100 text-[12px] font-bold text-accent-indigo uppercase tracking-[0.8em] mb-16 transform hover:scale-105 transition-all cursor-default">
                        Institutional Exchange Node
                    </div>
                    <h1 className="text-[11rem] md:text-[15rem] font-bold mb-10 tracking-tighter uppercase text-slate-900 leading-[0.7] drop-shadow-2xl">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <p className="text-slate-400 font-bold tracking-[1.5em] uppercase text-sm opacity-50 ml-6">The Future of Digital Assets</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-28 items-start flex-grow mb-48 relative z-10">
                    <div className="lg:col-span-4">
                        <div className="card w-full bg-white border-white shadow-[0_60px_120px_-30px_rgba(0,0,0,0.08)] p-16 relative overflow-hidden rounded-[4rem]">
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-accent-indigo via-accent-cyan to-accent-indigo bg-[length:200%_auto] animate-shimmer-light"></div>
                            
                            <h2 className="text-4xl font-bold text-slate-900 mb-16 uppercase tracking-tighter">Terminal Access</h2>
                            <form onSubmit={handleLogin} className="space-y-12">
                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.6em] block ml-4">Identity Code</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full text-center font-bold tracking-[0.3em] uppercase text-xl h-24 rounded-3xl" placeholder="REF_ID"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-bold text-slate-400 uppercase tracking-[0.6em] block ml-4">Secure Pass</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full text-center font-bold text-xl h-24 rounded-3xl" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-[12px] text-rose-500 font-bold text-center uppercase tracking-[0.3em] animate-bounce">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-9 text-lg shadow-indigo-500/40 rounded-3xl">
                                    {isSubmitting ? 'ESTABLISHING...' : 'START EXCHANGE'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-14 mb-24">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[1em] whitespace-nowrap">Live Market Feed</h2>
                            <div className="h-[3px] flex-grow bg-slate-200/50 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-indigo w-1/4 animate-shimmer-light"></div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="w-4 h-4 bg-accent-emerald rounded-full animate-pulse-soft"></span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.8em]">Operational</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-16">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-28 text-center border-t border-slate-200/50">
                   <p className="text-[14px] font-bold tracking-[1.5em] uppercase text-slate-300">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL ASSET PROTECTION
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
