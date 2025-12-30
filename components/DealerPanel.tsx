
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dealer, User, PrizeRates, LedgerEntry, BetLimits, Bet, Game, SubGameType } from '../types';
import { Icons } from '../constants';
import { useCountdown } from '../hooks/useCountdown';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl'; themeColor?: string }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses: Record<string, string> = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex justify-center items-center z-50 p-4 overflow-y-auto">
            <div className={`bg-evening-red-950 border border-rose-900/30 rounded-[3rem] shadow-2xl w-full ${sizeClasses[size]} flex flex-col my-auto max-h-[92vh] overflow-hidden`}>
                <div className="flex justify-between items-center p-8 border-b border-rose-900/10 flex-shrink-0 bg-black/20">
                    <h3 className="text-xs font-black text-rose-50 uppercase tracking-[0.4em]">{title}</h3>
                    <button onClick={onClose} className="text-rose-900 hover:text-evening-red-500 transition-colors">{Icons.close}</button>
                </div>
                <div className="p-10 overflow-y-auto no-scrollbar custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

export const UserForm: React.FC<{
  user?: User;
  users: User[];
  onSave: (user: User, originalId?: string, initialDeposit?: number) => Promise<void>;
  onCancel: () => void;
  dealerPrizeRates: PrizeRates;
  dealerId: string;
  showToast: (msg: string) => void;
}> = ({ user, onSave, onCancel, dealerPrizeRates, dealerId }) => {
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    password: user?.password || '',
    area: user?.area || '',
    contact: user?.contact || '',
    commissionRate: user?.commissionRate || 0,
    wallet: user?.wallet || 0,
    prizeRates: user?.prizeRates || { ...dealerPrizeRates },
    betLimits: user?.betLimits || { oneDigit: 5000, twoDigit: 5000, perDraw: 50000 },
    avatarUrl: user?.avatarUrl || '',
  });
  const [initialDeposit, setInitialDeposit] = useState(0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = { ...formData, dealerId, isRestricted: user?.isRestricted || false, ledger: user?.ledger || [] } as User;
    await onSave(u, user?.id, initialDeposit);
    onCancel();
  };

  const inputClass = "w-full bg-black/40 p-4 rounded-2xl border border-rose-900/30 text-rose-50 text-xs focus:ring-1 focus:ring-evening-red-600 focus:outline-none transition-all";
  const labelClass = "block text-[10px] font-black text-rose-950 uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Agent Terminal ID</label>
          <input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className={inputClass} required disabled={!!user} />
        </div>
        <div>
          <label className={labelClass}>Display Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Security Pass</label>
          <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Commission Protocol (%)</label>
          <input type="number" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })} className={inputClass} required />
        </div>
      </div>
      {!user && (
        <div>
          <label className={labelClass}>Initial Credit Injection (PKR)</label>
          <input type="number" value={initialDeposit} onChange={e => setInitialDeposit(parseFloat(e.target.value))} className={inputClass} />
        </div>
      )}
      <div className="flex justify-end gap-4 pt-6 border-t border-rose-900/10">
        <button type="button" onClick={onCancel} className="text-[10px] font-black text-rose-900 uppercase tracking-[0.3em] px-6">Abort</button>
        <button type="submit" className="bg-evening-red-600 text-white font-black py-4 px-12 rounded-2xl text-[10px] uppercase tracking-[0.4em] hover:bg-evening-red-500 transition-all shadow-xl shadow-evening-red-900/30">
          {user ? 'Update Profile' : 'Initialize Agent'}
        </button>
      </div>
    </form>
  );
};

const DealerPanel: React.FC<DealerPanelProps> = ({ dealer, users, onSaveUser, onDeleteUser, topUpUserWallet, withdrawFromUserWallet, toggleAccountRestriction, bets, games, placeBetAsDealer, isLoaded = false }) => {
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

  if (!dealer) return <div className="min-h-screen flex items-center justify-center text-evening-red-950 font-black uppercase tracking-[1em] animate-pulse">Syncing Mainframe...</div>;

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8 border-b border-rose-900/10 pb-12">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-rose-50 uppercase tracking-tighter mb-2">Node Hub</h2>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-evening-red-600 animate-pulse"></div>
                <p className="text-rose-900 text-[10px] font-black uppercase tracking-[0.6em]">DEALER AUTHENTICATED: {dealer.id}</p>
            </div>
          </div>
          <div className="bg-black/30 p-2 rounded-2xl flex items-center space-x-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-rose-900/20 shadow-inner backdrop-blur-xl">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 py-4 px-8 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-evening-red-600 text-white shadow-2xl shadow-evening-red-950/50' : 'text-rose-900 hover:text-rose-400'}`}>
                    {tab.label}
                </button>
            ))}
          </div>
      </div>
      
      {activeTab === 'users' && (
        <div className="animate-fade-in">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-8">
            <h3 className="text-2xl font-black text-rose-50 uppercase tracking-widest flex items-center gap-6">
                Active Agents <span className="bg-evening-red-950 px-4 py-1 rounded-xl text-xs text-evening-red-500 font-mono">{(Array.isArray(users) ? users : []).length}</span>
            </h3>
            <div className="flex gap-4 w-full sm:w-auto">
                <input type="text" placeholder="Identity Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/40 p-5 border border-rose-900/30 rounded-2xl text-rose-50 text-xs w-full sm:w-80 focus:border-evening-red-600 focus:outline-none transition-all shadow-inner" />
                <button onClick={() => { setSelectedUser(undefined); setIsUserModalOpen(true); }} className="bg-rose-50 hover:bg-white text-black font-black px-10 py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl">Deploy Agent</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(Array.isArray(users) ? users : []).filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                  <div key={user.id} className="bg-evening-red-950/40 p-8 rounded-[2.5rem] border border-rose-900/20 shadow-2xl group hover:border-evening-red-600/40 transition-all backdrop-blur-xl">
                      <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-rose-900/30 flex items-center justify-center font-black text-evening-red-500 text-xl">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-rose-50 uppercase tracking-tight">{user.name}</h4>
                                <p className="text-[10px] font-bold text-rose-900 uppercase tracking-widest">{user.id}</p>
                            </div>
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full ${user.isRestricted ? 'bg-evening-red-600 shadow-[0_0_12px_#e11d48]' : 'bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#f43f5e]'}`}></div>
                      </div>
                      <div className="bg-black/30 p-6 rounded-2xl mb-8 border border-rose-900/10 shadow-inner">
                          <p className="text-[9px] font-black text-rose-950 uppercase tracking-[0.4em] mb-2">Liquidity Balance</p>
                          <p className="text-3xl font-black font-mono text-rose-50 tracking-tighter">PKR {user.wallet.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="text-[10px] font-black text-rose-900 hover:text-rose-100 uppercase tracking-[0.3em] transition-colors">Configure</button>
                          <button onClick={() => setViewingUserLedgerFor(user)} className="text-[10px] font-black text-evening-red-600 hover:text-evening-red-400 uppercase tracking-[0.3em] transition-colors">Audit Logs</button>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'terminal' && <div className="animate-fade-in"><BettingTerminalView users={users} games={games} placeBetAsDealer={placeBetAsDealer} /></div>}
      {activeTab === 'wallet' && <div className="animate-fade-in"><WalletView dealer={dealer} /></div>}
      
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={selectedUser ? "Agent System Configuration" : "New Agent Initialization"}>
          <UserForm user={selectedUser} users={users} onSave={onSaveUser} onCancel={() => setIsUserModalOpen(false)} dealerPrizeRates={dealer.prizeRates} dealerId={dealer.id} showToast={() => {}} />
      </Modal>

      {viewingUserLedgerFor && (
        <Modal isOpen={!!viewingUserLedgerFor} onClose={() => setViewingUserLedgerFor(null)} title={`Agent Ledger Archive: ${viewingUserLedgerFor.name}`} size="xl">
            <LedgerTable entries={viewingUserLedgerFor.ledger} />
        </Modal>
      )}
    </div>
  );
};

const WalletView: React.FC<{ dealer: Dealer }> = ({ dealer }) => (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-evening-red-950/40 p-10 rounded-[2.5rem] border border-rose-900/30 shadow-2xl flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-4">Total Liquidity Pool</p>
                <p className="text-5xl font-black text-rose-50 font-mono tracking-tighter">PKR {dealer.wallet.toLocaleString()}</p>
            </div>
            <div className="bg-evening-red-950/40 p-10 rounded-[2.5rem] border border-rose-900/30 shadow-2xl flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-4">Audit Record Count</p>
                <p className="text-5xl font-black text-rose-50 font-mono tracking-tighter">{(dealer.ledger || []).length}</p>
            </div>
        </div>
        <LedgerTable entries={dealer.ledger || []} />
    </div>
);

const LedgerTable: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-black/30 rounded-[2rem] overflow-hidden border border-rose-900/20 shadow-2xl backdrop-blur-xl">
        <div className="overflow-y-auto max-h-[60vh] mobile-scroll-x custom-scrollbar">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-black/40 sticky top-0 backdrop-blur-md">
                    <tr>
                        <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest">Timestamp</th>
                        <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest">Protocol</th>
                        <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Debit</th>
                        <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Credit</th>
                        <th className="p-6 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Pool</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/10">
                    {Array.isArray(entries) && [...entries].reverse().map(entry => (
                        <tr key={entry.id} className="hover:bg-evening-red-500/5 text-xs transition-all">
                            <td className="p-6 text-rose-950 font-mono whitespace-nowrap uppercase tracking-tighter">{entry.timestamp?.toLocaleString() || '—'}</td>
                            <td className="p-6 text-rose-100 font-bold uppercase tracking-tight">{entry.description}</td>
                            <td className="p-6 text-right text-evening-red-600 font-mono font-black">{entry.debit > 0 ? `-${entry.debit.toFixed(2)}` : '—'}</td>
                            <td className="p-6 text-right text-rose-400 font-mono font-black">{entry.credit > 0 ? `+${entry.credit.toFixed(2)}` : '—'}</td>
                            <td className="p-6 text-right font-black text-white font-mono text-sm">{entry.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                    {(!Array.isArray(entries) || entries.length === 0) && (
                        <tr><td colSpan={5} className="p-20 text-center text-rose-950 font-black uppercase tracking-[1em] italic">Archive Empty</td></tr>
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
            if (betGroups.length === 0) { alert("Protocol Error: Check Syntax (e.g. 14, 25 rs100)"); setIsLoading(false); return; }
            await placeBetAsDealer({ userId: selectedUserId, gameId: selectedGameId, betGroups });
            setBulkInput('');
            alert("Terminal Synchronization Complete");
        } catch (error: any) {
            alert("Data Integrity Violation: Entry Rejected");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-evening-red-950/40 p-10 rounded-[3rem] border border-rose-900/20 shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl font-black text-rose-50 uppercase tracking-[0.3em] mb-10">High-Velocity Entry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-black/60 text-rose-100 p-5 rounded-2xl border border-rose-900/30 text-[10px] font-black uppercase tracking-[0.2em] focus:border-evening-red-600 focus:outline-none appearance-none cursor-pointer">
                    <option value="">Select Agent ID</option>
                    {Array.isArray(users) && users.filter(u => !u.isRestricted).map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                </select>
                <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="bg-black/60 text-rose-100 p-5 rounded-2xl border border-rose-900/30 text-[10px] font-black uppercase tracking-[0.2em] focus:border-evening-red-600 focus:outline-none appearance-none cursor-pointer">
                    <option value="">Target Terminal</option>
                    {Array.isArray(games) && games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            <textarea rows={10} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="STAKE_LOG_PROTOCOL_ENTRY:&#10;14, 25, 33 rs50&#10;88, 91 rs100" className="w-full bg-black/60 text-rose-400 p-8 rounded-3xl border border-rose-900/30 font-mono text-sm focus:border-evening-red-600 focus:outline-none placeholder-rose-950 shadow-inner" />
            <div className="flex justify-end mt-10">
                <button onClick={handleProcessBets} disabled={!selectedUserId || !selectedGameId || !bulkInput || isLoading} className="w-full md:w-auto bg-evening-red-600 hover:bg-evening-red-500 text-white font-black py-5 px-16 rounded-2xl disabled:opacity-30 transition-all uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-evening-red-950/60">
                    {isLoading ? 'SYNCING...' : 'COMMIT ENTRIES'}
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
