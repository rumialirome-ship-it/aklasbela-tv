
import React from 'react';
import { Role, User, Dealer, Admin } from '../types';

interface AuthScreenProps {
  onLogin: (role: Role, account: User | Dealer | Admin) => void;
  users: User[];
  dealers: Dealer[];
  admin: Admin;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, users, dealers, admin }) => {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Tactical Glows */}
      <div className="absolute top-0 left-0 w-full h-1 bg-accent-indigo/20">
        <div className="h-full bg-accent-indigo w-1/3 animate-shimmer"></div>
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        <header className="text-center mb-16">
          <div className="inline-block px-6 py-2 rounded-lg bg-slate-900 border border-white/5 text-[10px] font-black text-accent-indigo uppercase tracking-[0.4em] mb-8 shadow-2xl">
            Identity Verification Node
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter uppercase text-white leading-none">
            AKLASBELA<span className="text-accent-indigo">.</span>TV
          </h1>
          <p className="text-slate-500 font-bold tracking-[1em] uppercase text-[9px] mt-4 opacity-50">Authorized Personnel Only</p>
        </header>

        <div className="card border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-indigo opacity-30"></div>
          
          <h2 className="text-xl font-black text-white mb-10 uppercase tracking-widest text-center">Select Access Node</h2>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1 custom-scrollbar">
            {/* Admin Node */}
            <button
              onClick={() => onLogin(Role.Admin, admin)}
              className="w-full group relative p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-white/5 transition-all duration-500 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-accent-rose/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="font-black text-xs text-accent-rose uppercase tracking-[0.3em] mb-1">Command Control</p>
                  <p className="text-lg font-bold text-white uppercase tracking-tight">{admin.name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent-rose/10 flex items-center justify-center text-accent-rose group-hover:scale-110 transition-transform">
                  ADM
                </div>
              </div>
            </button>

            {/* Dealer Nodes */}
            {dealers.map(dealer => (
              <button
                key={dealer.id}
                onClick={() => onLogin(Role.Dealer, dealer)}
                className="w-full group relative p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-white/5 transition-all duration-500 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent-indigo/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className="font-black text-xs text-accent-indigo uppercase tracking-[0.3em] mb-1">Network Node</p>
                    <p className="text-lg font-bold text-white uppercase tracking-tight">{dealer.name}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo group-hover:scale-110 transition-transform">
                    DLR
                  </div>
                </div>
              </button>
            ))}

            {/* User Nodes */}
            {users.map(user => (
               <button
                key={user.id}
                onClick={() => onLogin(Role.User, user)}
                className="w-full group relative p-6 bg-slate-900/50 hover:bg-slate-800 rounded-2xl border border-white/5 transition-all duration-500 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className="font-black text-xs text-accent-cyan uppercase tracking-[0.3em] mb-1">Exchange Agent</p>
                    <p className="text-lg font-bold text-white uppercase tracking-tight">{user.name}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:scale-110 transition-transform">
                    USR
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
             <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em] italic">
                Encrypted Session Protocol v4.2.0-STABLE
             </p>
          </div>
        </div>
      </div>
      
      {/* Decorative Footer */}
      <footer className="absolute bottom-10 w-full text-center">
        <p className="text-[10px] text-slate-800 font-bold uppercase tracking-[1em] opacity-30">
          SECURE_NODE_ACCESS_LAYER
        </p>
      </footer>
    </div>
  );
};

export default AuthScreen;
