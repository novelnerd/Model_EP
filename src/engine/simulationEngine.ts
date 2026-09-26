import {
  SimulationInputs, SimulationResult, YearlyCashFlow, EconomicMetrics, RiskMetrics,
  TornadoItem, SpiderItem, HeatmapCell, FiscalRegime, UncertaintyInput
} from '../types';

// Random sampling functions
function gaussianRandom(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z * stdDev + mean;
}

function triangularRandom(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function pertRandom(min: number, mode: number, max: number): number {
  const alpha = 1 + 4 * (mode - min) / (max - min);
  const beta = 1 + 4 * (max - mode) / (max - min);
  // Beta distribution approximation
  const x = gammaRandom(alpha) / (gammaRandom(alpha) + gammaRandom(beta));
  return min + x * (max - min);
}

function gammaRandom(shape: number): number {
  if (shape < 1) {
    return gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number, v: number;
    do {
      x = gaussianRandom(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleFromDistribution(input: UncertaintyInput): number {
  const { p10, p50, p90, distribution } = input;
  const stdDev = (p90 - p10) / 2.56; // approx for normal
  
  switch (distribution) {
    case 'normal':
      return gaussianRandom(p50, stdDev);
    case 'lognormal':
      return Math.exp(gaussianRandom(Math.log(p50), stdDev / p50));
    case 'triangular':
      return triangularRandom(p10, p50, p90);
    case 'uniform':
      return p10 + Math.random() * (p90 - p10);
    case 'pert':
      return pertRandom(p10, p50, p90);
    default:
      return gaussianRandom(p50, stdDev);
  }
}

// Production decline calculation
function calculateProductionRate(inputs: SimulationInputs, year: number): { oil: number; gas: number; total: number } {
  const { production } = inputs;
  const initialOil = production.oil.p50;
  const declineRate = production.declineRate.p50 / 100;
  const plateauYears = production.plateauYears;
  
  let oilRate: number;
  if (year < plateauYears) {
    oilRate = initialOil;
  } else {
    const effectiveYear = year - plateauYears;
    switch (production.declineType) {
      case 'exponential':
        oilRate = initialOil * Math.exp(-declineRate * effectiveYear);
        break;
      case 'hyperbolic':
        oilRate = initialOil / Math.pow(1 + declineRate * production.hyperbolicExponent * effectiveYear, 1 / production.hyperbolicExponent);
        break;
      case 'harmonic':
        oilRate = initialOil / (1 + declineRate * effectiveYear);
        break;
      default:
        oilRate = initialOil * Math.exp(-declineRate * effectiveYear);
    }
  }
  
  oilRate = Math.max(oilRate, production.economicLimit);
  const gasRate = oilRate * production.gor;
  
  return { oil: oilRate, gas: gasRate, total: oilRate + gasRate / 1000 };
}

// Calculate yearly cash flow
function calculateYearlyCashFlow(inputs: SimulationInputs, year: number, isRandom: boolean = false): YearlyCashFlow {
  const { project, production, prices, capex, opex, fiscal } = inputs;
  
  // Production
  const prod = calculateProductionRate(inputs, year);
  const oilProd = prod.oil * 365;
  const gasProd = prod.gas * 365;
  const condensateProd = oilProd * 0.05;
  const nglProd = oilProd * prices.nglRatio;
  const waterProd = oilProd * production.wor;
  
  // Prices
  const oilPrice = isRandom ? sampleFromDistribution({
    p10: prices.oil.base * 0.8, p50: prices.oil.base, p90: prices.oil.base * 1.2,
    distribution: prices.oil.distribution
  }) * Math.pow(1 + prices.oil.escalation / 100, year) : prices.oil.base * Math.pow(1 + prices.oil.escalation / 100, year);
  
  const gasPrice = isRandom ? sampleFromDistribution({
    p10: prices.gas.base * 0.75, p50: prices.gas.base, p90: prices.gas.base * 1.25,
    distribution: prices.gas.distribution
  }) * Math.pow(1 + prices.gas.escalation / 100, year) : prices.gas.base * Math.pow(1 + prices.gas.escalation / 100, year);
  
  const condensatePrice = oilPrice * 0.95;
  const nglPrice = prices.ngl.base * Math.pow(1 + prices.ngl.escalation / 100, year);
  
  // Revenue
  const oilRevenue = oilProd * oilPrice;
  const gasRevenue = gasProd * gasPrice;
  const condensateRevenue = condensateProd * condensatePrice;
  const nglRevenue = nglProd * nglPrice;
  const carbonCreditRevenue = 0; // Simplified
  const grossRevenue = oilRevenue + gasRevenue + condensateRevenue + nglRevenue + carbonCreditRevenue;
  
  // Deductions
  const royalty = grossRevenue * (fiscal.royaltyRate / 100);
  const oidbCess = grossRevenue * (fiscal.oidbCess / 100);
  const revenueShare = grossRevenue * (fiscal.revenueShare / 100);
  const netRevenue = grossRevenue - royalty - oidbCess - revenueShare;
  
  // OPEX
  const totalOpex = isRandom ? 
    (opex.fixedOpex + opex.variableOpex * oilProd) * Math.pow(1 + opex.inflationRate / 100, year) * (1 + gaussianRandom(0, opex.totalOpexStdDev / 100)) :
    (opex.fixedOpex + opex.variableOpex * oilProd) * Math.pow(1 + opex.inflationRate / 100, year);
  
  const transportation = oilProd * opex.transportation;
  const carbonCost = oilProd * opex.carbonCost;
  
  // EBITDA
  const ebitda = netRevenue - totalOpex - transportation - carbonCost;
  const ebitdax = ebitda; // Simplified - would add exploration costs
  
  // CAPEX
  let yearlyCapex = 0;
  if (year === 0) {
    yearlyCapex = isRandom ? 
      capex.items.reduce((sum, item) => sum + item.amount, 0) * (1 + gaussianRandom(0, capex.totalCapexStdDev / 100)) :
      capex.items.reduce((sum, item) => sum + item.amount, 0);
  }
  // Workovers every 5 years
  if (year > 0 && year % 5 === 0) {
    yearlyCapex += capex.workovers;
  }
  // Abandonment in final year
  if (year === project.economicLife - 1) {
    yearlyCapex += capex.abandonment + capex.decommissioning;
  }
  
  // Depreciation
  const totalCapex = capex.items.reduce((sum, item) => sum + item.amount, 0);
  let depreciation = 0;
  switch (fiscal.depreciationMethod) {
    case 'straight_line':
      depreciation = totalCapex / fiscal.depreciationYears;
      break;
    case 'wdv':
      depreciation = totalCapex * (fiscal.wdvRate / 100);
      break;
    case 'units_of_production':
      const totalReserves = oilProd * project.economicLife;
      depreciation = (totalCapex / totalReserves) * oilProd;
      break;
    default:
      depreciation = totalCapex / fiscal.depreciationYears;
  }
  
  // Tax
  let taxableIncome = ebitda - depreciation;
  let lossCarryForward = 0;
  
  // Tax holiday
  if (year < fiscal.taxHolidayYears) {
    taxableIncome = 0;
  }
  
  const corporateTax = Math.max(0, taxableIncome) * (fiscal.corporateTaxRate / 100);
  const deferredTax = fiscal.deferredTax ? depreciation * 0.1 * (fiscal.corporateTaxRate / 100) : 0;
  
  // Cash flows
  const freeCashFlow = ebitda - corporateTax - deferredTax - yearlyCapex;
  const projectCashFlow = freeCashFlow * (project.workingInterest / 100);
  const equityCashFlow = projectCashFlow * (project.netRevenueInterest / 100);
  
  // Discounting
  const discountFactor = 1 / Math.pow(1 + project.discountRate / 100, year + 1);
  const discountedCashFlow = projectCashFlow * discountFactor;
  
  return {
    year,
    period: `Year ${year + 1}`,
    oilProduction: oilProd,
    gasProduction: gasProd,
    condensateProduction: condensateProd,
    nglProduction: nglProd,
    totalProduction: oilProd + gasProd / 1000,
    waterProduction: waterProd,
    oilRevenue,
    gasRevenue,
    condensateRevenue,
    nglRevenue,
    carbonCreditRevenue,
    grossRevenue,
    royalty,
    oidbCess,
    revenueShare,
    netRevenue,
    opex: totalOpex,
    transportation,
    carbonCost,
    ebitda,
    ebitdax,
    depreciation,
    taxableIncome,
    lossCarryForward,
    corporateTax,
    deferredTax,
    freeCashFlow,
    projectCashFlow,
    equityCashFlow,
    capex: yearlyCapex,
    cumulativeCashFlow: 0,
    discountFactor,
    discountedCashFlow,
    cumulativeDcf: 0,
    formulas: generateFormulas(year, inputs),
  };
}

// Generate Excel-compatible formulas
function generateFormulas(year: number, inputs: SimulationInputs): Record<string, string> {
  const { project, fiscal } = inputs;
  const row = year + 2;
  
  return {
    oilProduction: `=Initial_Oil_Rate * (1-Decline_Rate)^(A${row}-Plateau_Years) * 365`,
    gasProduction: `=B${row} * GOR`,
    oilRevenue: `=B${row} * Oil_Price * (1+Oil_Escalation)^A${row}`,
    gasRevenue: `=C${row} * Gas_Price * (1+Gas_Escalation)^A${row}`,
    grossRevenue: `=SUM(E${row}:H${row})`,
    royalty: `=I${row} * ${fiscal.royaltyRate}%`,
    netRevenue: `=I${row} - SUM(J${row}:L${row})`,
    opex: `=Fixed_Opex + Variable_Opex * B${row}`,
    ebitda: `=M${row} - N${row} - O${row} - P${row}`,
    depreciation: `=Total_Capex / ${fiscal.depreciationYears}`,
    taxableIncome: `=MAX(0, R${row} - S${row})`,
    corporateTax: `=T${row} * ${fiscal.corporateTaxRate}%`,
    freeCashFlow: `=R${row} - V${row} - W${row} - Y${row}`,
    discountFactor: `=1/(1+${project.discountRate}%)^(A${row})`,
    discountedCashFlow: `=Z${row} * AA${row}`,
  };
}

// Calculate economic metrics
function calculateEconomicMetrics(cashFlows: YearlyCashFlow[], inputs: SimulationInputs): EconomicMetrics {
  const totalCapex = inputs.capex.items.reduce((sum, item) => sum + item.amount, 0);
  const npv = cashFlows.reduce((sum, cf) => sum + cf.discountedCashFlow, 0);
  const totalProduction = cashFlows.reduce((sum, cf) => sum + cf.totalProduction, 0);
  const totalRevenue = cashFlows.reduce((sum, cf) => sum + cf.grossRevenue, 0);
  const totalOpex = cashFlows.reduce((sum, cf) => sum + cf.opex, 0);
  const totalEbitda = cashFlows.reduce((sum, cf) => sum + cf.ebitda, 0);
  
  // IRR calculation
  const irrCashFlows = [-totalCapex, ...cashFlows.map(cf => cf.projectCashFlow)];
  const irr = calculateIRR(irrCashFlows);
  
  // MIRR
  const mirr = calculateMIRR(irrCashFlows, inputs.project.discountRate / 100, inputs.project.discountRate / 100);
  
  // Payback
  let cumulative = 0;
  let paybackPeriod = -1;
  let discountedPayback = -1;
  let cumDiscounted = 0;
  
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i].projectCashFlow;
    cumDiscounted += cashFlows[i].discountedCashFlow;
    
    if (paybackPeriod < 0 && cumulative >= 0) {
      const prev = cumulative - cashFlows[i].projectCashFlow;
      paybackPeriod = i + (-prev / cashFlows[i].projectCashFlow);
    }
    
    if (discountedPayback < 0 && cumDiscounted >= 0) {
      const prev = cumDiscounted - cashFlows[i].discountedCashFlow;
      discountedPayback = i + (-prev / cashFlows[i].discountedCashFlow);
    }
  }
  
  // Breakeven
  const breakevenOilPrice = totalOpex / (cashFlows.reduce((sum, cf) => sum + cf.oilProduction, 0) * 0.8);
  const breakevenProduction = totalCapex / (cashFlows.reduce((sum, cf) => sum + (cf.ebitda / cf.totalProduction), 0));
  
  return {
    npv,
    irr,
    mirr,
    profitabilityIndex: npv / totalCapex,
    paybackPeriod,
    discountedPayback,
    breakevenOilPrice,
    breakevenGasPrice: breakevenOilPrice * 0.15,
    breakevenProduction,
    valuePerBoe: npv / totalProduction,
    valuePerMscf: npv / (cashFlows.reduce((sum, cf) => sum + cf.gasProduction, 0) / 1000),
    ebitdaMargin: (totalEbitda / totalRevenue) * 100,
    opexPerBoe: totalOpex / totalProduction,
    findingDevelopmentCost: totalCapex / totalProduction,
  };
}

function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 0.0001) return newRate * 100;
    rate = newRate;
  }
  return rate * 100;
}

function calculateMIRR(cashFlows: number[], financeRate: number, reinvestRate: number): number {
  const n = cashFlows.length - 1;
  let pvNegative = 0, fvPositive = 0;
  
  for (let t = 0; t < cashFlows.length; t++) {
    if (cashFlows[t] < 0) pvNegative += cashFlows[t] / Math.pow(1 + financeRate, t);
    else fvPositive += cashFlows[t] * Math.pow(1 + reinvestRate, n - t);
  }
  
  return (Math.pow(-fvPositive / pvNegative, 1 / n) - 1) * 100;
}

// Calculate risk metrics
function calculateRiskMetrics(npvValues: number[], irrValues: number[], paybackPeriods: number[], hurdleRate: number): RiskMetrics {
  const sorted = [...npvValues].sort((a, b) => a - b);
  const mean = npvValues.reduce((a, b) => a + b, 0) / npvValues.length;
  const variance = npvValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / npvValues.length;
  const stdDev = Math.sqrt(variance);
  
  const irrSorted = [...irrValues].sort((a, b) => a - b);
  
  // VaR and CVaR
  const varIndex = Math.floor(npvValues.length * 0.05);
  const valueAtRisk95 = sorted[varIndex];
  const conditionalVaR95 = sorted.slice(0, varIndex).reduce((a, b) => a + b, 0) / varIndex;
  
  // Skewness and Kurtosis
  const skewness = npvValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / npvValues.length;
  const kurtosis = npvValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / npvValues.length - 3;
  
  return {
    meanNpv: mean,
    medianNpv: sorted[Math.floor(sorted.length / 2)],
    stdDevNpv: stdDev,
    p10Npv: sorted[Math.floor(sorted.length * 0.1)],
    p50Npv: sorted[Math.floor(sorted.length * 0.5)],
    p90Npv: sorted[Math.floor(sorted.length * 0.9)],
    meanIrr: irrValues.reduce((a, b) => a + b, 0) / irrValues.length,
    medianIrr: irrSorted[Math.floor(irrSorted.length / 2)],
    p10Irr: irrSorted[Math.floor(irrSorted.length * 0.1)],
    p50Irr: irrSorted[Math.floor(irrSorted.length * 0.5)],
    p90Irr: irrSorted[Math.floor(irrSorted.length * 0.9)],
    probabilityNpvPositive: (npvValues.filter(v => v > 0).length / npvValues.length) * 100,
    probabilityIrrAboveHurdle: (irrValues.filter(v => v > hurdleRate).length / irrValues.length) * 100,
    paybackProbability: (paybackPeriods.filter(p => p > 0 && p < 10).length / paybackPeriods.length) * 100,
    valueAtRisk95,
    conditionalVaR95,
    coefficientOfVariation: (stdDev / Math.abs(mean)) * 100,
    skewness,
    kurtosis,
  };
}

// Tornado analysis
function runTornadoAnalysis(inputs: SimulationInputs): TornadoItem[] {
  const baseCashFlows = [];
  for (let year = 0; year < inputs.project.economicLife; year++) {
    baseCashFlows.push(calculateYearlyCashFlow(inputs, year, false));
  }
  let cumDcf = 0;
  baseCashFlows.forEach(cf => { cumDcf += cf.discountedCashFlow; cf.cumulativeDcf = cumDcf; });
  const baseNpv = cumDcf;
  
  const parameters = [
    { name: 'Oil Price', key: 'prices.oil.base', range: 0.2 },
    { name: 'Gas Price', key: 'prices.gas.base', range: 0.2 },
    { name: 'Initial Production', key: 'production.oil.p50', range: 0.2 },
    { name: 'Decline Rate', key: 'production.declineRate.p50', range: 0.15 },
    { name: 'Total CAPEX', key: 'capex.totalCapex', range: 0.2 },
    { name: 'Total OPEX', key: 'opex.totalOpex', range: 0.2 },
    { name: 'Discount Rate', key: 'project.discountRate', range: 0.15 },
    { name: 'Royalty Rate', key: 'fiscal.royaltyRate', range: 0.1 },
    { name: 'Corporate Tax', key: 'fiscal.corporateTaxRate', range: 0.1 },
    { name: 'Recovery Factor', key: 'production.recoveryFactor.p50', range: 0.15 },
  ];
  
  const tornado: TornadoItem[] = [];
  
  for (const param of parameters) {
    const keys = param.key.split('.');
    
    const getBaseValue = (obj: any, keys: string[]): any => {
      return keys.reduce((o, k) => o?.[k], obj);
    };
    
    const setValue = (obj: any, keys: string[], value: any) => {
      const lastKey = keys.pop()!;
      const target = keys.reduce((o, k) => o[k], obj);
      target[lastKey] = value;
    };
    
    const baseValue = getBaseValue(inputs, [...keys]);
    
    const lowInputs = JSON.parse(JSON.stringify(inputs));
    const highInputs = JSON.parse(JSON.stringify(inputs));
    
    const isCost = param.name.includes('CAPEX') || param.name.includes('OPEX') || param.name.includes('Tax') || param.name.includes('Royalty') || param.name.includes('Decline');
    const lowMult = isCost ? 1 + param.range : 1 - param.range;
    const highMult = isCost ? 1 - param.range : 1 + param.range;
    
    setValue(lowInputs, [...keys], baseValue * lowMult);
    setValue(highInputs, [...keys], baseValue * highMult);
    
    const lowCf = [];
    for (let y = 0; y < inputs.project.economicLife; y++) lowCf.push(calculateYearlyCashFlow(lowInputs, y, false));
    let lowCum = 0; lowCf.forEach(cf => { lowCum += cf.discountedCashFlow; });
    
    const highCf = [];
    for (let y = 0; y < inputs.project.economicLife; y++) highCf.push(calculateYearlyCashFlow(highInputs, y, false));
    let highCum = 0; highCf.forEach(cf => { highCum += cf.discountedCashFlow; });
    
    tornado.push({
      parameter: param.name,
      lowValue: lowCum,
      highValue: highCum,
      impact: highCum - lowCum,
      percentChange: param.range * 100,
    });
  }
  
  return tornado.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

// Spider analysis
function runSpiderAnalysis(inputs: SimulationInputs): SpiderItem[] {
  const parameters = ['Oil Price', 'Gas Price', 'Production', 'CAPEX', 'OPEX', 'Discount Rate'];
  const changes = [-30, -20, -10, 0, 10, 20, 30];
  
  return parameters.map(param => ({
    parameter: param,
    changes: changes.map(pct => ({
      percent: pct,
      npv: 0, // Would calculate actual NPV at each change
    })),
  }));
}

// Heatmap analysis
function runHeatmapAnalysis(inputs: SimulationInputs): HeatmapCell[] {
  const oilPrices = [50, 60, 70, 80, 90, 100];
  const productions = [300, 400, 500, 600, 700];
  
  const cells: HeatmapCell[] = [];
  oilPrices.forEach(oil => {
    productions.forEach(prod => {
      const modInputs = JSON.parse(JSON.stringify(inputs));
      modInputs.prices.oil.base = oil;
      modInputs.production.oil.p50 = prod;
      
      const cfs = [];
      for (let y = 0; y < inputs.project.economicLife; y++) {
        cfs.push(calculateYearlyCashFlow(modInputs, y, false));
      }
      let cumDcf = 0;
      cfs.forEach(cf => { cumDcf += cf.discountedCashFlow; });
      
      cells.push({
        x: `${oil} $/bbl`,
        y: `${prod} bopd`,
        value: cumDcf,
      });
    });
  });
  
  return cells;
}

// Main Monte Carlo simulation
export function runMonteCarlo(inputs: SimulationInputs): SimulationResult {
  const npvValues: number[] = [];
  const irrValues: number[] = [];
  const paybackPeriods: number[] = [];
  
  for (let i = 0; i < inputs.numIterations; i++) {
    const cashFlows: YearlyCashFlow[] = [];
    let cumCF = 0, cumDCF = 0;
    
    for (let year = 0; year < inputs.project.economicLife; year++) {
      const cf = calculateYearlyCashFlow(inputs, year, true);
      cumCF += cf.projectCashFlow;
      cumDCF += cf.discountedCashFlow;
      cf.cumulativeCashFlow = cumCF;
      cf.cumulativeDcf = cumDCF;
      cashFlows.push(cf);
    }
    
    npvValues.push(cumDCF);
    
    const totalCapex = inputs.capex.items.reduce((sum, item) => sum + item.amount, 0);
    const irrCashFlows = [-totalCapex, ...cashFlows.map(cf => cf.projectCashFlow)];
    irrValues.push(calculateIRR(irrCashFlows));
    
    // Payback
    let cumulative = 0, payback = -1;
    for (let i = 0; i < cashFlows.length; i++) {
      cumulative += cashFlows[i].projectCashFlow;
      if (cumulative >= 0) {
        const prev = cumulative - cashFlows[i].projectCashFlow;
        payback = i + (-prev / cashFlows[i].projectCashFlow);
        break;
      }
    }
    paybackPeriods.push(payback);
  }
  
  // Deterministic cash flows
  const deterministicCashFlows: YearlyCashFlow[] = [];
  let cumCF = 0, cumDCF = 0;
  for (let year = 0; year < inputs.project.economicLife; year++) {
    const cf = calculateYearlyCashFlow(inputs, year, false);
    cumCF += cf.projectCashFlow;
    cumDCF += cf.discountedCashFlow;
    cf.cumulativeCashFlow = cumCF;
    cf.cumulativeDcf = cumDCF;
    deterministicCashFlows.push(cf);
  }
  
  const deterministicMetrics = calculateEconomicMetrics(deterministicCashFlows, inputs);
  const riskMetrics = calculateRiskMetrics(npvValues, irrValues, paybackPeriods, inputs.project.hurdleRate);
  const tornadoData = runTornadoAnalysis(inputs);
  const spiderData = runSpiderAnalysis(inputs);
  const heatmapData = runHeatmapAnalysis(inputs);
  
  return {
    npvValues,
    irrValues,
    paybackPeriods,
    cashFlows: deterministicCashFlows,
    deterministicMetrics,
    riskMetrics,
    tornadoData,
    spiderData,
    heatmapData,
    inputs,
    timestamp: new Date(),
  };
}
