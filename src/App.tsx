import React, { useState, useCallback } from 'react';
import { SimulationInputs, SimulationResult } from './types';
import { runMonteCarlo } from './engine/simulationEngine';
import { exportToExcel, exportFormulasOnly } from './engine/excelExport';
import InputPanel from './components/InputPanel';
import ResultsDashboard from './components/ResultsDashboard';
import CashFlowTable from './components/CashFlowTable';
import { Download, FileSpreadsheet, BarChart3, Table2, Settings } from 'lucide-react';

const defaultInputs: SimulationInputs = {
  production: {
    initialRate: 500,
    declineRate: 15,
    declineType: 'exponential',
    hyperbolicExponent: 0.5,
    minRate: 20,
  },
  prices: {
    oilPrice: 75,
    gasPrice: 3.5,
    nglPrice: 35,
    oilPriceStdDev: 20,
    gasPriceStdDev: 30,
    nglPriceStdDev: 25,
    oilEscalation: 2,
    gasEscalation: 1.5,
    nglEscalation: 2,
    oilGasRatio: 0.15,
    nglRatio: 0.1,
  },
  costs: {
    opexPerBarrel: 12,
    opexStdDev: 15,
    opexEscalation: 2,
    fixedOpex: 5000,
    transportationCost: 3.5,
    severanceTaxRate: 4.5,
    adValoremTaxRate: 1.5,
  },
  capex: {
    initialCapex: 2500000,
    capexStdDev: 20,
    workoverCapex: 150000,
    workoverFrequency: 5,
    abandonmentCost: 100000,
    salvageValue: 25000,
  },
  fiscal: {
    discountRate: 10,
    incomeTaxRate: 25,
    royaltyRate: 18.75,
    depreciationMethod: 'straight_line',
    depreciationYears: 7,
    workingInterest: 100,
    netRevenueInterest: 81.25,
  },
  simulationYears: 20,
  numIterations: 1000,
};

type TabType = 'dashboard' | 'cashflow' | 'inputs';

function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(defaultInputs);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inputs');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const simResult = runMonteCarlo(inputs);
      setResult(simResult);
      setIsRunning(false);
      setActiveTab('dashboard');
    }, 100);
  }, [inputs]);

  const handleExportExcel = useCallback(() => {
    if (result) {
      exportToExcel(result);
    }
  }, [result]);

  const handleExportFormulas = useCallback(() => {
    if (result) {
      exportFormulasOnly(result);
    }
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
                E&P Monte Carlo NPV Simulator
              </h1>
              <p className="text-xs text-gray-500">DCF Valuation & Cash Flow Audit Model</p>
            </div>
          </div>
          
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFormulas}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet size={14} />
                Export Formulas
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 bg-green-700 border border-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-600 transition-colors"
              >
                <Download size={14} />
                Export Full Excel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-900/50 border-b border-gray-800 px-4">
        <div className="max-w-[1920px] mx-auto flex gap-1">
          <TabButton
            active={activeTab === 'inputs'}
            onClick={() => setActiveTab('inputs')}
            icon={<Settings size={14} />}
            label="Input Parameters"
          />
          {result && (
            <>
              <TabButton
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
                icon={<BarChart3 size={14} />}
                label="Results Dashboard"
              />
              <TabButton
                active={activeTab === 'cashflow'}
                onClick={() => setActiveTab('cashflow')}
                icon={<Table2 size={14} />}
                label="Cash Flow (Audit)"
              />
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-4">
        {activeTab === 'inputs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <InputPanel
                inputs={inputs}
                onChange={setInputs}
                onRunSimulation={handleRunSimulation}
                isRunning={isRunning}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 h-full">
                <h2 className="text-lg font-bold text-white mb-4">📖 How This Model Works</h2>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-400 mb-2">🎲 Monte Carlo Simulation</h3>
                    <p className="text-gray-400">
                      The simulation runs {inputs.numIterations.toLocaleString()} iterations, each time randomly sampling 
                      input parameters (prices, costs, capex) from their probability distributions. This generates a 
                      distribution of possible NPV outcomes, giving you P10/P50/P90 estimates and probability of loss.
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-green-400 mb-2">🛢️ E&P DCF Model</h3>
                    <p className="text-gray-400">
                      The cash flow model follows standard E&P valuation methodology:
                    </p>
                    <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
                      <li>Production decline (exponential/hyperbolic/harmonic)</li>
                      <li>Revenue = Oil + Gas + NGL production × respective prices</li>
                      <li>Deductions: Royalties, Opex, Transportation, Taxes</li>
                      <li>EBITDA → Taxable Income → Income Tax → Net Cash Flow</li>
                      <li>DCF: Each year's cash flow discounted at WACC</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-400 mb-2">📊 Excel Audit Trail</h3>
                    <p className="text-gray-400">
                      All cash flows include Excel-compatible formulas for full audit transparency. 
                      Export to Excel to see:
                    </p>
                    <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
                      <li><strong>Summary Sheet:</strong> NPV statistics, key inputs</li>
                      <li><strong>Cash Flow Sheet:</strong> Full DCF with values</li>
                      <li><strong>Formulas Sheet:</strong> Every cell's formula for audit</li>
                      <li><strong>Input Assumptions:</strong> All parameters documented</li>
                      <li><strong>Tornado Analysis:</strong> Sensitivity ranking</li>
                      <li><strong>NPV Distribution:</strong> Histogram bins</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Key Assumptions</h3>
                    <p className="text-gray-400">
                      Prices follow lognormal distributions. Production decline follows the selected 
                      type. All costs can escalate annually. The model uses working interest and 
                      net revenue interest for proper economic interest allocation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && result && (
          <ResultsDashboard result={result} />
        )}

        {activeTab === 'cashflow' && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">📑 DCF Cash Flow Model</h2>
                <p className="text-xs text-gray-500">Complete audit trail with Excel-compatible formulas</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFormulaModal(!showFormulaModal)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-700 rounded-lg text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                >
                  <FileSpreadsheet size={14} />
                  Formula Reference
                </button>
              </div>
            </div>
            <CashFlowTable result={result} />
          </div>
        )}
      </main>

      {/* Formula Reference Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowFormulaModal(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">📝 Excel Formula Reference</h3>
            <div className="space-y-3 text-sm">
              <FormulaRow label="Production Rate" formula="= Initial_Rate × EXP(-Decline_Rate × Year)" />
              <FormulaRow label="Annual Production" formula="= Prod_Rate × 365" />
              <FormulaRow label="Oil Revenue" formula="= Oil_Production × Oil_Price × (1 + Escalation)^Year" />
              <FormulaRow label="Gas Revenue" formula="= Gas_Production × Gas_Price × (1 + Escalation)^Year" />
              <FormulaRow label="NGL Revenue" formula="= NGL_Production × NGL_Price × (1 + Escalation)^Year" />
              <FormulaRow label="Gross Revenue" formula="= Oil_Rev + Gas_Rev + NGL_Rev" />
              <FormulaRow label="Royalty" formula="= Gross_Revenue × Royalty_Rate" />
              <FormulaRow label="Net Revenue" formula="= Gross_Revenue - Royalty" />
              <FormulaRow label="Opex" formula="= Annual_Production × Opex_per_boe × (1 + Escalation)^Year + Fixed_Opex × 12" />
              <FormulaRow label="Transportation" formula="= Annual_Production × Transport_Cost" />
              <FormulaRow label="Severance Tax" formula="= Net_Revenue × Severance_Tax_Rate" />
              <FormulaRow label="Ad Valorem Tax" formula="= Gross_Revenue × Ad_Valorem_Rate" />
              <FormulaRow label="EBITDA" formula="= Net_Revenue - Opex - Transport - Sev_Tax - Ad_Val_Tax" />
              <FormulaRow label="Depreciation" formula="= Initial_Capex / Depreciation_Years" />
              <FormulaRow label="Taxable Income" formula="= MAX(0, EBITDA - Depr) × Working_Interest" />
              <FormulaRow label="Income Tax" formula="= Taxable_Income × Tax_Rate" />
              <FormulaRow label="Net Cash Flow" formula="= (EBITDA - Income_Tax) × NRI - Capex × WI" />
              <FormulaRow label="Discount Factor" formula="= 1 / (1 + WACC)^(Year + 1)" />
              <FormulaRow label="Discounted CF" formula="= Net_CF × Discount_Factor" />
              <FormulaRow label="NPV" formula="= SUM(All Discounted Cash Flows)" />
            </div>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="mt-4 w-full py-2 bg-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-3 mt-8">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>E&P Monte Carlo NPV Simulator v1.0 | DCF Valuation Model</span>
          <span>For professional use - verify all assumptions with qualified petroleum engineers</span>
        </div>
      </footer>
    </div>
  );
}

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
    }`}
  >
    {icon}
    {label}
  </button>
);

const FormulaRow: React.FC<{ label: string; formula: string }> = ({ label, formula }) => (
  <div className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
    <span className="text-gray-400 font-medium min-w-[140px]">{label}</span>
    <code className="text-blue-300 font-mono text-xs bg-gray-900 px-2 py-1 rounded">{formula}</code>
  </div>
);

export default App;
