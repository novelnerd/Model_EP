import * as XLSX from 'xlsx';
import { SimulationResult } from '../types';

export function exportToExcel(result: SimulationResult) {
  const wb = XLSX.utils.book_new();
  const { inputs, cashFlows, riskMetrics, deterministicMetrics, tornadoData } = result;

  // Sheet 1: Summary
  const summaryData: any[][] = [
    ['E&P Enterprise Monte Carlo NPV Simulation - Executive Summary'],
    [''],
    ['Project Information'],
    ['Project Name', inputs.project.projectName],
    ['Asset Name', inputs.project.assetName],
    ['Basin', inputs.project.basin],
    ['Country', inputs.project.country],
    ['Operator', inputs.project.operator],
    ['Working Interest (%)', inputs.project.workingInterest],
    ['Net Revenue Interest (%)', inputs.project.netRevenueInterest],
    ['Currency', inputs.project.currency],
    ['Economic Life (Years)', inputs.project.economicLife],
    ['Discount Rate / WACC (%)', inputs.project.discountRate],
    ['Hurdle Rate (%)', inputs.project.hurdleRate],
    [''],
    ['Monte Carlo Results'],
    ['Number of Iterations', inputs.numIterations],
    ['Mean NPV', riskMetrics.meanNpv],
    ['Median NPV (P50)', riskMetrics.medianNpv],
    ['Standard Deviation', riskMetrics.stdDevNpv],
    ['P10 NPV (Upside)', riskMetrics.p10Npv],
    ['P50 NPV (Base Case)', riskMetrics.p50Npv],
    ['P90 NPV (Downside)', riskMetrics.p90Npv],
    ['Probability NPV > 0 (%)', riskMetrics.probabilityNpvPositive],
    ['Mean IRR (%)', riskMetrics.meanIrr],
    ['Value at Risk 95%', riskMetrics.valueAtRisk95],
    ['Conditional VaR 95%', riskMetrics.conditionalVaR95],
    [''],
    ['Deterministic Economics'],
    ['NPV', deterministicMetrics.npv],
    ['IRR (%)', deterministicMetrics.irr],
    ['MIRR (%)', deterministicMetrics.mirr],
    ['Profitability Index', deterministicMetrics.profitabilityIndex],
    ['Payback Period (Years)', deterministicMetrics.paybackPeriod],
    ['Discounted Payback (Years)', deterministicMetrics.discountedPayback],
    ['Breakeven Oil Price ($/bbl)', deterministicMetrics.breakevenOilPrice],
    ['Value per BOE', deterministicMetrics.valuePerBoe],
    ['EBITDA Margin (%)', deterministicMetrics.ebitdaMargin],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: Cash Flow
  const cfHeaders = [
    'Year', 'Oil Prod (bbl)', 'Gas Prod (Mcf)', 'Oil Revenue ($)', 'Gas Revenue ($)',
    'Gross Revenue ($)', 'Royalty ($)', 'OIDB Cess ($)', 'Net Revenue ($)',
    'Opex ($)', 'EBITDA ($)', 'Capex ($)', 'Depreciation ($)', 'Corporate Tax ($)',
    'Free Cash Flow ($)', 'Project CF ($)', 'Cumulative CF ($)',
    'Discount Factor', 'Discounted CF ($)', 'Cumulative DCF ($)'
  ];

  const cfData: any[][] = [cfHeaders];
  for (const cf of cashFlows) {
    cfData.push([
      cf.year + 1,
      Math.round(cf.oilProduction),
      Math.round(cf.gasProduction),
      Math.round(cf.oilRevenue),
      Math.round(cf.gasRevenue),
      Math.round(cf.grossRevenue),
      Math.round(cf.royalty),
      Math.round(cf.oidbCess),
      Math.round(cf.netRevenue),
      Math.round(cf.opex),
      Math.round(cf.ebitda),
      Math.round(cf.capex),
      Math.round(cf.depreciation),
      Math.round(cf.corporateTax),
      Math.round(cf.freeCashFlow),
      Math.round(cf.projectCashFlow),
      Math.round(cf.cumulativeCashFlow),
      Math.round(cf.discountFactor * 10000) / 10000,
      Math.round(cf.discountedCashFlow),
      Math.round(cf.cumulativeDcf),
    ]);
  }

  const wsCF = XLSX.utils.aoa_to_sheet(cfData);
  wsCF['!cols'] = cfHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsCF, 'Cash Flow');

  // Sheet 3: Formulas
  const formulaHeaders = [
    'Year', 'Oil Prod', 'Gas Prod', 'Oil Revenue', 'Gas Revenue',
    'Gross Revenue', 'Royalty', 'Net Revenue', 'Opex', 'EBITDA',
    'Depreciation', 'Taxable Income', 'Corporate Tax', 'Free Cash Flow',
    'Discount Factor', 'Discounted CF'
  ];

  const formulaData: any[][] = [formulaHeaders];
  for (const cf of cashFlows) {
    formulaData.push([
      cf.year + 1,
      cf.formulas.oilProduction,
      cf.formulas.gasProduction,
      cf.formulas.oilRevenue,
      cf.formulas.gasRevenue,
      cf.formulas.grossRevenue,
      cf.formulas.royalty,
      cf.formulas.netRevenue,
      cf.formulas.opex,
      cf.formulas.ebitda,
      cf.formulas.depreciation,
      cf.formulas.taxableIncome,
      cf.formulas.corporateTax,
      cf.formulas.freeCashFlow,
      cf.formulas.discountFactor,
      cf.formulas.discountedCashFlow,
    ]);
  }

  const wsFormulas = XLSX.utils.aoa_to_sheet(formulaData);
  wsFormulas['!cols'] = formulaHeaders.map(() => ({ wch: 40 }));
  XLSX.utils.book_append_sheet(wb, wsFormulas, 'Formulas (Audit)');

  // Sheet 4: Input Assumptions
  const inputSections: any[][] = [
    ['PRODUCTION ASSUMPTIONS'],
    ['Parameter', 'P10', 'P50', 'P90', 'Distribution'],
    ['Oil Rate (bopd)', inputs.production.oil.p10, inputs.production.oil.p50, inputs.production.oil.p90, inputs.production.oil.distribution],
    ['Decline Rate (%/yr)', inputs.production.declineRate.p10, inputs.production.declineRate.p50, inputs.production.declineRate.p90, inputs.production.declineRate.distribution],
    ['Recovery Factor', inputs.production.recoveryFactor.p10, inputs.production.recoveryFactor.p50, inputs.production.recoveryFactor.p90, inputs.production.recoveryFactor.distribution],
    ['GOR (scf/bbl)', inputs.production.gor],
    ['WOR (bbl/bbl)', inputs.production.wor],
    ['Plateau Years', inputs.production.plateauYears],
    ['Decline Type', inputs.production.declineType],
    [''],
    ['PRICE ASSUMPTIONS'],
    ['Commodity', 'Base', 'Escalation %/yr', 'Std Dev %', 'Distribution'],
    ['Oil ($/bbl)', inputs.prices.oil.base, inputs.prices.oil.escalation, inputs.prices.oil.stdDev, inputs.prices.oil.distribution],
    ['Gas ($/Mcf)', inputs.prices.gas.base, inputs.prices.gas.escalation, inputs.prices.gas.stdDev, inputs.prices.gas.distribution],
    ['NGL ($/bbl)', inputs.prices.ngl.base, inputs.prices.ngl.escalation, inputs.prices.ngl.stdDev, inputs.prices.ngl.distribution],
    [''],
    ['CAPEX ASSUMPTIONS'],
    ['Category', 'Amount ($)', 'Std Dev %'],
    ['Exploration', inputs.capex.exploration, inputs.capex.totalCapexStdDev],
    ['Drilling', inputs.capex.drilling],
    ['Facilities', inputs.capex.facilities],
    ['Pipelines', inputs.capex.pipelines],
    ['Workovers', inputs.capex.workovers],
    ['Abandonment', inputs.capex.abandonment],
    ['Decommissioning', inputs.capex.decommissioning],
    ['Contingency', inputs.capex.contingency],
    [''],
    ['OPEX ASSUMPTIONS'],
    ['Category', 'Base Value', 'Escalation %/yr', 'Std Dev %'],
    ['Fixed Opex ($/yr)', inputs.opex.fixedOpex, inputs.opex.inflationRate, inputs.opex.totalOpexStdDev],
    ['Variable Opex ($/bbl)', inputs.opex.variableOpex],
    ['Transportation ($/bbl)', inputs.opex.transportation],
    ['Carbon Cost ($/bbl)', inputs.opex.carbonCost],
    [''],
    ['FISCAL REGIME'],
    ['Parameter', 'Value', 'Unit'],
    ['Royalty Rate', inputs.fiscal.royaltyRate, '%'],
    ['OIDB Cess', inputs.fiscal.oidbCess, '%'],
    ['Corporate Tax Rate', inputs.fiscal.corporateTaxRate, '%'],
    ['Tax Holiday', inputs.fiscal.taxHolidayYears, 'years'],
    ['Depreciation Method', inputs.fiscal.depreciationMethod],
    ['Depreciation Years', inputs.fiscal.depreciationYears, 'years'],
    ['WDV Rate', inputs.fiscal.wdvRate, '%'],
  ];

  const wsInputs = XLSX.utils.aoa_to_sheet(inputSections);
  wsInputs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsInputs, 'Input Assumptions');

  // Sheet 5: Tornado
  const tornadoSheet: any[][] = [
    ['TORNADO ANALYSIS - Sensitivity Ranking'],
    [''],
    ['Parameter', 'Low NPV ($)', 'High NPV ($)', 'Swing ($)', '% Change', 'Rank'],
  ];
  
  tornadoData.forEach((item, idx) => {
    tornadoSheet.push([
      item.parameter,
      Math.round(item.lowValue),
      Math.round(item.highValue),
      Math.round(item.impact),
      `${item.percentChange}%`,
      idx + 1,
    ]);
  });

  const wsTornado = XLSX.utils.aoa_to_sheet(tornadoSheet);
  wsTornado['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, wsTornado, 'Tornado Analysis');

  // Sheet 6: NPV Distribution
  const binCount = 50;
  const min = Math.min(...result.npvValues);
  const max = Math.max(...result.npvValues);
  const binWidth = (max - min) / binCount;
  
  const distData: any[][] = [['Bin Start ($M)', 'Bin End ($M)', 'Count', 'Frequency (%)']];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = result.npvValues.filter(v => v >= binStart && v < binEnd).length;
    distData.push([
      Math.round(binStart / 1e6 * 100) / 100,
      Math.round(binEnd / 1e6 * 100) / 100,
      count,
      Math.round(count / result.npvValues.length * 10000) / 100,
    ]);
  }

  const wsDist = XLSX.utils.aoa_to_sheet(distData);
  wsDist['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDist, 'NPV Distribution');

  XLSX.writeFile(wb, `EP_Enterprise_NPV_MonteCarlo_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
