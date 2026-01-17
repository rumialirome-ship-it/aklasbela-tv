
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dealer, User, PrizeRates, LedgerEntry, BetLimits, Bet, Game, SubGameType } from '../types';
import { Icons } from '../constants';
import { useCountdown } from '../hooks/useCountdown';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses: Record<string, string> = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex justify-center items-center z-50 p-6 overflow-y-auto">
            <div className={`bg-obsidian border border-white/5 rounded-[3.5rem] shadow-2xl w-full ${sizeClasses[size]} flex flex-col my-auto max-h-[92vh] overflow-hidden`}>
                <div className="flex justify-between items-center p-10 border-b border-white/5 flex-shrink-0 bg-slate-900/50">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">{title}</h3>
                    <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">{Icons.close}</button>
                </div>
                <div className="p-12 overflow-y-auto no-scrollbar custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

const DealerPanel: React.FC<DealerPanelProps> = ({ dealer, users, onSaveUser, onDeleteUser, topUpUserWallet, withdrawFromUserWallet, toggleAccountRestriction, bets, games, placeBetAsDealer }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [viewingUserLedgerFor, setViewingUserLedgerFor] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'users', label: 'Network', icon: Icons.userGroup },
    { id: 'terminal', label: 'Terminal', icon: Icons.clipboardList },
    { id: 'wallet', label: 'Liquidity', icon: Icons.wallet },
    { id: 'history', label: 'Archive', icon: Icons.bookOpen },
  ];

  if (!dealer) return <div className="min-h-screen flex items-center justify-center text-slate-800 font-black uppercase tracking-[1em] animate-pulse">Establishing Node...</div>;

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-10 border-b border-white/5 pb-16">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter mb-3">Node Hub</h2>
            <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-accent-indigo animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
                <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.6em]">DEALER AUTHENTICATED: {dealer.id}</p>
            </div>
          </div>
          <div className="bg-slate-900/30 p-2 rounded-[2rem] flex items-center space-x-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-white/5 shadow-inner backdrop-blur-2xl">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 py-5 px-10 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-accent-indigo text-white shadow-2xl shadow-accent-indigo/50' : 'text-slate-600 hover:text-white'}`}>
                    {tab.label}
                </button>
            ))}
          </div>
      </div>
      
      {activeTab === 'users' && (
        <div className="animate-fade-in">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-8">
                Active Agents <span className="bg-slate-950 px-6 py-2 rounded-2xl text-sm text-accent-indigo font-mono">{(Array.isArray(users) ? users : []).length}</span>
            </h3>
            <div className="flex gap-6 w-full sm:w-auto">
                <input type="text" placeholder="Identity Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/40 p-6 border border-white/5 rounded-3xl text-white text-xs w-full sm:w-96 focus:border-accent-indigo focus:outline-none shadow-inner" />
                <button onClick={() => { setSelectedUser(undefined); setIsUserModalOpen(true); }} className="bg-white hover:bg-slate-200 text-black font-black px-12 py-6 rounded-3xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl">Deploy Agent</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {(Array.isArray(users) ? users : []).filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                  <div key={user.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl group hover:border-accent-indigo/40 transition-all backdrop-blur-xl">
                      <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-black/40 border border-white/10 flex items-center justify-center font-black text-accent-indigo text-2xl shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white uppercase tracking-tight">{user.name}</h4>
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-1">{user.id}</p>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${user.isRestricted ? 'bg-accent-rose shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-accent-emerald opacity-20 group-hover:opacity-100 transition-opacity shadow-[0_0_12px_rgba(16,185,129,0.6)]'}`}></div>
                      </div>
                      <div className="bg-black/30 p-8 rounded-3xl mb-10 border border-white/5 shadow-inner">
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Vault Credit</p>
                          <p className="text-4xl font-black font-mono text-white tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="text-[11px] font-black text-slate-600 hover:text-white uppercase tracking-[0.3em] transition-colors">Configure</button>
                          <button onClick={() => setViewingUserLedgerFor(user)} className="text-[11px] font-black text-accent-indigo hover:text-indigo-400 uppercase tracking-[0.3em] transition-colors">Audit Logs</button>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'terminal' && (
        <div className="animate-fade-in">
          <BettingTerminalView users={users} games={games} placeBetAsDealer={placeBetAsDealer} />
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
              <div className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">Node Liquidity</p>
                  <p className="text-6xl font-black text-white font-mono tracking-tighter">PKR {dealer.wallet.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">Audit Record Count</p>
                  <p className="text-6xl font-black text-white font-mono tracking-tighter">{(dealer.ledger || []).length}</p>
              </div>
          </div>
          <LedgerTable entries={dealer.ledger || []} />
        </div>
      )}
      
      {viewingUserLedgerFor && (
        <Modal isOpen={!!viewingUserLedgerFor} onClose={() => setViewingUserLedgerFor(null)} title={`Agent Ledger: ${viewingUserLedgerFor.name}`} size="xl">
            <LedgerTable entries={viewingUserLedgerFor.ledger} />
        </Modal>
      )}
    </div>
  );
};

const LedgerTable: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-black/30 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="overflow-y-auto max-h-[60vh] no-scrollbar custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-black/50 sticky top-0 backdrop-blur-2xl z-20">
                    <tr>
                        <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Protocol Date</th>
                        <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Instruction</th>
                        <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Debit</th>
                        <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Credit</th>
                        <th className="p-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Pool</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {Array.isArray(entries) && [...entries].reverse().map(entry => (
                        <tr key={entry.id} className="hover:bg-accent-indigo/5 transition-all">
                            <td className="p-8 text-xs font-mono font-bold text-slate-600 uppercase tracking-tighter">{entry.timestamp?.toLocaleString()}</td>
                            <td className="p-8 text-base font-bold text-slate-200 uppercase tracking-tight">{entry.description}</td>
                            <td className="p-8 text-right text-accent-rose font-mono font-black text-lg">{entry.debit > 0 ? `-${entry.debit.toFixed(2)}` : '—'}</td>
                            <td className="p-8 text-right text-accent-emerald font-mono font-black text-lg">{entry.credit > 0 ? `+${entry.credit.toFixed(2)}` : '—'}</td>
                            <td className="p-8 text-right font-black text-white font-mono text-xl">{entry.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                    {(!Array.isArray(entries) || entries.length === 0) && (
                        <tr><td colSpan={5} className="p-32 text-center text-slate-800 font-black uppercase tracking-[1em] italic">Archive Empty</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const BettingTerminalView: React.FC<{ users: User[]; games: Game[]; placeBetAsDealer: (details: any) => Promise<void> }> = ({ users, games, placeBetAsDealer }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedGameId, setSelectedGameId] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProcessBets = async () => {
        if (!selectedUserId || !selectedGameId || !bulkInput) return;
        setIsLoading(true);
        try {
            const lines = bulkInput.split('\n').filter(l => l.trim());
            const betGroups: any[] = [];
            lines.forEach(line => {
                const stakeMatch = line.match(/(?:rs|r)\s*(\d+\.?\d*)/i);
                const stake = stakeMatch ? parseFloat(stakeMatch[1]) : 0;
                if (stake <= 0) return;
                const numbersPart = line.substring(0, stakeMatch!.index).trim();
                const numbers = numbersPart.split(/[-.,\s]+/).filter(n => n.length > 0);
                if (numbers.length > 0) {
                    betGroups.push({ subGameType: SubGameType.TwoDigit, numbers, amountPerNumber: stake });
                }
            });
            await placeBetAsDealer({ userId: selectedUserId, gameId: selectedGameId, betGroups });
            setBulkInput('');
            alert("Terminal Synchronization Complete");
        } catch (error: any) {
            alert(error.message || "Data Integrity Violation: Entry Rejected");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 p-12 rounded-[4rem] border border-white/5 shadow-2xl backdrop-blur-xl">
            <h3 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-12">High-Velocity Terminal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-black/60 text-white p-6 rounded-3xl border border-white/5 text-[11px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer shadow-inner">
                    <option value="">Select Agent ID</option>
                    {Array.isArray(users) && users.filter(u => !u.isRestricted).map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                </select>
                <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="bg-black/60 text-white p-6 rounded-3xl border border-white/5 text-[11px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer shadow-inner">
                    <option value="">Target Market</option>
                    {Array.isArray(games) && games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            <textarea rows={12} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="STAKE_LOG_PROTOCOL:&#10;14, 25, 33 rs50&#10;88, 91 rs100" className="w-full bg-black/60 text-accent-indigo p-10 rounded-[3rem] border border-white/5 font-mono text-base sm:text-lg focus:border-accent-indigo focus:outline-none placeholder-slate-800 shadow-inner" />
            <div className="flex justify-end mt-12">
                <button onClick={handleProcessBets} disabled={!selectedUserId || !selectedGameId || !bulkInput || isLoading} className="w-full sm:w-auto bg-accent-indigo hover:bg-indigo-500 text-white font-black py-6 px-20 rounded-3xl disabled:opacity-30 transition-all uppercase tracking-[0.5em] text-[11px] shadow-2xl shadow-accent-indigo/40">
                    {isLoading ? 'ESTABLISHING SYNC...' : 'COMMIT TRANSACTION'}
                </button>
            </div>
        </div>
    );
};

interface DealerPanelProps {
  dealer: Dealer;
  users: User[];
  onSaveUser: (user: User, originalId?: string, initialDeposit?: number) => Promise<void>;
  onDeleteUser: (uId: string) => Promise<void>;
  topUpUserWallet: (userId: string, amount: number) => Promise<void>;
  withdrawFromUserWallet: (userId: string, amount: number) => Promise<void>;
  toggleAccountRestriction: (userId: string, userType: 'user') => void;
  bets: Bet[];
  games: Game[];
  placeBetAsDealer: (details: { userId: string; gameId: string; betGroups: any[] }) => Promise<void>;
  isLoaded?: boolean;
}

export default DealerPanel;
