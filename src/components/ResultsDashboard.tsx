import React, { useMemo } from 'react';
import { SimulationResult, HistogramBin } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

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
  // Histogram data
  const histogramData = useMemo(() => {
    const bins: HistogramBin[] = [];
    const numBins = 40;
    const values = result.npvValues;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / numBins;

    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      bins.push({
        binStart,
        binEnd,
        count,
        label: `${(binStart / 1e6).toFixed(1)}M`,
      });
    }
    return bins;
  }, [result.npvValues]);

  // Cumulative probability data
  const cdfData = useMemo(() => {
    const sorted = [...result.npvValues].sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(sorted.length / 100));
    return sorted.filter((_, i) => i % step === 0).map((v, i) => ({
      npv: v,
      probability: ((i * step) / sorted.length) * 100,
    }));
  }, [result.npvValues]);

  // Cash flow chart data
  const cfChartData = result.cashFlows.map(cf => ({
    year: `Yr ${cf.year + 1}`,
    netCF: cf.netCashFlow,
    cumCF: cf.cumulativeCashFlow,
    cumDCF: cf.cumulativeDiscountedCF,
  }));

  // Tornado chart data
  const tornadoData = result.tornadoData.map(item => ({
    parameter: item.parameter,
    low: item.lowValue,
    high: item.highValue,
    range: item.highValue - item.lowValue,
  }));

  // Production profile chart
  const prodData = result.cashFlows.map(cf => ({
    year: `Yr ${cf.year + 1}`,
    rate: cf.productionRate,
    annual: cf.annualProduction,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Mean NPV" value={formatCurrency(result.meanNPV)} color="blue" />
        <StatCard label="P10 (Upside)" value={formatCurrency(result.p10NPV)} color="green" />
        <StatCard label="P50 (Base)" value={formatCurrency(result.p50NPV)} color="purple" />
        <StatCard label="P90 (Downside)" value={formatCurrency(result.p90NPV)} color="orange" />
        <StatCard label="Std Dev" value={formatCurrency(result.stdDevNPV)} color="gray" />
        <StatCard label="P(Loss)" value={`${result.probabilityOfLoss.toFixed(1)}%`} color={result.probabilityOfLoss > 30 ? 'red' : 'green'} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NPV Histogram */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📊 NPV Distribution (Histogram)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
                formatter={(value: number) => [value, 'Count']}
                labelFormatter={(label) => `NPV: ${label}`}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Probability */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📈 Cumulative Probability (P-Plot)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cdfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="npv"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Probability']}
                labelFormatter={(v) => `NPV: ${formatCurrency(v as number)}`}
              />
              <Area type="monotone" dataKey="probability" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">💵 Cash Flow Profile (Base Case)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cfChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Line type="monotone" dataKey="netCF" stroke="#10B981" strokeWidth={2} dot={false} name="Net CF" />
              <Line type="monotone" dataKey="cumCF" stroke="#3B82F6" strokeWidth={2} dot={false} name="Cumulative CF" />
              <Line type="monotone" dataKey="cumDCF" stroke="#F59E0B" strokeWidth={2} dot={false} name="Cumulative DCF" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tornado Chart */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">🌪️ Tornado Analysis (Sensitivity)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tornadoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <YAxis type="category" dataKey="parameter" tick={{ fontSize: 9, fill: '#9CA3AF' }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'NPV Range']}
              />
              <Bar dataKey="range" fill="#EF4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production Profile */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">🛢️ Production Decline Profile</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={prodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="rate" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} name="Rate (boe/d)" />
            <Area yAxisId="right" type="monotone" dataKey="annual" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Annual (boe)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Table */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 Statistical Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">NPV Statistics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Mean</td><td className="py-1 text-right text-white">{formatCurrency(result.meanNPV)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Median</td><td className="py-1 text-right text-white">{formatCurrency(result.medianNPV)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Std Dev</td><td className="py-1 text-right text-white">{formatCurrency(result.stdDevNPV)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P10</td><td className="py-1 text-right text-green-400">{formatCurrency(result.p10NPV)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P50</td><td className="py-1 text-right text-purple-400">{formatCurrency(result.p50NPV)}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P90</td><td className="py-1 text-right text-orange-400">{formatCurrency(result.p90NPV)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">IRR Statistics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Mean IRR</td><td className="py-1 text-right text-white">{(result.irrValues.reduce((a, b) => a + b, 0) / result.irrValues.length).toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Median IRR</td><td className="py-1 text-right text-white">{result.irrValues.sort((a, b) => a - b)[Math.floor(result.irrValues.length / 2)].toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Min IRR</td><td className="py-1 text-right text-white">{Math.min(...result.irrValues).toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Max IRR</td><td className="py-1 text-right text-white">{Math.max(...result.irrValues).toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Payback Period</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Mean</td><td className="py-1 text-right text-white">{(result.paybackPeriods.filter(p => p > 0).reduce((a, b) => a + b, 0) / result.paybackPeriods.filter(p => p > 0).length || 0).toFixed(1)} yrs</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Never Payback</td><td className="py-1 text-right text-red-400">{result.paybackPeriods.filter(p => p < 0).length} ({((result.paybackPeriods.filter(p => p < 0).length / result.paybackPeriods.length) * 100).toFixed(1)}%)</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Risk Metrics</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">P(Loss)</td><td className="py-1 text-right text-white">{result.probabilityOfLoss.toFixed(1)}%</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">Iterations</td><td className="py-1 text-right text-white">{result.inputs.numIterations.toLocaleString()}</td></tr>
                <tr className="border-b border-gray-800"><td className="py-1 text-gray-400">CV (NPV)</td><td className="py-1 text-right text-white">{((result.stdDevNPV / Math.abs(result.meanNPV)) * 100).toFixed(1)}%</td></tr>
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
