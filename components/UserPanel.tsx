
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
            className={`group circular-game-card w-full p-4 sm:p-6 md:p-8 ${!isPlayable ? 'opacity-30 grayscale cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95 transition-all duration-700'}`}
        >
            <div className="relative mb-3 sm:mb-5 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28">
                <div className={`absolute -inset-3 sm:-inset-5 rounded-full blur-2xl transition-all duration-1000 ${isPlayable ? 'bg-accent-indigo/20 group-hover:bg-accent-indigo/40' : 'bg-transparent'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border border-white/10 p-1 bg-slate-900 group-hover:rotate-6 transition-transform duration-700 shadow-xl" />
            </div>

            <div className="text-center px-2 w-full">
                <h3 className="font-bold text-slate-100 text-[9px] sm:text-xs md:text-base tracking-tight uppercase group-hover:text-accent-indigo transition-colors duration-500 line-clamp-1">{game.name}</h3>
                
                {hasResult ? (
                    <div className="mt-1">
                        <span className="text-[7px] text-accent-emerald font-black tracking-[0.4em] uppercase">VERIFIED</span>
                        <div className="text-base sm:text-2xl md:text-4xl font-mono font-black text-white leading-none tracking-tighter">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-1">
                        <div className={`text-sm sm:text-xl md:text-3xl font-mono font-black leading-tight tracking-tighter ${isPlayable ? 'text-accent-indigo' : 'text-slate-600'}`}>
                            {countdown.text}
                        </div>
                        <p className="text-[9px] sm:text-[11px] md:text-[13px] text-white font-black uppercase tracking-[0.2em] mt-1.5 opacity-100">
                            {formatTime12h(game.drawTime)}
                        </p>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-1 px-4 py-1 bg-accent-indigo text-white text-[8px] font-black rounded-full shadow-2xl uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-10 py-8 sm:py-16 space-y-16 sm:space-y-24 md:space-y-32 animate-fade-in relative pb-48">
      
      {/* Portfolio Card */}
      <div className="card flex flex-col lg:flex-row justify-between items-center gap-8 sm:gap-16 lg:gap-20 px-6 sm:px-12 md:px-24 py-10 sm:py-16 md:py-20 relative overflow-hidden shadow-2xl border-white/5">
        <div className="absolute -top-10 -right-10 w-[400px] h-[400px] bg-accent-indigo/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 relative z-10 text-center sm:text-left w-full lg:w-auto">
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-950 border border-white/10 flex items-center justify-center font-black text-accent-indigo text-3xl sm:text-5xl md:text-6xl shadow-inner transform hover:rotate-3 transition-transform duration-700 overflow-hidden shrink-0">
               {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase leading-none mb-2 sm:mb-4">{user.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span>
                  <p className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">{user.id}</p>
              </div>
            </div>
        </div>
        
        <div className="text-center lg:text-right relative z-10 bg-black/50 px-6 sm:px-12 md:px-16 py-6 sm:py-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl w-full lg:w-auto">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1 sm:mb-2">Vault Credit</p>
            <p className="text-2xl sm:text-4xl md:text-6xl font-black text-white font-mono tracking-tighter truncate">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      {/* Grid: Responsive Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 md:gap-12 lg:gap-16">
        {games.map(game => (
          <GameOrbCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* Transaction History */}
      <div className="space-y-8 sm:space-y-12">
          <div className="flex items-center gap-6 sm:gap-10 px-4">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-black text-white uppercase tracking-[0.8em] whitespace-nowrap">Audit Archive</h3>
            <div className="h-px flex-grow bg-white/5"></div>
          </div>
          <div className="bg-slate-950/40 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto no-scrollbar custom-scrollbar">
                  <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-black/60 border-b border-white/5">
                          <tr>
                              <th className="p-6 sm:p-8 text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Timestamp</th>
                              <th className="p-6 sm:p-8 text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Node Node</th>
                              <th className="p-6 sm:p-8 text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Debit Amt</th>
                              <th className="p-6 sm:p-8 text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">Verification</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {bets.slice(-15).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-slate-900/60 transition-all duration-300">
                                  <td className="p-6 sm:p-8 text-[9px] sm:text-xs font-mono font-bold text-slate-500">{new Date(bet.timestamp).toLocaleString()}</td>
                                  <td className="p-6 sm:p-8 text-xs sm:text-base font-black text-slate-100 uppercase tracking-tight truncate">{games.find(g => g.id === bet.gameId)?.name || 'N/A'}</td>
                                  <td className="p-6 sm:p-8 text-right font-mono text-accent-rose font-black text-base sm:text-2xl">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-6 sm:p-8 text-right">
                                      <span className="text-[8px] sm:text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic truncate">SECURE_SYNC_OK</span>
                                  </td>
                              </tr>
                          ))}
                          {bets.length === 0 && (
                            <tr><td colSpan={4} className="p-20 sm:p-32 text-center text-slate-800 font-black uppercase tracking-[1em]">Archive_Null</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Trade Execution Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 sm:p-8 backdrop-blur-3xl animate-fade-in overflow-y-auto">
            <div className="bg-obsidian w-full max-w-2xl rounded-[2.5rem] sm:rounded-[4.5rem] overflow-hidden border border-white/10 shadow-[0_80px_200px_-40px_rgba(0,0,0,1)] my-auto">
                <div className="p-6 sm:p-12 bg-slate-900/80 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <img src={selectedGame.logo} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-white/10 bg-slate-950 p-1 shadow-2xl" alt="" />
                        <div>
                            <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-widest leading-none truncate">{selectedGame.name}</h3>
                            <p className="text-[7px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] mt-2">Trade_Execution_Layer</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-2 sm:p-3 text-slate-600 hover:text-white transition-all transform hover:rotate-90">{Icons.close}</button>
                </div>
                <div className="p-6 sm:p-16 space-y-10 sm:space-y-16">
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-5 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-[8px] sm:text-[11px] font-black uppercase transition-all duration-500 ${betType === t ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/40 scale-105' : 'bg-slate-950 text-slate-700 hover:bg-slate-900'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-8 sm:space-y-14">
                        <div className="space-y-3 sm:space-y-4">
                             <label className="text-[8px] sm:text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] block text-center">Protocol Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="00, 11, 22" className="text-center text-3xl sm:text-7xl font-mono font-black py-6 sm:py-12 tracking-[0.2em] bg-black/60 rounded-[2rem] sm:rounded-[3rem] border-white/5 border-2 focus:border-accent-indigo" />
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                             <label className="text-[8px] sm:text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] block text-center">Liquidity Stake (PKR)</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-center text-3xl sm:text-7xl font-mono font-black py-6 sm:py-12 text-accent-indigo bg-black/60 rounded-[2rem] sm:rounded-[3rem] border-white/5 border-2 focus:border-accent-indigo" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 sm:gap-8">
                            <div className="bg-black/60 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[8px] sm:text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] mb-1 sm:mb-2">Exposure</p>
                                <p className="text-lg sm:text-3xl font-mono font-black text-white tracking-tighter truncate">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-black/60 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-center border border-white/5 shadow-inner">
                                <p className="text-[8px] sm:text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] mb-1 sm:mb-2">Payloads</p>
                                <p className="text-lg sm:text-3xl font-mono font-black text-white tracking-tighter">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-accent-rose font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] py-3 sm:py-4 bg-accent-rose/10 rounded-xl sm:rounded-2xl border border-accent-rose/20 animate-shake">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full h-14 sm:h-20 text-[10px] sm:text-base rounded-full transform hover:scale-[1.02]">
                        {isSubmitting ? 'Verifying Sync...' : 'Commit Transaction'}
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
