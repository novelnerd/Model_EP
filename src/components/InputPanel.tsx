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
    production: true,
    prices: true,
    costs: true,
    capex: true,
    fiscal: true,
    simulation: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateNested = (section: string, key: string, value: number | string) => {
    const newInputs = { ...inputs };
    if (section === '') {
      // Top-level properties (simulationYears, numIterations)
      (newInputs as any)[key] = value;
    } else {
      (newInputs as any)[section] = { ...(newInputs as any)[section], [key]: value };
    }
    onChange(newInputs);
  };

  const NumberInput: React.FC<{
    section: string;
    field: string;
    label: string;
    value: number;
    step?: number;
    suffix?: string;
    min?: number;
    max?: number;
  }> = ({ section, field, label, value, step = 1, suffix = '', min, max }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => updateNested(section, field, parseFloat(e.target.value) || 0)}
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

      {/* Production */}
      <SectionHeader id="production" title="Production Profile" icon="🛢️" />
      {expandedSections.production && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="production" field="initialRate" label="Initial Rate" value={inputs.production.initialRate} step={50} suffix="boe/d" />
          <NumberInput section="production" field="declineRate" label="Decline Rate" value={inputs.production.declineRate} step={1} suffix="%/yr" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Decline Type</label>
            <select
              value={inputs.production.declineType}
              onChange={(e) => updateNested('production', 'declineType', e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="exponential">Exponential</option>
              <option value="hyperbolic">Hyperbolic</option>
              <option value="harmonic">Harmonic</option>
            </select>
          </div>
          <NumberInput section="production" field="hyperbolicExponent" label="b-Factor" value={inputs.production.hyperbolicExponent} step={0.1} min={0} max={2} />
          <NumberInput section="production" field="minRate" label="Econ. Limit" value={inputs.production.minRate} step={10} suffix="boe/d" />
        </div>
      )}

      {/* Prices */}
      <SectionHeader id="prices" title="Price Assumptions" icon="💰" />
      {expandedSections.prices && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="prices" field="oilPrice" label="Oil Price" value={inputs.prices.oilPrice} step={1} suffix="$/bbl" />
          <NumberInput section="prices" field="gasPrice" label="Gas Price" value={inputs.prices.gasPrice} step={0.25} suffix="$/Mcf" />
          <NumberInput section="prices" field="nglPrice" label="NGL Price" value={inputs.prices.nglPrice} step={1} suffix="$/bbl" />
          <NumberInput section="prices" field="oilPriceStdDev" label="Oil Price σ" value={inputs.prices.oilPriceStdDev} step={1} suffix="%" />
          <NumberInput section="prices" field="gasPriceStdDev" label="Gas Price σ" value={inputs.prices.gasPriceStdDev} step={1} suffix="%" />
          <NumberInput section="prices" field="oilEscalation" label="Oil Escalation" value={inputs.prices.oilEscalation} step={0.5} suffix="%/yr" />
          <NumberInput section="prices" field="gasEscalation" label="Gas Escalation" value={inputs.prices.gasEscalation} step={0.5} suffix="%/yr" />
          <NumberInput section="prices" field="oilGasRatio" label="Gas/Oil Ratio" value={inputs.prices.oilGasRatio} step={0.05} suffix="" />
          <NumberInput section="prices" field="nglRatio" label="NGL Ratio" value={inputs.prices.nglRatio} step={0.05} suffix="" />
        </div>
      )}

      {/* Costs */}
      <SectionHeader id="costs" title="Operating Costs" icon="📊" />
      {expandedSections.costs && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="costs" field="opexPerBarrel" label="Opex" value={inputs.costs.opexPerBarrel} step={0.5} suffix="$/boe" />
          <NumberInput section="costs" field="opexStdDev" label="Opex σ" value={inputs.costs.opexStdDev} step={1} suffix="%" />
          <NumberInput section="costs" field="fixedOpex" label="Fixed Opex" value={inputs.costs.fixedOpex} step={500} suffix="$/mo" />
          <NumberInput section="costs" field="transportationCost" label="Transport" value={inputs.costs.transportationCost} step={0.25} suffix="$/boe" />
          <NumberInput section="costs" field="severanceTaxRate" label="Severance Tax" value={inputs.costs.severanceTaxRate} step={0.5} suffix="%" />
          <NumberInput section="costs" field="adValoremTaxRate" label="Ad Valorem" value={inputs.costs.adValoremTaxRate} step={0.25} suffix="%" />
        </div>
      )}

      {/* Capex */}
      <SectionHeader id="capex" title="Capital Expenditure" icon="🏗️" />
      {expandedSections.capex && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="capex" field="initialCapex" label="Initial Capex" value={inputs.capex.initialCapex} step={100000} suffix="$" />
          <NumberInput section="capex" field="capexStdDev" label="Capex σ" value={inputs.capex.capexStdDev} step={1} suffix="%" />
          <NumberInput section="capex" field="workoverCapex" label="Workover Cost" value={inputs.capex.workoverCapex} step={10000} suffix="$" />
          <NumberInput section="capex" field="workoverFrequency" label="WO Frequency" value={inputs.capex.workoverFrequency} step={1} suffix="yrs" />
          <NumberInput section="capex" field="abandonmentCost" label="Abandonment" value={inputs.capex.abandonmentCost} step={10000} suffix="$" />
          <NumberInput section="capex" field="salvageValue" label="Salvage Value" value={inputs.capex.salvageValue} step={5000} suffix="$" />
        </div>
      )}

      {/* Fiscal */}
      <SectionHeader id="fiscal" title="Fiscal Regime" icon="📋" />
      {expandedSections.fiscal && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="fiscal" field="discountRate" label="Discount Rate" value={inputs.fiscal.discountRate} step={0.5} suffix="%" />
          <NumberInput section="fiscal" field="incomeTaxRate" label="Tax Rate" value={inputs.fiscal.incomeTaxRate} step={1} suffix="%" />
          <NumberInput section="fiscal" field="royaltyRate" label="Royalty Rate" value={inputs.fiscal.royaltyRate} step={0.5} suffix="%" />
          <NumberInput section="fiscal" field="workingInterest" label="Working Interest" value={inputs.fiscal.workingInterest} step={1} suffix="%" />
          <NumberInput section="fiscal" field="netRevenueInterest" label="Net Rev. Interest" value={inputs.fiscal.netRevenueInterest} step={1} suffix="%" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Depr. Method</label>
            <select
              value={inputs.fiscal.depreciationMethod}
              onChange={(e) => updateNested('fiscal', 'depreciationMethod', e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="straight_line">Straight Line</option>
              <option value="units_of_production">Units of Production</option>
            </select>
          </div>
          <NumberInput section="fiscal" field="depreciationYears" label="Depr. Life" value={inputs.fiscal.depreciationYears} step={1} suffix="yrs" />
        </div>
      )}

      {/* Simulation */}
      <SectionHeader id="simulation" title="Simulation Settings" icon="🎲" />
      {expandedSections.simulation && (
        <div className="grid grid-cols-2 gap-2 mb-4 p-2">
          <NumberInput section="" field="simulationYears" label="Years" value={inputs.simulationYears} step={1} suffix="yrs" min={1} max={50} />
          <NumberInput section="" field="numIterations" label="Iterations" value={inputs.numIterations} step={100} suffix="" min={100} max={10000} />
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
