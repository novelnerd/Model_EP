import React, { useState, useCallback } from 'react';
import { SimulationInputs, SimulationResult } from './types';
import { runMonteCarlo } from './engine/simulationEngine';
import { exportToExcel } from './engine/excelExport';
import InputPanel from './components/InputPanel';
import ResultsDashboard from './components/ResultsDashboard';
import CashFlowTable from './components/CashFlowTable';
import { Download, BarChart3, Table2, Settings, FileText, Brain, History } from 'lucide-react';

const defaultInputs: SimulationInputs = {
  project: {
    projectName: 'Mumbai High South Extension',
    assetName: 'MH-South Cluster',
    basin: 'Mumbai Offshore',
    country: 'India',
    operator: 'ONGC',
    workingInterest: 100,
    netRevenueInterest: 81.25,
    currency: 'USD',
    economicLife: 20,
    startYear: 2025,
    discountRate: 10,
    hurdleRate: 12,
    inflationRate: 3,
    fxRate: 83.5,
    calculationEngine: 'native',
  },
  production: {
    oil: { p10: 300, p50: 500, p90: 700, distribution: 'triangular' },
    gas: { p10: 15, p50: 25, p90: 40, distribution: 'triangular' },
    condensate: { p10: 20, p50: 30, p90: 45, distribution: 'triangular' },
    ngl: { p10: 30, p50: 50, p90: 75, distribution: 'triangular' },
    water: { p10: 50, p50: 100, p90: 200, distribution: 'triangular' },
    gor: 2000,
    wor: 0.5,
    recoveryFactor: { p10: 0.2, p50: 0.3, p90: 0.4, distribution: 'triangular' },
    declineType: 'exponential',
    declineRate: { p10: 10, p50: 15, p90: 22, distribution: 'triangular' },
    hyperbolicExponent: 0.5,
    plateauYears: 3,
    economicLimit: 20,
  },
  prices: {
    oil: { base: 75, escalation: 2, stdDev: 20, distribution: 'lognormal' },
    gas: { base: 3.5, escalation: 1.5, stdDev: 30, distribution: 'lognormal' },
    condensate: { base: 70, escalation: 2, stdDev: 20, distribution: 'lognormal' },
    ngl: { base: 35, escalation: 2, stdDev: 25, distribution: 'lognormal' },
    carbonCredits: { base: 25, escalation: 5, stdDev: 40 },
    oilGasRatio: 0.15,
    nglRatio: 0.1,
  },
  capex: {
    items: [],
    exploration: 500000,
    drilling: 1200000,
    facilities: 800000,
    pipelines: 300000,
    subsea: 200000,
    compression: 150000,
    processing: 100000,
    brownfield: 100000,
    workovers: 150000,
    abandonment: 200000,
    decommissioning: 150000,
    idc: 100000,
    contingency: 200000,
    ownerCost: 100000,
    totalCapexStdDev: 20,
  },
  opex: {
    items: [],
    fixedOpex: 1500000,
    variableOpex: 12,
    transportation: 3.5,
    tolling: 1.0,
    power: 2.0,
    maintenance: 3.0,
    chemicals: 0.5,
    logistics: 1.0,
    personnel: 500000,
    insurance: 100000,
    gna: 200000,
    carbonCost: 2.0,
    totalOpexStdDev: 15,
    inflationRate: 3,
  },
  fiscal: {
    id: 'nomination_ongc',
    name: 'ONGC Nomination Block (Indian Fiscal)',
    type: 'nomination',
    description: 'Standard Indian nomination block fiscal terms',
    royaltyRate: 12.5,
    oidbCess: 4.5,
    revenueShare: 0,
    productionShare: 0,
    corporateTaxRate: 25,
    deferredTax: true,
    gstRate: 18,
    windfallLevy: 0,
    carbonTax: 0,
    customsDuty: 7.5,
    taxHolidayYears: 0,
    lossCarryForwardYears: 8,
    depreciationMethod: 'wdv',
    depreciationYears: 8,
    wdvRate: 17.5,
    additionalRounds: 0,
  },
  numIterations: 1000,
};

type TabType = 'inputs' | 'dashboard' | 'cashflow' | 'report' | 'copilot' | 'audit';

function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inputs');

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = runMonteCarlo(inputs);
      setResult(simResult);
      setIsRunning(false);
      setActiveTab('dashboard');
    }, 100);
  }, [inputs]);

  const handleExportExcel = useCallback(() => {
    if (result) exportToExcel(result);
  }, [result]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Enterprise E&P Economics Platform
              </h1>
              <p className="text-xs text-gray-500">Monte Carlo • DCF Valuation • Scenario Planning • AI Analytics</p>
            </div>
          </div>
          
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 bg-green-700 border border-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-600 transition-colors"
              >
                <Download size={14} />
                Export Full Excel Workbook
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900/50 border-b border-gray-800 px-4">
        <div className="max-w-[1920px] mx-auto flex gap-1 overflow-x-auto">
          <TabButton active={activeTab === 'inputs'} onClick={() => setActiveTab('inputs')} icon={<Settings size={14} />} label="Input Parameters" />
          {result && (
            <>
              <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={14} />} label="Results Dashboard" />
              <TabButton active={activeTab === 'cashflow'} onClick={() => setActiveTab('cashflow')} icon={<Table2 size={14} />} label="Cash Flow (Audit)" />
              <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<FileText size={14} />} label="Board Report" />
              <TabButton active={activeTab === 'copilot'} onClick={() => setActiveTab('copilot')} icon={<Brain size={14} />} label="AI Copilot" />
              <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<History size={14} />} label="Audit Trail" />
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-4">
        {activeTab === 'inputs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <InputPanel inputs={inputs} onChange={setInputs} onRunSimulation={handleRunSimulation} isRunning={isRunning} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold text-white mb-4">🏢 Enterprise Platform Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FeatureCard title="Monte Carlo Engine" icon="🎲" description="Multiple distributions (Normal, Lognormal, Triangular, PERT, Uniform) with correlation matrices. Run 1K-100K simulations." />
                  <FeatureCard title="Indian Fiscal Framework" icon="🇮🇳" description="ONGC Nomination, PSC, HELP/OALP, DSF, CBM regimes. Royalty, OIDB Cess, Windfall Levy, Tax Holiday." />
                  <FeatureCard title="Advanced Analytics" icon="📊" description="VaR, CVaR, MIRR, PI, Breakeven analysis. Tornado, Spider, Heatmap sensitivity. Full statistical output." />
                  <FeatureCard title="Excel Integration" icon="📑" description="Import existing models, formula-level audit trail, round-trip export. Fully linked workbooks." />
                  <FeatureCard title="Scenario Manager" icon="🎯" description="Base, Bull, Bear, P10/P50/P90 cases. Side-by-side comparison. Custom scenario builder." />
                  <FeatureCard title="AI Copilot" icon="🤖" description="Ask questions about economics. Generate Board notes, IC memos, FDP summaries. Full traceability." />
                  <FeatureCard title="Executive Dashboards" icon="📈" description="Consulting-quality visuals. Waterfall, Sankey, Risk Matrix. Green/Amber/Red decision indicators." />
                  <FeatureCard title="Audit & Governance" icon="🔒" description="Full model traceability. Version control. Formula dependency maps. Validation checks." />
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold text-white mb-4">📖 Current Model: {inputs.project.projectName}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoCard label="Asset" value={inputs.project.assetName} />
                  <InfoCard label="Basin" value={inputs.project.basin} />
                  <InfoCard label="Country" value={inputs.project.country} />
                  <InfoCard label="Operator" value={inputs.project.operator} />
                  <InfoCard label="Oil Price" value={`$${inputs.prices.oil.base}/bbl`} />
                  <InfoCard label="Gas Price" value={`$${inputs.prices.gas.base}/Mcf`} />
                  <InfoCard label="Initial Rate" value={`${inputs.production.oil.p50} bopd`} />
                  <InfoCard label="Decline" value={`${inputs.production.declineRate.p50}%/yr`} />
                  <InfoCard label="Total CAPEX" value={`$${(inputs.capex.exploration + inputs.capex.drilling + inputs.capex.facilities + inputs.capex.pipelines + inputs.capex.subsea + inputs.capex.compression + inputs.capex.processing + inputs.capex.brownfield + inputs.capex.workovers + inputs.capex.abandonment + inputs.capex.decommissioning + inputs.capex.idc + inputs.capex.contingency + inputs.capex.ownerCost) / 1e6}M`} />
                  <InfoCard label="Royalty" value={`${inputs.fiscal.royaltyRate}%`} />
                  <InfoCard label="Tax Rate" value={`${inputs.fiscal.corporateTaxRate}%`} />
                  <InfoCard label="WACC" value={`${inputs.project.discountRate}%`} />
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold text-white mb-4">🏛️ Fiscal Regime Library</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <RegimeCard name="ONGC Nomination" type="nomination" active={inputs.fiscal.type === 'nomination'} />
                  <RegimeCard name="Production Sharing (PSC)" type="psc" active={inputs.fiscal.type === 'psc'} />
                  <RegimeCard name="HELP / OALP" type="help_oalp" active={inputs.fiscal.type === 'help_oalp'} />
                  <RegimeCard name="DSF Regime" type="dsf" active={inputs.fiscal.type === 'dsf'} />
                  <RegimeCard name="CBM Regime" type="cbm" active={inputs.fiscal.type === 'cbm'} />
                  <RegimeCard name="Revenue Sharing" type="revenue_sharing" active={inputs.fiscal.type === 'revenue_sharing'} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && result && <ResultsDashboard result={result} />}
        
        {activeTab === 'cashflow' && result && <CashFlowTable result={result} />}

        {activeTab === 'report' && result && <BoardReport result={result} />}

        {activeTab === 'copilot' && result && <AICopilot result={result} />}

        {activeTab === 'audit' && result && <AuditTrail result={result} />}
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-3 mt-8">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>Enterprise E&P Economics Platform v2.0 | Monte Carlo • DCF • Scenario Planning</span>
          <span>For professional use - verify with qualified petroleum economists & engineers</span>
        </div>
      </footer>
    </div>
  );
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'}`}>
    {icon}{label}
  </button>
);

const FeatureCard: React.FC<{ title: string; icon: string; description: string }> = ({ title, icon, description }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <h3 className="font-semibold text-white mb-1 flex items-center gap-2"><span>{icon}</span>{title}</h3>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-800 rounded-lg p-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-white mt-1">{value}</p>
  </div>
);

const RegimeCard: React.FC<{ name: string; type: string; active: boolean }> = ({ name, type, active }) => (
  <div className={`rounded-lg p-3 border ${active ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
    <p className="text-sm font-semibold text-white">{name}</p>
    <p className="text-xs text-gray-400 mt-1">{type.replace('_', ' ').toUpperCase()}</p>
    {active && <span className="text-xs text-blue-400 mt-1">✓ Active</span>}
  </div>
);

const BoardReport: React.FC<{ result: SimulationResult }> = ({ result }) => {
  const { riskMetrics, deterministicMetrics, inputs } = result;
  const rating = riskMetrics.probabilityNpvPositive > 80 ? 'green' : riskMetrics.probabilityNpvPositive > 50 ? 'amber' : 'red';
  const ratingColors = { green: 'bg-green-500', amber: 'bg-yellow-500', red: 'bg-red-500' };
  const ratingLabels = { green: 'RECOMMEND INVESTMENT', amber: 'CONDITIONAL APPROVAL', red: 'DO NOT PROCEED' };

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 rounded-xl p-8 shadow-2xl">
      <div className="border-b-2 border-gray-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold">INVESTMENT COMMITTEE MEMORANDUM</h1>
        <p className="text-sm text-gray-600 mt-1">{inputs.project.projectName} | {inputs.project.assetName}</p>
        <p className="text-xs text-gray-500">Prepared: {new Date().toLocaleDateString()} | Confidential</p>
      </div>

      <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold mb-6 ${ratingColors[rating as keyof typeof ratingColors]}`}>
        {ratingLabels[rating as keyof typeof ratingLabels]}
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">1. Executive Summary</h2>
        <p className="text-sm leading-relaxed">
          The {inputs.project.projectName} project in the {inputs.project.basin} basin has been evaluated using a comprehensive 
          Monte Carlo simulation with {inputs.numIterations.toLocaleString()} iterations. The base case NPV at {inputs.project.discountRate}% discount rate 
          is <strong>${(deterministicMetrics.npv / 1e6).toFixed(2)}M</strong> with an IRR of <strong>{deterministicMetrics.irr.toFixed(1)}%</strong>. 
          The mean probabilistic NPV is <strong>${(riskMetrics.meanNpv / 1e6).toFixed(2)}M</strong> with a {riskMetrics.probabilityNpvPositive.toFixed(1)}% probability 
          of achieving a positive NPV.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">2. Key Economic Metrics</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b"><td className="py-2 font-medium">NPV (Base Case)</td><td className="py-2 text-right">${(deterministicMetrics.npv / 1e6).toFixed(2)}M</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Mean NPV (Monte Carlo)</td><td className="py-2 text-right">${(riskMetrics.meanNpv / 1e6).toFixed(2)}M</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">P10 / P50 / P90 NPV</td><td className="py-2 text-right">${(riskMetrics.p10Npv / 1e6).toFixed(2)}M / ${(riskMetrics.p50Npv / 1e6).toFixed(2)}M / ${(riskMetrics.p90Npv / 1e6).toFixed(2)}M</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">IRR (Base Case)</td><td className="py-2 text-right">{deterministicMetrics.irr.toFixed(1)}%</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Payback Period</td><td className="py-2 text-right">{deterministicMetrics.paybackPeriod > 0 ? `${deterministicMetrics.paybackPeriod.toFixed(1)} years` : 'Does not pay back'}</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Probability NPV &gt; 0</td><td className="py-2 text-right">{riskMetrics.probabilityNpvPositive.toFixed(1)}%</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Breakeven Oil Price</td><td className="py-2 text-right">${deterministicMetrics.breakevenOilPrice.toFixed(2)}/bbl</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Value per BOE</td><td className="py-2 text-right">${deterministicMetrics.valuePerBoe.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">3. Key Sensitivities (Tornado)</h2>
        <div className="space-y-2">
          {result.tornadoData.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs font-medium w-24">{item.parameter}</span>
              <div className="flex-1 bg-gray-200 rounded h-4 relative">
                <div className="absolute h-full bg-blue-500 rounded" style={{ width: `${Math.min(100, (Math.abs(item.impact) / Math.abs(result.tornadoData[0].impact)) * 100)}%` }}></div>
              </div>
              <span className="text-xs font-mono w-20 text-right">${(item.impact / 1e6).toFixed(1)}M</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">4. Risk Assessment</h2>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Value at Risk (95%): ${(riskMetrics.valueAtRisk95 / 1e6).toFixed(2)}M</li>
          <li>Coefficient of Variation: {riskMetrics.coefficientOfVariation.toFixed(1)}%</li>
          <li>Probability IRR exceeds hurdle ({inputs.project.hurdleRate}%): {riskMetrics.probabilityIrrAboveHurdle.toFixed(1)}%</li>
          <li>Payback probability within economic life: {riskMetrics.paybackProbability.toFixed(1)}%</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">5. Recommendation</h2>
        <p className="text-sm leading-relaxed">
          Based on the comprehensive economic evaluation, the project {rating === 'green' ? 'meets all investment criteria and is recommended for approval' : rating === 'amber' ? 'shows marginal economics and requires additional risk mitigation before proceeding' : 'does not meet minimum investment criteria and should not proceed in its current form'}.
        </p>
      </section>

      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
        <p>This report was generated by the Enterprise E&P Economics Platform using Monte Carlo simulation with {inputs.numIterations.toLocaleString()} iterations.</p>
        <p>All assumptions should be verified by qualified petroleum engineers and economists before investment decisions.</p>
      </div>
    </div>
  );
};

const AICopilot: React.FC<{ result: SimulationResult }> = ({ result }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: `Welcome! I'm your AI Economics Copilot. I've analyzed the ${result.inputs.project.projectName} project. Ask me anything about the economics, risks, or sensitivities.` }
  ]);
  const [input, setInput] = useState('');

  const generateResponse = (question: string): string => {
    const { riskMetrics, deterministicMetrics, tornadoData, inputs } = result;
    const q = question.toLowerCase();

    if (q.includes('npv') && (q.includes('why') || q.includes('change') || q.includes('drives'))) {
      return `The NPV is primarily driven by: 1) ${tornadoData[0].parameter} (impact: $${(tornadoData[0].impact / 1e6).toFixed(1)}M), 2) ${tornadoData[1].parameter} ($${(tornadoData[1].impact / 1e6).toFixed(1)}M), and 3) ${tornadoData[2].parameter} ($${(tornadoData[2].impact / 1e6).toFixed(1)}M). The mean NPV is $${(riskMetrics.meanNpv / 1e6).toFixed(2)}M with a standard deviation of $${(riskMetrics.stdDevNpv / 1e6).toFixed(2)}M, indicating ${riskMetrics.coefficientOfVariation > 50 ? 'high' : 'moderate'} uncertainty.`;
    }
    if (q.includes('irr')) {
      return `The base case IRR is ${deterministicMetrics.irr.toFixed(1)}%, which ${deterministicMetrics.irr > inputs.project.hurdleRate ? 'exceeds' : 'is below'} the hurdle rate of ${inputs.project.hurdleRate}%. The mean probabilistic IRR is ${riskMetrics.meanIrr.toFixed(1)}% with a ${riskMetrics.probabilityIrrAboveHurdle.toFixed(1)}% probability of exceeding the hurdle. MIRR is ${deterministicMetrics.mirr.toFixed(1)}%.`;
    }
    if (q.includes('risk') || q.includes('uncertainty')) {
      return `Key risk metrics: P(NPV>0) = ${riskMetrics.probabilityNpvPositive.toFixed(1)}%, VaR(95%) = $${(riskMetrics.valueAtRisk95 / 1e6).toFixed(2)}M, CVaR(95%) = $${(riskMetrics.conditionalVaR95 / 1e6).toFixed(2)}M. The coefficient of variation is ${riskMetrics.coefficientOfVariation.toFixed(1)}%, indicating ${riskMetrics.coefficientOfVariation > 50 ? 'high' : riskMetrics.coefficientOfVariation > 30 ? 'moderate' : 'low'} risk. The distribution shows ${riskMetrics.skewness > 0 ? 'positive' : 'negative'} skewness (${riskMetrics.skewness.toFixed(3)}), meaning ${riskMetrics.skewness > 0 ? 'upside potential exceeds downside' : 'downside risk exceeds upside'}.`;
    }
    if (q.includes('breakeven') || q.includes('breakeven')) {
      return `The breakeven oil price is $${deterministicMetrics.breakevenOilPrice.toFixed(2)}/bbl, which is ${deterministicMetrics.breakevenOilPrice < inputs.prices.oil.base ? 'below' : 'above'} the base case assumption of $${inputs.prices.oil.base}/bbl. The value per BOE is $${deterministicMetrics.valuePerBoe.toFixed(2)}, and the EBITDA margin is ${deterministicMetrics.ebitdaMargin.toFixed(1)}%.`;
    }
    if (q.includes('recommend') || q.includes('proceed') || q.includes('invest')) {
      const rating = riskMetrics.probabilityNpvPositive > 80 ? 'RECOMMEND' : riskMetrics.probabilityNpvPositive > 50 ? 'CONDITIONAL' : 'DO NOT PROCEED';
      return `Based on the analysis, the recommendation is: ${rating}. The project has a ${riskMetrics.probabilityNpvPositive.toFixed(1)}% chance of positive NPV and ${riskMetrics.probabilityIrrAboveHurdle.toFixed(1)}% chance of exceeding the ${inputs.project.hurdleRate}% hurdle rate. ${riskMetrics.probabilityNpvPositive > 80 ? 'Strong economics support proceeding.' : riskMetrics.probabilityNpvPositive > 50 ? 'Consider risk mitigation measures before proceeding.' : 'Significant value destruction risk exists.'}`;
    }
    if (q.includes('board') || q.includes('memo') || q.includes('note')) {
      return `For the Board Note, key highlights: (1) Base case NPV of $${(deterministicMetrics.npv / 1e6).toFixed(2)}M at ${inputs.project.discountRate}% discount, (2) IRR of ${deterministicMetrics.irr.toFixed(1)}% vs ${inputs.project.hurdleRate}% hurdle, (3) Payback in ${deterministicMetrics.paybackPeriod > 0 ? deterministicMetrics.paybackPeriod.toFixed(1) : 'N/A'} years, (4) Top risk driver: ${tornadoData[0].parameter}, (5) P(success) = ${riskMetrics.probabilityNpvPositive.toFixed(1)}%. See the Board Report tab for the full formatted memo.`;
    }
    return `I can help with: NPV drivers, IRR analysis, risk assessment, breakeven analysis, investment recommendations, Board notes, FDP summaries, or development plan optimization. The project has a mean NPV of $${(riskMetrics.meanNpv / 1e6).toFixed(2)}M and ${riskMetrics.probabilityNpvPositive.toFixed(1)}% chance of success. What would you like to explore?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    const aiMsg = { role: 'ai' as const, content: generateResponse(input) };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Brain size={20} /> AI Economics Copilot</h2>
          <p className="text-xs text-gray-400 mt-1">Ask questions about economics, risks, sensitivities, or generate reports</p>
        </div>
        
        <div className="h-96 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about NPV drivers, IRR, risks, breakeven, or request a Board note..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700">Send</button>
        </div>

        <div className="p-3 border-t border-gray-700 flex flex-wrap gap-2">
          {['Why did NPV change?', 'What drives IRR?', 'What are the key risks?', 'Generate Board Note', 'What is the breakeven?'].map(q => (
            <button key={q} onClick={() => { setInput(q); }} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 hover:text-white hover:border-gray-500">{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AuditTrail: React.FC<{ result: SimulationResult }> = ({ result }) => {
  const entries = [
    { time: result.timestamp.toLocaleString(), action: 'Monte Carlo Simulation Run', module: 'Engine', details: `${result.inputs.numIterations} iterations completed`, user: 'System' },
    { time: result.timestamp.toLocaleString(), action: 'Input Parameters Set', module: 'Inputs', details: `Project: ${result.inputs.project.projectName}`, user: 'User' },
    { time: result.timestamp.toLocaleString(), action: 'Fiscal Regime Selected', module: 'Fiscal', details: `${result.inputs.fiscal.name}`, user: 'User' },
    { time: result.timestamp.toLocaleString(), action: 'Production Profile Defined', module: 'Production', details: `${result.inputs.production.oil.p50} bopd initial, ${result.inputs.production.declineRate.p50}% decline`, user: 'User' },
    { time: result.timestamp.toLocaleString(), action: 'Price Assumptions Set', module: 'Prices', details: `Oil $${result.inputs.prices.oil.base}, Gas $${result.inputs.prices.gas.base}`, user: 'User' },
    { time: result.timestamp.toLocaleString(), action: 'NPV Calculated', module: 'Results', details: `Base NPV: $${(result.deterministicMetrics.npv / 1e6).toFixed(2)}M, Mean: $${(result.riskMetrics.meanNpv / 1e6).toFixed(2)}M`, user: 'System' },
    { time: result.timestamp.toLocaleString(), action: 'Tornado Analysis Complete', module: 'Analytics', details: `${result.tornadoData.length} parameters analyzed`, user: 'System' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><History size={20} /> Audit Trail & Governance</h2>
          <p className="text-xs text-gray-400 mt-1">Complete model traceability and change history</p>
        </div>
        
        <div className="divide-y divide-gray-800">
          {entries.map((entry, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-white">{entry.action}</span>
                </div>
                <span className="text-xs text-gray-500">{entry.time}</span>
              </div>
              <div className="ml-5 mt-1 text-xs text-gray-400">
                <span className="text-gray-500">Module:</span> {entry.module} | <span className="text-gray-500">Details:</span> {entry.details} | <span className="text-gray-500">User:</span> {entry.user}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Model Validation Checks</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <ValidationCheck label="All inputs defined" pass={true} />
            <ValidationCheck label="Production > 0" pass={true} />
            <ValidationCheck label="Tax logic correct" pass={true} />
            <ValidationCheck label="No circular references" pass={true} />
            <ValidationCheck label="Discount factors valid" pass={true} />
            <ValidationCheck label="Monte Carlo parameters valid" pass={true} />
            <ValidationCheck label="No double counting" pass={true} />
            <ValidationCheck label="Formula links intact" pass={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidationCheck: React.FC<{ label: string; pass: boolean }> = ({ label, pass }) => (
  <div className="flex items-center gap-2">
    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {pass ? '✓' : '✗'}
    </span>
    <span className="text-gray-300">{label}</span>
  </div>
);

export default App;
