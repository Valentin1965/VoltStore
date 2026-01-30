
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../services/supabase';
import { Order, AppView } from '../../types';
import { 
  ShoppingBag, User, Package, Zap, MapPin, Mail, Phone, 
  CreditCard, ShieldCheck, Plus, Trash2, Home, Award,
  Fingerprint, Smartphone, Search, AtSign, UserPlus, ChevronRight, ArrowRight, Loader2,
  Lock, KeyRound, ChevronLeft
} from 'lucide-react';

export const ClientCabinet: React.FC = () => {
  const { t, formatPrice, language } = useLanguage();
  const { addNotification } = useNotification();
  const { currentUser, login, logout, findUser, registerUser } = useUser();
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'payments'>('profile');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const goBackToAbout = () => {
    // Dispatch a global event to change the view to ABOUT
    const event = new CustomEvent('changeView', { detail: AppView.ABOUT });
    window.dispatchEvent(event);
  };

  const handleLogin = () => {
    if (!searchQuery.trim()) {
      addNotification("Enter your email address", "info");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const profile = findUser(searchQuery);
      if (profile) {
        login(profile);
        addNotification(`Welcome back, ${profile.name}!`, 'success');
      } else {
        addNotification("Email not found in our database.", "error");
      }
      setIsProcessing(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.email) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      const newUser = registerUser({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        address: regData.address
      });
      login(newUser);
      addNotification("VoltStore profile created successfully!", "success");
      setIsProcessing(false);
    }, 1200);
  };

  if (!currentUser) {
    return (
      <div className="max-w-[400px] mx-auto py-10 animate-fade-in px-4">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] space-y-6 overflow-hidden relative">
            
            <div className="flex justify-between items-center">
              <button 
                onClick={goBackToAbout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 font-black uppercase text-[8px] tracking-widest transition-all"
              >
                <ChevronLeft size={12} /> Back to About
              </button>

              <div className="bg-slate-50 p-1 rounded-lg flex border border-slate-100">
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setAuthMode('register')}
                  className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  Register
                </button>
              </div>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="flex justify-center gap-3 mb-2 relative">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 shadow-xl relative z-10">
                      <User size={18} />
                    </div>
                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100 absolute -right-1 top-0 rotate-12 scale-90">
                      <AtSign size={16} />
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Identification</h2>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Access your VoltStore profile</p>
                </div>
                
                <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                     <AtSign size={12} />
                   </div>
                   <input 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-14 py-3.5 text-[11px] font-black outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                     placeholder="example@mail.com" 
                   />
                   <button onClick={handleLogin} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2 rounded-lg hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
                     {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <ArrowRight size={14}/>}
                   </button>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-2">
                     <button 
                        onClick={() => setAuthMode('register')}
                        className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 transition-all group shadow-sm"
                     >
                        <div className="bg-emerald-500 text-white p-2 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                          <UserPlus size={14} />
                        </div>
                        <div className="text-left">
                          <div className="text-[9px] font-black text-emerald-900 uppercase tracking-tight">Create Profile</div>
                          <div className="text-[7px] font-bold text-emerald-600/60 uppercase tracking-widest leading-none">New member setup</div>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-emerald-200 group-hover:translate-x-1 transition-transform" />
                     </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                <div className="text-center space-y-1 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mx-auto shadow-xl mb-2">
                    <UserPlus size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">New Client</h2>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Secure energy profile</p>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-2">Full Name</label>
                    <input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[10px] font-black uppercase focus:border-emerald-400 focus:bg-white transition-all outline-none" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-2">Email</label>
                    <input required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none" placeholder="mail@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                      <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <><ShieldCheck size={14} /> Register</>}
                </button>
                
                <p className="text-center text-[7px] text-slate-400 font-bold uppercase tracking-widest">
                  Already a member? <button type="button" onClick={() => setAuthMode('login')} className="text-emerald-600 font-black hover:underline underline-offset-2 ml-1">Login</button>
                </p>
              </form>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-32 pt-6 px-4">
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-3xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white mb-6 shadow-2xl relative">
                <User size={40} />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-xl border border-white/10 text-emerald-400 shadow-lg"><Fingerprint size={16} /></div>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter truncate w-full text-center">{currentUser.name || 'Client'}</h3>
              <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] mt-3 border border-emerald-500/20">Pro Member</div>
              <button 
                onClick={logout} 
                className="text-[9px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-[0.3em] mt-8 transition-colors flex items-center gap-2 group/logout"
              >
                <KeyRound size={12} className="group-hover/logout:rotate-12 transition-transform" /> Log out from profile
              </button>
            </div>
          </div>
          
          <nav className="bg-white rounded-[3.5rem] p-4 border border-slate-100 shadow-2xl flex flex-col gap-3">
            {[
              { id: 'profile', label: 'Profile & Security', icon: User },
              { id: 'history', label: 'Purchase History', icon: ShoppingBag },
              { id: 'payments', label: 'Payment Methods', icon: CreditCard },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`w-full flex items-center gap-6 px-8 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <tab.icon size={20} className={activeTab === tab.id ? 'text-emerald-400' : ''} /> {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 w-full space-y-12">
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-fade-in">
              <div className="px-6">
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Profile & Security</h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Management of personal assets and access security</p>
              </div>
              
              <div className="bg-white rounded-[4rem] p-12 md:p-16 border border-slate-100 shadow-2xl space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-6">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] pl-20 pr-8 py-7 text-sm font-black uppercase outline-none focus:border-emerald-400 focus:bg-white transition-all shadow-sm" value={currentUser.name} readOnly />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-6">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] pl-20 pr-8 py-7 text-sm font-black outline-none opacity-60 cursor-not-allowed" value={currentUser.email} readOnly />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-6">Primary Delivery Address</label>
                    <div className="relative group">
                      <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] pl-20 pr-8 py-7 text-sm font-black uppercase outline-none focus:border-emerald-400 focus:bg-white transition-all shadow-sm" value={currentUser.address} placeholder="City, Str. Name, House Number" />
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100/50">
                     <ShieldCheck className="text-emerald-600" size={24} />
                     <span className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.1em]">Your data is under Pro Security protection</span>
                  </div>
                  <button className="w-full md:w-auto bg-slate-900 text-white px-16 py-7 rounded-[2.5rem] text-[12px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-3xl active:scale-95">Update Profile</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
             <div className="space-y-10 animate-fade-in text-center py-24 bg-white rounded-[4rem] border border-slate-100 shadow-2xl">
                <div className="bg-slate-50 w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner"><ShoppingBag size={48} /></div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">History is Empty</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed px-6">You haven't made any orders in VoltStore yet. Explore our catalog to choose energy solutions.</p>
             </div>
          )}

          {activeTab === 'payments' && (
             <div className="space-y-10 animate-fade-in">
                <div className="px-6"><h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Payment Methods</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <button className="bg-white p-16 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-6 text-slate-300 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/10 transition-all group shadow-sm">
                      <Plus size={48} className="group-hover:rotate-90 transition-transform duration-500" />
                      <span className="text-[12px] font-black uppercase tracking-widest">Add New Card</span>
                   </button>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};
