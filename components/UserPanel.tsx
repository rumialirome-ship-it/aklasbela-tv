
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
        <div className={`card ${!isPlayable ? 'opacity-40 grayscale' : 'hover:border-brand-500/20'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <img src={game.logo} alt={game.name} className="w-10 h-10 rounded-full bg-obsidian-900 p-1" />
                    <div>
                        <h3 className="font-black text-white text-sm tracking-tight">{game.name}</h3>
                        <p className="text-[8px] text-obsidian-400 font-bold uppercase tracking-widest">{formatTime12h(game.drawTime)}</p>
                    </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${isPlayable ? 'bg-brand-500 animate-pulse' : 'bg-red-900'}`}></div>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 text-center border border-white/5 mb-6">
                {hasFinalWinner ? (
                    <div className="text-2xl font-mono font-black text-white">{game.winningNumber}</div>
                ) : (
                    <div className={`text-xl font-mono font-black ${isPlayable ? 'text-brand-400' : 'text-obsidian-400'}`}>{countdownText}</div>
                )}
            </div>

            <button 
                onClick={() => onPlay(game)} 
                disabled={!isPlayable}
                className="w-full btn-primary py-3 text-[10px] uppercase tracking-widest font-black"
            >
                Place Stakes
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
      setErrorMsg('Protocol violation: Incomplete fields.'); return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('Insufficient liquidity.'); return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({ gameId: selectedGame.id, betGroups: [{ subGameType: betType, numbers: parsedNumbers, amountPerNumber: amountPerNumber }] });
      setSelectedGame(null); setInputNumbers(''); setAmountPerNumber(0);
      alert("Terminal Sync Complete.");
    } catch (err: any) {
      setErrorMsg(err.message || 'System error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
      {/* Wallet Dashboard */}
      <div className="card bg-brand-600/5 border-brand-500/10 flex flex-col md:flex-row justify-between items-center gap-8 px-10">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-obsidian-900 flex items-center justify-center font-black text-brand-500 text-4xl shadow-2xl border border-white/5">
                {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
              <p className="text-obsidian-400 text-[10px] font-bold uppercase tracking-[0.4em]">{user.id} • Terminal Active</p>
            </div>
        </div>
        <div className="text-center md:text-right">
            <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-1">Available Liquidity</p>
            <p className="text-4xl font-black text-white font-mono tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={setSelectedGame} isRestricted={user.isRestricted} />
        ))}
      </div>

      {/* History */}
      <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Transaction Audit</h3>
            <div className="h-[1px] flex-grow bg-white/5"></div>
          </div>
          <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-white/5">
                          <tr>
                              <th className="p-5 text-[9px] font-black text-obsidian-400 uppercase tracking-widest">Date</th>
                              <th className="p-5 text-[9px] font-black text-obsidian-400 uppercase tracking-widest">Terminal</th>
                              <th className="p-5 text-[9px] font-black text-obsidian-400 uppercase tracking-widest text-right">Debit</th>
                              <th className="p-5 text-[9px] font-black text-obsidian-400 uppercase tracking-widest text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {bets.slice(-10).reverse().map(bet => (
                              <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="p-5 text-[10px] font-mono text-obsidian-400">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                  <td className="p-5"><span className="text-[11px] font-bold text-white uppercase">{games.find(g => g.id === bet.gameId)?.name}</span></td>
                                  <td className="p-5 text-right font-mono text-brand-500 font-bold">-{bet.totalAmount.toFixed(0)}</td>
                                  <td className="p-5 text-right font-black text-xs text-obsidian-400">SYNCED</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Bet Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="card w-full max-w-lg bg-obsidian-950 p-0 overflow-hidden">
                <div className="p-8 bg-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Terminal Entry: {selectedGame.name}</h3>
                    <button onClick={() => setSelectedGame(null)} className="text-obsidian-400 hover:text-brand-500">{Icons.close}</button>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex justify-center gap-2">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(t => (
                            <button key={t} onClick={() => setBetType(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${betType === t ? 'bg-brand-600 text-white' : 'bg-white/5 text-obsidian-400'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <input type="text" value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="PROTOCOL NUMBERS (14, 25...)" className="w-full text-center text-xl font-mono font-black py-6" />
                        <input type="number" value={amountPerNumber || ''} onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)} placeholder="STAKE AMOUNT" className="w-full text-center text-xl font-mono font-black py-6 text-brand-500" />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] text-obsidian-400 uppercase mb-1">Total Stake</p>
                                <p className="text-lg font-mono font-black text-white">PKR {totalStake}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] text-obsidian-400 uppercase mb-1">Units</p>
                                <p className="text-lg font-mono font-black text-white">{parsedNumbers.length}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCommitBet} disabled={isSubmitting || !totalStake} className="btn-primary w-full py-5 text-xs tracking-[0.4em]">
                        {isSubmitting ? 'ENCRYPTING...' : 'COMMIT TRANSACTION'}
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
