
import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { AppView } from '../../types';
import { 
  ChevronLeft, ChevronRight, Truck, CreditCard, CheckCircle2, 
  MapPin, Loader2, User, Search, ArrowRight, ShieldCheck, 
  UserCheck, Home, CreditCard as CardIcon,
  ShieldAlert, AtSign, UserPlus, Building2, UserCircle
} from 'lucide-react';
import { supabase } from '../../services/supabase';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: () => void;
  setView?: (view: AppView) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToCart, onOrderSuccess, setView }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { addNotification } = useNotification();
  const { formatPrice, t } = useLanguage();
  const { findUser, currentUser } = useUser();
  
  const [step, setStep] = useState(0); // 0: Identification, 1: Payment & Delivery (Contacts merged or profile used)
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [foundProfile, setFoundProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [deliveryType, setDeliveryType] = useState<'profile' | 'custom'>('custom');
  const [payerType, setPayerType] = useState<'private' | 'company'>('private');
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    city: '', 
    department: '', // Used for address/details
    companyDetails: ''
  });

  // Auto-fill if logged in or profile found
  useEffect(() => {
    if (currentUser && step === 0) {
      setFoundProfile(currentUser);
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        city: currentUser.city || '',
        department: currentUser.address || '',
        companyDetails: ''
      });
      setSelectedCardId(currentUser.cards?.[0]?.id || '');
      setDeliveryType('profile');
      setStep(1); // Skip Step 0 if already logged in
    }
  }, [currentUser, step]);

  const handleIdentify = () => {
    if (!searchQuery.trim()) {
      addNotification("Enter your email address", "info");
      return;
    }
    
    setIsSearchingUser(true);
    setTimeout(() => {
      const profile = findUser(searchQuery);

      if (profile) {
        setFoundProfile(profile);
        setFormData({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          city: profile.city || '',
          department: profile.address || '',
          companyDetails: ''
        });
        setSelectedCardId(profile.cards?.[0]?.id || '');
        setDeliveryType('profile');
        addNotification(`Profile linked: ${profile.email}`, 'success');
        setStep(1); // Proceed straight to Payment & Delivery
      } else {
        setFoundProfile(null);
        setFormData(prev => ({ ...prev, email: searchQuery }));
        setDeliveryType('custom');
        addNotification("Guest checkout initialized.", "info");
        setStep(1); // Proceed straight to Payment & Delivery
      }
      setIsSearchingUser(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foundProfile && (!formData.name || !formData.phone || !formData.department)) {
      addNotification("Please complete all required fields", "error");
      return;
    }

    if (!foundProfile && payerType === 'company' && !formData.companyDetails) {
      addNotification("Please enter company details", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const finalAddress = deliveryType === 'profile' && foundProfile 
        ? foundProfile.address 
        : formData.department;

      const { error } = await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        total_price: totalPrice,
        items: items,
        shipping_address: finalAddress,
        status: 'processing',
        payment_method: foundProfile ? `Card (${selectedCardId})` : 'Invoice/Guest',
        meta: { payerType, companyDetails: formData.companyDetails }
      }]);

      if (error) throw error;
      addNotification('Order placed successfully!', 'success');
      clearCart();
      onOrderSuccess();
    } catch (err: any) {
      addNotification(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center justify-between mb-6 px-4">
        <button 
          onClick={step === 0 ? onBackToCart : () => setStep(0)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase text-[9px] tracking-widest transition-all"
        >
          <ChevronLeft size={14} /> {step === 0 ? t('back_to_cart') : 'Back'}
        </button>
        <div className="hidden sm:flex items-center gap-6">
           {[0, 1].map(s => (
             <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-emerald-600' : 'text-slate-300'}`}>
               <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${step >= s ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100'}`}>
                  {s === 0 ? <Search size={12} /> : <CardIcon size={12} />}
               </div>
               <span className="text-[8px] font-black uppercase tracking-[0.1em]">{s === 0 ? 'Identification' : 'Payment & Delivery'}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden">
        
        {step === 0 && (
          <div className="space-y-6 animate-fade-in py-2">
            <div className="text-center max-w-lg mx-auto space-y-2">
               <div className="flex justify-center gap-3 mb-4 relative">
                 <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 shadow-md z-10">
                    <User size={20} />
                 </div>
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100 absolute -right-3 bottom-0 rotate-12">
                    <AtSign size={18} />
                 </div>
               </div>
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Identify Yourself</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Profile link or guest mode.</p>
            </div>

            <div className="max-w-sm mx-auto space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
                 <div className="relative group">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                     <AtSign size={14} />
                   </div>
                   <input 
                     type="email"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleIdentify()}
                     placeholder="example@mail.com"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-14 py-4 text-xs font-black outline-none focus:border-emerald-400 focus:bg-white transition-all"
                   />
                   <button 
                    onClick={handleIdentify} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2.5 rounded-lg hover:bg-emerald-500 transition-all shadow-md active:scale-95"
                   >
                     {isSearchingUser ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                   </button>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50 text-center space-y-4">
                 <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">New user?</div>
                 <button 
                  onClick={() => setView && setView(AppView.CABINET)}
                  className="w-full flex items-center justify-center gap-4 p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 transition-all group shadow-sm"
                 >
                    <div className="bg-emerald-500 text-white p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                      <UserPlus size={16} />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black text-emerald-900 uppercase tracking-tight">Create Profile</div>
                      <div className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest leading-none">Access saved cards</div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-emerald-200 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in py-1">
             <div className="border-b border-slate-50 pb-4 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('checkout_payment_delivery')}</h3>
                {foundProfile && <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm">{foundProfile.name}</span>}
             </div>

             {/* Payer Type Selection */}
             <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{t('payer_type')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   <button 
                    onClick={() => setPayerType('private')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${payerType === 'private' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-400'}`}
                   >
                      <UserCircle size={18} className={payerType === 'private' ? 'text-emerald-600' : ''} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('private_person')}</span>
                   </button>
                   <button 
                    onClick={() => setPayerType('company')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${payerType === 'company' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-400'}`}
                   >
                      <Building2 size={18} className={payerType === 'company' ? 'text-emerald-600' : ''} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('company')}</span>
                   </button>
                </div>

                {payerType === 'company' && (
                  <div className="px-2 animate-fade-in">
                    <textarea 
                      placeholder={t('company_details')}
                      value={formData.companyDetails}
                      onChange={e => setFormData({...formData, companyDetails: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-4 py-2 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none min-h-[50px]"
                    />
                  </div>
                )}
             </div>

             {/* Guest Contact Details */}
             {!foundProfile && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">{t('profile_name')}</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">{t('profile_phone')}</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none" placeholder="+123..." />
                  </div>
               </div>
             )}

             {/* Delivery Address */}
             <div className="space-y-4">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2"><Truck size={14} className="text-emerald-500" /> Delivery Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {foundProfile && (
                     <button onClick={() => setDeliveryType('profile')} className={`p-4 border rounded-xl text-left transition-all group ${deliveryType === 'profile' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50/50'}`}>
                       <Home className={deliveryType === 'profile' ? 'text-emerald-600' : 'text-slate-400'} size={18} />
                       <div className="text-[10px] font-black text-slate-900 uppercase mt-1 tracking-tight">Saved Address</div>
                       <div className="text-[8px] text-slate-500 font-bold uppercase truncate mt-0.5 opacity-70">{foundProfile.address}</div>
                     </button>
                   )}
                   <button onClick={() => setDeliveryType('custom')} className={`p-4 border rounded-xl text-left transition-all group ${deliveryType === 'custom' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 bg-slate-50/50'}`}>
                     <MapPin className={deliveryType === 'custom' ? 'text-emerald-600' : 'text-slate-400'} size={18} />
                     <div className="text-[10px] font-black text-slate-900 uppercase mt-1 tracking-tight">Manual Entry</div>
                     <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5 opacity-70">{t('full_shipping_address')}</div>
                   </button>
                </div>
                
                {deliveryType === 'custom' && (
                  <div className="px-2 animate-fade-in">
                    <textarea 
                      required
                      placeholder="City, Street name, Zip code, Country"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black focus:border-emerald-400 focus:bg-white transition-all outline-none min-h-[60px]"
                    />
                  </div>
                )}
             </div>

             {/* Payment Method Selection */}
             <div className="space-y-4 pt-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2"><CardIcon size={14} className="text-emerald-500" /> Payment Method</h4>
                {foundProfile ? (
                  <div className="grid grid-cols-1 gap-2">
                    {foundProfile.cards?.map((card: any) => (
                      <button key={card.id} onClick={() => setSelectedCardId(card.id)} className={`w-full p-3 border rounded-xl flex items-center justify-between transition-all ${selectedCardId === card.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-50 hover:bg-slate-50 transition-colors'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${selectedCardId === card.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <CardIcon size={16}/>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{card.brand} •••• {card.last4}</span>
                        </div>
                        {selectedCardId === card.id && <CheckCircle2 className="text-emerald-600" size={16} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4 text-amber-900">
                    <ShieldAlert size={20} className="shrink-0 text-amber-600" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-tighter leading-none">Invoice Mode</div>
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1 leading-tight">
                        Guest orders via direct invoice.
                      </p>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl mt-6 border border-white/5">
                <div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Total Amount</div>
                  <div className="text-2xl font-black text-emerald-400 tracking-tighter leading-none">{formatPrice(totalPrice)}</div>
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={isProcessing} 
                  className="w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={18} className="inline mr-2" /> Complete</>}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
