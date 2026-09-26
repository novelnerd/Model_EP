import React, { useState } from 'react';
import { SimulationResult } from '../types';

interface CashFlowTableProps {
  result: SimulationResult;
}

const formatNum = (value: number, decimals: number = 0): string => {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(decimals);
};

const CashFlowTable: React.FC<CashFlowTableProps> = ({ result }) => {
  const [showFormulas, setShowFormulas] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const { cashFlows, cashFlowsWithFormulas } = result;
  const displayFlows = showAllRows ? cashFlows : cashFlows.slice(0, 15);
  const displayFormulas = showAllRows ? cashFlowsWithFormulas : cashFlowsWithFormulas.slice(0, 15);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>📑</span> DCF Cash Flow Model
          <span className="text-xs text-gray-500 font-normal">(Audit Trail)</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              showFormulas
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showFormulas ? '📊 Show Values' : '📝 Show Formulas'}
          </button>
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="px-3 py-1.5 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            {showAllRows ? '📄 Show First 15' : '📋 Show All Years'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800">
              <th className="sticky left-0 bg-gray-800 px-3 py-2 text-left text-gray-400 font-semibold border-b border-gray-700 min-w-[50px]">
                Year
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Prod Rate<br /><span className="text-[10px] font-normal text-gray-500">(boe/d)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Annual Prod<br /><span className="text-[10px] font-normal text-gray-500">(boe)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-green-900/20">
                Oil Rev<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-green-900/20">
                Gas Rev<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-green-900/20">
                NGL Rev<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-green-900/30">
                Gross Rev<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Royalty<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Net Revenue<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-red-900/20">
                Opex<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-red-900/20">
                Transport<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Sev. Tax<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Ad Val. Tax<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-blue-900/20">
                EBITDA<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-red-900/20">
                Capex<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Depr.<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Taxable Inc.<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Income Tax<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-yellow-900/20">
                Net CF<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Cum CF<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700">
                Disc. Factor
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-purple-900/20">
                Disc. CF<br /><span className="text-[10px] font-normal text-gray-500">($)</span>
              </th>
              <th className="px-3 py-2 text-right text-gray-400 font-semibold border-b border-gray-700 bg-purple-900/30">
                Cum DCF<br /><span className="text-[10px] font-normal text-gray-500">($ = NPV)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {showFormulas ? (
              displayFormulas.map((cf, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="sticky left-0 bg-gray-900 px-3 py-1.5 text-gray-300 font-medium border-r border-gray-700">
                    {cf.year + 1}
                  </td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.productionRate}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.annualProduction}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-green-900/10">{cf.formulas.oilRevenue}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-green-900/10">{cf.formulas.gasRevenue}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-green-900/10">{cf.formulas.nglRevenue}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-green-900/20">{cf.formulas.grossRevenue}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.royalty}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.netRevenue}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-red-900/10">{cf.formulas.opex}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-red-900/10">{cf.formulas.transportation}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.severanceTax}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.adValoremTax}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-blue-900/10">{cf.formulas.ebitda}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-red-900/10">{cf.formulas.capex}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.depreciation}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.taxableIncome}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.incomeTax}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-yellow-900/10">{cf.formulas.netCashFlow}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.cumulativeCashFlow}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px]">{cf.formulas.discountFactor}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-purple-900/10">{cf.formulas.discountedCashFlow}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-mono text-[10px] bg-purple-900/20">{cf.formulas.cumulativeDiscountedCF}</td>
                </tr>
              ))
            ) : (
              displayFlows.map((cf, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="sticky left-0 bg-gray-900 px-3 py-1.5 text-gray-300 font-medium border-r border-gray-700">
                    {cf.year + 1}
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-300">{formatNum(cf.productionRate, 0)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-300">{formatNum(cf.annualProduction)}</td>
                  <td className="px-3 py-1.5 text-right text-green-400 bg-green-900/10">{formatNum(cf.oilRevenue)}</td>
                  <td className="px-3 py-1.5 text-right text-green-400 bg-green-900/10">{formatNum(cf.gasRevenue)}</td>
                  <td className="px-3 py-1.5 text-right text-green-400 bg-green-900/10">{formatNum(cf.nglRevenue)}</td>
                  <td className="px-3 py-1.5 text-right text-green-300 font-semibold bg-green-900/20">{formatNum(cf.grossRevenue)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400">{formatNum(cf.royalty)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-300">{formatNum(cf.netRevenue)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400 bg-red-900/10">{formatNum(cf.opex)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400 bg-red-900/10">{formatNum(cf.transportation)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400">{formatNum(cf.severanceTax)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400">{formatNum(cf.adValoremTax)}</td>
                  <td className="px-3 py-1.5 text-right text-blue-300 font-semibold bg-blue-900/10">{formatNum(cf.ebitda)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400 bg-red-900/10">{formatNum(cf.capex)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-400">{formatNum(cf.depreciation)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-400">{formatNum(cf.taxableIncome)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400">{formatNum(cf.incomeTax)}</td>
                  <td className={`px-3 py-1.5 text-right font-semibold bg-yellow-900/10 ${cf.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNum(cf.netCashFlow)}
                  </td>
                  <td className={`px-3 py-1.5 text-right ${cf.cumulativeCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNum(cf.cumulativeCashFlow)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-400">{cf.discountFactor.toFixed(4)}</td>
                  <td className={`px-3 py-1.5 text-right bg-purple-900/10 ${cf.discountedCashFlow >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
                    {formatNum(cf.discountedCashFlow)}
                  </td>
                  <td className={`px-3 py-1.5 text-right font-semibold bg-purple-900/20 ${cf.cumulativeDiscountedCF >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
                    {formatNum(cf.cumulativeDiscountedCF)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Totals row */}
          {!showFormulas && (
            <tfoot>
              <tr className="bg-gray-800 font-semibold border-t-2 border-gray-600">
                <td className="sticky left-0 bg-gray-800 px-3 py-2 text-gray-200">Total</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {formatNum(cashFlows.reduce((s, c) => s + c.annualProduction, 0))}
                </td>
                <td className="px-3 py-2 text-right text-green-400 bg-green-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.oilRevenue, 0))}
                </td>
                <td className="px-3 py-2 text-right text-green-400 bg-green-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.gasRevenue, 0))}
                </td>
                <td className="px-3 py-2 text-right text-green-400 bg-green-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.nglRevenue, 0))}
                </td>
                <td className="px-3 py-2 text-right text-green-300 bg-green-900/20">
                  {formatNum(cashFlows.reduce((s, c) => s + c.grossRevenue, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.royalty, 0))}
                </td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {formatNum(cashFlows.reduce((s, c) => s + c.netRevenue, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400 bg-red-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.opex, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400 bg-red-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.transportation, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.severanceTax, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.adValoremTax, 0))}
                </td>
                <td className="px-3 py-2 text-right text-blue-300 bg-blue-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.ebitda, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400 bg-red-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.capex, 0))}
                </td>
                <td className="px-3 py-2 text-right text-gray-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.depreciation, 0))}
                </td>
                <td className="px-3 py-2 text-right text-gray-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.taxableIncome, 0))}
                </td>
                <td className="px-3 py-2 text-right text-red-400">
                  {formatNum(cashFlows.reduce((s, c) => s + c.incomeTax, 0))}
                </td>
                <td className="px-3 py-2 text-right text-yellow-300 bg-yellow-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.netCashFlow, 0))}
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-purple-300 bg-purple-900/10">
                  {formatNum(cashFlows.reduce((s, c) => s + c.discountedCashFlow, 0))}
                </td>
                <td className="px-3 py-2 text-right text-purple-300 font-bold bg-purple-900/20">
                  {formatNum(cashFlows[cashFlows.length - 1]?.cumulativeDiscountedCF || 0)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-700 flex flex-wrap gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-900/30 inline-block"></span> Revenue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-900/30 inline-block"></span> Costs/Deductions</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-900/30 inline-block"></span> EBITDA</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-900/30 inline-block"></span> Net Cash Flow</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-900/30 inline-block"></span> Discounted / NPV</span>
        {showFormulas && (
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-3 h-3 rounded bg-blue-900/30 inline-block"></span> Excel-compatible formulas (copy to Excel)
          </span>
        )}
      </div>
    </div>
  );
};

export default CashFlowTable;
