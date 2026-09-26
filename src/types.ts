// Enterprise E&P Economics Platform - Core Types

export type DeclineType = 'exponential' | 'hyperbolic' | 'harmonic' | 'arps';
export type DistributionType = 'normal' | 'lognormal' | 'triangular' | 'uniform' | 'pert';
export type DepreciationMethod = 'straight_line' | 'wdv' | 'units_of_production' | 'companies_act' | 'user_defined';
export type FiscalRegimeType = 'nomination' | 'psc' | 'help_oalp' | 'dsf' | 'cbm' | 'revenue_sharing' | 'production_sharing' | 'custom';
export type DecisionRating = 'green' | 'amber' | 'red';
export type CalculationEngine = 'native' | 'excel' | 'hybrid';

export interface UncertaintyInput {
  p10: number;
  p50: number;
  p90: number;
  distribution: DistributionType;
  min?: number;
  max?: number;
}

export interface ProjectInfo {
  projectName: string;
  assetName: string;
  basin: string;
  country: string;
  operator: string;
  workingInterest: number;
  netRevenueInterest: number;
  currency: string;
  economicLife: number;
  startYear: number;
  discountRate: number;
  hurdleRate: number;
  inflationRate: number;
  fxRate: number;
  calculationEngine: CalculationEngine;
}

export interface ProductionProfile {
  oil: UncertaintyInput;
  gas: UncertaintyInput;
  condensate: UncertaintyInput;
  ngl: UncertaintyInput;
  water: UncertaintyInput;
  gor: number;
  wor: number;
  recoveryFactor: UncertaintyInput;
  declineType: DeclineType;
  declineRate: UncertaintyInput;
  hyperbolicExponent: number;
  plateauYears: number;
  economicLimit: number;
}

export interface PriceAssumptions {
  oil: { base: number; escalation: number; stdDev: number; distribution: DistributionType; forwardCurve?: number[] };
  gas: { base: number; escalation: number; stdDev: number; distribution: DistributionType; forwardCurve?: number[] };
  condensate: { base: number; escalation: number; stdDev: number; distribution: DistributionType };
  ngl: { base: number; escalation: number; stdDev: number; distribution: DistributionType };
  carbonCredits: { base: number; escalation: number; stdDev: number };
  oilGasRatio: number;
  nglRatio: number;
}

export interface CapexItem {
  category: string;
  year: number;
  amount: number;
  escalation: number;
  distribution: DistributionType;
  stdDev: number;
}

export interface CapexAssumptions {
  items: CapexItem[];
  exploration: number;
  drilling: number;
  facilities: number;
  pipelines: number;
  subsea: number;
  compression: number;
  processing: number;
  brownfield: number;
  workovers: number;
  abandonment: number;
  decommissioning: number;
  idc: number;
  contingency: number;
  ownerCost: number;
  totalCapexStdDev: number;
}

export interface OpexItem {
  category: string;
  baseValue: number;
  escalation: number;
  distribution: DistributionType;
  stdDev: number;
  isFixed: boolean;
}

export interface OpexAssumptions {
  items: OpexItem[];
  fixedOpex: number;
  variableOpex: number;
  transportation: number;
  tolling: number;
  power: number;
  maintenance: number;
  chemicals: number;
  logistics: number;
  personnel: number;
  insurance: number;
  gna: number;
  carbonCost: number;
  totalOpexStdDev: number;
  inflationRate: number;
}

export interface FiscalRegime {
  id: string;
  name: string;
  type: FiscalRegimeType;
  description: string;
  royaltyRate: number;
  oidbCess: number;
  revenueShare: number;
  productionShare: number;
  corporateTaxRate: number;
  deferredTax: boolean;
  gstRate: number;
  windfallLevy: number;
  carbonTax: number;
  customsDuty: number;
  taxHolidayYears: number;
  lossCarryForwardYears: number;
  depreciationMethod: DepreciationMethod;
  depreciationYears: number;
  wdvRate: number;
  additionalRounds: number;
  investmentMultiple?: number;
  costOilLimit?: number;
  profitOilSplit?: { operator: number; government: number }[];
}

export interface SimulationInputs {
  project: ProjectInfo;
  production: ProductionProfile;
  prices: PriceAssumptions;
  capex: CapexAssumptions;
  opex: OpexAssumptions;
  fiscal: FiscalRegime;
  numIterations: number;
  correlationMatrix?: Record<string, Record<string, number>>;
}

export interface YearlyCashFlow {
  year: number;
  period: string;
  oilProduction: number;
  gasProduction: number;
  condensateProduction: number;
  nglProduction: number;
  totalProduction: number;
  waterProduction: number;
  oilRevenue: number;
  gasRevenue: number;
  condensateRevenue: number;
  nglRevenue: number;
  carbonCreditRevenue: number;
  grossRevenue: number;
  royalty: number;
  oidbCess: number;
  revenueShare: number;
  netRevenue: number;
  opex: number;
  transportation: number;
  carbonCost: number;
  ebitda: number;
  ebitdax: number;
  depreciation: number;
  taxableIncome: number;
  lossCarryForward: number;
  corporateTax: number;
  deferredTax: number;
  freeCashFlow: number;
  projectCashFlow: number;
  equityCashFlow: number;
  capex: number;
  cumulativeCashFlow: number;
  discountFactor: number;
  discountedCashFlow: number;
  cumulativeDcf: number;
  formulas: Record<string, string>;
}

export interface EconomicMetrics {
  npv: number;
  irr: number;
  mirr: number;
  profitabilityIndex: number;
  paybackPeriod: number;
  discountedPayback: number;
  breakevenOilPrice: number;
  breakevenGasPrice: number;
  breakevenProduction: number;
  valuePerBoe: number;
  valuePerMscf: number;
  ebitdaMargin: number;
  opexPerBoe: number;
  findingDevelopmentCost: number;
}

export interface RiskMetrics {
  meanNpv: number;
  medianNpv: number;
  stdDevNpv: number;
  p10Npv: number;
  p50Npv: number;
  p90Npv: number;
  meanIrr: number;
  medianIrr: number;
  p10Irr: number;
  p50Irr: number;
  p90Irr: number;
  probabilityNpvPositive: number;
  probabilityIrrAboveHurdle: number;
  paybackProbability: number;
  valueAtRisk95: number;
  conditionalVaR95: number;
  coefficientOfVariation: number;
  skewness: number;
  kurtosis: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: 'base' | 'optimistic' | 'pessimistic' | 'bull' | 'bear' | 'custom';
  inputs: Partial<SimulationInputs>;
  metrics?: EconomicMetrics;
  riskMetrics?: RiskMetrics;
  color: string;
}

export interface SimulationResult {
  npvValues: number[];
  irrValues: number[];
  paybackPeriods: number[];
  cashFlows: YearlyCashFlow[];
  deterministicMetrics: EconomicMetrics;
  riskMetrics: RiskMetrics;
  tornadoData: TornadoItem[];
  spiderData: SpiderItem[];
  heatmapData: HeatmapCell[];
  inputs: SimulationInputs;
  scenario?: Scenario;
  timestamp: Date;
}

export interface TornadoItem {
  parameter: string;
  lowValue: number;
  highValue: number;
  impact: number;
  percentChange: number;
}

export interface SpiderItem {
  parameter: string;
  changes: { percent: number; npv: number }[];
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  module: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface CorrelationPair {
  param1: string;
  param2: string;
  coefficient: number;
}
