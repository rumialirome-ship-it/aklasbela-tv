
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
            className={`group circular-game-card w-full p-8 sm:p-10 md:p-12 ${!isPlayable ? 'opacity-30 grayscale cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95 transition-all duration-700'}`}
        >
            {/* Draw Time Header Badge */}
            <div className="absolute top-5 sm:top-8 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-slate-950/95 border-2 border-white/10 px-5 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] sm:text-[13px] font-black text-accent-indigo uppercase tracking-tight leading-none whitespace-nowrap">
                        {formatTime12h(game.drawTime)}
                    </p>
                </div>
            </div>

            <div className="relative mb-6 sm:mb-8 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 mt-8 sm:mt-10">
                <div className={`absolute -inset-5 sm:-inset-8 rounded-full blur-3xl transition-all duration-1000 ${isPlayable ? 'bg-accent-indigo/30 group-hover:bg-accent-indigo/50' : 'bg-transparent'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border-2 border-white/10 p-1.5 bg-slate-900 group-hover:rotate-6 transition-transform duration-700 shadow-2xl" />
            </div>

            <div className="text-center px-4 w-full">
                <h3 className="font-black text-slate-100 text-[11px] sm:text-sm md:text-xl tracking-tighter uppercase group-hover:text-accent-indigo transition-colors duration-500 line-clamp-1">{game.name}</h3>
                
                {hasResult ? (
                    <div className="mt-2">
                        <span className="text-[8px] text-accent-emerald font-black tracking-[0.4em] uppercase">VERIFIED</span>
                        <div className="text-xl sm:text-3xl md:text-5xl font-mono font-black text-white leading-none tracking-tighter mt-1">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-lg sm:text-2xl md:text-4xl font-mono font-black leading-tight tracking-tighter ${isPlayable ? 'text-white' : 'text-slate-600'}`}>
                            {countdown.text}
                        </div>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-2 px-6 py-2 bg-accent-indigo text-white text-[9px] font-black rounded-full shadow-2xl uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                    Trade Node
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
      setErrorMsg('MISSING_DATA'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('VAULT_LOW'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'LINK_FAILURE');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-12 py-8 sm:py-16 space-y-20 sm:space-y-32 md:space-y-40 animate-fade-in relative pb-48">
      
      {/* Portfolio Card */}
      <div className="card flex flex-col lg:flex-row justify-between items-center gap-10 sm:gap-20 px-8 sm:px-24 py-12 sm:py-20 relative overflow-hidden shadow-2xl border-white/5">
        <div className="absolute -top-10 -right-10 w-[500px] h-[500px] bg-accent-indigo/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative z-10 text-center sm:text-left w-full lg:w-auto">
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] bg-slate-950 border-2 border-white/10 flex items-center justify-center font-black text-accent-indigo text-4xl sm:text-7xl shadow-inner transform hover:rotate-3 transition-transform duration-700 overflow-hidden shrink-0">
               {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-4xl sm:text-7xl font-bold text-white tracking-tighter uppercase leading-none mb-4">{user.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                  <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                  <p className="text-slate-500 text-[10px] sm:text-sm font-black uppercase tracking-[0.6em]">{user.id}</p>
              </div>
            </div>
        </div>
        
        <div className="text-center lg:text-right relative z-10 bg-black/50 px-8 sm:px-16 py-8 rounded-[3rem] border border-white/5 shadow-2xl w-full lg:w-auto">
            <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Vault Liquidity</p>
            <p className="text-3xl sm:text-7xl font-black text-white font-mono tracking-tighter truncate">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      {/* Grid: Larger Game Nodes */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-12 sm:gap-16 lg:gap-20">
        {games.map(game => (
          <GameOrbCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* Transaction History */}
      <div className="space-y-12 sm:space-y-16">
          <div className="flex items-center gap-10 px-6">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[1em] whitespace-nowrap">Audit Protocol Archive</h3>
            <div className="h-px flex-grow bg-white/5"></div>
          </div>
          <div className="bg-slate-950/40 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto no-scrollbar custom-scrollbar">
                  <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-black/60 border-b border-white/5">
                          <tr>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Timestamp</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Market Node</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Debit Amt</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Sync Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {bets.slice(-20).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-slate-900/60 transition-all duration-300">
                                  <td className="p-8 text-[11px] font-mono font-bold text-slate-500">{new Date(bet.timestamp).toLocaleString()}</td>
                                  <td className="p-8 text-base font-black text-slate-100 uppercase tracking-tight">{games.find(g => g.id === bet.gameId)?.name || 'N/A'}</td>
                                  <td className="p-8 text-right font-mono text-accent-rose font-black text-2xl">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-8 text-right">
                                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">SECURE_VERIFIED</span>
                                  </td>
                              </tr>
                          ))}
                          {bets.length === 0 && (
                            <tr><td colSpan={4} className="p-32 text-center text-slate-800 font-black uppercase tracking-[1.5em]">No_Archive_Detected</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Trade Execution Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 sm:p-10 backdrop-blur-3xl animate-fade-in overflow-y-auto">
            <div className="bg-obsidian w-full max-w-2xl rounded-[3.5rem] sm:rounded-[5rem] overflow-hidden border border-white/10 shadow-[0_100px_250px_-50px_rgba(0,0,0,1)] my-auto">
                <div className="p-10 sm:p-16 bg-slate-900/80 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-8">
                        <img src={selectedGame.logo} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/10 bg-slate-950 p-2 shadow-2xl" alt="" />
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedGame.name}</h3>
                            <p className="text-[9px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-[0.6em] mt-3">Node_Execution_Layer</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-4 text-slate-600 hover:text-white transition-all transform hover:rotate-90">{Icons.close}</button>
                </div>
                <div className="p-10 sm:p-20 space-y-12 sm:space-y-16">
                    <div className="flex flex-wrap justify-center gap-4">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-10 py-5 rounded-2xl text-[10px] sm:text-[12px] font-black uppercase transition-all duration-500 ${betType === t ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/40 scale-105' : 'bg-slate-950 text-slate-700 hover:bg-slate-900'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-12 sm:space-y-16">
                        <div className="space-y-4">
                             <label className="text-[10px] sm:text-[12px] font-black text-slate-700 uppercase tracking-[0.7em] block text-center">Protocol Identity Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="00, 11, 22" className="text-center text-4xl sm:text-8xl font-mono font-black py-10 sm:py-14 tracking-[0.2em] bg-black/60 rounded-[3rem] sm:rounded-[4rem] border-white/5 border-2 focus:border-accent-indigo" />
                        </div>
                        <div className="space-y-4">
                             <label className="text-[10px] sm:text-[12px] font-black text-slate-700 uppercase tracking-[0.7em] block text-center">Liquidity Stake Protocol</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-center text-4xl sm:text-8xl font-mono font-black py-10 sm:py-14 text-accent-indigo bg-black/60 rounded-[3rem] sm:rounded-[4rem] border-white/5 border-2 focus:border-accent-indigo" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 sm:gap-12">
                            <div className="bg-black/60 p-10 rounded-[3rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] mb-3">Total Exposure</p>
                                <p className="text-2xl sm:text-4xl font-mono font-black text-white tracking-tighter truncate">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-black/60 p-10 rounded-[3rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] mb-3">Payloads</p>
                                <p className="text-2xl sm:text-4xl font-mono font-black text-white tracking-tighter">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-accent-rose font-black text-[11px] uppercase tracking-[0.5em] py-5 bg-accent-rose/10 rounded-2xl border border-accent-rose/20 animate-shake">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full h-20 sm:h-24 text-sm sm:text-xl rounded-full transform hover:scale-[1.02]">
                        {isSubmitting ? 'Verifying Node Sync...' : 'Commit Protocol Transaction'}
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
