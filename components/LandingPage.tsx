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
        <div className="bg-evening-red-600/10 border-y border-rose-900/20 py-2 overflow-hidden relative">
            <div className="flex whitespace-nowrap animate-marquee">
                {[...results, ...results, ...results].map((game, i) => (
                    <div key={i} className="flex items-center px-8 border-r border-rose-900/20">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mr-3">{game.name}</span>
                        <span className="text-sm font-mono font-black text-white">{game.winningNumber}</span>
                        <span className="ml-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
};

const GameDisplayCard: React.FC<{ game: Game; onClick: () => void }> = ({ game, onClick }) => {
    const { status, text: countdownText } = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isMarketClosedForDisplay = !game.isMarketOpen;
    const logo = GAME_LOGOS[game.name] || '';

    return (
        <button
            onClick={onClick}
            className="relative group bg-evening-red-950/40 p-6 flex flex-col items-center justify-between text-center transition-all duration-500 border border-rose-900/20 w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-evening-red-500 rounded-3xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-evening-red-900/10 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 w-full flex flex-col h-full">
                <div className="flex-grow">
                    <img src={logo} alt={game.name} className="w-20 h-20 rounded-full mb-4 border-2 border-rose-900/50 group-hover:border-evening-red-500 transition-all mx-auto shadow-2xl" />
                    <h3 className="text-xl text-rose-50 mb-1 uppercase tracking-widest font-black">{game.name}</h3>
                    <p className="text-rose-400/60 text-[10px] font-bold uppercase tracking-widest">Draw at {formatTime12h(game.drawTime)}</p>
                </div>
                <div className="text-center w-full p-4 mt-6 bg-black/40 border border-rose-900/30 min-h-[100px] flex flex-col justify-center rounded-2xl">
                    {hasFinalWinner ? (
                        <>
                            <div className="text-[9px] uppercase tracking-[0.4em] text-evening-red-500 font-black mb-1">FINAL DRAW</div>
                            <div className="text-4xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(225,29,72,0.6)]">
                                {game.winningNumber}
                            </div>
                        </>
                    ) : isMarketClosedForDisplay ? (
                        <div className="text-lg font-black text-evening-red-700 uppercase tracking-widest italic">Locked</div>
                    ) : status === 'OPEN' ? (
                        <>
                            <div className="text-[9px] uppercase tracking-[0.4em] text-rose-500/50 mb-1">CLOSING IN</div>
                            <div className="text-2xl font-mono font-black text-evening-red-500">{countdownText}</div>
                        </>
                    ) : (
                        <>
                            <div className="text-[9px] uppercase tracking-[0.4em] text-rose-500/50 mb-1">OPENS IN</div>
                            <div className="text-lg font-mono font-black text-rose-500/40">{countdownText}</div>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
};

const WhatsAppButton: React.FC = () => (
    <a 
        href="https://wa.me/923000000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] bg-green-500 hover:bg-green-400 text-white p-5 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-110 flex items-center justify-center group"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.237a9.994 9.994 0 0 0 4.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0 0 12.012 2zm0 2.035c2.127 0 4.127.828 5.632 2.332a7.93 7.93 0 0 1 2.335 5.633c-.001 4.391-3.577 7.962-7.97 7.962a7.936 7.936 0 0 1-4.057-1.115l-.291-.173-3.02.714.726-3.048-.189-.3a7.941 7.941 0 0 1-1.216-4.043c0-4.391 3.576-7.962 7.97-7.962zm4.615 11.028c-.252-.126-1.497-.738-1.73-.822-.232-.083-.4-.126-.57.126-.171.252-.661.822-.811.99-.15.168-.3.189-.551.063-.251-.126-1.063-.392-2.024-1.247-.748-.667-1.252-1.49-1.399-1.741-.148-.252-.015-.388.11-.513.113-.113.252-.294.378-.441.127-.147.169-.252.253-.42.083-.168.042-.314-.021-.441-.063-.126-.57-1.356-.783-1.867-.204-.49-.412-.423-.57-.431-.147-.008-.317-.01-.485-.01-.168 0-.442.063-.673.314-.232.252-.885.864-.885 2.108 0 1.244.903 2.443 1.03 2.61.127.168 1.777 2.712 4.305 3.801.601.259 1.071.413 1.438.53.604.192 1.154.165 1.587.1.483-.07 1.497-.611 1.708-1.2 0-.001.21-.589.156-.693-.053-.105-.181-.168-.432-.294z"/></svg>
        <span className="absolute right-full mr-4 bg-evening-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none">Support Contact</span>
    </a>
);

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
            setError(err.message || "Authentication Failed: Check Protocol ID");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050101] text-rose-50 flex flex-col selection:bg-rose-500 selection:text-white">
            <ResultsTicker games={games} />
            <WhatsAppButton />
            
            <div className="max-w-7xl mx-auto px-6 w-full flex-grow">
                <header className="text-center py-16 md:py-24">
                    <div className="inline-block relative">
                        <h1 className="text-7xl md:text-9xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-50 to-evening-red-700 uppercase">AKLASBELA</h1>
                        <div className="absolute -top-6 -right-12 bg-evening-red-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-[0.3em] shadow-lg animate-pulse">Live Terminal</div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-evening-red-600 uppercase tracking-[0.8em] mb-6">TV EXCHANGE</h2>
                    
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                        <p className="text-rose-300/60 font-black uppercase tracking-widest text-[10px] italic">
                            Verified Node: aklasbela-tv.com
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-24">
                    <div className="lg:col-span-1 bg-evening-red-950/20 border border-rose-900/10 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-evening-red-600/5 blur-3xl group-hover:bg-evening-red-600/10 transition-all"></div>
                        <div className="flex items-center justify-between mb-10 border-b border-rose-900/10 pb-6">
                            <h2 className="text-xl font-black uppercase tracking-[0.2em]">Secure Access</h2>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-red-600"></div>
                                <div className="w-1 h-1 rounded-full bg-red-600"></div>
                                <div className="w-1 h-1 rounded-full bg-red-600"></div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-8">
                            <div>
                                <label className="block text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-3">Terminal Identity ID</label>
                                <input 
                                  type="text" 
                                  value={loginId}
                                  onChange={e => setLoginId(e.target.value)}
                                  className="w-full bg-black/40 border border-rose-900/20 p-5 rounded-2xl focus:border-evening-red-500 focus:outline-none transition-all font-mono text-rose-50 placeholder:text-rose-950/40"
                                  placeholder="E.G. ADU-001"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-3">Security Protocol Key</label>
                                <input 
                                  type="password" 
                                  value={password}
                                  onChange={e => setPassword(e.target.value)}
                                  className="w-full bg-black/40 border border-rose-900/20 p-5 rounded-2xl focus:border-evening-red-500 focus:outline-none transition-all font-mono text-rose-50 placeholder:text-rose-950/40"
                                  placeholder="••••••••"
                                />
                            </div>
                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/40 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest text-center animate-bounce">
                                    {error}
                                </div>
                            )}
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-evening-red-600 hover:bg-evening-red-500 text-white font-black py-6 rounded-2xl uppercase tracking-[0.5em] text-[10px] transition-all shadow-2xl shadow-evening-red-900/40 disabled:opacity-50"
                            >
                                {isSubmitting ? 'CONNECTING...' : 'INITIATE TERMINAL'}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-12">
                        <div className="flex items-center gap-6">
                            <h2 className="text-xl font-black text-rose-50 uppercase tracking-[0.3em]">Live Feed Status</h2>
                            <div className="h-px flex-grow bg-rose-900/10"></div>
                            <span className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Core Grid Active
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                            {games.map(game => (
                                <GameDisplayCard 
                                  key={game.id} 
                                  game={game} 
                                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="text-center py-16 text-rose-950 font-black uppercase tracking-[0.5em] text-[10px] border-t border-rose-900/10">
                    <div className="mb-4 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                        <span>Terminal Build v2.5.0-STABLE</span>
                        <div className="flex items-center gap-1 text-rose-900">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                             <span>Node verified on port 3005</span>
                        </div>
                    </div>
                    &copy; {new Date().getFullYear()} AKLASBELA-TV EXCHANGE STRATEGIC COMMAND
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;