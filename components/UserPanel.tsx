
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
            className={`circular-card glass group ${!isPlayable ? 'opacity-40 grayscale-0 pointer-events-none brightness-75' : 'bg-white/80 border-white hover:border-accent-indigo/40'}`}
        >
            <div className="relative mb-4 w-24 h-24">
                <div className={`absolute inset-0 rounded-full blur-xl transition-all ${isPlayable ? 'bg-accent-indigo/20 animate-pulse-soft' : 'bg-slate-200'}`}></div>
                <img src={game.logo} alt={game.name} className="relative w-full h-full rounded-full border-4 border-white shadow-xl p-1 bg-white" />
            </div>

            <div className="text-center">
                <h3 className="font-black text-slate-900 text-lg tracking-tighter uppercase">{game.name}</h3>
                
                {hasFinalWinner ? (
                    <div className="mt-2">
                        <p className="text-[8px] text-accent-emerald font-black uppercase tracking-[0.4em] mb-1">FINAL</p>
                        <div className="text-3xl font-mono font-black text-slate-900">{game.winningNumber}</div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className={`text-2xl font-mono font-black ${isPlayable ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
                    </div>
                )}
            </div>

            {isPlayable && (
                <div className="absolute -bottom-2 px-6 py-2 bg-accent-indigo text-white text-[9px] font-black rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                    STAKE NOW
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
      setErrorMsg('PROTOCOL ERROR: MISSING FIELDS'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT LIQUIDITY'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'LINK ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-20 animate-fade-in relative pb-40">
      {/* Profile Header */}
      <div className="card bg-white/95 border-white flex flex-col md:flex-row justify-between items-center gap-14 px-16 py-20 relative overflow-hidden shadow-[0_48px_80px_-20px_rgba(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full"></div>
        
        <div className="flex items-center gap-12 relative z-10">
            <div className="relative">
                <div className="absolute -inset-4 bg-accent-indigo/5 rounded-full blur-2xl animate-spin-slow"></div>
                <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center font-black text-accent-indigo text-7xl shadow-2xl border-4 border-white relative z-10 overflow-hidden">
                   {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
            </div>
            <div>
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">{user.name}</h2>
              <div className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse-soft shadow-lg shadow-emerald-500/20"></span>
                  <p className="text-slate-400 text-[13px] font-black uppercase tracking-[0.6em]">{user.id} • NODE SYNCED</p>
              </div>
            </div>
        </div>
        <div className="text-center md:text-right relative z-10 bg-slate-50 px-12 py-8 rounded-[3rem] border border-slate-100 shadow-inner">
            <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.8em] mb-3">Available Credits</p>
            <p className="text-7xl font-black text-slate-900 font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* History */}
      <div className="space-y-12">
          <div className="flex items-center gap-10">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-[0.5em]">Ledger Archive</h3>
            <div className="h-[2px] flex-grow bg-slate-100 rounded-full"></div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Latest Transactions</div>
          </div>
          <div className="card overflow-hidden p-0 border-white shadow-2xl bg-white/60 backdrop-blur-3xl">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                          <tr>
                              <th className="p-10 text-[12px] font-black text-slate-400 uppercase tracking-widest">Time (UTC)</th>
                              <th className="p-10 text-[12px] font-black text-slate-400 uppercase tracking-widest">Target Market</th>
                              <th className="p-10 text-[12px] font-black text-slate-400 uppercase tracking-widest text-right">Debit Balance</th>
                              <th className="p-10 text-[12px] font-black text-slate-400 uppercase tracking-widest text-right">Link Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {bets.slice(-12).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-brand-50/40 transition-all group">
                                  <td className="p-10 text-[13px] font-mono text-slate-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-10"><span className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors">{games.find(g => g.id === bet.gameId)?.name}</span></td>
                                  <td className="p-10 text-right font-mono text-accent-rose font-black text-lg">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-10 text-right font-black text-[12px] text-slate-300 uppercase tracking-[0.4em] italic group-hover:text-slate-500 transition-colors">VERIFIED_TX</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Bet Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-8 backdrop-blur-2xl animate-fade-in">
            <div className="card w-full max-w-2xl bg-white p-0 overflow-hidden border-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] rounded-[4.5rem]">
                <div className="p-14 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-8">
                        <img src={selectedGame.logo} className="w-16 h-16 rounded-full shadow-xl bg-white p-1" alt="" />
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-none">TX DEPLOY: {selectedGame.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Target Terminal</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="p-4 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-900 transition-all hover:scale-110 shadow-sm">{Icons.close}</button>
                </div>
                <div className="p-16 space-y-14">
                    <div className="flex justify-center gap-5">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-12 py-6 rounded-full text-[12px] font-black uppercase transition-all ${betType === t ? 'bg-accent-indigo text-white shadow-2xl shadow-indigo-500/40 scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-12">
                        <div className="space-y-5 text-center">
                             <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em]">Input Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="e.g. 14, 52, 90" className="w-full text-center text-5xl font-mono font-black py-12 bg-slate-50 border-slate-200 rounded-[3rem] focus:ring-accent-indigo/20 shadow-inner" />
                        </div>
                        <div className="space-y-5 text-center">
                             <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em]">Credits Per Unit</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="PKR" className="w-full text-center text-5xl font-mono font-black py-12 text-accent-indigo bg-slate-50 border-slate-200 rounded-[3rem] focus:ring-accent-indigo/20 shadow-inner" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-10">
                            <div className="bg-slate-50 p-10 rounded-[3.5rem] text-center border border-slate-100 shadow-sm">
                                <p className="text-[12px] text-slate-400 font-black uppercase mb-3 tracking-[0.4em]">Total Stake</p>
                                <p className="text-4xl font-mono font-black text-slate-900">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-10 rounded-[3.5rem] text-center border border-slate-100 shadow-sm">
                                <p className="text-[12px] text-slate-400 font-black uppercase mb-3 tracking-[0.4em]">Unit Count</p>
                                <p className="text-4xl font-mono font-black text-slate-900">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <div className="text-center text-rose-500 font-black text-[12px] uppercase tracking-widest bg-rose-50 py-4 rounded-3xl border border-rose-100 animate-bounce">{errorMsg}</div>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-8 text-[15px] tracking-[0.8em] rounded-full shadow-indigo-500/50">
                        {isSubmitting ? 'SYNCING TRANSACTION...' : 'COMMIT TO LEDGER'}
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
