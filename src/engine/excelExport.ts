import * as XLSX from 'xlsx';
import { SimulationResult, SimulationInputs } from '../types';

export function exportToExcel(result: SimulationResult) {
  const wb = XLSX.utils.book_new();
  const { inputs, cashFlows, cashFlowsWithFormulas } = result;

  // Sheet 1: Summary
  const summaryData = [
    ['E&P Monte Carlo NPV Simulation - Summary Report'],
    [''],
    ['Simulation Parameters'],
    ['Number of Iterations', inputs.numIterations],
    ['Simulation Period (Years)', inputs.simulationYears],
    [''],
    ['NPV Results (Monte Carlo)'],
    ['Mean NPV', result.meanNPV],
    ['Median NPV (P50)', result.medianNPV],
    ['Standard Deviation', result.stdDevNPV],
    ['P10 NPV (Upside)', result.p10NPV],
    ['P50 NPV (Base Case)', result.p50NPV],
    ['P90 NPV (Downside)', result.p90NPV],
    ['Probability of Loss (%)', result.probabilityOfLoss],
    [''],
    ['Key Input Assumptions'],
    ['Initial Production Rate (boe/d)', inputs.production.initialRate],
    ['Decline Rate (%)', inputs.production.declineRate],
    ['Decline Type', inputs.production.declineType],
    ['Oil Price ($/bbl)', inputs.prices.oilPrice],
    ['Gas Price ($/Mcf)', inputs.prices.gasPrice],
    ['NGL Price ($/bbl)', inputs.prices.nglPrice],
    ['Opex ($/boe)', inputs.costs.opexPerBarrel],
    ['Initial Capex ($)', inputs.capex.initialCapex],
    ['Discount Rate / WACC (%)', inputs.fiscal.discountRate],
    ['Royalty Rate (%)', inputs.fiscal.royaltyRate],
    ['Income Tax Rate (%)', inputs.fiscal.incomeTaxRate],
    ['Working Interest (%)', inputs.fiscal.workingInterest],
    ['Net Revenue Interest (%)', inputs.fiscal.netRevenueInterest],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Cash Flow (Values)
  const cfHeaders = [
    'Year', 'Prod Rate (boe/d)', 'Annual Prod (boe)', 'Oil Revenue ($)', 'Gas Revenue ($)',
    'NGL Revenue ($)', 'Gross Revenue ($)', 'Royalty ($)', 'Net Revenue ($)',
    'Opex ($)', 'Transportation ($)', 'Severance Tax ($)', 'Ad Valorem Tax ($)',
    'EBITDA ($)', 'Capex ($)', 'Depreciation ($)', 'Taxable Income ($)',
    'Income Tax ($)', 'Net Cash Flow ($)', 'Cumulative CF ($)',
    'Discount Factor', 'Discounted CF ($)', 'Cumulative DCF ($)'
  ];

  const cfData: any[][] = [cfHeaders];
  for (const cf of cashFlows) {
    cfData.push([
      cf.year + 1,
      Math.round(cf.productionRate * 100) / 100,
      Math.round(cf.annualProduction),
      Math.round(cf.oilRevenue),
      Math.round(cf.gasRevenue),
      Math.round(cf.nglRevenue),
      Math.round(cf.grossRevenue),
      Math.round(cf.royalty),
      Math.round(cf.netRevenue),
      Math.round(cf.opex),
      Math.round(cf.transportation),
      Math.round(cf.severanceTax),
      Math.round(cf.adValoremTax),
      Math.round(cf.ebitda),
      Math.round(cf.capex),
      Math.round(cf.depreciation),
      Math.round(cf.taxableIncome),
      Math.round(cf.incomeTax),
      Math.round(cf.netCashFlow),
      Math.round(cf.cumulativeCashFlow),
      Math.round(cf.discountFactor * 10000) / 10000,
      Math.round(cf.discountedCashFlow),
      Math.round(cf.cumulativeDiscountedCF),
    ]);
  }

  const wsCF = XLSX.utils.aoa_to_sheet(cfData);
  wsCF['!cols'] = cfHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsCF, 'Cash Flow');

  // Sheet 3: Formulas (Audit Trail)
  const formulaHeaders = [
    'Year', 'Prod Rate Formula', 'Annual Prod Formula', 'Oil Revenue Formula', 'Gas Revenue Formula',
    'NGL Revenue Formula', 'Gross Revenue Formula', 'Royalty Formula', 'Net Revenue Formula',
    'Opex Formula', 'Transportation Formula', 'Sev Tax Formula', 'Ad Val Tax Formula',
    'EBITDA Formula', 'Capex Formula', 'Depreciation Formula', 'Taxable Income Formula',
    'Income Tax Formula', 'Net Cash Flow Formula', 'Cumulative CF Formula',
    'Discount Factor Formula', 'Discounted CF Formula', 'Cumulative DCF Formula'
  ];

  const formulaData: any[][] = [formulaHeaders];
  for (const cf of cashFlowsWithFormulas) {
    formulaData.push([
      cf.year + 1,
      cf.formulas.productionRate,
      cf.formulas.annualProduction,
      cf.formulas.oilRevenue,
      cf.formulas.gasRevenue,
      cf.formulas.nglRevenue,
      cf.formulas.grossRevenue,
      cf.formulas.royalty,
      cf.formulas.netRevenue,
      cf.formulas.opex,
      cf.formulas.transportation,
      cf.formulas.severanceTax,
      cf.formulas.adValoremTax,
      cf.formulas.ebitda,
      cf.formulas.capex,
      cf.formulas.depreciation,
      cf.formulas.taxableIncome,
      cf.formulas.incomeTax,
      cf.formulas.netCashFlow,
      cf.formulas.cumulativeCashFlow,
      cf.formulas.discountFactor,
      cf.formulas.discountedCashFlow,
      cf.formulas.cumulativeDiscountedCF,
    ]);
  }

  const wsFormulas = XLSX.utils.aoa_to_sheet(formulaData);
  wsFormulas['!cols'] = formulaHeaders.map(() => ({ wch: 40 }));
  XLSX.utils.book_append_sheet(wb, wsFormulas, 'Formulas (Audit)');

  // Sheet 4: Input Assumptions
  const inputSections = [
    ['PRODUCTION ASSUMPTIONS'],
    ['Parameter', 'Value', 'Unit'],
    ['Initial Rate', inputs.production.initialRate, 'boe/day'],
    ['Decline Rate', inputs.production.declineRate, '%/year'],
    ['Decline Type', inputs.production.declineType, ''],
    ['Hyperbolic Exponent', inputs.production.hyperbolicExponent, ''],
    ['Economic Limit', inputs.production.minRate, 'boe/day'],
    [''],
    ['PRICE ASSUMPTIONS'],
    ['Parameter', 'Value', 'Std Dev %', 'Escalation %/yr'],
    ['Oil Price', inputs.prices.oilPrice, inputs.prices.oilPriceStdDev, inputs.prices.oilEscalation],
    ['Gas Price', inputs.prices.gasPrice, inputs.prices.gasPriceStdDev, inputs.prices.gasEscalation],
    ['NGL Price', inputs.prices.nglPrice, inputs.prices.nglPriceStdDev, inputs.prices.nglEscalation],
    ['Oil/Gas Ratio', inputs.prices.oilGasRatio, '', ''],
    ['NGL Ratio', inputs.prices.nglRatio, '', ''],
    [''],
    ['COST ASSUMPTIONS'],
    ['Parameter', 'Value', 'Std Dev %', 'Escalation %/yr'],
    ['Opex', inputs.costs.opexPerBarrel, inputs.costs.opexStdDev, inputs.costs.opexEscalation],
    ['Fixed Opex', inputs.costs.fixedOpex, '', ''],
    ['Transportation', inputs.costs.transportationCost, '', ''],
    ['Severance Tax Rate', inputs.costs.severanceTaxRate, '', ''],
    ['Ad Valorem Tax Rate', inputs.costs.adValoremTaxRate, '', ''],
    [''],
    ['CAPEX ASSUMPTIONS'],
    ['Parameter', 'Value', 'Std Dev %'],
    ['Initial Capex', inputs.capex.initialCapex, inputs.capex.capexStdDev],
    ['Workover Capex', inputs.capex.workoverCapex, ''],
    ['Workover Frequency', inputs.capex.workoverFrequency, 'years'],
    ['Abandonment Cost', inputs.capex.abandonmentCost, ''],
    ['Salvage Value', inputs.capex.salvageValue, ''],
    [''],
    ['FISCAL REGIME'],
    ['Parameter', 'Value', 'Unit'],
    ['Discount Rate (WACC)', inputs.fiscal.discountRate, '%'],
    ['Income Tax Rate', inputs.fiscal.incomeTaxRate, '%'],
    ['Royalty Rate', inputs.fiscal.royaltyRate, '%'],
    ['Depreciation Method', inputs.fiscal.depreciationMethod, ''],
    ['Depreciation Years', inputs.fiscal.depreciationYears, 'years'],
    ['Working Interest', inputs.fiscal.workingInterest, '%'],
    ['Net Revenue Interest', inputs.fiscal.netRevenueInterest, '%'],
  ];

  const wsInputs = XLSX.utils.aoa_to_sheet(inputSections);
  wsInputs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsInputs, 'Input Assumptions');

  // Sheet 5: Tornado Analysis
  const tornadoData: any[][] = [
    ['TORNADO ANALYSIS - Sensitivity Ranking'],
    [''],
    ['Parameter', 'Low NPV ($)', 'High NPV ($)', 'Swing ($)', 'Rank'],
  ];
  
  result.tornadoData.forEach((item, idx) => {
    tornadoData.push([
      item.parameter,
      Math.round(item.lowValue),
      Math.round(item.highValue),
      Math.round(item.impact),
      idx + 1,
    ]);
  });

  const wsTornado = XLSX.utils.aoa_to_sheet(tornadoData);
  wsTornado['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 8 }];
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
      Math.round(binStart / 1000000 * 100) / 100,
      Math.round(binEnd / 1000000 * 100) / 100,
      count,
      Math.round(count / result.npvValues.length * 10000) / 100,
    ]);
  }

  const wsDist = XLSX.utils.aoa_to_sheet(distData);
  wsDist['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDist, 'NPV Distribution');

  // Generate file
  XLSX.writeFile(wb, `EP_NPV_MonteCarlo_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportFormulasOnly(result: SimulationResult) {
  const { cashFlowsWithFormulas, inputs } = result;
  
  // Create a workbook with actual Excel formulas
  const wb = XLSX.utils.book_new();
  
  // Build formula-based sheet
  const headers = [
    'Year', 'Prod Rate (boe/d)', 'Annual Prod (boe)', 'Oil Revenue ($)', 'Gas Revenue ($)',
    'NGL Revenue ($)', 'Gross Revenue ($)', 'Royalty ($)', 'Net Revenue ($)',
    'Opex ($)', 'Transportation ($)', 'Severance Tax ($)', 'Ad Valorem Tax ($)',
    'EBITDA ($)', 'Capex ($)', 'Depreciation ($)', 'Taxable Income ($)',
    'Income Tax ($)', 'Net Cash Flow ($)', 'Cumulative CF ($)',
    'Discount Factor', 'Discounted CF ($)', 'Cumulative DCF ($)'
  ];

  const data: any[][] = [headers];
  
  for (let i = 0; i < cashFlowsWithFormulas.length; i++) {
    const cf = cashFlowsWithFormulas[i];
    const row = i + 2; // Excel row (1-indexed, +1 for header)
    const prevRow = row - 1;
    
    data.push([
      cf.year + 1,
      { f: cf.formulas.productionRate },
      { f: cf.formulas.annualProduction },
      { f: cf.formulas.oilRevenue },
      { f: cf.formulas.gasRevenue },
      { f: cf.formulas.nglRevenue },
      { f: cf.formulas.grossRevenue },
      { f: cf.formulas.royalty },
      { f: cf.formulas.netRevenue },
      { f: cf.formulas.opex },
      { f: cf.formulas.transportation },
      { f: cf.formulas.severanceTax },
      { f: cf.formulas.adValoremTax },
      { f: cf.formulas.ebitda },
      { f: cf.formulas.capex },
      { f: cf.formulas.depreciation },
      { f: cf.formulas.taxableIncome },
      { f: cf.formulas.incomeTax },
      { f: cf.formulas.netCashFlow },
      { f: cf.formulas.cumulativeCashFlow },
      { f: cf.formulas.discountFactor },
      { f: cf.formulas.discountedCashFlow },
      { f: cf.formulas.cumulativeDiscountedCF },
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'DCF Model (Formulas)');
  
  XLSX.writeFile(wb, `EP_DCF_Formulas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
