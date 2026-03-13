import { useState, useEffect } from 'react';
import { ShoppingCart, X, ChevronUp } from 'lucide-react';

/**
 * Mobile Bottom Sheet wrapper for the BuySellPanel.
 * Shows a floating "Trade" button on mobile screens,
 * which opens the BuySellPanel as a slide-up sheet.
 * On desktop, it renders children normally.
 */
export default function MobileBottomSheet({ children, selectedStock, currentPrice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close on escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent scroll when sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  if (!isMobile) {
    // Desktop: render normally
    return children;
  }

  return (
    <>
      {/* Floating Trade Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] transition-all active:scale-95 font-bold text-sm"
      >
        <ShoppingCart className="w-5 h-5" />
        Trade
        {selectedStock && (
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            {selectedStock.symbol}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-101 bg-card border-t border-edge rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Sheet Handle */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-edge rounded-full mx-auto" />
          </div>
          <div className="flex items-center gap-3">
            {selectedStock && (
              <div className="text-right">
                <p className="text-xs font-bold text-primary">{selectedStock.symbol}</p>
                <p className="text-[10px] text-accent font-mono">₹{currentPrice?.toFixed(2)}</p>
              </div>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 bg-surface rounded-xl text-muted hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
