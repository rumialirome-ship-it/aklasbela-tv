import React, { useState, useMemo, useEffect } from 'react';
import { Dealer, User, Game, PrizeRates, LedgerEntry, Bet, NumberLimit, SubGameType, Admin } from '../types';
import { Icons } from '../constants';
import { useAuth } from '../hooks/useAuth';

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

const SummaryCard: React.FC<{ title: string; value: number | string; color: string; label?: string }> = ({ title, value, color, label }) => (
    <div className="bg-evening-red-950/40 p-8 rounded-2xl border border-rose-900/30 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="text-6xl font-black text-white">{Icons.chartBar}</div>
        </div>
        <p className="text-[10px] font-black text-rose-50 uppercase tracking-[0.4em] mb-3">{title}</p>
        <p className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0 }) : value}</p>
        {label && <p className="text-[9px] text-rose-900 font-bold mt-2 uppercase tracking-widest">{label}</p>}
    </div>
);

const DashboardView: React.FC<{ summary: FinancialSummary | null; admin: Admin }> = ({ summary, admin }) => {
    const [health, setHealth] = useState<any>(null);
    const { fetchWithAuth } = useAuth();

    useEffect(() => {
        fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {});
    }, []);

    if (!summary) return <div className="text-center p-20 animate-pulse text-rose-950 font-black uppercase tracking-[1em]">Scanning Mainframe...</div>;

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <SummaryCard title="Vault Reserve" value={admin.wallet} color="text-rose-100" label="Current Liquidity" />
                <SummaryCard title="Gross Volume" value={summary.totals.totalStake} color="text-red-500" label="Aggregate Stakes" />
                <SummaryCard title="Liability" value={summary.totals.totalPayouts} color="text-rose-400" label="Prize Obligations" />
                
                {/* System Health Card */}
                <div className="bg-evening-red-950/40 p-8 rounded-2xl border border-rose-900/30 shadow-2xl relative flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-rose-50 uppercase tracking-[0.4em] mb-3">System Control</p>
                        <p className={`text-2xl font-black tracking-tighter ${health ? "text-green-500" : "text-red-600"}`}>
                            {health ? "STABLE" : "OFFLINE"}
                        </p>
                        <p className="text-[9px] text-rose-900 font-bold mt-2 uppercase tracking-widest">
                            {health ? `Node ${health.node} | Uptime: ${Math.floor(health.uptime / 60)}m` : "Reconnecting..."}
                        </p>
                    </div>
                </div>
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
                                        <span className="text-[10px] font-mono text-rose-950">[{game.winningNumber || '--'}]</span>
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

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.chartBar },
    { id: 'dealers', label: 'Dealers', icon: Icons.userGroup }, 
    { id: 'games', label: 'Games', icon: Icons.gamepad },
    { id: 'limits', label: 'Limits', icon: Icons.clipboardList }, 
  ];

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
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <input type="text" placeholder="Winner Num" value={winningNumbers[game.id] || ''} onChange={e => setWinningNumbers(prev => ({...prev, [game.id]: e.target.value}))} className="flex-grow bg-black/40 border border-rose-900/30 p-3 rounded-xl text-rose-50 text-xs focus:outline-none focus:border-red-600" />
                             <button onClick={() => { if(winningNumbers[game.id]) props.declareWinner(game.id, winningNumbers[game.id]); }} className="bg-red-600 text-white font-black p-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all">Declare</button>
                        </div>
                        {game.winningNumber && !game.payoutsApproved && <button onClick={() => props.approvePayouts(game.id)} className="w-full bg-rose-50 text-black font-black p-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg">Approve Payouts</button>}
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
                               <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full border-2 border-rose-600/30 overflow-hidden flex items-center justify-center bg-rose-950 text-rose-500 font-black">{dealer.name.charAt(0)}</div><div><div className="font-black text-rose-100 uppercase tracking-tight text-sm">{dealer.name}</div><div className="text-[10px] text-rose-900 font-bold tracking-widest uppercase">{dealer.id} / {dealer.area}</div></div></div></td>
                               <td className="p-6 text-right font-mono font-black text-rose-100 text-lg">{dealer.wallet.toLocaleString()}</td>
                               <td className="p-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${dealer.isRestricted ? 'bg-red-950/40 text-red-500 border-red-900/40' : 'bg-rose-950/40 text-rose-500 border-rose-900/40'}`}>{dealer.isRestricted ? 'Restricted' : 'Operational'}</span></td>
                               <td className="p-6 text-right"><div className="flex justify-end gap-3"><button onClick={() => { setSelectedDealer(dealer); setIsModalOpen(true); }} className="text-rose-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Modify</button></div></td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
