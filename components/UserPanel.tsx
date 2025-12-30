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
    const logo = game.logo;

    return (
        <div className={`bg-evening-red-950/40 rounded-3xl shadow-2xl p-6 flex flex-col justify-between transition-all duration-500 border border-rose-900/20 ${!isPlayable ? 'opacity-60' : 'hover:border-evening-red-500/50 hover:-translate-y-2'}`}>
            <div>
                <div className="flex items-center mb-6">
                    <img src={logo} alt={game.name} className="w-14 h-14 rounded-full border-2 border-rose-900/50 shadow-xl" />
                    <div className="ml-4">
                        <h3 className="text-lg font-black text-rose-50 uppercase tracking-widest">{game.name}</h3>
                        <p className="text-[10px] text-rose-900 font-bold uppercase tracking-widest">Draw @ {formatTime12h(game.drawTime)}</p>
                    </div>
                </div>
                <div className="text-center my-6 p-4 rounded-2xl bg-black/40 border border-rose-900/30 min-h-[90px] flex flex-col justify-center">
                    {hasFinalWinner ? (
                        <>
                            <div className="text-[8px] uppercase tracking-[0.4em] text-evening-red-500 font-black mb-1">FINAL DRAW</div>
                            <div className="text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_#e11d48]">{game.winningNumber}</div>
                        </>
                    ) : status === 'OPEN' ? (
                        <>
                            <div className="text-[8px] uppercase tracking-[0.4em] text-rose-500/50 mb-1">CLOSING IN</div>
                            <div className="text-3xl font-mono font-black text-evening-red-500">{countdownText}</div>
                        </>
                    ) : (
                        <div className="text-sm font-black text-rose-900 uppercase tracking-widest">{countdownText}</div>
                    )}
                </div>
            </div>
            <button 
                onClick={() => onPlay(game)} 
                disabled={!isPlayable}
                className="w-full bg-rose-50 hover:bg-white text-black font-black py-4 rounded-2xl transition-all duration-300 disabled:bg-rose-950 disabled:text-rose-900 uppercase tracking-[0.3em] text-[10px] shadow-2xl"
            >
                Enter Stake
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
      setErrorMsg('Protocol violation: Incomplete data fields.');
      return;
    }
    if (totalStake > user.wallet) {
      setErrorMsg('Liquidity failure: Insufficient credits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await placeBet({
        gameId: selectedGame.id,
        betGroups: [
          {
            subGameType: betType,
            numbers: parsedNumbers,
            amountPerNumber: amountPerNumber
          }
        ]
      });
      setSelectedGame(null);
      setInputNumbers('');
      setAmountPerNumber(0);
      alert("Transaction synchronized with grid.");
    } catch (err: any) {
      setErrorMsg(err.message || 'Transmission interrupted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
       {/* User Header Profile */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-evening-red-950/40 p-8 rounded-3xl mb-12 border border-rose-900/20 gap-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-evening-red-600/30 overflow-hidden shadow-2xl bg-rose-950 flex items-center justify-center">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-rose-500">{user.name.charAt(0)}</span>}
            </div>
            <div>
              <h2 className="text-4xl font-black text-rose-50 uppercase tracking-tighter">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-evening-red-600"></div>
                <p className="text-rose-900 text-[10px] font-black uppercase tracking-[0.5em]">Terminal ID: {user.id}</p>
              </div>
            </div>
        </div>
        <div className="bg-black/40 p-6 px-10 rounded-2xl border border-rose-900/30 text-right shadow-inner">
            <p className="text-[10px] text-evening-red-500 font-black uppercase tracking-[0.4em] mb-2">Available Credits</p>
            <p className="font-mono font-black text-4xl text-rose-50 tracking-tighter">PKR {user.wallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-black text-rose-50 uppercase tracking-[0.2em]">Active Terminals</h2>
        <div className="h-px flex-grow mx-8 bg-rose-900/20 hidden md:block"></div>
        <span className="text-[10px] font-black text-rose-950 uppercase tracking-[0.4em]">Grid Status: Online</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={(g) => { setSelectedGame(g); setErrorMsg(''); }} isRestricted={user.isRestricted} />
        ))}
      </div>
      
      {/* Bet History */}
      <div className="mt-24">
          <div className="flex items-center gap-6 mb-8">
            <h3 className="text-xl font-black text-rose-100 uppercase tracking-[0.3em]">Operational Logs</h3>
            <div className="h-px flex-grow bg-rose-900/10"></div>
          </div>
          <div className="bg-evening-red-950/40 rounded-3xl overflow-hidden border border-rose-900/20 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto mobile-scroll-x custom-scrollbar">
                  <table className="w-full text-left">
                      <thead className="bg-black/40">
                          <tr>
                              <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest">Timestamp</th>
                              <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest">Terminal</th>
                              <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Stake</th>
                              <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Outcome</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-900/10">
                          {bets.filter(b => b.userId === user.id).slice(-15).reverse().map(bet => {
                              const game = games.find(g => g.id === bet.gameId);
                              return (
                                  <tr key={bet.id} className="hover:bg-evening-red-500/5 transition-all">
                                      <td className="p-6 text-xs font-mono text-rose-900 uppercase tracking-tighter">{new Date(bet.timestamp).toLocaleString()}</td>
                                      <td className="p-6">
                                          <div className="text-sm font-black text-rose-50 uppercase tracking-tight">{game?.name}</div>
                                          <div className="text-[10px] text-rose-950 font-bold uppercase tracking-widest">{bet.subGameType}</div>
                                      </td>
                                      <td className="p-6 text-right font-mono text-evening-red-400 font-bold">{bet.totalAmount.toFixed(2)}</td>
                                      <td className="p-6 text-right font-black text-white font-mono">—</td>
                                  </tr>
                              );
                          })}
                          {bets.filter(b => b.userId === user.id).length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-rose-950 uppercase tracking-widest font-black italic">Log Empty</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {selectedGame && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-4">
            <div className="bg-evening-red-950 border border-rose-900/40 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-rose-900/20 flex justify-between items-center bg-black/40">
                    <h3 className="text-xl font-black text-rose-50 uppercase tracking-[0.3em]">Stake Terminal: {selectedGame.name}</h3>
                    <button onClick={() => setSelectedGame(null)} className="text-rose-900 hover:text-evening-red-500 transition-colors">{Icons.close}</button>
                </div>
                <div className="p-10">
                    <div className="flex gap-2 mb-8 justify-center">
                        {[SubGameType.OneDigitOpen, SubGameType.OneDigitClose, SubGameType.TwoDigit].map(type => (
                            <button
                                key={type}
                                onClick={() => setBetType(type)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${betType === type ? 'bg-evening-red-600 text-white shadow-lg' : 'bg-black/40 text-rose-900 border border-rose-900/20'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-rose-950 uppercase tracking-[0.4em] mb-2 text-center">Protocol Input (Numbers)</label>
                            <input 
                                type="text"
                                value={inputNumbers}
                                onChange={e => setInputNumbers(e.target.value)}
                                placeholder="e.g. 14, 25, 88"
                                className="w-full bg-black/60 border border-rose-900/30 p-6 rounded-3xl text-center text-2xl font-mono font-black text-rose-100 focus:border-evening-red-500 focus:outline-none transition-all placeholder-rose-950"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-rose-950 uppercase tracking-[0.4em] mb-2 text-center">Unit Stake (PKR)</label>
                            <input 
                                type="number"
                                value={amountPerNumber || ''}
                                onChange={e => setAmountPerNumber(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full bg-black/60 border border-rose-900/30 p-6 rounded-3xl text-center text-2xl font-mono font-black text-evening-red-500 focus:border-evening-red-500 focus:outline-none transition-all placeholder-rose-950"
                            />
                        </div>

                        <div className="bg-black/40 p-6 rounded-3xl border border-rose-900/10 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black text-rose-900 uppercase tracking-widest">Aggregate Stake</p>
                                <p className="text-2xl font-black font-mono text-rose-50">PKR {totalStake.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-rose-900 uppercase tracking-widest">Selected Units</p>
                                <p className="text-2xl font-black font-mono text-rose-50">{parsedNumbers.length}</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-950/40 border border-red-900/40 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest text-center animate-pulse">
                                {errorMsg}
                            </div>
                        )}
                    </div>

                    <button 
                      onClick={handleCommitBet}
                      disabled={isSubmitting || parsedNumbers.length === 0 || amountPerNumber <= 0}
                      className="w-full mt-10 bg-evening-red-600 hover:bg-evening-red-500 text-white font-black py-6 rounded-2xl uppercase tracking-[0.5em] text-xs transition-all shadow-xl shadow-evening-red-900/50 disabled:opacity-20"
                    >
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