import React, { useMemo } from 'react';
import { SimulationResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, Cell } from 'recharts';

interface ResultsDashboardProps {
  result: SimulationResult;
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result }) => {
  const { riskMetrics, deterministicMetrics, cashFlows, npvValues, tornadoData, heatmapData } = result;

  const histogramData = useMemo(() => {
    const numBins = 40;
    const min = Math.min(...npvValues);
    const max = Math.max(...npvValues);
    const binWidth = (max - min) / numBins;
    return Array.from({ length: numBins }, (_, i) => {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = npvValues.filter(v => v >= binStart && v < binEnd).length;
      return { label: `${(binStart / 1e6).toFixed(1)}M`, count, binStart };
    });
  }, [npvValues]);

  const cdfData = useMemo(() => {
    const sorted = [...npvValues].sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(sorted.length / 100));
    return sorted.filter((_, i) => i % step === 0).map((v, i) => ({
      npv: v,
      probability: ((i * step) / sorted.length) * 100,
    }));
  }, [npvValues]);

  const cfChartData = cashFlows.map(cf => ({
    year: `Yr ${cf.year + 1}`,
    netCF: cf.projectCashFlow,
    cumCF: cf.cumulativeCashFlow,
    cumDCF: cf.cumulativeDcf,
    ebitda: cf.ebitda,
  }));

  const prodData = cashFlows.map(cf => ({
    year: `Yr ${cf.year + 1}`,
    oil: cf.oilProduction,
    gas: cf.gasProduction,
    total: cf.totalProduction,
  }));

  const tornadoChartData = tornadoData.map(item => ({
    parameter: item.parameter,
    range: Math.abs(item.impact),
    low: item.lowValue,
    high: item.highValue,
  }));

  // Decision indicator
  const getDecisionRating = (): 'green' | 'amber' | 'red' => {
    if (riskMetrics.probabilityNpvPositive > 80 && riskMetrics.meanIrr > deterministicMetrics.irr * 0.8) return 'green';
    if (riskMetrics.probabilityNpvPositive > 50 && riskMetrics.meanIrr > result.inputs.project.hurdleRate) return 'amber';
    return 'red';
  };

  const rating = getDecisionRating();
  const ratingColors = { green: 'bg-green-500', amber: 'bg-yellow-500', red: 'bg-red-500' };
  const ratingLabels = { green: 'RECOMMEND', amber: 'CONDITIONAL', red: 'DO NOT PROCEED' };

  return (
    <div className="space-y-6">
      {/* Executive Summary Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{result.inputs.project.projectName}</h2>
            <p className="text-gray-400">{result.inputs.project.assetName} | {result.inputs.project.basin} | {result.inputs.project.country}</p>
          </div>
          <div className={`px-6 py-3 rounded-lg ${ratingColors[rating]} text-white font-bold text-lg`}>
            {ratingLabels[rating]}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Mean NPV" value={formatCurrency(riskMetrics.meanNpv)} color="blue" />
        <StatCard label="P10 (Upside)" value={formatCurrency(riskMetrics.p10Npv)} color="green" />
        <StatCard label="P50 (Base)" value={formatCurrency(riskMetrics.p50Npv)} color="purple" />
        <StatCard label="P90 (Downside)" value={formatCurrency(riskMetrics.p90Npv)} color="orange" />
        <StatCard label="Mean IRR" value={`${riskMetrics.meanIrr.toFixed(1)}%`} color="blue" />
        <StatCard label="P(NPV>0)" value={`${riskMetrics.probabilityNpvPositive.toFixed(1)}%`} color={riskMetrics.probabilityNpvPositive > 50 ? 'green' : 'red'} />
        <StatCard label="Payback" value={`${deterministicMetrics.paybackPeriod > 0 ? deterministicMetrics.paybackPeriod.toFixed(1) : 'N/A'} yrs`} color="gray" />
        <StatCard label="PI" value={deterministicMetrics.profitabilityIndex.toFixed(2)} color="purple" />
        <StatCard label="VaR (95%)" value={formatCurrency(riskMetrics.valueAtRisk95)} color="red" />
        <StatCard label="CVaR (95%)" value={formatCurrency(riskMetrics.conditionalVaR95)} color="red" />
        <StatCard label="BE Oil Price" value={`$${deterministicMetrics.breakevenOilPrice.toFixed(1)}`} color="orange" />
        <StatCard label="$\!/boe" value={formatCurrency(deterministicMetrics.valuePerBoe)} color="green" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 NPV Distribution (Monte Carlo)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📈 Cumulative Probability (S-Curve)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cdfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="npv" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Probability']} labelFormatter={(v) => `NPV: ${formatCurrency(v as number)}`} />
              <Area type="monotone" dataKey="probability" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">💵 Cash Flow Profile (Base Case)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cfChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(value: number) => [formatCurrency(value)]} />
              <Line type="monotone" dataKey="netCF" stroke="#10B981" strokeWidth={2} dot={false} name="Project CF" />
              <Line type="monotone" dataKey="cumCF" stroke="#3B82F6" strokeWidth={2} dot={false} name="Cumulative CF" />
              <Line type="monotone" dataKey="cumDCF" stroke="#F59E0B" strokeWidth={2} dot={false} name="Cumulative DCF" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🌪️ Tornado Analysis (Sensitivity)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tornadoChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <YAxis type="category" dataKey="parameter" tick={{ fontSize: 9, fill: '#9CA3AF' }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(value: number) => [formatCurrency(value), 'NPV Swing']} />
              <Bar dataKey="range" radius={[0, 4, 4, 0]}>
                {tornadoChartData.map((_, index) => (
                  <Cell key={index} fill={index % 2 === 0 ? '#EF4444' : '#F59E0B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🛢️ Production Decline Profile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={prodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="oil" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} name="Oil (bbl/d)" />
              <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Total (boe/d)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🔥 Heatmap: Oil Price vs Production</h3>
          <div className="grid grid-cols-5 gap-1">
            {heatmapData.map((cell, idx) => {
              const maxVal = Math.max(...heatmapData.map(c => Math.abs(c.value)));
              const intensity = Math.abs(cell.value) / maxVal;
              const color = cell.value >= 0
                ? `rgba(34, 197, 94, ${intensity})`
                : `rgba(239, 68, 68, ${intensity})`;
              return (
                <div key={idx} className="p-2 rounded text-center" style={{ backgroundColor: color }} title={`${cell.x}, ${cell.y}: ${formatCurrency(cell.value)}`}>
                  <div className="text-[10px] text-white font-mono">{formatCurrency(cell.value)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            <span>← Production (bopd)</span>
            <span>Oil Price ($/bbl) →</span>
          </div>
        </div>
      </div>

      {/* Statistical Summary */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 Comprehensive Statistical Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">NPV Statistics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Mean</td><td className="py-1 text-right text-white">{formatCurrency(riskMetrics.meanNpv)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Median</td><td className="py-1 text-right text-white">{formatCurrency(riskMetrics.medianNpv)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Std Dev</td><td className="py-1 text-right text-white">{formatCurrency(riskMetrics.stdDevNpv)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P10/P50/P90</td><td className="py-1 text-right text-white">{formatCurrency(riskMetrics.p10Npv)} / {formatCurrency(riskMetrics.p50Npv)} / {formatCurrency(riskMetrics.p90Npv)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Skewness</td><td className="py-1 text-right text-white">{riskMetrics.skewness.toFixed(3)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Kurtosis</td><td className="py-1 text-right text-white">{riskMetrics.kurtosis.toFixed(3)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">IRR Statistics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Mean IRR</td><td className="py-1 text-right text-white">{riskMetrics.meanIrr.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Median IRR</td><td className="py-1 text-right text-white">{riskMetrics.medianIrr.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P10/P50/P90</td><td className="py-1 text-right text-white">{riskMetrics.p10Irr.toFixed(1)}% / {riskMetrics.p50Irr.toFixed(1)}% / {riskMetrics.p90Irr.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P(IRR&gt;Hurdle)</td><td className="py-1 text-right text-white">{riskMetrics.probabilityIrrAboveHurdle.toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Economic Metrics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">NPV</td><td className="py-1 text-right text-white">{formatCurrency(deterministicMetrics.npv)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">IRR</td><td className="py-1 text-right text-white">{deterministicMetrics.irr.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">MIRR</td><td className="py-1 text-right text-white">{deterministicMetrics.mirr.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">PI</td><td className="py-1 text-right text-white">{deterministicMetrics.profitabilityIndex.toFixed(2)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Payback</td><td className="py-1 text-right text-white">{deterministicMetrics.paybackPeriod > 0 ? `${deterministicMetrics.paybackPeriod.toFixed(1)} yrs` : 'N/A'}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">EBITDA Margin</td><td className="py-1 text-right text-white">{deterministicMetrics.ebitdaMargin.toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Risk Metrics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P(NPV&gt;0)</td><td className="py-1 text-right text-white">{riskMetrics.probabilityNpvPositive.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">VaR (95%)</td><td className="py-1 text-right text-red-400">{formatCurrency(riskMetrics.valueAtRisk95)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">CVaR (95%)</td><td className="py-1 text-right text-red-400">{formatCurrency(riskMetrics.conditionalVaR95)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">CV (NPV)</td><td className="py-1 text-right text-white">{riskMetrics.coefficientOfVariation.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Iterations</td><td className="py-1 text-right text-white">{result.inputs.numIterations.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
    gray: 'border-gray-500/30 bg-gray-500/10',
    red: 'border-red-500/30 bg-red-500/10',
  };

  return (
    <div className={`rounded-lg p-3 border ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
    </div>
  );
};

export default ResultsDashboard;
