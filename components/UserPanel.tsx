
import React, { useState, useMemo } from 'react';
import { User, Game, SubGameType, Bet } from '../types';
import { Icons } from '../constants';
import { useCountdown } from '../hooks/useCountdown';

const formatTime12h = (time24: string) => {
    if (!time24) return '--:--';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const GameOrbCard: React.FC<{ game: Game; onPlay: (game: Game) => void; isRestricted: boolean; }> = ({ game, onPlay, isRestricted }) => {
    const countdown = useCountdown(game.drawTime);
    const hasResult = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isPlayable = !!game.isMarketOpen && !isRestricted && countdown.status === 'OPEN';

    return (
        <button 
            onClick={() => onPlay(game)}
            disabled={!isPlayable}
            className={`group circular-game-card ${!isPlayable ? 'opacity-30 grayscale cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95 transition-all duration-700'}`}
        >
            <div className="relative mb-4 sm:mb-6 w-20 h-20 sm:w-28 sm:h-28">
                <div className={`absolute -inset-6 rounded-full blur-3xl transition-all duration-1000 ${isPlayable ? 'bg-accent-indigo/20 group-hover:bg-accent-indigo/40' : 'bg-transparent'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border border-white/10 p-1.5 bg-slate-900 group-hover:rotate-6 transition-transform duration-700 shadow-2xl" />
            </div>

            <div className="text-center px-4 w-full">
                <h3 className="font-bold text-slate-100 text-xs sm:text-lg tracking-tight uppercase group-hover:text-accent-indigo transition-colors duration-500 line-clamp-1">{game.name}</h3>
                
                {hasResult ? (
                    <div className="mt-2">
                        <span className="text-[8px] text-accent-emerald font-black tracking-[0.4em] uppercase">AUDIT_DONE</span>
                        <div className="text-xl sm:text-4xl font-mono font-black text-white leading-none tracking-tighter mt-1">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-xl sm:text-3xl font-mono font-black leading-tight tracking-tighter ${isPlayable ? 'text-accent-indigo' : 'text-slate-600'}`}>
                            {countdown.text}
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 opacity-60">
                            Draw {formatTime12h(game.drawTime)}
                        </p>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-2 px-8 py-2 bg-accent-indigo text-white text-[10px] font-black rounded-full shadow-2xl shadow-accent-indigo/50 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                    Trade
                </div>
            )}
        </button>
    );
};

const UserPanel: React.FC<UserPanelProps> = ({ user, games, bets, placeBet }) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [betType, setBetType] = useState<SubGameType>(SubGameType.TwoDigit);
  const [inputNumbers, setInputNumbers] = useState('');
  const [amountPerNumber, setAmountPerNumber] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const parsedNumbers = useMemo(() => {
    return inputNumbers.split(/[\s,.-]+/).filter(n => n.length > 0);
  }, [inputNumbers]);

  const totalStake = useMemo(() => {
    return parsedNumbers.length * (amountPerNumber || 0);
  }, [parsedNumbers, amountPerNumber]);

  const handleCommitBet = async () => {
    if (!selectedGame || parsedNumbers.length === 0 || amountPerNumber <= 0) {
      setErrorMsg('INCOMPLETE_DATA_FIELDS'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT_LIQUIDITY'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'SYSTEM_LINK_TIMEOUT');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 sm:p-16 space-y-16 sm:space-y-32 animate-fade-in relative pb-48 selection:bg-accent-indigo/20">
      
      {/* Vault Summary Card */}
      <div className="card flex flex-col md:flex-row justify-between items-center gap-12 sm:gap-20 px-12 sm:px-24 py-16 sm:py-24 relative overflow-hidden shadow-2xl border-white/5">
        <div className="absolute -top-10 -right-10 w-[500px] h-[500px] bg-accent-indigo/5 blur-[150px] rounded-full"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative z-10 text-center sm:text-left">
            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-[2.5rem] bg-slate-950 border border-white/10 flex items-center justify-center font-black text-accent-indigo text-5xl sm:text-7xl shadow-inner relative z-10 overflow-hidden transform hover:rotate-3 transition-transform duration-700">
               {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-5xl sm:text-8xl font-bold text-white tracking-tighter uppercase leading-none mb-4">{user.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                  <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]"></span>
                  <p className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-[0.8em]">{user.id}</p>
              </div>
            </div>
        </div>
        
        <div className="text-center md:text-right relative z-10 bg-black/50 px-12 sm:px-20 py-10 rounded-[3rem] border border-white/5 shadow-2xl w-full sm:w-auto">
            <p className="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Portfolio Value</p>
            <p className="text-5xl sm:text-8xl font-bold text-white font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      {/* Deployment Hub Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10 sm:gap-20">
        {games.map(game => (
          <GameOrbCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* Archive Ledger */}
      <div className="space-y-12">
          <div className="flex items-center gap-10 px-6">
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-[1em] whitespace-nowrap">Audit Ledger</h3>
            <div className="h-px flex-grow bg-white/5"></div>
          </div>
          <div className="card overflow-hidden p-0 border-white/5 bg-slate-950/40">
              <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-black/50 border-b border-white/5">
                          <tr>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Date</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Market Node</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Debit Amt</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Verif.</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {bets.slice(-10).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-slate-900/40 transition-all duration-300">
                                  <td className="p-8 text-sm font-mono font-bold text-slate-500">{new Date(bet.timestamp).toLocaleString()}</td>
                                  <td className="p-8 text-base font-black text-slate-100 uppercase tracking-tight">{games.find(g => g.id === bet.gameId)?.name}</td>
                                  <td className="p-8 text-right font-mono text-accent-rose font-black text-2xl">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-8 text-right">
                                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">SECURE_SYNC</span>
                                  </td>
                              </tr>
                          ))}
                          {bets.length === 0 && (
                            <tr><td colSpan={4} className="p-24 text-center text-slate-700 font-black uppercase tracking-[1em]">Ledger_Empty</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Trade Execution Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-3xl animate-fade-in">
            <div className="card w-full max-w-2xl bg-obsidian p-0 overflow-hidden border-white/10 shadow-[0_60px_150px_-20px_rgba(0,0,0,1)] rounded-[4rem]">
                <div className="p-10 bg-slate-900/60 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-8">
                        <img src={selectedGame.logo} className="w-16 h-16 rounded-full border border-white/10 bg-slate-950 p-1.5 shadow-2xl" alt="" />
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Trade: {selectedGame.name}</h3>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] mt-2">Institutional Execution Mode</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-4 text-slate-600 hover:text-white transition-colors duration-300 transform hover:rotate-90">{Icons.close}</button>
                </div>
                <div className="p-10 sm:p-20 space-y-16">
                    <div className="flex flex-wrap justify-center gap-4">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase transition-all duration-500 ${betType === t ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/50 scale-105' : 'bg-slate-950 text-slate-600 hover:bg-slate-900'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-14">
                        <div className="space-y-4">
                             <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] block text-center">Unit Identifiers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="e.g. 14, 25, 33" className="text-center text-5xl sm:text-8xl font-mono font-black py-12 tracking-[0.2em] bg-black/50 rounded-[3rem] border-white/5" />
                        </div>
                        <div className="space-y-4">
                             <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] block text-center">Stake volume</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="PKR" className="text-center text-5xl sm:text-8xl font-mono font-black py-12 text-accent-indigo bg-black/50 rounded-[3rem] border-white/5" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-black/50 p-10 rounded-[3rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2">Total Liability</p>
                                <p className="text-2xl sm:text-5xl font-mono font-black text-white tracking-tighter">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-black/50 p-10 rounded-[3rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2">Unit Quantity</p>
                                <p className="text-2xl sm:text-5xl font-mono font-black text-white tracking-tighter">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-accent-rose font-black text-xs uppercase tracking-[0.3em] py-5 bg-accent-rose/10 rounded-2xl border border-accent-rose/20 animate-shake">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full h-20 text-base sm:text-lg rounded-[2.5rem] transform hover:scale-[1.02]">
                        {isSubmitting ? 'Authorizing Protocol...' : 'Commit Transaction'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

interface UserPanelProps {
  user: User;
  games: Game[];
  bets: Bet[];
  placeBet: (details: any) => Promise<void>;
}

export default UserPanel;
