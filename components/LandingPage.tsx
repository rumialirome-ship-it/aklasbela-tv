
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
        <div className="bg-white/60 backdrop-blur-xl border-b border-slate-100 py-5 overflow-hidden shadow-sm">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-16 border-r border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mr-6">{game.name}</span>
                        <span className="text-2xl font-mono font-black text-accent-indigo tracking-tight">{game.winningNumber}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee { animation: marquee 25s linear infinite; }
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
            className="group relative circular-card glass bg-white/40 border-white hover:border-accent-indigo/30"
        >
            <div className="absolute inset-0 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative mb-4 w-24 h-24">
                <div className="absolute inset-0 bg-accent-indigo/10 rounded-full animate-pulse-soft blur-xl"></div>
                <img src={logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-lg p-1 bg-white" />
            </div>

            <div className="relative z-10 text-center">
                <h3 className="text-lg text-slate-900 mb-1 uppercase tracking-tighter font-black">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-2">
                        <div className="text-[8px] uppercase tracking-widest text-accent-emerald font-black mb-1">RESULT</div>
                        <div className="text-3xl font-mono font-black text-slate-900 leading-none">{game.winningNumber}</div>
                    </div>
                ) : isMarketClosed ? (
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Closed</div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-xl font-mono font-black ${status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                        <div className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">{formatTime12h(game.drawTime)}</div>
                    </div>
                )}
            </div>
            
            {status === 'OPEN' && !isMarketClosed && !hasFinalWinner && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-accent-emerald rounded-full animate-pulse-soft neon-glow-cyan"></div>
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
            setError("PROTOCOL DENIED: VERIFY CREDENTIALS");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col relative py-12">
                {/* Visual Orbs */}
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-mesh-flow"></div>
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full animate-mesh-flow" style={{ animationDelay: '-5s' }}></div>

                <header className="pt-12 pb-16 text-center animate-fade-in relative z-10">
                    <div className="inline-block px-8 py-2.5 rounded-full bg-white shadow-xl border border-slate-50 text-[10px] font-black text-accent-indigo uppercase tracking-[0.5em] mb-10 transition-transform hover:scale-110 cursor-default">
                        Node Active • Exchange 3.0
                    </div>
                    <h1 className="text-8xl md:text-[10rem] font-black mb-6 tracking-tighter uppercase text-slate-900 leading-none drop-shadow-sm">
                        AKLASBELA<span className="text-accent-indigo">.</span>TV
                    </h1>
                    <p className="text-slate-400 font-black tracking-[1em] uppercase text-[11px] opacity-80">Premium Digital Lottery Engine</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start flex-grow mb-32 relative z-10">
                    <div className="lg:col-span-4">
                        <div className="card w-full bg-white/90 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                            
                            <h2 className="text-2xl font-black text-slate-900 mb-12 uppercase tracking-tight flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-accent-indigo">{Icons.user}</span>
                                Portal Entry
                            </h2>
                            <form onSubmit={handleLogin} className="space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-2">Identity Ref</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full text-center font-bold tracking-widest uppercase" placeholder="TERMINAL_ID"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-2">Secure Passkey</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full text-center font-bold" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-[10px] text-rose-500 font-black text-center uppercase tracking-wider animate-bounce">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-[11px] tracking-[0.6em] uppercase py-7 shadow-indigo-500/40">
                                    {isSubmitting ? 'ESTABLISHING...' : 'INITIATE SESSION'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-10 mb-16">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.6em]">Live Market Feed</h2>
                            <div className="h-[2px] flex-grow bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500/20 w-1/3 animate-shimmer-light"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="w-3 h-3 bg-accent-indigo rounded-full animate-ping"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Nodes Synchronized</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-20 text-center border-t border-slate-100">
                   <p className="text-[12px] font-black tracking-[0.8em] uppercase text-slate-300">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV • INSTITUTIONAL CRYPTO PROTOCOL
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
