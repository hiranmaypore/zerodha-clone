import { useState, useEffect } from 'react';
import { getAllStocks } from '../services/api';
import { getSocket } from '../services/socket';
import ChartPanel from '../components/dashboard/ChartPanel';
import { Grid2x2, Grid3X3, Columns, Rows, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MultiChart() {
  const [stocks, setStocks] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [layout, setLayout] = useState('2x2'); // '1x2', '2x1', '2x2'
  
  // Default selections
  const [selectedStocks, setSelectedStocks] = useState([null, null, null, null]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllStocks();
        const list = res.data.stocks || [];
        setStocks(list);

        const priceMap = {};
        list.forEach(s => { if (s.price) priceMap[s.symbol] = s.price; });
        setLivePrices(priceMap);

        // Pre-fill default popular stocks
        setSelectedStocks([
          list.find(s => s.symbol === 'RELIANCE') || list[0],
          list.find(s => s.symbol === 'HDFC') || list[1] || list[0],
          list.find(s => s.symbol === 'TCS') || list[2] || list[0],
          list.find(s => s.symbol === 'INFY') || list[3] || list[0],
        ]);
      } catch (err) {
        console.error("Failed to load stocks", err);
      }
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const priceHandler = (prices) => setLivePrices(prev => ({ ...prev, ...prices }));
    socket.on('price_update', priceHandler);
    return () => socket.off('price_update', priceHandler);
  }, []);

  const updateSymbol = (index, newStock) => {
    setSelectedStocks(prev => {
      const copy = [...prev];
      copy[index] = newStock;
      return copy;
    });
  };

  const getGridClass = () => {
    if (layout === '1x2') return 'grid-cols-2 grid-rows-1';
    if (layout === '2x1') return 'grid-cols-1 grid-rows-2';
    if (layout === '2x2') return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-2 grid-rows-2';
  };

  const activeCount = layout === '1x2' || layout === '2x1' ? 2 : 4;

  return (
    <div className="h-full flex flex-col p-2 gap-2 animate-fade-in">
      {/* Top Toolbar */}
      <div className="flex-none bg-card border border-edge rounded-lg px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <h1 className="text-sm font-bold text-primary mr-4">Multi-Chart Layout</h1>
           
           <div className="flex items-center gap-1 bg-surface border border-edge rounded-lg p-1">
              <button 
                onClick={() => setLayout('1x2')}
                className={`p-1.5 rounded-md transition-colors ${layout === '1x2' ? 'bg-accent text-white' : 'text-muted hover:text-primary hover:bg-edge'}`}
                title="2 Charts (Vertical Split)"
              >
                 <Columns className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setLayout('2x1')}
                className={`p-1.5 rounded-md transition-colors ${layout === '2x1' ? 'bg-accent text-white' : 'text-muted hover:text-primary hover:bg-edge'}`}
                title="2 Charts (Horizontal Split)"
              >
                 <Rows className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setLayout('2x2')}
                className={`p-1.5 rounded-md transition-colors ${layout === '2x2' ? 'bg-accent text-white' : 'text-muted hover:text-primary hover:bg-edge'}`}
                title="4 Charts (Grid)"
              >
                 <Grid2x2 className="w-4 h-4" />
              </button>
           </div>
        </div>
        
        <Link 
          to="/dashboard" 
          className="text-xs font-bold text-muted hover:text-primary flex items-center gap-2 border border-edge px-3 py-1.5 rounded-lg hover:border-accent transition-colors"
        >
          Exit Multi-Layout <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Grid Container */}
      <div className={`flex-1 min-h-0 grid gap-2 ${getGridClass()}`}>
        {Array.from({ length: activeCount }).map((_, i) => (
          <div key={i} className="min-w-0 min-h-0 bg-card border border-edge rounded-xl shadow-lg shadow-black/20 overflow-hidden relative">
            <ChartPanel
              selectedStock={selectedStocks[i]}
              stocks={stocks}
              onStockChange={(newStock) => updateSymbol(i, newStock)}
              currentPrice={selectedStocks[i] ? (livePrices[selectedStocks[i].symbol] || selectedStocks[i].price || 0) : 0}
              livePrices={livePrices}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
