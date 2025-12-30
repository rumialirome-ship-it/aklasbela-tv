
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
            <div className="absolute inset-0 bg-gradient-to-br from-evening-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

const LandingPage: React.FC<{ games: Game[] }> = ({ games }) => {
    const { login } = useAuth();
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(loginId, password);
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen bg-animated-bg text-rose-50 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="text-center py-16 md:py-24">
                    <h1 className="text-7xl md:text-9xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-50 to-evening-red-700">AKLASBELA</h1>
                    <h2 className="text-2xl md:text-3xl font-bold text-evening-red-600 uppercase tracking-[0.8em] mb-6">TV EXCHANGE</h2>
                    <p className="text-rose-300/40 max-w-2xl mx-auto font-bold uppercase tracking-widest text-xs italic">
                        Premium Digital Lottery Terminal • Encrypted Network
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-24">
                    {/* Left: Login Section */}
                    <div className="lg:col-span-1 bg-evening-red-950/40 border border-rose-900/20 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
                        <h2 className="text-xl font-black mb-8 uppercase tracking-[0.2em] border-b border-rose-900/20 pb-4">Secure Access</h2>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2">Account ID</label>
                                <input 
                                  type="text" 
                                  value={loginId}
                                  onChange={e => setLoginId(e.target.value)}
                                  className="w-full bg-black/40 border border-rose-900/30 p-4 rounded-xl focus:border-evening-red-500 focus:outline-none transition-all"
                                  placeholder="Enter Terminal ID"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2">Access Key</label>
                                <input 
                                  type="password" 
                                  value={password}
                                  onChange={e => setPassword(e.target.value)}
                                  className="w-full bg-black/40 border border-rose-900/30 p-4 rounded-xl focus:border-evening-red-500 focus:outline-none transition-all"
                                  placeholder="••••••••"
                                />
                            </div>
                            {error && <p className="text-evening-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
                            <button type="submit" className="w-full bg-evening-red-600 hover:bg-evening-red-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.4em] text-xs transition-all shadow-xl shadow-evening-red-900/40">
                                Authenticate
                            </button>
                        </form>
                    </div>

                    {/* Right: Games Grid */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="flex items-center gap-6">
                            <h2 className="text-xl font-black text-rose-50 uppercase tracking-[0.3em]">Live Terminals</h2>
                            <div className="h-px flex-grow bg-rose-900/20"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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

                <footer className="text-center py-12 text-rose-950 font-black uppercase tracking-[0.3em] text-[10px] border-t border-rose-900/10">
                    &copy; {new Date().getFullYear()} Aklasbela-TV Exchange Terminal • All Rights Reserved
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
