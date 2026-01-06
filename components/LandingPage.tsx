
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
        <div className="bg-brand-600/10 border-b border-brand-500/10 py-3 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-10 border-r border-white/5">
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mr-4">{game.name}</span>
                        <span className="text-lg font-mono font-black text-white">{game.winningNumber}</span>
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
            className="group relative glass p-6 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-brand-500/30 hover:-translate-y-1 rounded-3xl"
        >
            <div className="w-full flex flex-col h-full">
                <div className="flex-grow">
                    <div className="relative mb-4 mx-auto w-16 h-16">
                        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src={logo} alt={game.name} className="relative w-16 h-16 rounded-full border border-white/10 p-1" />
                    </div>
                    <h3 className="text-lg text-white mb-1 uppercase tracking-tight font-black">{game.name}</h3>
                    <p className="text-obsidian-400 text-[9px] font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
                </div>
                <div className="mt-6 bg-black/40 rounded-2xl p-4 border border-white/5 min-h-[80px] flex flex-col justify-center">
                    {hasFinalWinner ? (
                        <>
                            <div className="text-[8px] uppercase tracking-widest text-brand-500 font-bold mb-1">FINAL RESULT</div>
                            <div className="text-3xl font-mono font-black text-white">{game.winningNumber}</div>
                        </>
                    ) : isMarketClosed ? (
                        <div className="text-xs font-black text-obsidian-400 uppercase tracking-widest">Market Locked</div>
                    ) : (
                        <>
                            <div className="text-[8px] uppercase tracking-widest text-brand-500/60 mb-1">{status === 'OPEN' ? 'CLOSING' : 'OPENING'}</div>
                            <div className={`text-xl font-mono font-black ${status === 'OPEN' ? 'text-brand-400' : 'text-obsidian-400'}`}>{countdownText}</div>
                        </>
                    )}
                </div>
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
            setError("Authentication Protocol Failure");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian-950 flex flex-col">
            <ResultsTicker games={games} />
            
            <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col">
                <header className="pt-20 pb-12 text-center">
                    <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter uppercase text-white">AKLASBELA-TV</h1>
                    <p className="text-brand-500 font-bold tracking-[0.6em] uppercase text-[10px]">Premium Digital Exchange</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-grow mb-20">
                    <div className="lg:col-span-5 flex justify-center">
                        <div className="card w-full max-w-md bg-obsidian-900/40 border-brand-500/10 backdrop-blur-3xl p-10">
                            <h2 className="text-xl font-black text-white mb-8 border-b border-white/5 pb-4 uppercase">Terminal Login</h2>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-2 block">Terminal ID</label>
                                    <input 
                                        type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
                                        className="w-full" placeholder="e.g. ADU-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-2 block">Security Key</label>
                                    <input 
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full" placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-bold text-center">
                                        {error}
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-xs tracking-widest uppercase">
                                    {isSubmitting ? 'CONNECTING...' : 'INITIATE SESSION'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Real-time Markets</h2>
                            <div className="h-[1px] flex-grow bg-white/5"></div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-bold text-obsidian-400 uppercase">Live Node 3005</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {games.map(game => (
                                <GameDisplayCard key={game.id} game={game} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="py-10 text-center border-t border-white/5 opacity-40 text-[9px] font-bold tracking-widest uppercase">
                    &copy; {new Date().getFullYear()} AKLASBELA-TV EXCHANGE SYSTEM • v2.6.0
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
