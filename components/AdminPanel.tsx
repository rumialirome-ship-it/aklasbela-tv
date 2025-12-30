
import React, { useState, useMemo, useEffect } from 'react';
import { Dealer, User, Game, PrizeRates, LedgerEntry, Bet, NumberLimit, SubGameType, Admin } from '../types';
import { Icons } from '../constants';
import { useAuth } from '../hooks/useAuth';
// Fix: Ensure UserForm is correctly imported as a named export from DealerPanel
import { UserForm } from './DealerPanel';

interface GameSummary {
  gameName: string;
  winningNumber: string;
  totalStake: number;
  totalPayouts: number;
  totalDealerProfit: number;
  totalCommissions: number;
  netProfit: number;
}

interface FinancialSummary {
  games: GameSummary[];
  totals: {
    totalStake: number;
    totalPayouts: number;
    totalDealerProfit: number;
    totalCommissions: number;
    netProfit: number;
  };
  totalBets: number;
}

type SortKey = 'name' | 'wallet' | 'status';
type SortDirection = 'asc' | 'desc';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const StatefulLedgerTableWrapper: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => {
    const [startDate, setStartDate] = useState(getTodayDateString());
    const [endDate, setEndDate] = useState(getTodayDateString());

    const filteredEntries = useMemo(() => {
        if (!startDate && !endDate) return entries;
        return entries.filter(entry => {
            const entryDateStr = entry.timestamp.toISOString().split('T')[0];
            if (startDate && entryDateStr < startDate) return false;
            if (endDate && entryDateStr > endDate) return false;
            return true;
        });
    }, [entries, startDate, endDate]);

    const inputClass = "w-full bg-black/40 p-3 rounded-xl border border-rose-900/40 focus:ring-1 focus:ring-rose-500 focus:outline-none text-rose-50 font-sans transition-all";

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end mb-6 bg-rose-950/20 p-6 rounded-2xl border border-rose-900/20">
                <div>
                    <label className="block text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2">From Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2">To Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                </div>
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-rose-900/40 hover:bg-rose-800/60 text-rose-100 font-bold py-3 px-4 rounded-xl border border-rose-900/40 transition-all h-fit uppercase text-[10px] tracking-widest">Show All Data</button>
            </div>
            <LedgerTable entries={filteredEntries} />
        </div>
    );
};

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    currentSortKey: SortKey;
    sortDirection: SortDirection;
    onSort: (key: SortKey) => void;
    className?: string;
}> = ({ label, sortKey, currentSortKey, sortDirection, onSort, className }) => {
    const isActive = sortKey === currentSortKey;
    const icon = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '';
    return (
        <th className={`p-4 text-[10px] font-black text-rose-50 uppercase tracking-[0.2em] cursor-pointer hover:text-rose-100 transition-colors ${className}`} onClick={() => onSort(sortKey)}>
            <div className="flex items-center gap-2">
                <span>{label}</span>
                <span className="text-red-500">{icon}</span>
            </div>
        </th>
    );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl'; themeColor?: string }> = ({ isOpen, onClose, title, children, size = 'md', themeColor = 'rose-quartz' }) => {
    if (!isOpen) return null;
    const sizeClasses: Record<string, string> = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex justify-center items-center z-50 p-4">
            <div className={`bg-evening-red-950 border border-rose-900/40 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[92vh] overflow-hidden`}>
                <div className="flex justify-between items-center p-6 border-b border-rose-900/30 flex-shrink-0">
                    <h3 className="text-sm font-black text-rose-100 uppercase tracking-[0.3em]">{title}</h3>
                    <button onClick={onClose} className="text-rose-900 hover:text-rose-400 transition-colors">{Icons.close}</button>
                </div>
                <div className="p-8 overflow-y-auto no-scrollbar">{children}</div>
            </div>
        </div>
    );
};

const LedgerTable: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-black/30 rounded-2xl overflow-hidden border border-rose-900/20">
        <div className="overflow-y-auto max-h-[60vh] mobile-scroll-x">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-rose-950/40 sticky top-0 backdrop-blur-md">
                    <tr>
                        <th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Date</th>
                        <th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Operation</th>
                        <th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Debit</th>
                        <th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Credit</th>
                        <th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Pool</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/10">
                    {Array.isArray(entries) && [...entries].reverse().map(entry => (
                        <tr key={entry.id} className="hover:bg-rose-500/5 text-xs transition-colors">
                            <td className="p-4 text-rose-400/60 font-mono whitespace-nowrap uppercase tracking-tighter">{entry.timestamp.toLocaleString()}</td>
                            <td className="p-4 text-rose-100 font-bold uppercase tracking-tight">{entry.description}</td>
                            <td className="p-4 text-right text-red-500 font-mono font-bold">{entry.debit > 0 ? `-${entry.debit.toFixed(2)}` : '—'}</td>
                            <td className="p-4 text-right text-rose-400 font-mono font-bold">{entry.credit > 0 ? `+${entry.credit.toFixed(2)}` : '—'}</td>
                            <td className="p-4 text-right font-black text-white font-mono">{entry.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                     {(!Array.isArray(entries) || entries.length === 0) && (
                        <tr><td colSpan={5} className="p-12 text-center text-rose-900 font-black uppercase tracking-[0.4em] italic">No Logs Found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

interface WinnerRecord {
    betId: string;
    timestamp: Date;
    userName: string;
    dealerName: string;
    gameName: string;
    winningNumber: string;
    subGameType: SubGameType;
    selectedNumbers: string[];
    winningNumbersInBet: string[];
    stake: number;
    payout: number;
    payoutApproved: boolean;
}

const WinnersView: React.FC<{ bets: Bet[], games: Game[], users: User[], dealers: Dealer[] }> = ({ bets, games, users, dealers }) => {
    const [startDate, setStartDate] = useState(getTodayDateString());
    const [endDate, setEndDate] = useState(getTodayDateString());
    const [searchTerm, setSearchTerm] = useState('');

    const winnerData = useMemo(() => {
        const records: WinnerRecord[] = [];
        const finalizedGames = games.filter(g => g.winningNumber && !g.winningNumber.includes('_'));

        finalizedGames.forEach(game => {
            const gameBets = bets.filter(b => b.gameId === game.id);
            const winningNumber = game.winningNumber!;

            gameBets.forEach(bet => {
                const user = users.find(u => u.id === bet.userId);
                const dealer = dealers.find(d => d.id === bet.dealerId);
                if (!user) return;

                const winningNumbersInBet = bet.numbers.filter(num => {
                    switch (bet.subGameType) {
                        case SubGameType.OneDigitOpen: return winningNumber.length === 2 && num === winningNumber[0];
                        case SubGameType.OneDigitClose: return game.name === 'AKC' ? num === winningNumber : (winningNumber.length === 2 && num === winningNumber[1]);
                        default: return num === winningNumber;
                    }
                });

                if (winningNumbersInBet.length > 0) {
                    const getPrizeMultiplier = (rates: PrizeRates, type: SubGameType) => {
                        if (type === SubGameType.OneDigitOpen) return rates.oneDigitOpen;
                        if (type === SubGameType.OneDigitClose) return rates.oneDigitClose;
                        return rates.twoDigit;
                    };
                    const multiplier = getPrizeMultiplier(user.prizeRates, bet.subGameType);
                    records.push({
                        betId: bet.id, timestamp: bet.timestamp, userName: user.name, dealerName: dealer?.name || '?',
                        gameName: game.name, winningNumber: winningNumber, subGameType: bet.subGameType,
                        selectedNumbers: bet.numbers, winningNumbersInBet, stake: bet.totalAmount,
                        payout: winningNumbersInBet.length * bet.amountPerNumber * multiplier,
                        payoutApproved: !!game.payoutsApproved
                    });
                }
            });
        });

        return records.filter(r => {
            const dateStr = r.timestamp.toISOString().split('T')[0];
            return (!startDate || dateStr >= startDate) && (!endDate || dateStr <= endDate) &&
                   (!searchTerm.trim() || r.userName.toLowerCase().includes(searchTerm.toLowerCase()));
        }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [bets, games, users, dealers, startDate, endDate, searchTerm]);

    return (
        <div>
            <h3 className="text-2xl font-black text-rose-100 uppercase tracking-tighter mb-8">Victory Terminal</h3>
            <div className="bg-evening-red-950/40 p-6 rounded-2xl border border-rose-900/20 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div><label className="text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2 block">Chronicle Start</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/40 p-3 rounded-xl border border-rose-900/30 text-rose-50" /></div>
                <div><label className="text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2 block">Chronicle End</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/40 p-3 rounded-xl border border-rose-900/30 text-rose-50" /></div>
                <div><label className="text-[10px] font-black text-rose-50 uppercase tracking-widest mb-2 block">Filter User</label><input type="text" placeholder="Search Identity..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 p-3 rounded-xl border border-rose-900/30 text-rose-50 uppercase tracking-tighter" /></div>
                <button onClick={() => { setStartDate(getTodayDateString()); setEndDate(getTodayDateString()); setSearchTerm(''); }} className="bg-rose-900/40 text-rose-100 font-bold py-3 rounded-xl uppercase tracking-widest text-[10px]">Purge Filters</button>
            </div>
            <div className="bg-black/30 rounded-2xl overflow-hidden border border-rose-900/20">
                <div className="overflow-x-auto mobile-scroll-x">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-rose-950/40">
                            <tr><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Timestamp</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Player</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Terminal</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest">Result</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Stake</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Payout</th><th className="p-4 text-[10px] font-black text-rose-50 uppercase tracking-widest text-center">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-rose-900/10">
                            {winnerData.map((record, i) => (
                                <tr key={i} className="hover:bg-red-600/5 transition-all">
                                    <td className="p-4 text-xs font-mono text-rose-900 uppercase">{record.timestamp.toLocaleString()}</td>
                                    <td className="p-4 font-black text-rose-100 uppercase tracking-tighter">{record.userName}</td>
                                    <td className="p-4 text-rose-400 font-bold uppercase text-[10px]">{record.gameName}</td>
                                    <td className="p-4 font-mono text-red-500 text-xl font-black">{record.winningNumber}</td>
                                    <td className="p-4 text-right font-mono text-rose-900 font-bold">{record.stake.toFixed(0)}</td>
                                    <td className="p-4 text-right font-mono text-white text-lg font-black">{record.payout.toLocaleString()}</td>
                                    <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${record.payoutApproved ? 'bg-red-900/20 text-red-400 border-red-900/40' : 'bg-rose-900/20 text-rose-400 border-rose-900/40'}`}>{record.payoutApproved ? 'Paid Out' : 'Queued'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ summary: FinancialSummary | null; admin: Admin }> = ({ summary, admin }) => {
    if (!summary) return <div className="text-center p-20 animate-pulse text-rose-950 font-black uppercase tracking-[1em]">Scanning Mainframe...</div>;

    const SummaryCard: React.FC<{ title: string; value: number; color: string; label?: string }> = ({ title, value, color, label }) => (
        <div className="bg-evening-red-950/40 p-8 rounded-2xl border border-rose-900/30 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="text-6xl font-black text-white">{Icons.chartBar}</div>
            </div>
            <p className="text-[10px] font-black text-rose-50 uppercase tracking-[0.4em] mb-3">{title}</p>
            <p className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{value.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
            {label && <p className="text-[9px] text-rose-900 font-bold mt-2 uppercase tracking-widest">{label}</p>}
        </div>
    );
    
    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <SummaryCard title="Vault Reserve" value={admin.wallet} color="text-rose-100" label="Current Liquidity" />
                <SummaryCard title="Gross Volume" value={summary.totals.totalStake} color="text-red-500" label="Aggregate Stakes" />
                <SummaryCard title="Liability" value={summary.totals.totalPayouts} color="text-rose-400" label="Prize Obligations" />
                <SummaryCard title="Net Ecosystem" value={summary.totals.netProfit} color={summary.totals.netProfit >= 0 ? "text-rose-100" : "text-red-600"} label="Operational Margin" />
            </div>

            <div className="bg-evening-red-950/40 rounded-3xl border border-rose-900/20 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-rose-900/20 flex justify-between items-center">
                    <h3 className="text-lg font-black text-rose-100 uppercase tracking-[0.2em]">Terminal Performance</h3>
                    <span className="text-[10px] font-bold text-rose-900 uppercase tracking-widest">Real-Time Sync Active</span>
                </div>
                <div className="overflow-x-auto mobile-scroll-x">
                    <table className="w-full text-left">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest">Terminal</th>
                                <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Volume</th>
                                <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Payouts</th>
                                <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-900/10">
                            {summary.games.map(game => (
                                <tr key={game.gameName} className="hover:bg-rose-500/5 group transition-all">
                                    <td className="p-6 font-bold text-rose-100 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#f43f5e]"></div>
                                        <span className="uppercase tracking-widest">{game.gameName}</span>
                                        <span className="text-[10px] font-mono text-rose-950">[{game.winningNumber}]</span>
                                    </td>
                                    <td className="p-6 text-right font-mono text-rose-300 font-bold">{game.totalStake.toLocaleString()}</td>
                                    <td className="p-6 text-right font-mono text-red-500 font-bold">{game.totalPayouts.toLocaleString()}</td>
                                    <td className={`p-6 text-right font-mono font-black text-lg ${game.netProfit >= 0 ? "text-rose-100" : "text-red-700"}`}>
                                        {game.netProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DealerForm: React.FC<{
  dealer?: Dealer;
  dealers: Dealer[];
  onSave: (dealer: any, originalId?: string) => Promise<void>;
  onCancel: () => void;
  adminPrizeRates: PrizeRates;
}> = ({ dealer, onSave, onCancel, adminPrizeRates }) => {
  const [formData, setFormData] = useState({
    id: dealer?.id || '',
    name: dealer?.name || '',
    password: dealer?.password || '',
    area: dealer?.area || '',
    contact: dealer?.contact || '',
    commissionRate: dealer?.commissionRate || 0,
    wallet: dealer?.wallet || 0,
    prizeRates: dealer?.prizeRates || { ...adminPrizeRates },
    avatarUrl: dealer?.avatarUrl || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, dealer?.id);
    onCancel();
  };

  const inputClass = "w-full bg-black/40 p-3 rounded-xl border border-rose-900/30 text-rose-50 text-xs focus:ring-1 focus:ring-red-600 focus:outline-none";

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-rose-50 uppercase mb-1">ID</label>
          <input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className="block text-[10px] font-black text-rose-50 uppercase mb-1">Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-rose-50 uppercase mb-1">Password</label>
          <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className="block text-[10px] font-black text-rose-50 uppercase mb-1">Commission %</label>
          <input type="number" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })} className={inputClass} required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="text-[10px] font-black text-rose-900 uppercase tracking-widest px-4">Cancel</button>
        <button type="submit" className="bg-red-600 text-white font-black py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all">
          {dealer ? 'Update Dealer' : 'Deploy Dealer'}
        </button>
      </div>
    </form>
  );
};

interface AdminPanelProps {
  admin: Admin;
  dealers: Dealer[];
  onSaveDealer: (dealer: any, originalId?: string) => Promise<void>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  games: Game[];
  bets: Bet[];
  declareWinner: (id: string, num: string) => Promise<void>;
  updateWinner: (id: string, num: string) => Promise<void>;
  approvePayouts: (id: string) => Promise<void>;
  topUpDealerWallet: (id: string, amt: number) => Promise<void>;
  withdrawFromDealerWallet: (id: string, amt: number) => Promise<void>;
  toggleAccountRestriction: (id: string, type: 'dealer' | 'user') => Promise<void>;
  onPlaceAdminBets: (d: any) => Promise<void>;
  updateGameDrawTime: (id: string, time: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | undefined>(undefined);
  const [viewingLedgerId, setViewingLedgerId] = useState<string | null>(null);
  const [viewingLedgerType, setViewingLedgerType] = useState<'dealer' | 'admin' | 'user' | null>(null);
  const { fetchWithAuth } = useAuth();
  const [winningNumbers, setWinningNumbers] = useState<{[key: string]: string}>({});

  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetchWithAuth('/api/admin/summary');
        if (response.ok) setSummaryData(await response.json());
      } catch (error) {}
    };
    if (activeTab === 'dashboard') fetchSummary();
  }, [activeTab, fetchWithAuth]);

  const activeLedgerAccount = useMemo(() => {
    if (!viewingLedgerId || !viewingLedgerType) return null;
    if (viewingLedgerType === 'admin') return props.admin;
    if (viewingLedgerType === 'dealer') return props.dealers.find(d => d.id === viewingLedgerId);
    if (viewingLedgerType === 'user') return props.users.find(u => u.id === viewingLedgerId);
    return null;
  }, [viewingLedgerId, viewingLedgerType, props.admin, props.dealers, props.users]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.chartBar },
    { id: 'dealers', label: 'Dealers', icon: Icons.userGroup }, 
    { id: 'users', label: 'Users', icon: Icons.clipboardList },
    { id: 'games', label: 'Games', icon: Icons.gamepad },
    { id: 'winners', label: 'Winners', icon: Icons.star },
    { id: 'limits', label: 'Limits', icon: Icons.clipboardList }, 
    { id: 'history', label: 'Pools', icon: Icons.wallet },
  ];

  const handleToggleGameStatus = async (gameId: string) => {
      try {
          await fetchWithAuth(`/api/admin/games/${gameId}/toggle-status`, { method: 'PUT' });
          if (props.onRefreshData) await props.onRefreshData();
      } catch (error) {
          console.error("Failed to toggle game status", error);
      }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-rose-900/20 pb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-rose-100 uppercase tracking-tighter mb-2">Central Ops</h2>
            <p className="text-rose-900 text-[10px] font-black uppercase tracking-[0.6em]">AKLASBELA-TV STRATEGIC COMMAND</p>
          </div>
          <div className="bg-rose-950/20 p-2 rounded-2xl flex items-center space-x-2 flex-wrap border border-rose-900/20 shadow-inner">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-3 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-red-600 text-white shadow-xl shadow-red-950/40' : 'text-rose-900 hover:text-rose-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>
      </div>
      
      {activeTab === 'dashboard' && <DashboardView summary={summaryData} admin={props.admin} />}
      {activeTab === 'winners' && <WinnersView bets={props.bets} games={props.games} users={props.users} dealers={props.dealers} />}
      
      {activeTab === 'games' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.games.map(game => (
                <div key={game.id} className={`bg-evening-red-950/40 p-6 rounded-3xl border transition-all ${game.isActive ? 'border-rose-900/20 opacity-100' : 'border-rose-950/50 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <img src={game.logo} alt={game.name} className="w-12 h-12 rounded-full border border-rose-900/20" />
                            <div>
                                <h4 className="font-black text-rose-50 uppercase tracking-tight text-sm">{game.name}</h4>
                                <p className="text-[10px] text-rose-950 font-bold uppercase tracking-widest">{game.drawTime}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleToggleGameStatus(game.id)}
                            className={`p-2 rounded-xl border transition-all ${game.isActive ? 'border-red-600/40 text-red-500 hover:bg-red-600 hover:text-white' : 'border-rose-900/40 text-rose-400 hover:bg-rose-900 hover:text-white'}`}
                            title={game.isActive ? "Hide Game" : "Show Game"}
                        >
                            {game.isActive ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            )}
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <input 
                                type="text" 
                                placeholder="Winner Num" 
                                value={winningNumbers[game.id] || ''}
                                onChange={e => setWinningNumbers(prev => ({...prev, [game.id]: e.target.value}))}
                                className="flex-grow bg-black/40 border border-rose-900/30 p-3 rounded-xl text-rose-50 text-xs focus:outline-none focus:border-red-600"
                             />
                             <button 
                                onClick={() => {
                                    if(winningNumbers[game.id]) props.declareWinner(game.id, winningNumbers[game.id]);
                                }}
                                className="bg-red-600 text-white font-black p-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all"
                             >
                                Declare
                             </button>
                        </div>
                        {game.winningNumber && !game.payoutsApproved && (
                             <button 
                                onClick={() => props.approvePayouts(game.id)}
                                className="w-full bg-rose-50 text-black font-black p-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                             >
                                Approve Payouts
                             </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'dealers' && (
        <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-rose-100 uppercase tracking-widest">Network Dealers</h3>
               <button onClick={() => { setSelectedDealer(undefined); setIsModalOpen(true); }} className="bg-red-600 hover:bg-red-500 text-white font-black py-4 px-10 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-red-950/40">Onboard Dealer</button>
           </div>
           <div className="bg-evening-red-950/40 rounded-3xl border border-rose-900/20 overflow-hidden">
               <table className="w-full text-left">
                   <thead className="bg-black/20">
                       <tr>
                           <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest">Profile</th>
                           <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Liquidity</th>
                           <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-center">Status</th>
                           <th className="p-6 text-[10px] font-black text-rose-50 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-rose-900/10">
                       {props.dealers.map(dealer => (
                           <tr key={dealer.id} className="hover:bg-rose-500/5 transition-all">
                               <td className="p-6">
                                   <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full border-2 border-rose-600/30 overflow-hidden flex items-center justify-center bg-rose-950 text-rose-500 font-black">
                                           {dealer.avatarUrl ? <img src={dealer.avatarUrl} className="w-full h-full object-cover" /> : dealer.name.charAt(0)}
                                       </div>
                                       <div>
                                           <div className="font-black text-rose-100 uppercase tracking-tight text-sm">{dealer.name}</div>
                                           <div className="text-[10px] text-rose-900 font-bold tracking-widest uppercase">{dealer.id} / {dealer.area}</div>
                                       </div>
                                   </div>
                               </td>
                               <td className="p-6 text-right font-mono font-black text-rose-100 text-lg">{dealer.wallet.toLocaleString()}</td>
                               <td className="p-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${dealer.isRestricted ? 'bg-red-950/40 text-red-500 border-red-900/40' : 'bg-rose-950/40 text-rose-500 border-rose-900/40'}`}>{dealer.isRestricted ? 'Restricted' : 'Operational'}</span></td>
                               <td className="p-6 text-right">
                                   <div className="flex justify-end gap-3">
                                       <button onClick={() => { setSelectedDealer(dealer); setIsModalOpen(true); }} className="text-rose-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Modify</button>
                                       <button onClick={() => { setViewingLedgerId(dealer.id); setViewingLedgerType('dealer'); }} className="text-red-600 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest">Logs</button>
                                   </div>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedDealer ? "Configure Dealer" : "Initial Onboarding"}>
          <DealerForm dealer={selectedDealer} dealers={props.dealers} onSave={props.onSaveDealer} onCancel={() => setIsModalOpen(false)} adminPrizeRates={props.admin.prizeRates} />
      </Modal>

      {activeLedgerAccount && (
        <Modal isOpen={!!activeLedgerAccount} onClose={() => { setViewingLedgerId(null); setViewingLedgerType(null); }} title={`Operation Log: ${activeLedgerAccount.name}`} size="xl">
            <StatefulLedgerTableWrapper entries={activeLedgerAccount.ledger} />
        </Modal>
      )}

    </div>
  );
};

export default AdminPanel;
