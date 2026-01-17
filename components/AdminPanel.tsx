
import React, { useState, useEffect } from 'react';
import { Dealer, User, Game, Admin, Bet } from '../types';
import { Icons } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface SummaryCardProps {
  title: string;
  value: number | string;
  color: string;
  label?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, color, label }) => (
  <div className="bg-slate-900/40 p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
      <div className="text-5xl sm:text-6xl font-black text-white">{Icons.chartBar}</div>
    </div>
    <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 sm:mb-3">{title}</p>
    <p className={`text-2xl sm:text-4xl font-black font-mono tracking-tighter ${color}`}>
      {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0 }) : value}
    </p>
    {label && <p className="text-[8px] sm:text-[9px] text-slate-700 font-bold mt-2 uppercase tracking-widest">{label}</p>}
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ admin, dealers, games, declareWinner, updateWinner, approvePayouts, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [winningNumbers, setWinningNumbers] = useState<{[key: string]: string}>({});
  const { fetchWithAuth } = useAuth();
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetchWithAuth('/api/admin/summary');
        if (response.ok) setSummaryData(await response.json());
      } catch (error) {}
    };
    if (activeTab === 'dashboard') fetchSummary();
  }, [activeTab, fetchWithAuth, onRefreshData]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.chartBar },
    { id: 'dealers', label: 'Dealers', icon: Icons.userGroup }, 
    { id: 'results', label: 'Winning Numbers', icon: Icons.clipboardList },
  ];

  const validateWinningNumber = (game: Game, num: string) => {
    if (game.name === 'AK' || game.name === 'AKC') {
        return num.length === 1 && /^\d$/.test(num);
    }
    return num.length === 2 && /^\d{2}$/.test(num);
  };

  return (
    <div className="px-4 sm:px-10 py-8 sm:py-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 sm:mb-20 gap-8 sm:gap-10 border-b border-white/5 pb-12 sm:pb-16">
        <div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white uppercase tracking-tighter mb-2 sm:mb-3 leading-none">Command Center</h2>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-rose animate-pulse"></div>
            <p className="text-slate-600 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em]">ROOT_ACCESS_VERIFIED: {admin.id}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 p-1.5 rounded-2xl flex items-center space-x-1 w-full lg:w-auto overflow-x-auto no-scrollbar border border-white/5 shadow-inner backdrop-blur-2xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 py-4 px-6 sm:px-10 text-[9px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/50' : 'text-slate-600 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && summaryData && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <SummaryCard title="Reserve Vault" value={admin.wallet} color="text-white" label="System Liquidity" />
            <SummaryCard title="Gross Turnover" value={summaryData.totals.totalStake} color="text-accent-indigo" label="Market Volume" />
            <SummaryCard title="Liabilities" value={summaryData.totals.totalPayouts} color="text-accent-rose" label="Obligations" />
            <SummaryCard title="Net Yield" value={summaryData.totals.netProfit} color="text-accent-emerald" label="System Margin" />
          </div>

          <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-[0.3em]">Market Performance Matrix</h3>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Aggregate bets: {summaryData.totalBets}</span>
                 <button onClick={onRefreshData} className="text-accent-indigo hover:scale-110 transition-transform">{Icons.chartBar}</button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-black/40">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Volume</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Payouts</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summaryData.games.map((game: any) => (
                    <tr key={game.gameName} className="hover:bg-accent-indigo/5 transition-all">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-accent-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                           <span className="font-bold text-white uppercase tracking-widest text-sm">{game.gameName}</span>
                           <span className="text-[10px] font-mono text-slate-600">RES: {game.winningNumber || '--'}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right font-mono text-slate-400 text-sm">PKR {game.totalStake.toLocaleString()}</td>
                      <td className="p-6 text-right font-mono text-accent-rose text-sm">PKR {game.totalPayouts.toLocaleString()}</td>
                      <td className={`p-6 text-right font-mono font-black text-lg ${game.netProfit >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                        {game.netProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {games.map(game => {
              const currentInput = winningNumbers[game.id] || '';
              const isValid = validateWinningNumber(game, currentInput);
              const isDeclared = !!game.winningNumber;
              const isApproved = !!game.payoutsApproved;

              return (
                <div key={game.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col justify-between group hover:border-accent-indigo/40 transition-all backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                     <img src={game.logo} className="w-24 h-24 rounded-full grayscale" alt="" />
                  </div>
                  
                  <div className="mb-10">
                    <div className="flex items-center gap-5 mb-4">
                       <img src={game.logo} className="w-14 h-14 rounded-full border-2 border-white/10 p-1 bg-slate-950 shadow-2xl" alt="" />
                       <div>
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter">{game.name}</h4>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">NODE_TIME: {game.drawTime}</p>
                       </div>
                    </div>
                    <div className="flex gap-3">
                        <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${game.isActive ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                        {game.isActive ? 'Active Node' : 'Offline'}
                        </div>
                        {isDeclared && (
                            <div className="px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20">
                                Result Live: {game.winningNumber}
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                     {!isApproved && (
                         <div className="bg-black/60 p-8 rounded-3xl border border-white/5 shadow-inner">
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4 text-center">Protocol Payload Entry</p>
                            <div className="flex gap-4">
                               <input 
                                 type="text" 
                                 placeholder={game.name === 'AK' || game.name === 'AKC' ? "0" : "00"} 
                                 maxLength={game.name === 'AK' || game.name === 'AKC' ? 1 : 2}
                                 value={currentInput} 
                                 onChange={e => setWinningNumbers(prev => ({...prev, [game.id]: e.target.value}))} 
                                 className="text-center font-mono font-black text-4xl py-6 tracking-[0.2em] bg-slate-950 border-white/10 focus:border-accent-indigo"
                               />
                               <button 
                                 onClick={() => { 
                                     if(isValid) {
                                         if (isDeclared) updateWinner(game.id, currentInput);
                                         else declareWinner(game.id, currentInput);
                                         setWinningNumbers(prev => ({...prev, [game.id]: ''}));
                                     }
                                 }}
                                 disabled={!isValid}
                                 className={`px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isValid ? 'bg-accent-indigo text-white shadow-2xl hover:scale-105 active:scale-95' : 'bg-slate-900 text-slate-700 cursor-not-allowed'}`}
                               >
                                 {isDeclared ? 'Update' : 'Commit'}
                               </button>
                            </div>
                            <p className="text-[8px] text-slate-800 font-bold mt-4 text-center uppercase tracking-widest">
                                {game.name === 'AK' || game.name === 'AKC' ? "Single Digit Only" : "Double Digit Entry Required"}
                            </p>
                         </div>
                     )}

                     {isDeclared && !isApproved && (
                       <button 
                         onClick={() => { if(confirm("Liquidate all bets for this market?")) approvePayouts(game.id); }}
                         className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-slate-200 shadow-2xl transition-all"
                       >
                         Authorize Liquidations
                       </button>
                     )}

                     {isApproved && (
                        <div className="flex flex-col items-center justify-center p-10 bg-accent-emerald/5 border-2 border-dashed border-accent-emerald/20 rounded-[2.5rem] text-center">
                           <div className="text-accent-emerald text-3xl mb-4">
                               {Icons.chartBar}
                           </div>
                           <p className="text-accent-emerald font-black text-[11px] uppercase tracking-[0.5em]">Audit Finalized</p>
                           <p className="text-slate-600 text-[9px] font-bold mt-2 uppercase tracking-widest">Payouts successfully Pushed</p>
                        </div>
                     )}
                  </div>
                </div>
              );
          })}
        </div>
      )}

      {activeTab === 'dealers' && (
        <div className="animate-fade-in">
           <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left min-w-[800px]">
                 <thead className="bg-black/40">
                   <tr>
                     <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Node</th>
                     <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Liquidity</th>
                     <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                     <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {dealers.map(dealer => (
                     <tr key={dealer.id} className="hover:bg-accent-indigo/5 transition-all">
                       <td className="p-8">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center bg-slate-950 font-black text-accent-indigo text-xl shadow-inner">
                               {dealer.name.charAt(0)}
                            </div>
                            <div>
                               <h4 className="font-bold text-white uppercase tracking-tighter text-base">{dealer.name}</h4>
                               <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{dealer.id} / {dealer.area}</p>
                            </div>
                         </div>
                       </td>
                       <td className="p-8 text-right font-mono font-black text-white text-lg">PKR {dealer.wallet.toLocaleString()}</td>
                       <td className="p-8 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${dealer.isRestricted ? 'bg-accent-rose/10 text-accent-rose border-accent-rose/20' : 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'}`}>
                             {dealer.isRestricted ? 'Restricted' : 'Active'}
                          </span>
                       </td>
                       <td className="p-8 text-right">
                          <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Configure</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
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
