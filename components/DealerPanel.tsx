
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
                <input type="text" placeholder="Identity Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/40 px-6 py-4 border border-white/5 rounded-2xl text-white text-xs w-full sm:w-64 focus:border-accent-indigo focus:outline-none" />
                <button onClick={() => { setSelectedUser(undefined); setIsUserModalOpen(true); }} className="bg-white hover:bg-slate-200 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shrink-0">Add Agent</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {filteredUsers.map(user => (
                  <div key={user.id} className="bg-slate-900/40 p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl group hover:border-accent-indigo/40 transition-all backdrop-blur-xl flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-8 sm:mb-10">
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] bg-black/40 border border-white/10 flex items-center justify-center font-black text-accent-indigo text-xl sm:text-2xl shadow-inner shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">{user.name}</h4>
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-1">{user.id}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleAccountRestriction(user.id, 'user')} className={`w-2.5 h-2.5 rounded-full transition-all ${user.isRestricted ? 'bg-accent-rose shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)] opacity-30 group-hover:opacity-100'}`}></button>
                      </div>
                      
                      {/* Quick Cash Interface */}
                      <div className="bg-black/30 p-6 sm:p-8 rounded-[2rem] mb-8 sm:mb-10 border border-white/5 shadow-inner">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Live Vault Status</p>
                            <span className="text-[8px] font-mono text-slate-800 uppercase">Secure_Sync_OK</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tighter truncate">PKR {user.wallet.toLocaleString()}</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { const a = prompt(`Topup ${user.name}'s balance?`); if(a) topUpUserWallet(user.id, parseFloat(a)); }} 
                                    className="bg-accent-emerald text-white h-12 px-5 rounded-xl flex items-center justify-center font-black text-xs hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10"
                                    title="Quick Topup"
                                >
                                    {Icons.plus}
                                </button>
                                <button 
                                    onClick={() => { const a = prompt(`Withdraw from ${user.name}'s balance? (Balance: PKR ${user.wallet})`); if(a) withdrawFromUserWallet(user.id, parseFloat(a)); }} 
                                    className="bg-accent-rose text-white h-12 px-5 rounded-xl flex items-center justify-center font-black text-xs hover:bg-rose-500 transition-all shadow-lg shadow-rose-500/10"
                                    title="Quick Withdraw"
                                >
                                    -
                                </button>
                            </div>
                          </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                          <button onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }} className="text-[9px] sm:text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-[0.3em] transition-colors">Configure Agent</button>
                          <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em]">Audit_Locked</span>
                      </div>
                  </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-800 font-black uppercase tracking-[0.8em] italic border-2 border-dashed border-white/5 rounded-[3rem]">
                  Agent_Node_Missing
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mb-12 sm:mb-16">
              <div className="bg-slate-900/40 p-10 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">Master Liquidity</p>
                  <p className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tighter">PKR {dealer.wallet.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/40 p-10 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">Network Activity</p>
                  <p className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tighter">{(dealer.ledger || []).length}</p>
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
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-slate-900/40 p-10 sm:p-16 rounded-[3rem] border border-white/5 shadow-2xl">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-12">Node Authentication</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Node Alias</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Access Key (Password)</label>
                        <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-12 pt-8 border-t border-white/5">Prize Protocol</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">1D Open Rate</label>
                        <input type="number" value={formData.prizeRates.oneDigitOpen} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, oneDigitOpen: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">1D Close Rate</label>
                        <input type="number" value={formData.prizeRates.oneDigitClose} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, oneDigitClose: parseInt(e.target.value) || 0 } })} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">2D Rate</label>
                        <input type="number" value={formData.prizeRates.twoDigit} onChange={e => setFormData({ ...formData, prizeRates: { ...formData.prizeRates, twoDigit: parseInt(e.target.value) || 0 } })} />
                    </div>
                </div>

                <div className="bg-slate-950/60 p-8 rounded-2xl mb-12 border border-white/5 text-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Network Commission: {dealer.commissionRate}%</p>
                    <p className="text-[8px] text-slate-800 font-bold mt-2 uppercase">Commission changes require root admin authorization</p>
                </div>

                {status && <p className="text-center text-accent-indigo font-black text-[10px] uppercase tracking-widest mb-10 animate-pulse">{status}</p>}

                <button onClick={handleSubmit} className="btn-primary w-full h-16 sm:h-20 text-sm">Commit Protocol Update</button>
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
    <div className="space-y-8 sm:space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-2">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Node ID</label>
          <input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="ADU-XXX" disabled={!!user} />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Alias</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Agent Name" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Access Key</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="PIN" />
        </div>
        {!user && (
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Initial Liquidity</label>
            <input type="number" value={initialDeposit || ''} onChange={e => setInitialDeposit(parseFloat(e.target.value) || 0)} placeholder="PKR" className="text-accent-indigo font-mono" />
          </div>
        )}
      </div>
      
      <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-2">
          <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 truncate">1D Open</label>
          <input type="number" value={formData.prizeRates.oneDigitOpen} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, oneDigitOpen: parseInt(e.target.value) || 0}})} />
        </div>
        <div className="space-y-2">
          <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 truncate">1D Close</label>
          <input type="number" value={formData.prizeRates.oneDigitClose} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, oneDigitClose: parseInt(e.target.value) || 0}})} />
        </div>
        <div className="space-y-2">
          <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 truncate">2D Rate</label>
          <input type="number" value={formData.prizeRates.twoDigit} onChange={e => setFormData({...formData, prizeRates: {...formData.prizeRates, twoDigit: parseInt(e.target.value) || 0}})} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-10">
        <button onClick={() => onSave(formData, initialDeposit)} className="btn-primary flex-grow h-14 sm:h-auto">Commit Record</button>
        <button onClick={onCancel} className="bg-slate-900 text-slate-500 font-black px-12 py-4 rounded-full uppercase tracking-widest text-[9px] sm:text-[10px]">Abort</button>
      </div>
    </div>
  );
};

const LedgerTable: React.FC<{ entries: LedgerEntry[] }> = ({ entries }) => (
    <div className="bg-black/30 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-black/50 sticky top-0 backdrop-blur-2xl z-20">
                    <tr>
                        <th className="p-6 sm:p-8 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Date</th>
                        <th className="p-6 sm:p-8 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Description</th>
                        <th className="p-6 sm:p-8 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Debit</th>
                        <th className="p-6 sm:p-8 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Credit</th>
                        <th className="p-6 sm:p-8 text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] text-right">Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {Array.isArray(entries) && [...entries].reverse().map((entry, idx) => (
                        <tr key={idx} className="hover:bg-accent-indigo/5 transition-all">
                            <td className="p-6 sm:p-8 text-[10px] font-mono font-bold text-slate-600 truncate">{new Date(entry.timestamp).toLocaleString()}</td>
                            <td className="p-6 sm:p-8 text-sm font-bold text-slate-200 uppercase tracking-tight">{entry.description}</td>
                            <td className="p-6 sm:p-8 text-right text-accent-rose font-mono font-black text-base">-{entry.debit > 0 ? entry.debit.toFixed(2) : '—'}</td>
                            <td className="p-6 sm:p-8 text-right text-accent-emerald font-mono font-black text-base">+{entry.credit > 0 ? entry.credit.toFixed(2) : '—'}</td>
                            <td className="p-6 sm:p-8 text-right font-black text-white font-mono text-lg">{entry.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                    {(!Array.isArray(entries) || entries.length === 0) && (
                        <tr><td colSpan={5} className="p-24 sm:p-32 text-center text-slate-800 font-black uppercase tracking-[1em] italic">Archive_Empty</td></tr>
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
        <div className="bg-slate-900/40 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-white/5 shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.4em] mb-10 sm:mb-12">High-Velocity Terminal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-10">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-black/60 text-white px-6 py-5 rounded-2xl border border-white/5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer">
                    <option value="">Agent ID</option>
                    {Array.isArray(users) && users.filter(u => !u.isRestricted).map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                </select>
                <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="bg-black/60 text-white px-6 py-5 rounded-2xl border border-white/5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] focus:border-accent-indigo focus:outline-none appearance-none cursor-pointer">
                    <option value="">Market Node</option>
                    {Array.isArray(games) && games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            <textarea rows={10} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="LOG_PROTOCOL:&#10;14, 25, 33 rs50&#10;88, 91 rs100" className="w-full bg-black/60 text-accent-indigo p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 font-mono text-sm sm:text-base focus:border-accent-indigo focus:outline-none placeholder-slate-800" />
            <div className="flex justify-end mt-10 sm:mt-12">
                <button onClick={handleProcessBets} disabled={!selectedUserId || !selectedGameId || !bulkInput || isLoading} className="w-full sm:w-auto btn-primary h-14 sm:h-16 px-16 sm:px-24">
                    {isLoading ? 'SYNCING...' : 'Commit Transaction'}
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
