
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
    <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <div className="text-6xl font-black text-white">{Icons.chartBar}</div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">{title}</p>
        <p className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0 }) : value}</p>
        {label && <p className="text-[9px] text-slate-700 font-bold mt-2 uppercase tracking-widest">{label}</p>}
    </div>
);

const DashboardView: React.FC<{ summary: FinancialSummary | null; admin: Admin }> = ({ summary, admin }) => {
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {});
    }, []);

    if (!summary) return <div className="text-center p-20 animate-pulse text-slate-800 font-black uppercase tracking-[1em]">Scanning Mainframe...</div>;

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <SummaryCard title="Vault Reserve" value={admin.wallet} color="text-white" label="Current Liquidity" />
                <SummaryCard title="Gross Volume" value={summary.totals.totalStake} color="text-accent-indigo" label="Aggregate Stakes" />
                <SummaryCard title="Liability" value={summary.totals.totalPayouts} color="text-accent-rose" label="Prize Obligations" />
                
                <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 shadow-2xl relative flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">System Control</p>
                        <p className={`text-2xl font-black tracking-tighter ${health ? "text-accent-emerald" : "text-accent-rose"}`}>
                            {health ? "STABLE" : "OFFLINE"}
                        </p>
                        <p className="text-[9px] text-slate-700 font-bold mt-2 uppercase tracking-widest">
                            {health ? `Node ${health.node || 'v24'} | Uptime: ${Math.floor((health.uptime || 0) / 60)}m` : "Reconnecting..."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">Market Performance</h3>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Global Sync Active</span>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Terminal</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Volume</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Payouts</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {summary.games.map(game => (
                                <tr key={game.gameName} className="hover:bg-accent-indigo/5 group transition-all">
                                    <td className="p-6 font-bold text-slate-200 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-accent-indigo opacity-20 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                        <span className="uppercase tracking-widest">{game.gameName}</span>
                                        <span className="text-[10px] font-mono text-slate-600">[{game.winningNumber || '--'}]</span>
                                    </td>
                                    <td className="p-6 text-right font-mono text-slate-400 font-bold">{game.totalStake.toLocaleString()}</td>
                                    <td className="p-6 text-right font-mono text-accent-rose font-bold">{game.totalPayouts.toLocaleString()}</td>
                                    <td className={`p-6 text-right font-mono font-black text-lg ${game.netProfit >= 0 ? "text-accent-emerald" : "text-accent-rose"}`}>
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

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [winningNumbers, setWinningNumbers] = useState<{[key: string]: string}>({});
  const [summaryData, setSummaryData] = useState<FinancialSummary | null>(null);
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetchWithAuth('/api/admin/summary');
        if (response.ok) setSummaryData(await response.json());
      } catch (error) {}
    };
    if (activeTab === 'dashboard') fetchSummary();
  }, [activeTab, fetchWithAuth, props.onRefreshData]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.chartBar },
    { id: 'dealers', label: 'Dealers', icon: Icons.userGroup }, 
    { id: 'games', label: 'Games', icon: Icons.gamepad },
    { id: 'limits', label: 'Limits', icon: Icons.clipboardList }, 
  ];

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/5 pb-12">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter mb-2">Central Ops</h2>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.6em]">INSTITUTIONAL STRATEGIC COMMAND</p>
          </div>
          <div className="bg-slate-900/30 p-2 rounded-2xl flex items-center space-x-2 flex-wrap border border-white/5 shadow-inner backdrop-blur-xl">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-8 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/50' : 'text-slate-600 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>
      </div>
      
      {activeTab === 'dashboard' && <DashboardView summary={summaryData} admin={props.admin} />}
      
      {activeTab === 'games' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {props.games.map(game => (
                <div key={game.id} className={`bg-slate-900/40 p-8 rounded-[2.5rem] border transition-all ${game.isActive ? 'border-white/5 opacity-100' : 'border-white/5 opacity-40 grayscale'}`}>
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-5">
                            <img src={game.logo} alt={game.name} className="w-14 h-14 rounded-full border border-white/10 p-1 bg-slate-950" />
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-tight text-base">{game.name}</h4>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{game.drawTime}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                             <input type="text" placeholder="Winner" value={winningNumbers[game.id] || ''} onChange={e => setWinningNumbers(prev => ({...prev, [game.id]: e.target.value}))} className="flex-grow bg-black/40 border border-white/5 p-4 rounded-xl text-white text-xs focus:outline-none focus:border-accent-indigo" />
                             <button onClick={() => { if(winningNumbers[game.id]) props.declareWinner(game.id, winningNumbers[game.id]); }} className="bg-accent-indigo text-white font-black p-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all">Declare</button>
                        </div>
                        {game.winningNumber && !game.payoutsApproved && (
                          <button onClick={() => props.approvePayouts(game.id)} className="w-full bg-white text-black font-black p-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl">Approve Payouts</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'dealers' && (
        <div className="animate-fade-in">
           <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-white uppercase tracking-widest">Network Dealers</h3>
               <button onClick={() => {}} className="bg-accent-indigo hover:bg-indigo-500 text-white font-black py-5 px-12 rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-accent-indigo/50">Onboard Dealer</button>
           </div>
           <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                   <thead className="bg-black/20">
                       <tr>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Liquidity</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                           <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                       {props.dealers.map(dealer => (
                           <tr key={dealer.id} className="hover:bg-accent-indigo/5 transition-all">
                               <td className="p-8"><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center bg-slate-950 text-accent-indigo font-black text-xl">{dealer.name.charAt(0)}</div><div><div className="font-bold text-white uppercase tracking-tight text-base">{dealer.name}</div><div className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mt-1">{dealer.id} / {dealer.area}</div></div></div></td>
                               <td className="p-8 text-right font-mono font-black text-white text-xl">{dealer.wallet.toLocaleString()}</td>
                               <td className="p-8 text-center"><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase border tracking-widest ${dealer.isRestricted ? 'bg-accent-rose/10 text-accent-rose border-accent-rose/20' : 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'}`}>{dealer.isRestricted ? 'Restricted' : 'Operational'}</span></td>
                               <td className="p-8 text-right"><button className="text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Configure</button></td>
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

export default AdminPanel;
