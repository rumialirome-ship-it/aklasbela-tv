
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
        <div className="bg-white/40 backdrop-blur-xl border-b border-slate-200 py-4 overflow-hidden shadow-sm">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-12 border-r border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">{game.name}</span>
                        <span className="text-xl font-mono font-black text-accent-indigo tracking-tight">{game.winningNumber}</span>
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
    const { status, text: countdownText } = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isMarketClosed = !game.isMarketOpen;
    const logo = GAME_LOGOS[game.name] || '';

    return (
        <button
            onClick={onClick}
            className="group relative glass p-8 flex flex-col items-center justify-between text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 rounded-[3rem] border-white"
        >
            <div className="w-full">
                <div className="relative mb-6 mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full animate-pulse-soft"></div>
                    <img src={logo} alt={game.name} className="relative w-20 h-20 rounded-full border-4 border-white shadow-xl p-1 bg-white" />
                </div>
                <h3 className="text-xl text-slate-800 mb-1 uppercase tracking-tighter font-black">{game.name}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
            </div>
            
            <div className="mt-8 w-full bg-slate-50 rounded-[2rem] p-6 border border-slate-100 min-h-[100px] flex flex-col justify-center group-hover:bg-white transition-colors">
                {hasFinalWinner ? (
                    <>
                        <div className="text-[9px] uppercase tracking-widest text-accent-emerald font-black mb-1">FINAL RESULT</div>
                        <div className="text-4xl font-mono font-black text-slate-900 tracking-tighter">{game.winningNumber}</div>
                    </>
                ) : isMarketClosed ? (
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Market Closed</div>
                ) : (
                    <>
                        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">{status === 'OPEN' ? 'TIME REMAINING' : 'UPCOMING'}</div>
                        <div className={`text-2xl font-mono font-black ${status === 'OPEN' ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
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
            setError("ACCESS DENIED: PLEASE VERIFY CREDENTIALS");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col relative">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/20 blur-[100px] rounded-full animate-mesh-flow"></div>
                <div className="absolute top-1/2 -right-24 w-80 h-80 bg-accent-indigo/10 blur-[100px] rounded-full animate-mesh-flow"></div>

                <header className="pt-24 pb-20 text-center animate-fade-in relative z-10">
                    <div className="inline-block px-6 py-2 rounded-full bg-white shadow-xl border border-slate-100 text-[10px] font-black text-accent-indigo uppercase tracking-[0.4em] mb-8">
                        Secure Exchange Portal v2.9
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter uppercase text-slate-900 drop-shadow-sm">
                        AKLASBELA<span className="text-accent-indigo">-</span>TV
                    </h1>
                    <p className="text-slate-400 font-black tracking-[0.8em] uppercase text-xs">Professional Digital Lottery Engine</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start flex-grow mb-32 relative z-10">
                    <div className="lg:col-span-5 flex justify-center">
                        <div className="card w-full max-w-md bg-white/80 border-white shadow-2xl p-12 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-accent-indigo"></div>
                            
                            <h2 className="text-2xl font-black text-slate-900 mb-12 uppercase tracking-tight">Terminal Sync</h2>
                            <form onSubmit={handleLogin} className="space-y-8">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Identity Code</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full" placeholder="e.g. ADU-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Security Passkey</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] text-rose-500 font-black text-center uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-xs tracking-[0.5em] uppercase py-6 shadow-indigo-500/30">
                                    {isSubmitting ? 'ESTABLISHING LINK...' : 'INITIATE SESSION'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="flex items-center gap-6 mb-12">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Live Markets</h2>
                            <div className="h-[1px] flex-grow bg-slate-200"></div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 bg-accent-indigo rounded-full animate-pulse-soft shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Nodes</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-16 text-center border-t border-slate-200">
                   <p className="text-[11px] font-black tracking-[0.6em] uppercase text-slate-400">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV • GLOBAL ASSET PROTECTION
                   </p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
