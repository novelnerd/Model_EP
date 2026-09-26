import React, { useState } from 'react';
import { SimulationInputs } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface InputPanelProps {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ inputs, onChange, onRunSimulation, isRunning }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    project: true,
    production: true,
    prices: true,
    capex: false,
    opex: false,
    fiscal: true,
    simulation: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateProject = (key: string, value: any) => {
    onChange({ ...inputs, project: { ...inputs.project, [key]: value } });
  };

  const updateProduction = (key: string, value: any) => {
    onChange({ ...inputs, production: { ...inputs.production, [key]: value } });
  };

  const updatePrices = (commodity: string, key: string, value: any) => {
    const current = (inputs.prices as any)[commodity];
    onChange({ ...inputs, prices: { ...inputs.prices, [commodity]: { ...current, [key]: value } } });
  };

  const updateCapex = (key: string, value: any) => {
    onChange({ ...inputs, capex: { ...inputs.capex, [key]: value } });
  };

  const updateOpex = (key: string, value: any) => {
    onChange({ ...inputs, opex: { ...inputs.opex, [key]: value } });
  };

  const updateFiscal = (key: string, value: any) => {
    onChange({ ...inputs, fiscal: { ...inputs.fiscal, [key]: value } });
  };

  const NumberInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    suffix?: string;
    min?: number;
    max?: number;
  }> = ({ label, value, onChange, step = 1, suffix = '', min, max }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
        {suffix && <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  const SectionHeader: React.FC<{ id: string; title: string; icon: string }> = ({ id, title, icon }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg mb-2 hover:bg-gray-750 transition-colors"
    >
      <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <span>{icon}</span> {title}
      </span>
      {expandedSections[id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>⚙️</span> Model Parameters
      </h2>

      {/* Project Info */}
      <SectionHeader id="project" title="Project Information" icon="📋" />
      {expandedSections.project && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Economic Life" value={inputs.project.economicLife} onChange={(v) => updateProject('economicLife', v)} step={1} suffix="yrs" />
          <NumberInput label="Discount Rate" value={inputs.project.discountRate} onChange={(v) => updateProject('discountRate', v)} step={0.5} suffix="%" />
          <NumberInput label="Hurdle Rate" value={inputs.project.hurdleRate} onChange={(v) => updateProject('hurdleRate', v)} step={0.5} suffix="%" />
          <NumberInput label="Working Interest" value={inputs.project.workingInterest} onChange={(v) => updateProject('workingInterest', v)} step={1} suffix="%" />
          <NumberInput label="Net Revenue Interest" value={inputs.project.netRevenueInterest} onChange={(v) => updateProject('netRevenueInterest', v)} step={1} suffix="%" />
          <NumberInput label="Inflation Rate" value={inputs.project.inflationRate} onChange={(v) => updateProject('inflationRate', v)} step={0.5} suffix="%" />
        </div>
      )}

      {/* Production */}
      <SectionHeader id="production" title="Production Profile" icon="🛢️" />
      {expandedSections.production && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Initial Oil Rate (P50)" value={inputs.production.oil.p50} onChange={(v) => updateProduction('oil', { ...inputs.production.oil, p50: v })} step={50} suffix="bopd" />
          <NumberInput label="Oil P10" value={inputs.production.oil.p10} onChange={(v) => updateProduction('oil', { ...inputs.production.oil, p10: v })} step={50} suffix="bopd" />
          <NumberInput label="Oil P90" value={inputs.production.oil.p90} onChange={(v) => updateProduction('oil', { ...inputs.production.oil, p90: v })} step={50} suffix="bopd" />
          <NumberInput label="Decline Rate (P50)" value={inputs.production.declineRate.p50} onChange={(v) => updateProduction('declineRate', { ...inputs.production.declineRate, p50: v })} step={1} suffix="%/yr" />
          <NumberInput label="GOR" value={inputs.production.gor} onChange={(v) => updateProduction('gor', v)} step={100} suffix="scf/bbl" />
          <NumberInput label="WOR" value={inputs.production.wor} onChange={(v) => updateProduction('wor', v)} step={0.1} suffix="bbl/bbl" />
          <NumberInput label="Plateau Years" value={inputs.production.plateauYears} onChange={(v) => updateProduction('plateauYears', v)} step={1} suffix="yrs" />
          <NumberInput label="Economic Limit" value={inputs.production.economicLimit} onChange={(v) => updateProduction('economicLimit', v)} step={10} suffix="bopd" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Decline Type</label>
            <select
              value={inputs.production.declineType}
              onChange={(e) => updateProduction('declineType', e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="exponential">Exponential</option>
              <option value="hyperbolic">Hyperbolic</option>
              <option value="harmonic">Harmonic</option>
            </select>
          </div>
          <NumberInput label="Hyperbolic b" value={inputs.production.hyperbolicExponent} onChange={(v) => updateProduction('hyperbolicExponent', v)} step={0.1} min={0} max={2} />
        </div>
      )}

      {/* Prices */}
      <SectionHeader id="prices" title="Price Assumptions" icon="💰" />
      {expandedSections.prices && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Oil Price (Base)" value={inputs.prices.oil.base} onChange={(v) => updatePrices('oil', 'base', v)} step={1} suffix="$/bbl" />
          <NumberInput label="Oil Escalation" value={inputs.prices.oil.escalation} onChange={(v) => updatePrices('oil', 'escalation', v)} step={0.5} suffix="%/yr" />
          <NumberInput label="Gas Price (Base)" value={inputs.prices.gas.base} onChange={(v) => updatePrices('gas', 'base', v)} step={0.25} suffix="$/Mcf" />
          <NumberInput label="Gas Escalation" value={inputs.prices.gas.escalation} onChange={(v) => updatePrices('gas', 'escalation', v)} step={0.5} suffix="%/yr" />
          <NumberInput label="NGL Price" value={inputs.prices.ngl.base} onChange={(v) => updatePrices('ngl', 'base', v)} step={1} suffix="$/bbl" />
          <NumberInput label="NGL Ratio" value={inputs.prices.nglRatio} onChange={(v) => onChange({ ...inputs, prices: { ...inputs.prices, nglRatio: v } })} step={0.05} />
        </div>
      )}

      {/* CAPEX */}
      <SectionHeader id="capex" title="Capital Expenditure" icon="🏗️" />
      {expandedSections.capex && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Exploration" value={inputs.capex.exploration} onChange={(v) => updateCapex('exploration', v)} step={100000} suffix="$" />
          <NumberInput label="Drilling" value={inputs.capex.drilling} onChange={(v) => updateCapex('drilling', v)} step={100000} suffix="$" />
          <NumberInput label="Facilities" value={inputs.capex.facilities} onChange={(v) => updateCapex('facilities', v)} step={100000} suffix="$" />
          <NumberInput label="Pipelines" value={inputs.capex.pipelines} onChange={(v) => updateCapex('pipelines', v)} step={100000} suffix="$" />
          <NumberInput label="Workovers" value={inputs.capex.workovers} onChange={(v) => updateCapex('workovers', v)} step={50000} suffix="$" />
          <NumberInput label="Abandonment" value={inputs.capex.abandonment} onChange={(v) => updateCapex('abandonment', v)} step={50000} suffix="$" />
          <NumberInput label="Contingency" value={inputs.capex.contingency} onChange={(v) => updateCapex('contingency', v)} step={50000} suffix="$" />
          <NumberInput label="CAPEX σ" value={inputs.capex.totalCapexStdDev} onChange={(v) => updateCapex('totalCapexStdDev', v)} step={1} suffix="%" />
        </div>
      )}

      {/* OPEX */}
      <SectionHeader id="opex" title="Operating Costs" icon="📊" />
      {expandedSections.opex && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Fixed Opex" value={inputs.opex.fixedOpex} onChange={(v) => updateOpex('fixedOpex', v)} step={1000} suffix="$/yr" />
          <NumberInput label="Variable Opex" value={inputs.opex.variableOpex} onChange={(v) => updateOpex('variableOpex', v)} step={0.5} suffix="$/bbl" />
          <NumberInput label="Transportation" value={inputs.opex.transportation} onChange={(v) => updateOpex('transportation', v)} step={0.25} suffix="$/bbl" />
          <NumberInput label="Carbon Cost" value={inputs.opex.carbonCost} onChange={(v) => updateOpex('carbonCost', v)} step={0.5} suffix="$/bbl" />
          <NumberInput label="Inflation Rate" value={inputs.opex.inflationRate} onChange={(v) => updateOpex('inflationRate', v)} step={0.5} suffix="%/yr" />
          <NumberInput label="OPEX σ" value={inputs.opex.totalOpexStdDev} onChange={(v) => updateOpex('totalOpexStdDev', v)} step={1} suffix="%" />
        </div>
      )}

      {/* Fiscal */}
      <SectionHeader id="fiscal" title="Fiscal Regime" icon="📜" />
      {expandedSections.fiscal && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput label="Royalty Rate" value={inputs.fiscal.royaltyRate} onChange={(v) => updateFiscal('royaltyRate', v)} step={0.5} suffix="%" />
          <NumberInput label="OIDB Cess" value={inputs.fiscal.oidbCess} onChange={(v) => updateFiscal('oidbCess', v)} step={0.25} suffix="%" />
          <NumberInput label="Corporate Tax" value={inputs.fiscal.corporateTaxRate} onChange={(v) => updateFiscal('corporateTaxRate', v)} step={1} suffix="%" />
          <NumberInput label="Tax Holiday" value={inputs.fiscal.taxHolidayYears} onChange={(v) => updateFiscal('taxHolidayYears', v)} step={1} suffix="yrs" />
          <NumberInput label="Depreciation Years" value={inputs.fiscal.depreciationYears} onChange={(v) => updateFiscal('depreciationYears', v)} step={1} suffix="yrs" />
          <NumberInput label="WDV Rate" value={inputs.fiscal.wdvRate} onChange={(v) => updateFiscal('wdvRate', v)} step={1} suffix="%" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Depr. Method</label>
            <select
              value={inputs.fiscal.depreciationMethod}
              onChange={(e) => updateFiscal('depreciationMethod', e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="straight_line">Straight Line</option>
              <option value="wdv">Written Down Value</option>
              <option value="units_of_production">Units of Production</option>
            </select>
          </div>
        </div>
      )}

      {/* Simulation */}
      <SectionHeader id="simulation" title="Simulation Settings" icon="🎲" />
      {expandedSections.simulation && (
        <div className="grid grid-cols-1 gap-2 mb-4 p-2">
          <NumberInput label="Number of Iterations" value={inputs.numIterations} onChange={(v) => onChange({ ...inputs, numIterations: v })} step={100} min={100} max={100000} />
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={onRunSimulation}
        disabled={isRunning}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
          isRunning
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running Simulation...
          </span>
        ) : (
          '🚀 Run Monte Carlo Simulation'
        )}
      </button>
    </div>
  );
};

export default InputPanel;
