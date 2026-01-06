
import React, { useState, useMemo } from 'react';
import { User, Game, SubGameType, Bet } from '../types';
import { Icons } from '../constants';
import { useCountdown } from '../hooks/useCountdown';

const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const GameCard: React.FC<{ game: Game; onPlay: (game: Game) => void; isRestricted: boolean; }> = ({ game, onPlay, isRestricted }) => {
    const { status, text: countdownText } = useCountdown(game.drawTime);
    const hasFinalWinner = !!game.winningNumber && !game.winningNumber.endsWith('_');
    const isPlayable = !!game.isMarketOpen && !isRestricted && status === 'OPEN';

    return (
        <button 
            onClick={() => onPlay(game)}
            disabled={!isPlayable}
            className={`circular-game-card glass group ${!isPlayable ? 'opacity-30 grayscale pointer-events-none' : 'bg-white/90 border-white hover:border-accent-indigo/50'}`}
        >
            <div className="relative mb-5 w-24 h-24">
                <div className={`absolute -inset-3 rounded-full blur-2xl transition-all duration-700 ${isPlayable ? 'bg-accent-indigo/10 group-hover:bg-accent-indigo/20 animate-pulse-soft' : 'bg-slate-100'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-2xl p-1 bg-white transform group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="text-center">
                <h3 className="font-black text-slate-900 text-lg tracking-tighter uppercase group-hover:text-accent-indigo transition-colors">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-3">
                        <p className="text-[9px] text-accent-emerald font-black uppercase tracking-[0.5em] mb-1 opacity-60">WINNER</p>
                        <div className="text-3xl font-mono font-black text-slate-900 leading-none">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-3">
                        <div className={`text-2xl font-mono font-black leading-none ${isPlayable ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.6em] mt-2 opacity-60">{formatTime12h(game.drawTime)}</p>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-1 px-8 py-2 bg-slate-900 text-white text-[10px] font-black rounded-full shadow-2xl uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
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
      setErrorMsg('SYSTEM ERROR: MISSING DATA FIELD'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT FUNDS IN VAULT'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'NETWORK LINK TIMEOUT');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-10 md:p-16 space-y-24 animate-fade-in relative pb-60">
      {/* Dynamic Profile Hub */}
      <div className="card bg-white/95 border-white flex flex-col md:flex-row justify-between items-center gap-16 px-20 py-24 relative overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.08)]">
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full animate-mesh-flow"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full"></div>
        
        <div className="flex items-center gap-16 relative z-10">
            <div className="relative group">
                <div className="absolute -inset-6 bg-gradient-to-br from-accent-indigo/10 to-accent-cyan/10 rounded-full blur-3xl animate-pulse-soft"></div>
                <div className="w-40 h-40 rounded-full bg-slate-50 flex items-center justify-center font-black text-accent-indigo text-8xl shadow-2xl border-4 border-white relative z-10 overflow-hidden group-hover:scale-105 transition-transform duration-700">
                   {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
            </div>
            <div>
              <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-6">{user.name}</h2>
              <div className="flex items-center gap-6">
                  <span className="w-4 h-4 bg-accent-emerald rounded-full animate-pulse-soft shadow-xl shadow-emerald-500/30"></span>
                  <p className="text-slate-400 text-sm font-black uppercase tracking-[0.8em] opacity-60">{user.id} • PORTAL SYNCED</p>
              </div>
            </div>
        </div>
        <div className="text-center md:text-right relative z-10 bg-slate-50/50 backdrop-blur-xl px-16 py-10 rounded-[4rem] border border-white/50 shadow-inner">
            <p className="text-sm font-black text-slate-400 uppercase tracking-[1em] mb-4 opacity-70">Vault Liquidity</p>
            <p className="text-8xl font-black text-slate-900 font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-14">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* Ledger History */}
      <div className="space-y-16">
          <div className="flex items-center gap-12">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.8em] whitespace-nowrap">Ledger Archive</h3>
            <div className="h-[2px] flex-grow bg-slate-200/50 rounded-full"></div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-60">Verified Records</div>
          </div>
          <div className="card overflow-hidden p-0 border-white shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[4rem]">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50/70 border-b border-slate-100/50">
                          <tr>
                              <th className="p-12 text-[13px] font-black text-slate-400 uppercase tracking-[0.4em]">Time Entry</th>
                              <th className="p-12 text-[13px] font-black text-slate-400 uppercase tracking-[0.4em]">Exchange Market</th>
                              <th className="p-12 text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Debit Balance</th>
                              <th className="p-12 text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Verification</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/30">
                          {bets.slice(-15).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-indigo-50/30 transition-all group">
                                  <td className="p-12 text-sm font-mono font-bold text-slate-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-12">
                                      <span className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors">
                                        {games.find(g => g.id === bet.gameId)?.name}
                                      </span>
                                  </td>
                                  <td className="p-12 text-right font-mono text-accent-rose font-black text-xl">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-12 text-right">
                                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] italic group-hover:text-slate-500 transition-colors">SECURE_SYNC</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Modern Interaction Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-8 backdrop-blur-[32px] animate-fade-in">
            <div className="card w-full max-w-3xl bg-white p-0 overflow-hidden border-white shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)] rounded-[5rem]">
                <div className="p-16 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-10">
                        <img src={selectedGame.logo} className="w-20 h-20 rounded-full shadow-2xl bg-white p-1" alt="" />
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-none">DEPLOY: {selectedGame.name}</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.8em] mt-3">Trade Verification Protocol</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-5 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 transition-all hover:scale-110 shadow-sm">{Icons.close}</button>
                </div>
                <div className="p-20 space-y-16">
                    <div className="flex justify-center gap-6">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-14 py-7 rounded-full text-xs font-black uppercase transition-all duration-500 ${betType === t ? 'bg-accent-indigo text-white shadow-2xl shadow-indigo-500/40 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-16">
                        <div className="space-y-6 text-center">
                             <label className="text-sm font-black text-slate-400 uppercase tracking-[1em]">Target Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="e.g. 14, 25, 33" className="w-full text-center text-6xl font-mono font-black py-16 bg-slate-50 border-slate-200 rounded-[4rem] focus:ring-accent-indigo/20 shadow-inner tracking-widest" />
                        </div>
                        <div className="space-y-6 text-center">
                             <label className="text-sm font-black text-slate-400 uppercase tracking-[1em]">Stake Per Unit</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="PKR" className="w-full text-center text-6xl font-mono font-black py-16 text-accent-indigo bg-slate-50 border-slate-200 rounded-[4rem] focus:ring-accent-indigo/20 shadow-inner" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-12">
                            <div className="bg-slate-50/50 p-12 rounded-[4.5rem] text-center border border-slate-100 shadow-sm">
                                <p className="text-[13px] text-slate-400 font-black uppercase mb-4 tracking-[0.5em]">Total Liability</p>
                                <p className="text-5xl font-mono font-black text-slate-900 tracking-tighter">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50/50 p-12 rounded-[4.5rem] text-center border border-slate-100 shadow-sm">
                                <p className="text-[13px] text-slate-400 font-black uppercase mb-4 tracking-[0.5em]">Unit Quantity</p>
                                <p className="text-5xl font-mono font-black text-slate-900 tracking-tighter">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-rose-500 font-black text-[13px] uppercase tracking-[0.4em] bg-rose-50 py-5 rounded-[2.5rem] border border-rose-100 animate-bounce">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-10 text-lg tracking-[1.2em] rounded-full shadow-indigo-500/50">
                        {isSubmitting ? 'SYNCING LEDGER...' : 'COMMIT TRANSACTION'}
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
