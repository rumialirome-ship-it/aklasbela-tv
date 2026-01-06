
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
        <div className={`card ${!isPlayable ? 'opacity-40 grayscale pointer-events-none' : 'hover:neon-border hover:-translate-y-1'}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <img src={game.logo} alt={game.name} className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 p-1" />
                    <div>
                        <h3 className="font-black text-white text-base tracking-tighter uppercase">{game.name}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
                    </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${isPlayable ? 'bg-neon-cyan animate-pulse shadow-[0_0_10px_#06b6d4]' : 'bg-rose-600 shadow-[0_0_10px_#f43f5e]'}`}></div>
            </div>

            <div className="bg-black/30 rounded-3xl p-6 text-center border border-white/5 mb-8">
                {hasFinalWinner ? (
                    <>
                        <p className="text-[8px] text-neon-cyan font-black uppercase tracking-[0.3em] mb-1">FINAL</p>
                        <div className="text-3xl font-mono font-black text-white tracking-tighter">{game.winningNumber}</div>
                    </>
                ) : (
                    <>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">{isPlayable ? 'REMAINING' : 'LOCKED'}</p>
                        <div className={`text-2xl font-mono font-black ${isPlayable ? 'neon-text-cyan' : 'text-slate-600'}`}>{countdownText}</div>
                    </>
                )}
            </div>

            <button 
                onClick={() => onPlay(game)} 
                disabled={!isPlayable}
                className="w-full btn-primary py-4 text-[10px] uppercase tracking-[0.4em] font-black"
            >
                PLACE STAKES
            </button>
        </div>
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
      setErrorMsg('PROTOCOL VIOLATION: INVALID FIELDS'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT TERMINAL BALANCE'); return;
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
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 animate-fade-in">
      {/* Profile Header */}
      <div className="card bg-gradient-to-br from-brand-900/40 to-slate-950/40 border-brand-500/20 flex flex-col md:flex-row justify-between items-center gap-10 px-12 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] rounded-full"></div>
        
        <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-black/60 flex items-center justify-center font-black text-neon-cyan text-5xl shadow-2xl border border-white/10 ring-1 ring-neon-cyan/20">
                {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{user.name}</h2>
              <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-neon-emerald rounded-full"></span>
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">{user.id} • PORTAL SYNCED</p>
              </div>
            </div>
        </div>
        <div className="text-center md:text-right relative z-10">
            <p className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.5em] mb-2">Available Credits</p>
            <p className="text-5xl font-black text-white font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* History */}
      <div className="space-y-8 pb-20">
          <div className="flex items-center gap-6">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Transaction Log</h3>
            <div className="h-[1px] flex-grow bg-white/5"></div>
            <p className="text-[10px] text-slate-500 font-black uppercase">Recent Activity</p>
          </div>
          <div className="card overflow-hidden p-0 border-brand-500/5">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-white/5">
                          <tr>
                              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Market</th>
                              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Debit</th>
                              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Checksum</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {bets.slice(-10).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-brand-500/5 transition-all">
                                  <td className="p-6 text-[11px] font-mono text-slate-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-6"><span className="text-xs font-black text-white uppercase tracking-wider">{games.find(g => g.id === bet.gameId)?.name}</span></td>
                                  <td className="p-6 text-right font-mono text-neon-rose font-black">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-6 text-right font-black text-[10px] text-slate-600 uppercase tracking-widest italic">VERIFIED</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Bet Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in">
            <div className="card w-full max-w-xl bg-slate-950/80 p-0 overflow-hidden border-neon-cyan/20">
                <div className="p-10 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src={selectedGame.logo} className="w-8 h-8 rounded-lg" alt="" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">STAKE ENTRY: {selectedGame.name}</h3>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="text-slate-500 hover:text-white transition-colors">{Icons.close}</button>
                </div>
                <div className="p-10 space-y-10">
                    <div className="flex justify-center gap-3">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${betType === t ? 'bg-neon-cyan text-black shadow-[0_0_20px_#06b6d4]' : 'bg-white/5 text-slate-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-3 text-center">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Protocol Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="01, 44, 92..." className="w-full text-center text-3xl font-mono font-black py-8 bg-black/40 border-white/5" />
                        </div>
                        <div className="space-y-3 text-center">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit per Unit</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="AMOUNT" className="w-full text-center text-3xl font-mono font-black py-8 text-neon-cyan bg-black/40 border-white/5" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/5 p-6 rounded-3xl text-center border border-white/5">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Total Liability</p>
                                <p className="text-2xl font-mono font-black text-white">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl text-center border border-white/5">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Unit Count</p>
                                <p className="text-2xl font-mono font-black text-white">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <p className="text-center text-rose-500 font-black text-[10px] uppercase tracking-widest">{errorMsg}</p>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-6 text-[11px] tracking-[0.5em] shadow-neon-cyan/10">
                        {isSubmitting ? 'ENCRYPTING TRANSACTION...' : 'COMMIT TO LEDGER'}
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
