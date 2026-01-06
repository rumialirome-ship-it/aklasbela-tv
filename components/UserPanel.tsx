
import React, { useState, useMemo } from 'react';
import { User, Game, SubGameType, Bet } from '../types';
import { Icons } from '../constants';
import { useCountdown } from '../hooks/useCountdown';

const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const GameCard: React.FC<{ game: Game; onPlay: (game: Game) => void; isRestricted: boolean; }> = ({ game, onPlay, isRestricted }) => {
    const countdown = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isPlayable = !!game.isMarketOpen && !isRestricted && countdown.status === 'OPEN';

    return (
        <button 
            onClick={() => onPlay(game)}
            disabled={!isPlayable}
            className={`circular-game-card glass group ${!isPlayable ? 'opacity-40 grayscale-[0.5] cursor-not-allowed' : 'bg-white border-white hover:border-accent-indigo/40'}`}
        >
            <div className="relative mb-3 sm:mb-5 w-20 h-20 sm:w-28 sm:h-28">
                <div className={`absolute -inset-3 rounded-full blur-2xl transition-all duration-700 ${isPlayable ? 'bg-accent-indigo/10 group-hover:bg-accent-indigo/20 animate-pulse-soft' : 'bg-slate-100'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-xl p-1 bg-white transform group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="text-center px-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-lg tracking-tight uppercase group-hover:text-accent-indigo transition-colors">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-2">
                        <p className="text-[8px] text-accent-emerald font-bold uppercase tracking-[0.3em] mb-0.5 opacity-60">WINNER</p>
                        <div className="text-xl sm:text-3xl font-mono font-bold text-slate-900 leading-none">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-lg sm:text-2xl font-mono font-bold leading-tight ${isPlayable ? 'text-accent-indigo' : 'text-slate-300'}`}>
                            {countdown.text}
                        </div>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1.5 opacity-60">
                            {formatTime12h(game.drawTime)}
                        </p>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-1 px-6 sm:px-8 py-1.5 sm:py-2 bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-2xl uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    PLAY
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
      setErrorMsg('MISSING DATA FIELD'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT FUNDS'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'LINK TIMEOUT');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-12 space-y-16 sm:space-y-24 animate-fade-in relative pb-40">
      {/* Profile Hub - Responsive */}
      <div className="card bg-white/95 border-white flex flex-col md:flex-row justify-between items-center gap-10 sm:gap-16 px-8 sm:px-20 py-12 sm:py-24 relative overflow-hidden shadow-xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-14 relative z-10 text-center sm:text-left">
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-accent-indigo/10 to-accent-cyan/10 rounded-full blur-3xl"></div>
                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-slate-50 flex items-center justify-center font-bold text-accent-indigo text-4xl sm:text-7xl shadow-2xl border-4 border-white relative z-10 overflow-hidden">
                   {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-slate-900 tracking-tighter uppercase leading-none mb-4">{user.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                  <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse-soft"></span>
                  <p className="text-slate-400 text-[11px] sm:text-sm font-bold uppercase tracking-[0.6em] opacity-60">{user.id}</p>
              </div>
            </div>
        </div>
        <div className="text-center md:text-right relative z-10 bg-slate-50/50 backdrop-blur-xl px-10 sm:px-16 py-8 sm:py-10 rounded-[2.5rem] sm:rounded-[4rem] border border-white shadow-inner w-full sm:w-auto">
            <p className="text-[11px] sm:text-sm font-bold text-slate-400 uppercase tracking-[0.6em] mb-2 opacity-70">Credits</p>
            <p className="text-5xl sm:text-7xl lg:text-8xl font-bold text-slate-900 font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-12">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* History Ledger - Scrollable */}
      <div className="space-y-10 sm:space-y-16">
          <div className="flex items-center gap-8">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 uppercase tracking-[0.6em] whitespace-nowrap">Archive</h3>
            <div className="h-[2px] flex-grow bg-slate-200/50 rounded-full"></div>
            <div className="hidden sm:block text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-60">Latest Ledger Entry</div>
          </div>
          <div className="card overflow-hidden p-0 border-white shadow-2xl bg-white/70 backdrop-blur-3xl">
              <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50/50 border-b border-slate-100/50">
                          <tr>
                              <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entry</th>
                              <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exchange</th>
                              <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Debit</th>
                              <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Node</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/30">
                          {bets.slice(-10).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-indigo-50/20 transition-all group">
                                  <td className="p-8 text-xs font-mono font-bold text-slate-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-8">
                                      <span className="text-base font-bold text-slate-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors">
                                        {games.find(g => g.id === bet.gameId)?.name}
                                      </span>
                                  </td>
                                  <td className="p-8 text-right font-mono text-accent-rose font-bold text-lg">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-8 text-right">
                                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] italic group-hover:text-slate-500 transition-colors">VERIFIED</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Modal - Polished */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 sm:p-8 backdrop-blur-xl animate-fade-in">
            <div className="card w-full max-w-2xl bg-white p-0 overflow-hidden border-white shadow-2xl rounded-[3rem] sm:rounded-[4rem] max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="p-8 sm:p-12 bg-slate-50/80 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-6 sm:gap-8">
                        <img src={selectedGame.logo} className="w-16 h-16 rounded-full shadow-lg bg-white p-1" alt="" />
                        <div>
                            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 uppercase tracking-widest leading-none">DEPLOY: {selectedGame.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Trade Protocol</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-4 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 hover:scale-110 transition-all">{Icons.close}</button>
                </div>
                <div className="p-8 sm:p-14 space-y-10 sm:space-y-12">
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-8 py-4 sm:px-10 sm:py-5 rounded-full text-[10px] sm:text-xs font-bold uppercase transition-all ${betType === t ? 'bg-accent-indigo text-white shadow-xl scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-4 text-center">
                             <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.8em]">Target Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="14, 25, 33" className="text-center text-4xl sm:text-6xl font-mono font-bold py-10 sm:py-12 bg-slate-50 border-slate-200 rounded-[2.5rem] tracking-widest" />
                        </div>
                        <div className="space-y-4 text-center">
                             <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.8em]">Unit Stake</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="PKR" className="text-center text-4xl sm:text-6xl font-mono font-bold py-10 sm:py-12 text-accent-indigo bg-slate-50 border-slate-200 rounded-[2.5rem]" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 sm:gap-10">
                            <div className="bg-slate-50/50 p-8 sm:p-10 rounded-[2.5rem] text-center border border-slate-100">
                                <p className="text-[11px] text-slate-400 font-bold uppercase mb-2 tracking-[0.4em]">Total</p>
                                <p className="text-2xl sm:text-4xl font-mono font-bold text-slate-900 tracking-tighter">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50/50 p-8 sm:p-10 rounded-[2.5rem] text-center border border-slate-100">
                                <p className="text-[11px] text-slate-400 font-bold uppercase mb-2 tracking-[0.4em]">Quantity</p>
                                <p className="text-2xl sm:text-4xl font-mono font-bold text-slate-900 tracking-tighter">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-rose-500 font-bold text-xs uppercase tracking-[0.3em] bg-rose-50 py-4 rounded-3xl animate-bounce">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-8 text-sm tracking-[1em]">
                        {isSubmitting ? 'SYNCING...' : 'COMMIT TRADE'}
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
