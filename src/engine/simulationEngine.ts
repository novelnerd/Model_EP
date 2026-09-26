import { SimulationInputs, SimulationResult, YearlyCashFlow, CashFlowWithFormulas, TornadoItem } from '../types';

// Box-Muller transform for normal distribution
function gaussianRandom(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z * stdDev + mean;
}

// Calculate production for a given year
function calculateProduction(inputs: SimulationInputs, year: number): number {
  const { initialRate, declineRate, declineType, hyperbolicExponent, minRate } = inputs.production;
  const d = declineRate / 100;
  
  let rate: number;
  switch (declineType) {
    case 'exponential':
      rate = initialRate * Math.exp(-d * year);
      break;
    case 'hyperbolic':
      rate = initialRate / Math.pow(1 + d * hyperbolicExponent * year, 1 / hyperbolicExponent);
      break;
    case 'harmonic':
      rate = initialRate / (1 + d * year);
      break;
    default:
      rate = initialRate * Math.exp(-d * year);
  }
  
  return Math.max(rate, minRate);
}

// Generate random price with lognormal distribution
function randomPrice(basePrice: number, stdDevPct: number, escalation: number, year: number): number {
  const escalatedPrice = basePrice * Math.pow(1 + escalation / 100, year);
  const randomFactor = gaussianRandom(1, stdDevPct / 100);
  return Math.max(0, escalatedPrice * randomFactor);
}

// Calculate yearly cash flow
function calculateYearlyCashFlow(
  inputs: SimulationInputs,
  year: number,
  priceOverrides?: { oilPrice?: number; gasPrice?: number; nglPrice?: number; opex?: number; capex?: number }
): YearlyCashFlow {
  const { prices, costs, capex, fiscal } = inputs;
  
  // Production
  const startRate = calculateProduction(inputs, year);
  const endRate = calculateProduction(inputs, year + 1);
  const avgRate = (startRate + endRate) / 2;
  const annualProduction = avgRate * 365;
  
  // Prices (with optional overrides for tornado)
  const oilPrice = priceOverrides?.oilPrice ?? randomPrice(prices.oilPrice, 0, prices.oilEscalation, year);
  const gasPrice = priceOverrides?.gasPrice ?? randomPrice(prices.gasPrice, 0, prices.gasEscalation, year);
  const nglPrice = priceOverrides?.nglPrice ?? randomPrice(prices.nglPrice, 0, prices.nglEscalation, year);
  
  // Revenue split (oil/gas/NGL)
  const gasProduction = annualProduction * prices.oilGasRatio; // Mcf
  const nglProduction = annualProduction * prices.nglRatio; // bbl
  const oilProduction = annualProduction * (1 - prices.oilGasRatio - prices.nglRatio);
  
  const oilRevenue = oilProduction * oilPrice;
  const gasRevenue = gasProduction * gasPrice;
  const nglRevenue = nglProduction * nglPrice;
  const grossRevenue = oilRevenue + gasRevenue + nglRevenue;
  
  // Royalties
  const royalty = grossRevenue * (fiscal.royaltyRate / 100);
  const netRevenue = grossRevenue - royalty;
  
  // Operating costs
  const opex = priceOverrides?.opex ?? 
    (annualProduction * (costs.opexPerBarrel * Math.pow(1 + costs.opexEscalation / 100, year)) + costs.fixedOpex * 12);
  const transportation = annualProduction * costs.transportationCost;
  const severanceTax = netRevenue * (costs.severanceTaxRate / 100);
  const adValoremTax = grossRevenue * (costs.adValoremTaxRate / 100);
  
  // EBITDA
  const ebitda = netRevenue - opex - transportation - severanceTax - adValoremTax;
  
  // Capital expenditure
  let yearlyCapex = 0;
  if (year === 0) {
    yearlyCapex = priceOverrides?.capex ?? capex.initialCapex;
  }
  if (inputs.capex.workoverFrequency > 0 && year % inputs.capex.workoverFrequency === 0 && year > 0) {
    yearlyCapex += capex.workoverCapex;
  }
  if (year === inputs.simulationYears - 1) {
    yearlyCapex += capex.abandonmentCost - capex.salvageValue;
  }
  
  // Depreciation
  const depreciation = fiscal.depreciationMethod === 'straight_line'
    ? capex.initialCapex / fiscal.depreciationYears
    : (capex.initialCapex / annualProduction) * annualProduction;
  
  // Taxes
  const taxableIncome = Math.max(0, ebitda - depreciation) * (fiscal.workingInterest / 100);
  const incomeTax = taxableIncome * (fiscal.incomeTaxRate / 100);
  
  // Net cash flow
  const netCashFlow = (ebitda - incomeTax) * (fiscal.netRevenueInterest / 100) - yearlyCapex * (fiscal.workingInterest / 100);
  
  // Discounting
  const discountFactor = 1 / Math.pow(1 + fiscal.discountRate / 100, year + 1);
  const discountedCashFlow = netCashFlow * discountFactor;
  
  return {
    year,
    productionRate: avgRate,
    annualProduction,
    oilRevenue,
    gasRevenue,
    nglRevenue,
    grossRevenue,
    royalty,
    netRevenue,
    opex,
    transportation,
    severanceTax,
    adValoremTax,
    ebitda,
    capex: yearlyCapex,
    depreciation,
    taxableIncome,
    incomeTax,
    netCashFlow,
    cumulativeCashFlow: 0, // calculated later
    discountFactor,
    discountedCashFlow,
    cumulativeDiscountedCF: 0, // calculated later
  };
}

// Calculate IRR using Newton-Raphson
function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1;
  const maxIter = 100;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    
    if (Math.abs(dnpv) < 1e-10) break;
    
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate * 100;
    rate = newRate;
  }
  
  return rate * 100;
}

// Calculate payback period
function calculatePaybackPeriod(cashFlows: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0) {
      if (i === 0) return 0;
      const prevCumulative = cumulative - cashFlows[i];
      return i - 1 + (-prevCumulative / cashFlows[i]);
    }
  }
  return -1; // Never pays back
}

// Generate formula strings for audit trail
function generateFormulas(year: number, inputs: SimulationInputs): Record<string, string> {
  const { prices, costs, capex, fiscal } = inputs;
  const row = year + 2; // Excel row (1-indexed, +1 for header)
  const prevRow = row - 1;
  
  return {
    productionRate: `=Initial_Rate * EXP(-Decline_Rate * ${year})`,
    annualProduction: `=C${row} * 365`,
    oilRevenue: `=D${row} * Oil_Fraction * Oil_Price * (1+${prices.oilEscalation}%)^${year}`,
    gasRevenue: `=D${row} * Gas_Fraction * Gas_Price * (1+${prices.gasEscalation}%)^${year}`,
    nglRevenue: `=D${row} * NGL_Fraction * NGL_Price * (1+${prices.nglEscalation}%)^${year}`,
    grossRevenue: `=SUM(E${row}:G${row})`,
    royalty: `=H${row} * ${fiscal.royaltyRate}%`,
    netRevenue: `=H${row} - I${row}`,
    opex: `=D${row} * ${costs.opexPerBarrel} * (1+${costs.opexEscalation}%)^${year} + ${costs.fixedOpex}*12`,
    transportation: `=D${row} * ${costs.transportationCost}`,
    severanceTax: `=J${row} * ${costs.severanceTaxRate}%`,
    adValoremTax: `=H${row} * ${costs.adValoremTaxRate}%`,
    ebitda: `=J${row} - SUM(K${row}:N${row})`,
    capex: year === 0 ? `=${capex.initialCapex}` : (year % capex.workoverFrequency === 0 ? `=${capex.workoverCapex}` : `=0`),
    depreciation: `=${capex.initialCapex} / ${fiscal.depreciationYears}`,
    taxableIncome: `=MAX(0, O${row} - P${row}) * ${fiscal.workingInterest}%`,
    incomeTax: `=Q${row} * ${fiscal.incomeTaxRate}%`,
    netCashFlow: `=(O${row} - R${row}) * ${fiscal.netRevenueInterest}% - S${row} * ${fiscal.workingInterest}%`,
    cumulativeCashFlow: year === 0 ? `=T${row}` : `=${`U${prevRow}`} + T${row}`,
    discountFactor: `=1/(1+${fiscal.discountRate}%)^${year + 1}`,
    discountedCashFlow: `=T${row} * V${row}`,
    cumulativeDiscountedCF: year === 0 ? `=W${row}` : `=${`X${prevRow}`} + W${row}`,
  };
}

// Run single simulation iteration
function runSingleIteration(inputs: SimulationInputs): { npv: number; irr: number; payback: number; cashFlows: YearlyCashFlow[] } {
  const cashFlows: YearlyCashFlow[] = [];
  let cumulativeCF = 0;
  let cumulativeDCF = 0;
  
  for (let year = 0; year < inputs.simulationYears; year++) {
    const cf = calculateYearlyCashFlow(inputs, year);
    cumulativeCF += cf.netCashFlow;
    cumulativeDCF += cf.discountedCashFlow;
    cf.cumulativeCashFlow = cumulativeCF;
    cf.cumulativeDiscountedCF = cumulativeDCF;
    cashFlows.push(cf);
  }
  
  const npv = cumulativeDCF;
  const irrCashFlows = [-inputs.capex.initialCapex, ...cashFlows.map(cf => cf.netCashFlow)];
  const irr = calculateIRR(irrCashFlows);
  const payback = calculatePaybackPeriod(cashFlows.map(cf => cf.netCashFlow));
  
  return { npv, irr, payback, cashFlows };
}

// Tornado analysis
function runTornadoAnalysis(inputs: SimulationInputs): TornadoItem[] {
  const baseResult = runSingleIteration(inputs);
  const baseNPV = baseResult.npv;
  
  const parameters = [
    { name: 'Oil Price', key: 'oilPrice', range: 0.2 },
    { name: 'Gas Price', key: 'gasPrice', range: 0.2 },
    { name: 'Initial Production', key: 'initialRate', range: 0.2 },
    { name: 'Decline Rate', key: 'declineRate', range: 0.15 },
    { name: 'Opex/boe', key: 'opexPerBarrel', range: 0.2 },
    { name: 'Initial Capex', key: 'initialCapex', range: 0.2 },
    { name: 'Discount Rate', key: 'discountRate', range: 0.15 },
    { name: 'Royalty Rate', key: 'royaltyRate', range: 0.1 },
    { name: 'Tax Rate', key: 'incomeTaxRate', range: 0.1 },
    { name: 'WI/NRI', key: 'netRevenueInterest', range: 0.1 },
  ];
  
  const tornado: TornadoItem[] = [];
  
  for (const param of parameters) {
    const lowInputs = JSON.parse(JSON.stringify(inputs));
    const highInputs = JSON.parse(JSON.stringify(inputs));
    
    // Navigate to correct nested property
    let baseValue: number;
    if (param.key in inputs.prices) {
      baseValue = (inputs.prices as any)[param.key];
      (lowInputs.prices as any)[param.key] = baseValue * (1 - param.range);
      (highInputs.prices as any)[param.key] = baseValue * (1 + param.range);
    } else if (param.key in inputs.production) {
      baseValue = (inputs.production as any)[param.key];
      (lowInputs.production as any)[param.key] = baseValue * (1 - param.range);
      (highInputs.production as any)[param.key] = baseValue * (1 + param.range);
    } else if (param.key in inputs.costs) {
      baseValue = (inputs.costs as any)[param.key];
      (lowInputs.costs as any)[param.key] = baseValue * (1 + param.range);
      (highInputs.costs as any)[param.key] = baseValue * (1 - param.range);
    } else if (param.key in inputs.capex) {
      baseValue = (inputs.capex as any)[param.key];
      (lowInputs.capex as any)[param.key] = baseValue * (1 + param.range);
      (highInputs.capex as any)[param.key] = baseValue * (1 - param.range);
    } else if (param.key in inputs.fiscal) {
      baseValue = (inputs.fiscal as any)[param.key];
      (lowInputs.fiscal as any)[param.key] = baseValue * (1 + param.range);
      (highInputs.fiscal as any)[param.key] = baseValue * (1 - param.range);
    }
    
    const lowResult = runSingleIteration(lowInputs);
    const highResult = runSingleIteration(highInputs);
    
    tornado.push({
      parameter: param.name,
      lowValue: lowResult.npv,
      highValue: highResult.npv,
      impact: highResult.npv - lowResult.npv,
    });
  }
  
  return tornado.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

// Main simulation function
export function runMonteCarlo(inputs: SimulationInputs): SimulationResult {
  const npvValues: number[] = [];
  const irrValues: number[] = [];
  const paybackPeriods: number[] = [];
  
  for (let i = 0; i < inputs.numIterations; i++) {
    const result = runSingleIteration(inputs);
    npvValues.push(result.npv);
    irrValues.push(result.irr);
    paybackPeriods.push(result.payback);
  }
  
  // Statistics
  npvValues.sort((a, b) => a - b);
  const meanNPV = npvValues.reduce((a, b) => a + b, 0) / npvValues.length;
  const medianNPV = npvValues[Math.floor(npvValues.length / 2)];
  const variance = npvValues.reduce((sum, val) => sum + Math.pow(val - meanNPV, 2), 0) / npvValues.length;
  const stdDevNPV = Math.sqrt(variance);
  
  const p10Index = Math.floor(npvValues.length * 0.1);
  const p50Index = Math.floor(npvValues.length * 0.5);
  const p90Index = Math.floor(npvValues.length * 0.9);
  
  const probabilityOfLoss = (npvValues.filter(v => v < 0).length / npvValues.length) * 100;
  
  // Deterministic cash flow (base case)
  const deterministicCashFlows: YearlyCashFlow[] = [];
  let cumCF = 0;
  let cumDCF = 0;
  
  for (let year = 0; year < inputs.simulationYears; year++) {
    const cf = calculateYearlyCashFlow(inputs, year);
    cumCF += cf.netCashFlow;
    cumDCF += cf.discountedCashFlow;
    cf.cumulativeCashFlow = cumCF;
    cf.cumulativeDiscountedCF = cumDCF;
    deterministicCashFlows.push(cf);
  }
  
  // Cash flows with formulas
  const cashFlowsWithFormulas: CashFlowWithFormulas[] = deterministicCashFlows.map(cf => ({
    ...cf,
    formulas: generateFormulas(cf.year, inputs),
  }));
  
  // Tornado analysis
  const tornadoData = runTornadoAnalysis(inputs);
  
  return {
    npvValues,
    irrValues,
    paybackPeriods,
    meanNPV,
    medianNPV,
    stdDevNPV,
    p10NPV: npvValues[p10Index],
    p50NPV: npvValues[p50Index],
    p90NPV: npvValues[p90Index],
    probabilityOfLoss,
    cashFlows: deterministicCashFlows,
    cashFlowsWithFormulas,
    inputs,
    tornadoData,
  };
}
