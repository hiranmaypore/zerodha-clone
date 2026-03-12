import { useState } from 'react';
import { 
  calcSIP, calcEMI, calcSWP, calcBrokerage,
  calcStepUpSIP, calcRetirement, calcNPS, calcSTP, calcFOMargin, calcBlackScholes
} from '../services/api';
import { Calculator as CalcIcon } from 'lucide-react';

const calculators = [
  { id: 'sip', name: 'SIP', fields: [
    { key: 'monthlyInvestment', label: 'Monthly Investment (₹)', placeholder: '5000' },
    { key: 'expectedReturn', label: 'Expected Return (%)', placeholder: '12' },
    { key: 'timePeriod', label: 'Time Period (Years)', placeholder: '10' },
  ]},
  { id: 'stepup', name: 'Step-up SIP', fields: [
    { key: 'monthlyInvestment', label: 'Initial Monthly Investment (₹)', placeholder: '5000' },
    { key: 'annualIncrement', label: 'Annual Step-up (%)', placeholder: '10' },
    { key: 'expectedReturn', label: 'Expected Return (%)', placeholder: '12' },
    { key: 'timePeriod', label: 'Time Period (Years)', placeholder: '10' },
  ]},
  { id: 'retirement', name: 'Retirement', fields: [
    { key: 'currentAge', label: 'Current Age', placeholder: '30' },
    { key: 'retirementAge', label: 'Retirement Age', placeholder: '60' },
    { key: 'lifeExpectancy', label: 'Life Expectancy', placeholder: '85' },
    { key: 'monthlyExpenses', label: 'Current Monthly Expenses (₹)', placeholder: '50000' },
    { key: 'inflationRate', label: 'Inflation Rate (%)', placeholder: '6' },
    { key: 'expectedReturn', label: 'Expected Return (%)', placeholder: '12' },
  ]},
  { id: 'nps', name: 'NPS', fields: [
    { key: 'currentAge', label: 'Current Age', placeholder: '30' },
    { key: 'retirementAge', label: 'Retirement Age', placeholder: '60' },
    { key: 'monthlyContribution', label: 'Monthly Contribution (₹)', placeholder: '5000' },
    { key: 'expectedReturn', label: 'Expected Return (%)', placeholder: '10' },
    { key: 'annuityRate', label: 'Expected Annuity Return (%)', placeholder: '6' },
  ]},
  { id: 'stp', name: 'STP', fields: [
    { key: 'initialInvestment', label: 'Initial Investment (Lumpsum ₹)', placeholder: '500000' },
    { key: 'monthlyTransfer', label: 'Monthly Transfer to Equity (₹)', placeholder: '10000' },
    { key: 'sourceReturn', label: 'Debt/Source Return (%)', placeholder: '6' },
    { key: 'targetReturn', label: 'Equity/Target Return (%)', placeholder: '12' },
    { key: 'timePeriod', label: 'Time Period (Years)', placeholder: '4' },
  ]},
  { id: 'emi', name: 'EMI', fields: [
    { key: 'loanAmount', label: 'Loan Amount (₹)', placeholder: '1000000' },
    { key: 'interestRate', label: 'Interest Rate (%)', placeholder: '8.5' },
    { key: 'loanTenure', label: 'Tenure (Years)', placeholder: '20' },
  ]},
  { id: 'swp', name: 'SWP', fields: [
    { key: 'initialInvestment', label: 'Total Investment (₹)', placeholder: '5000000' },
    { key: 'monthlyWithdrawal', label: 'Monthly Withdrawal (₹)', placeholder: '25000' },
    { key: 'expectedReturn', label: 'Expected Return (%)', placeholder: '8' },
    { key: 'timePeriod', label: 'Time Period (Years)', placeholder: '20' },
  ]},
  { id: 'brokerage', name: 'Brokerage', fields: [
    { key: 'buyPrice', label: 'Buy Price (₹)', placeholder: '500' },
    { key: 'sellPrice', label: 'Sell Price (₹)', placeholder: '510' },
    { key: 'quantity', label: 'Quantity', placeholder: '100' },
  ]},
  { id: 'fomargin', name: 'F&O Margin', fields: [
    { key: 'instrumentType', label: 'Instrument Type (e.g. FUTIDX, OPTIDX)', type: 'text', placeholder: 'FUTIDX' },
    { key: 'optionType', label: 'Option Type (CE/PE) - Leave blank if FUT', type: 'text', placeholder: 'CE' },
    { key: 'spotPrice', label: 'Spot Price', placeholder: '22000' },
    { key: 'strikePrice', label: 'Strike Price (Options only)', placeholder: '22100' },
    { key: 'lotSize', label: 'Lot Size', placeholder: '50' },
    { key: 'lots', label: 'Number of Lots', placeholder: '1' },
    { key: 'volatility', label: 'Volatility / IV (%)', placeholder: '20' },
  ]},
  { id: 'blackscholes', name: 'Black-Scholes Pricing', fields: [
    { key: 'optionType', label: 'Option Type (call/put)', type: 'text', placeholder: 'call' },
    { key: 'spotPrice', label: 'Spot Price', placeholder: '22000' },
    { key: 'strikePrice', label: 'Strike Price', placeholder: '22100' },
    { key: 'daysToExpiry', label: 'Days to Expiry', placeholder: '7' },
    { key: 'volatility', label: 'Implied Volatility (%)', placeholder: '15' },
    { key: 'riskFreeRate', label: 'Risk Free Rate (%)', placeholder: '6.5' },
  ]},
];

const apiMap = { 
  sip: calcSIP, emi: calcEMI, swp: calcSWP, brokerage: calcBrokerage,
  stepup: calcStepUpSIP, retirement: calcRetirement, nps: calcNPS, stp: calcSTP,
  fomargin: calcFOMargin, blackscholes: calcBlackScholes
};

export default function Calculators() {
  const [active, setActive] = useState('sip');
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calc = calculators.find(c => c.id === active);

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleCalc = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {};
      calc.fields.forEach(f => {
        if (f.type === 'text') {
           payload[f.key] = values[f.key] || f.placeholder;
        } else {
           payload[f.key] = parseFloat(values[f.key] || f.placeholder) || 0; 
        }
      });
      
      if (active === 'brokerage') payload.tradeType = 'equity_intraday';

      const res = await apiMap[active](payload);
      setResult(res.data.data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Calculation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Calculators</h1>
        <p className="text-secondary text-sm mt-1">Financial planning tools</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {calculators.map(c => (
          <button
            key={c.id}
            onClick={() => { setActive(c.id); setResult(null); setValues({}); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer
              ${active === c.id ? 'bg-accent text-white' : 'bg-card text-secondary border border-edge hover:text-primary'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">{calc.name}</h2>
          <div className="space-y-4">
            {calc.fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm text-secondary mb-1.5">{f.label}</label>
                <input
                  type="number"
                  value={values[f.key] || ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:border-accent outline-none transition-all"
                />
              </div>
            ))}
            <button
              onClick={handleCalc}
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="bg-card border border-edge rounded-xl p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Result</h2>
          {result ? (
            result.error ? (
              <p className="text-loss text-sm">{result.error}</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(result).map(([key, val]) => {
                  if (typeof val === 'object') return null;
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                  const formatted = typeof val === 'number'
                    ? val > 100 ? `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : val.toFixed(2)
                    : val;
                  return (
                    <div key={key} className="flex justify-between py-2 border-b border-edge last:border-0">
                      <span className="text-sm text-secondary">{label}</span>
                      <span className="text-sm font-medium text-primary">{formatted}</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="py-8 text-center text-muted text-sm">
              <CalcIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
              Enter values and click Calculate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
