import { useState } from 'react';
import { 
  History, Calendar, Info, 
  ArrowUpRight, Building2, Coins, Landmark,
  ChevronRight, Search, Clock
} from 'lucide-react';

const IPOS = [
  { id: 1, name: 'Nova Genesis Ltd', symbol: 'NOVA', category: 'Mainboard', priceRange: '₹450 - ₹475', lotSize: 30, status: 'OPEN', closeDate: '2026-03-15' },
  { id: 2, name: 'GreenFlow Hydro', symbol: 'GFH', category: 'SME', priceRange: '₹120 - ₹128', lotSize: 1200, status: 'OPEN', closeDate: '2026-03-14' },
  { id: 3, name: 'CyberShield AI', symbol: 'CSAI', category: 'Mainboard', priceRange: '₹890 - ₹940', lotSize: 15, status: 'UPCOMING', closeDate: '2026-03-22' },
];

const BONDS = [
  { id: 101, name: 'SGB 2026 Series IV', type: 'SGB', interest: '2.5% fixed', price: '₹6,240 / gm', status: 'OPEN' },
  { id: 102, name: 'GOI 7.18% 2033', type: 'G-Sec', interest: '7.18% yearly', price: 'Yield 7.21%', status: 'OPEN' },
];

export default function Bids() {
  const [tab, setTab] = useState('IPO');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-2 md:p-6 pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Coins className="w-6 h-6 text-warning" /> Bids
          </h1>
          <p className="text-sm text-muted mt-1">Apply for IPOs, SGBs, and Government Securities</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-card border border-edge rounded-xl text-sm focus:border-accent outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           <button className="p-2 bg-card border border-edge rounded-xl text-muted hover:text-primary transition-all">
              <History className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
         {['IPO', 'Govt Securities', 'Commercial Paper'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border
                ${tab === t ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-card border-edge text-secondary hover:text-primary'}`}
            >
              {t}
            </button>
         ))}
      </div>

      {tab === 'IPO' ? (
        <div className="space-y-4">
           {/* IPO Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {IPOS.map(ipo => (
                 <div key={ipo.id} className="bg-card border border-edge rounded-2xl p-5 hover:border-accent/40 transition-all flex flex-col group">
                    <div className="flex items-start justify-between mb-4">
                       <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-edge group-hover:bg-accent/5 group-hover:border-accent/20 transition-all shadow-sm">
                          <Building2 className="w-6 h-6 text-accent" />
                       </div>
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          ipo.status === 'OPEN' ? 'bg-profit/10 text-profit border-profit/20' : 'bg-surface text-muted border-edge'
                       }`}>
                          {ipo.status}
                       </span>
                    </div>

                    <h3 className="font-bold text-primary">{ipo.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">{ipo.symbol} · {ipo.category}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                       <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Price Range</p>
                          <p className="text-xs font-bold text-primary font-mono">{ipo.priceRange}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">Lot Size</p>
                          <p className="text-xs font-bold text-primary font-mono">{ipo.lotSize} shares</p>
                       </div>
                    </div>

                    <div className="mt-auto pt-6 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-loss">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-medium">Closes {new Date(ipo.closeDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                       </div>
                       <button className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/80 transition-all shadow-lg shadow-accent/20">
                          {ipo.status === 'OPEN' ? 'Apply' : 'Notify'}
                       </button>
                    </div>
                 </div>
              ))}
           </div>

           {/* Info banner */}
           <div className="bg-surface border border-edge rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center shrink-0">
                 <Info className="w-5 h-5 text-warning" />
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                 <strong className="text-primary block mb-0.5">Pre-Apply Feature</strong>
                 You can now pre-apply for upcoming IPOs 2 days before the launch date. Funds will be blocked via UPI Mandate once the issue opens.
              </p>
           </div>
        </div>
      ) : (
        <div className="bg-card border border-edge rounded-2xl overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-surface/30 border-b border-edge">
                 <tr>
                    <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Bond / Paper</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Interest / Discount</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Price / Yield</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                 {BONDS.map(bond => (
                    <tr key={bond.id} className="hover:bg-surface/50 transition-colors">
                       <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-surface border border-edge rounded-lg">
                                <Landmark className="w-4 h-4 text-accent" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-primary">{bond.name}</p>
                                <p className="text-[10px] text-muted font-medium">{bond.type}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4">
                          <span className="text-sm font-bold text-profit">{bond.interest}</span>
                       </td>
                       <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-secondary font-mono">{bond.price}</span>
                       </td>
                       <td className="px-5 py-4 text-right">
                          <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1 ml-auto">
                             Place Bid <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Institutional Note */}
      <div className="text-center py-6 opacity-40">
         <p className="text-[10px] text-muted uppercase tracking-widest font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3" /> SEBI Registered Brokerage Node
         </p>
      </div>

    </div>
  );
}

function ShieldCheck({ className }) {
   return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
}
