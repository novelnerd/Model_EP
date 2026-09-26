// E&P Monte Carlo NPV Simulation Types

export interface ProductionProfile {
  initialRate: number; // bbl/day or boe/day
  declineRate: number; // annual decline rate (%)
  declineType: 'exponential' | 'hyperbolic' | 'harmonic';
  hyperbolicExponent: number; // b factor for hyperbolic decline
  minRate: number; // economic limit rate (bbl/day)
}

export interface PriceAssumptions {
  oilPrice: number; // $/bbl
  gasPrice: number; // $/Mcf
  nglPrice: number; // $/bbl
  oilPriceStdDev: number; // standard deviation %
  gasPriceStdDev: number;
  nglPriceStdDev: number;
  oilEscalation: number; // annual escalation %
  gasEscalation: number;
  nglEscalation: number;
  oilGasRatio: number; // bbl oil per Mcf gas
  nglRatio: number; // bbl NGL per bbl oil
}

export interface CostAssumptions {
  opexPerBarrel: number; // $/boe
  opexStdDev: number; // %
  opexEscalation: number; // annual %
  fixedOpex: number; // $/month
  transportationCost: number; // $/boe
  severanceTaxRate: number; // %
  adValoremTaxRate: number; // %
}

export interface CapexAssumptions {
  initialCapex: number; // $
  capexStdDev: number; // %
  workoverCapex: number; // $ per workover
  workoverFrequency: number; // years between workovers
  abandonmentCost: number; // $
  salvageValue: number; // $
}

export interface FiscalRegime {
  discountRate: number; // WACC %
  incomeTaxRate: number; // %
  royaltyRate: number; // %
  depreciationMethod: 'straight_line' | 'units_of_production';
  depreciationYears: number;
  workingInterest: number; // %
  netRevenueInterest: number; // %
}

export interface SimulationInputs {
  production: ProductionProfile;
  prices: PriceAssumptions;
  costs: CostAssumptions;
  capex: CapexAssumptions;
  fiscal: FiscalRegime;
  simulationYears: number;
  numIterations: number;
}

export interface YearlyCashFlow {
  year: number;
  productionRate: number; // boe/day
  annualProduction: number; // boe
  oilRevenue: number;
  gasRevenue: number;
  nglRevenue: number;
  grossRevenue: number;
  royalty: number;
  netRevenue: number;
  opex: number;
  transportation: number;
  severanceTax: number;
  adValoremTax: number;
  ebitda: number;
  capex: number;
  depreciation: number;
  taxableIncome: number;
  incomeTax: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  discountFactor: number;
  discountedCashFlow: number;
  cumulativeDiscountedCF: number;
}

export interface CashFlowWithFormulas extends YearlyCashFlow {
  formulas: Record<string, string>;
}

export interface SimulationResult {
  npvValues: number[];
  irrValues: number[];
  paybackPeriods: number[];
  meanNPV: number;
  medianNPV: number;
  stdDevNPV: number;
  p10NPV: number;
  p50NPV: number;
  p90NPV: number;
  probabilityOfLoss: number;
  cashFlows: YearlyCashFlow[];
  cashFlowsWithFormulas: CashFlowWithFormulas[];
  inputs: SimulationInputs;
  tornadoData: TornadoItem[];
}

export interface TornadoItem {
  parameter: string;
  lowValue: number;
  highValue: number;
  impact: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
  label: string;
}
