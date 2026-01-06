
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
        <div className="bg-brand-900/20 backdrop-blur-md border-b border-brand-500/20 py-3 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-10 border-r border-white/5">
                        <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.2em] mr-4">{game.name}</span>
                        <span className="text-lg font-mono font-black text-white">{game.winningNumber}</span>
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
            className="group relative glass p-6 flex flex-col items-center justify-between text-center transition-all duration-500 hover:neon-border hover:-translate-y-2 rounded-[2.5rem]"
        >
            <div className="w-full">
                <div className="relative mb-6 mx-auto w-16 h-16">
                    <div className="absolute inset-0 bg-neon-cyan/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img src={logo} alt={game.name} className="relative w-16 h-16 rounded-full border border-white/5 p-1 bg-black/40" />
                </div>
                <h3 className="text-lg text-white mb-1 uppercase tracking-tighter font-black">{game.name}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
            </div>
            
            <div className="mt-8 w-full bg-black/40 rounded-3xl p-5 border border-white/5 min-h-[90px] flex flex-col justify-center transition-colors group-hover:bg-brand-900/10">
                {hasFinalWinner ? (
                    <>
                        <div className="text-[8px] uppercase tracking-widest text-neon-cyan font-bold mb-1">CLOSING RESULT</div>
                        <div className="text-3xl font-mono font-black text-white tracking-tighter">{game.winningNumber}</div>
                    </>
                ) : isMarketClosed ? (
                    <div className="text-xs font-black text-slate-600 uppercase tracking-widest">Locked</div>
                ) : (
                    <>
                        <div className="text-[8px] uppercase tracking-widest text-brand-400 font-bold mb-1">{status === 'OPEN' ? 'TIME REMAINING' : 'OPENING AT'}</div>
                        <div className={`text-2xl font-mono font-black ${status === 'OPEN' ? 'neon-text-cyan' : 'text-slate-500'}`}>{countdownText}</div>
                    </>
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
            setError("CRYPTO-KEY MISMATCH: ACCESS DENIED");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col">
                <header className="pt-24 pb-16 text-center animate-fade-in">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-black text-brand-400 uppercase tracking-[0.4em] mb-6">
                        System Online • Node 3005
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter uppercase text-white">AKLASBELA-TV</h1>
                    <p className="text-neon-cyan font-black tracking-[0.6em] uppercase text-[11px] opacity-80">Institutional Digital Exchange</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start flex-grow mb-24">
                    <div className="lg:col-span-5 flex justify-center sticky top-24">
                        <div className="card w-full max-w-md bg-slate-950/40 border-brand-500/10 p-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
                            
                            <h2 className="text-xl font-black text-white mb-10 uppercase tracking-widest border-b border-white/5 pb-6">Secure Terminal Login</h2>
                            <form onSubmit={handleLogin} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Identity Reference</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full" placeholder="TERMINAL_ID"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Encryption Cipher</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-[10px] text-rose-400 font-black text-center uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-xs tracking-[0.4em] uppercase py-5">
                                    {isSubmitting ? 'ENCRYPTING...' : 'INITIALIZE LINK'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="flex items-center gap-6 mb-12">
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Live Feed</h2>
                            <div className="h-[1px] flex-grow bg-white/5"></div>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse-glow shadow-[0_0_10px_#06b6d4]"></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Stream</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-12 text-center border-t border-white/5 opacity-40">
                   <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-500">
                    Proprietary Algorithm • Secure Exchange Protocol v2.8
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
