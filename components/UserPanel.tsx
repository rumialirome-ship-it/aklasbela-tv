
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
        <div className={`card card-hover ${!isPlayable ? 'opacity-50 grayscale pointer-events-none' : 'border-white'}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <img src={game.logo} alt={game.name} className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-md p-1" />
                    <div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tighter uppercase">{game.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isPlayable ? 'bg-accent-indigo animate-pulse' : 'bg-slate-300'}`}></div>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 text-center border border-slate-100 mb-8 shadow-inner">
                {hasFinalWinner ? (
                    <>
                        <p className="text-[10px] text-accent-emerald font-black uppercase tracking-[0.4em] mb-2">DRAW COMPLETE</p>
                        <div className="text-4xl font-mono font-black text-slate-900 tracking-tighter">{game.winningNumber}</div>
                    </>
                ) : (
                    <>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mb-2">{isPlayable ? 'TIME REMAINING' : 'MARKET LOCKED'}</p>
                        <div className={`text-3xl font-mono font-black ${isPlayable ? 'text-accent-indigo' : 'text-slate-300'}`}>{countdownText}</div>
                    </>
                )}
            </div>

            <button 
                onClick={() => onPlay(game)} 
                disabled={!isPlayable}
                className="w-full btn-primary py-5 text-[11px] uppercase tracking-[0.5em] font-black"
            >
                START TRADE
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
      setErrorMsg('MISSING DATA: FILL ALL PROTOCOL FIELDS'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('INSUFFICIENT BALANCE FOR TRANSACTION'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'GATEWAY ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 animate-fade-in relative">
      {/* Profile Header */}
      <div className="card bg-white/90 border-white flex flex-col md:flex-row justify-between items-center gap-12 px-14 py-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 blur-[100px] rounded-full"></div>
        
        <div className="flex items-center gap-10 relative z-10">
            <div className="w-28 h-28 rounded-[2rem] bg-slate-50 flex items-center justify-center font-black text-accent-indigo text-6xl shadow-xl border border-white">
                {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{user.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                  <span className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse-soft"></span>
                  <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.5em]">{user.id} • PORTAL ACTIVE</p>
              </div>
            </div>
        </div>
        <div className="text-center md:text-right relative z-10">
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] mb-3">Available Liquidity</p>
            <p className="text-6xl font-black text-slate-900 font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* History */}
      <div className="space-y-10 pb-32">
          <div className="flex items-center gap-8">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-[0.4em]">Audit Archive</h3>
            <div className="h-[1px] flex-grow bg-slate-200"></div>
          </div>
          <div className="card overflow-hidden p-0 border-white shadow-xl bg-white/50">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50">
                          <tr>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">Market</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Debit</th>
                              <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Checksum</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {bets.slice(-10).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-brand-50 transition-all">
                                  <td className="p-8 text-[12px] font-mono text-slate-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-8"><span className="text-sm font-black text-slate-900 uppercase tracking-tight">{games.find(g => g.id === bet.gameId)?.name}</span></td>
                                  <td className="p-8 text-right font-mono text-accent-rose font-black">-{bet.totalAmount.toLocaleString()}</td>
                                  <td className="p-8 text-right font-black text-[11px] text-slate-300 uppercase tracking-[0.2em] italic">VERIFIED</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Bet Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-8 backdrop-blur-xl animate-fade-in">
            <div className="card w-full max-w-2xl bg-white p-0 overflow-hidden border-white shadow-2xl rounded-[4rem]">
                <div className="p-12 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <img src={selectedGame.logo} className="w-12 h-12 rounded-2xl shadow-md bg-white p-1" alt="" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">TX ENTRY: {selectedGame.name}</h3>
                    </div>
                    <button onClick={() => setSelectedGame(null)} className="text-slate-300 hover:text-slate-900 transition-colors p-2 bg-white rounded-full border border-slate-100">{Icons.close}</button>
                </div>
                <div className="p-14 space-y-12">
                    <div className="flex justify-center gap-4">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase transition-all ${betType === t ? 'bg-accent-indigo text-white shadow-xl shadow-indigo-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-4 text-center">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Input Protocol Numbers</label>
                             <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="01, 14, 99..." className="w-full text-center text-4xl font-mono font-black py-10 bg-slate-50 border-slate-100 rounded-[3rem]" />
                        </div>
                        <div className="space-y-4 text-center">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Credits Per Unit</label>
                             <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="VALUE" className="w-full text-center text-4xl font-mono font-black py-10 text-accent-indigo bg-slate-50 border-slate-100 rounded-[3rem]" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-8 rounded-[3rem] text-center border border-slate-100">
                                <p className="text-[11px] text-slate-400 font-black uppercase mb-2 tracking-[0.3em]">Total Liability</p>
                                <p className="text-3xl font-mono font-black text-slate-900">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[3rem] text-center border border-slate-100">
                                <p className="text-[11px] text-slate-400 font-black uppercase mb-2 tracking-[0.3em]">Unit Quantity</p>
                                <p className="text-3xl font-mono font-black text-slate-900">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    {errorMsg && <p className="text-center text-rose-500 font-black text-[11px] uppercase tracking-widest animate-bounce">{errorMsg}</p>}
                    
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-7 text-[13px] tracking-[0.6em] rounded-[3rem] shadow-indigo-500/40">
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
