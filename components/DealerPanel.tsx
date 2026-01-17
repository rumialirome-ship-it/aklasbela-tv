
import React, { useState, useMemo, useEffect } from 'react';
import { Dealer, User, LedgerEntry, Bet, Game, SubGameType } from '../types';
import { Icons } from '../constants';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses: Record<string, string> = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex justify-center items-center z-[60] p-4 sm:p-6 overflow-y-auto">
            <div className={`bg-obsidian border border-white/5 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl w-full ${sizeClasses[size]} flex flex-col my-auto max-h-[95vh] overflow-hidden`}>
                <div className="flex justify-between items-center p-8 sm:p-10 border-b border-white/5 flex-shrink-0 bg-slate-900/50">
                    <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.4em]">{title}</h3>
                    <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">{Icons.close}</button>
                </div>
                <div className="p-8 sm:p-12 overflow-y-auto no-scrollbar custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

const DealerPanel: React.FC<DealerPanelProps> = ({ dealer, users, onSaveUser, topUpUserWallet, withdrawFromUserWallet, toggleAccountRestriction, games, placeBetAsDealer, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'users', label: 'Network', icon: Icons.userGroup },
    { id: 'terminal', label: 'Terminal', icon: Icons.clipboardList },
    { id: 'wallet', label: 'Vault', icon: Icons.wallet },
    { id: 'settings', label: 'Nodes', icon: Icons.plus },
  ];

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery]);

  return (
    <div className="px-4 sm:px-10 py-8 sm:py-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 sm:mb-20 gap-8 sm:gap-10 border-b border-white/5 pb-12 sm:pb-16">
          <div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white uppercase tracking-tighter mb-2 sm:mb-3 leading-none">Node Hub</h2>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-indigo animate-pulse"></div>
                <p className="text-slate-600 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em]">DEALER_AUTH: {dealer.id}</p>
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
      
      {activeTab === 'users' && (
        <div className="animate-fade-in">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-10 sm:mb-12 gap-6 sm:gap-10">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest flex items-center gap-6">
                Active Agents <span className="bg-slate-950 px-5 py-2 rounded-xl text-xs sm:text-sm text-accent-indigo font-mono">{filteredUsers.length}</span>
            </h3>
            <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">{Icons.search}</span>
                    <input type="text" placeholder="Identity Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/40 pl-14 pr-6 py-4 border border-white/5 rounded-2xl text-white text-xs w-full sm:w-72 focus:border-accent-indigo focus:outline-none" />
                </div>
                <button onClick={() => { setSelectedUser(undefined); setIsUserModalOpen(true); }} className="bg-white hover:bg-slate-200 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shrink-0">Add Agent</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
              {filteredUsers.map(user => (
                  <div key={user.id} className="bg-slate-900/40 p-10 sm:p-12 rounded-[3rem] border border-white/5 shadow-2xl group hover:border-accent-indigo/40 transition-all backdrop-blur-xl flex flex-col justify-between h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-accent-indigo opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-5 sm:gap-7">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center font-black text-accent-indigo text-2xl sm:text-3xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight line-clamp-1">{user.name}</h4>
                                <p className="text-[11px] sm:text-[12px] font-black text-slate-600 uppercase tracking-widest mt-1.5">{user.id}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleAccountRestriction(user.id, 'user')} className={`w-3 h-3 rounded-full transition-all mt-3 ${user.isRestricted ? 'bg-accent-rose shadow-[0_0_15px_rgba(244,63,94,0.7)]' : 'bg-accent-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)] opacity-30 group-hover:opacity-100'}`}></button>
                      </div>
                      
                      {/* Quick Cash Withdrawal/Topup Interface */}
                      <div className="bg-black/40 p-8 sm:p-10 rounded-[2.5rem] mb-10 border border-white/5 shadow-inner">
                          <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-[0.45em]">Live Vault Status</p>
                            <span className="text-[9px] font-mono text-accent-indigo uppercase animate-pulse">Sync_OK</span>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-end justify-between">
                                <p className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tighter truncate">PKR {user.wallet.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { const a = prompt(`Topup ${user.name}'s balance?`); if(a) topUpUserWallet(user.id, parseFloat(a)); }} 
                                    className="bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo h-16 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-accent-indigo hover:text-white transition-all shadow-xl"
                                >
                                    Deposit
                                </button>
                                <button 
                                    onClick={() => { const a = prompt(`Withdraw from ${user.name}'s balance? (Current: PKR ${user.wallet})`); if(a) withdrawFromUserWallet(user.id, parseFloat(a)); }} 
                                    className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose h-16 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-accent-rose hover:text-white transition-all shadow-xl"
                                >
                                    Withdraw
                                </button>
                            </div>
                          </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-2">
                          <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-[0.35em] transition-colors flex items-center gap-3 group/btn">
                            Modify Access 
                            <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
                          </button>
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic">Audit_OK</span>
                      </div>
                  </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-32 text-center text-slate-800 font-black uppercase tracking-[1.2em] italic border-2 border-dashed border-white/5 rounded-[4rem]">
                  Agent_Node_Missing_In_Search
                </div>
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-14 mb-16 sm:mb-24">
              <div className="bg-slate-900/40 p-12 sm:p-20 rounded-[3rem] sm:rounded-[4.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] sm:text-[13px] font-black text-slate-500 uppercase tracking-[0.6em] mb-6">Master Liquidity Node</p>
                  <p className="text-5xl sm:text-8xl font-black text-white font-mono tracking-tighter">PKR {dealer.wallet.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/40 p-12 sm:p-20 rounded-[3rem] sm:rounded-[4.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] sm:text-[13px] font-black text-slate-500 uppercase tracking-[0.6em] mb-6">Protocol Operations</p>
                  <p className="text-5xl sm:text-8xl font-black text-white font-mono tracking-tighter">{(dealer.ledger || []).length}</p>
              </div>
          </div>
          <LedgerTable entries={dealer.ledger || []} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in">
            <DealerProfileForm dealer={dealer} onUpdate={onUpdateProfile} />
        </div>
      )}

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={selectedUser ? "Modify Agent Config" : "Deploy New Agent"} size="lg">
          <AgentForm user={selectedUser} onCancel={() => setIsUserModalOpen(false)} onSave={(u, dep) => { onSaveUser(u, selectedUser?.id, dep); setIsUserModalOpen(false); }} />
      </Modal>
    </div>
  );
};

const DealerProfileForm: React.FC<{ dealer: Dealer; onUpdate: (d: any) => Promise<void> }> = ({ dealer, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: dealer.name,
        password: dealer.password,
        commissionRate: dealer.commissionRate,
        prizeRates: { ...dealer.prizeRates }
    });
    const [status, setStatus] = useState('');

    const handleSubmit = async () => {
        try {
            await onUpdate(formData);
            setStatus('PROFILE_UPDATED_SUCCESSFULLY');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            setStatus('UPDATE_FAILED');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-16">
            <div className="bg-slate-900/40 p-12 sm:p-20 rounded-[4rem] border border-white/5 shadow-2xl">
                <h3 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-16 flex items-center gap-6">
                    <span className="w-2 h-10 bg-accent-indigo"></span>
                    Authentication Node
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Protocol Alias</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Access Key (Password)</label>
                        <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                </div>

                <h3 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-16 pt-16 border-t border-white/5 flex items-center gap-6">
                    <span className="w-2 h-10 bg-accent-emerald"></span>
                    Yield Protocols
                </h3>
                
                <div className="bg-slate-950/60 p-10 rounded-3xl mb-12 border border-white/5">
                    <div className="space-y-4 mb-10">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Network Commission Rate (%)</label>
                        <input type="number" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })} />
                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest px-3">Your network performance margin</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-16">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">1D Open Prize</label>
                        <input type="number" value={formData.prizeRates.oneDigitOpen} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, oneDigitOpen: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">1D Close Prize</label>
                        <input type="number" value={formData.prizeRates.oneDigitClose} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, oneDigitClose: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">2D Entry Prize</label>
                        <input type="number" value={formData.prizeRates.twoDigit} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, twoDigit: parseInt(e.target.value) || 0 } })} />
                    </div>
                </div>

                {status && <p className="text-center text-accent-indigo font-black text-[12px] uppercase tracking-widest mb-12 animate-pulse">{status}</p>}

                <button onClick={handleSubmit} className="btn-primary w-full h-20 sm:h-24 text-base sm:text-lg rounded-[2rem]">
                    Commit Full Protocol Update
                </button>
            </div>
        </div>
    );
};

const AgentForm: React.FC<{ user?: User; onCancel: () => void; onSave: (u: any, dep: number) => void }> = ({ user, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    password: user?.password || '',
    area: user?.area || '',
    contact: user?.contact || '',
    commissionRate: user?.commissionRate || 0,
    prizeRates: user?.prizeRates || { oneDigitOpen: 70, oneDigitClose: 70, twoDigit: 700 },
    betLimits: user?.betLimits || { oneDigit: 5000, twoDigit: 10000, perDraw: 50000 }
  });
  const [initialDeposit, setInitialDeposit] = useState(0);

  return (
    <div className="space-y-10 sm:space-y-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
        <div className="space-y-3">
          <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Node ID</label>
          <input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="ADU-XXX" disabled={!!user} />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Alias</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Agent Name" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Access Key</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="PIN" />
        </div>
        {!user && (
          <div className="space-y-3">
            <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3">Initial Liquidity (PKR)</label>
            <input type="number" value={initialDeposit || ''} onChange={e => setInitialDeposit(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-accent-indigo font-mono text-xl" />
          </div>
        )}
      </div>
      
      <div className="pt-12 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
        <div className="space-y-3">
          <label className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">1D Open</label>
          <input type="number" value={formData.prizeRates.oneDigitOpen} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, oneDigitOpen: parseInt(e.target.value) || 0}})} />
        </div>
        <div className="space-y-3">
          <label className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">1D Close</label>
          <input type="number" value={formData.prizeRates.oneDigitClose} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, oneDigitClose: parseInt(e.target.value) || 0}})} />
        </div>
        <div className="space-y-3">
          <label className="text-[9px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 truncate">2D Rate</label>
          <input type="number" value={formData.prizeRates.twoDigit} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, twoDigit: parseInt(e.target.value) || 0}})} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 pt-10">
        <button onClick={() => onSave(formData, initialDeposit)} className="btn-primary flex-grow h-20 text-sm">Commit Record</button>
        <button onClick={onCancel} className="bg-slate-900 text-slate-500 font-black px-16 py-6 rounded-full uppercase tracking-widest text-[10px] sm:text-[11px] hover:text-white transition-colors">Abort</button>
      </div>
    </div>
  );
};

const LedgerTable: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-black/40 rounded-[3rem] sm:rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
            <table className="w-full text-left min-w-[900px]">
                <thead className="bg-black/60 sticky top-0 backdrop-blur-2xl z-20">
                    <tr>
                        <th className="p-8 sm:p-10 text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em]">Timestamp</th>
                        <th className="p-8 sm:p-10 text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em]">Operation_Log</th>
                        <th className="p-8 sm:p-10 text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] text-right">Debit</th>
                        <th className="p-8 sm:p-10 text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] text-right">Credit</th>
                        <th className="p-8 sm:p-10 text-[11px] sm:text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] text-right">Node_Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {Array.isArray(entries) && [...entries].reverse().map((entry, idx) => (
                        <tr key={idx} className="hover:bg-accent-indigo/[0.03] transition-all group">
                            <td className="p-8 sm:p-10 text-[11px] font-mono font-bold text-slate-600 truncate">{new Date(entry.timestamp).toLocaleString()}</td>
                            <td className="p-8 sm:p-10 text-base font-bold text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors">{entry.description}</td>
                            <td className="p-8 sm:p-10 text-right text-accent-rose font-mono font-black text-xl">-{entry.debit > 0 ? entry.debit.toLocaleString() : '—'}</td>
                            <td className="p-8 sm:p-10 text-right text-accent-emerald font-mono font-black text-xl">+{entry.credit > 0 ? entry.credit.toLocaleString() : '—'}</td>
                            <td className="p-8 sm:p-10 text-right font-black text-white font-mono text-2xl tracking-tighter">{entry.balance.toLocaleString()}</td>
                        </tr>
                    ))}
                    {(!Array.isArray(entries) || entries.length === 0) && (
                        <tr><td colSpan={5} className="p-32 sm:p-48 text-center text-slate-800 font-black uppercase tracking-[1.5em] italic">No_Ledger_Archive_Found</td></tr>
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
            if (betGroups.length === 0) throw new Error("Format: 11, 22 rs100");
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
        <div className="bg-slate-900/40 p-10 sm:p-20 rounded-[3.5rem] sm:rounded-[5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
            <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-[0.45em] mb-14 sm:mb-20">High-Velocity Protocol Terminal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
                <div className="relative">
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-black/60 text-white pl-8 pr-12 py-6 rounded-2xl border border-white/5 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer h-20">
                        <option value="">Agent Selector</option>
                        {Array.isArray(users) && users.filter(u => !u.isRestricted).map(u => <option key={u.id} value={u.id}>{u.name} (PKR {u.wallet.toLocaleString()})</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                </div>
                <div className="relative">
                    <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="bg-black/60 text-white pl-8 pr-12 py-6 rounded-2xl border border-white/5 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer h-20">
                        <option value="">Market Node Selector</option>
                        {Array.isArray(games) && games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                </div>
            </div>
            <textarea rows={12} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="PROTOCOL_ENTRY_LOG:&#10;14, 25, 33 rs500&#10;88, 91 rs1000" className="w-full bg-black/60 text-accent-indigo p-10 sm:p-14 rounded-[3rem] sm:rounded-[4rem] border border-white/5 font-mono text-base sm:text-xl focus:border-accent-indigo focus:outline-none placeholder-slate-800 leading-relaxed" />
            <div className="flex justify-end mt-12 sm:mt-16">
                <button onClick={handleProcessBets} disabled={!selectedUserId || !selectedGameId || !bulkInput || isLoading} className="w-full sm:w-auto btn-primary h-20 sm:h-24 px-20 sm:px-40 text-base sm:text-lg">
                    {isLoading ? 'SYNCING_PROTOCOL...' : 'Commit Protocol Transaction'}
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
  onUpdateProfile: (d: any) => Promise<void>;
  isLoaded?: boolean;
}

export default DealerPanel;
