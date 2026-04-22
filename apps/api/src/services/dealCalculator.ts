export function calculateMortgagePayment(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) return principal / numPayments;

  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

export function calculateCapRate(noi: number, purchasePrice: number): number {
  if (purchasePrice === 0) return 0;
  return (noi / purchasePrice) * 100;
}

export function calculateCashOnCash(annualCashFlow: number, totalCashInvested: number): number {
  if (totalCashInvested === 0) return 0;
  return (annualCashFlow / totalCashInvested) * 100;
}

export function calculateGrossRentMultiplier(purchasePrice: number, annualRent: number): number {
  if (annualRent === 0) return 0;
  return purchasePrice / annualRent;
}

export function calculateMonthlyCashFlow(
  monthlyRent: number,
  monthlyMortgage: number,
  monthlyTaxes: number,
  monthlyInsurance: number,
  monthlyHoa: number,
  vacancyRatePct: number,
  monthlyExpenses: number,
): number {
  const effectiveRent = monthlyRent * (1 - vacancyRatePct / 100);
  return effectiveRent - monthlyMortgage - monthlyTaxes - monthlyInsurance - monthlyHoa - monthlyExpenses;
}

export function projectAppreciation(
  currentValue: number,
  annualRatePct: number,
  years: number,
  loanBalance: number,
  monthlyMortgage: number,
  annualRate: number,
): { value: number; equity: number } {
  const futureValue = currentValue * Math.pow(1 + annualRatePct / 100, years);

  let balance = loanBalance;
  const monthlyRate = annualRate / 100 / 12;
  for (let i = 0; i < years * 12; i++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyMortgage - interest;
    balance = Math.max(0, balance - principalPayment);
  }

  return {
    value: Math.round(futureValue),
    equity: Math.round(futureValue - balance),
  };
}

export function generateInvestmentScore(metrics: {
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  grossRentMultiplier: number;
}): number {
  let score = 50;

  // Cap rate scoring (weight: 25)
  if (metrics.capRate >= 10) score += 25;
  else if (metrics.capRate >= 7) score += 20;
  else if (metrics.capRate >= 5) score += 12;
  else if (metrics.capRate >= 3) score += 5;
  else score -= 10;

  // Cash-on-cash scoring (weight: 25)
  if (metrics.cashOnCash >= 12) score += 25;
  else if (metrics.cashOnCash >= 8) score += 18;
  else if (metrics.cashOnCash >= 5) score += 10;
  else if (metrics.cashOnCash >= 0) score += 2;
  else score -= 15;

  // Cash flow scoring (weight: 15)
  if (metrics.monthlyCashFlow >= 500) score += 15;
  else if (metrics.monthlyCashFlow >= 200) score += 10;
  else if (metrics.monthlyCashFlow >= 0) score += 3;
  else score -= 10;

  // GRM scoring (weight: 10) — lower is better
  if (metrics.grossRentMultiplier <= 10) score += 10;
  else if (metrics.grossRentMultiplier <= 15) score += 5;
  else if (metrics.grossRentMultiplier <= 20) score += 0;
  else score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface DealInput {
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  expectedMonthlyRent: number;
  monthlyExpenses: number;
  propertyTaxesAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  vacancyRatePct: number;
}

export interface DealMetrics {
  monthlyMortgage: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  grossRentMultiplier: number;
  totalCashNeeded: number;
  noi: number;
  appreciation: {
    year5: { value: number; equity: number };
    year10: { value: number; equity: number };
    year30: { value: number; equity: number };
  };
  investmentScore: number;
}

export function analyzeDeal(input: DealInput): DealMetrics {
  const downPayment = input.purchasePrice * (input.downPaymentPct / 100);
  const loanAmount = input.purchasePrice - downPayment;
  const closingCosts = input.purchasePrice * 0.03;
  const totalCashNeeded = downPayment + closingCosts;

  const monthlyMortgage = calculateMortgagePayment(loanAmount, input.interestRate, input.loanTermYears);
  const monthlyTaxes = input.propertyTaxesAnnual / 12;
  const monthlyInsurance = input.insuranceAnnual / 12;

  const monthlyCashFlow = calculateMonthlyCashFlow(
    input.expectedMonthlyRent, monthlyMortgage, monthlyTaxes,
    monthlyInsurance, input.hoaMonthly, input.vacancyRatePct, input.monthlyExpenses,
  );

  const annualCashFlow = monthlyCashFlow * 12;
  const effectiveAnnualRent = input.expectedMonthlyRent * 12 * (1 - input.vacancyRatePct / 100);
  const annualExpenses = input.propertyTaxesAnnual + input.insuranceAnnual +
    (input.hoaMonthly * 12) + (input.monthlyExpenses * 12);
  const noi = effectiveAnnualRent - annualExpenses;

  const capRate = calculateCapRate(noi, input.purchasePrice);
  const cashOnCashReturn = calculateCashOnCash(annualCashFlow, totalCashNeeded);
  const grossRentMultiplier = calculateGrossRentMultiplier(
    input.purchasePrice, input.expectedMonthlyRent * 12,
  );

  const appreciationRate = 3.5;
  const appreciation = {
    year5: projectAppreciation(input.purchasePrice, appreciationRate, 5, loanAmount, monthlyMortgage, input.interestRate),
    year10: projectAppreciation(input.purchasePrice, appreciationRate, 10, loanAmount, monthlyMortgage, input.interestRate),
    year30: projectAppreciation(input.purchasePrice, appreciationRate, 30, loanAmount, monthlyMortgage, input.interestRate),
  };

  const investmentScore = generateInvestmentScore({
    capRate, cashOnCash: cashOnCashReturn, monthlyCashFlow, grossRentMultiplier,
  });

  return {
    monthlyMortgage: Math.round(monthlyMortgage * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    annualCashFlow: Math.round(annualCashFlow * 100) / 100,
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
    totalCashNeeded: Math.round(totalCashNeeded),
    noi: Math.round(noi),
    appreciation,
    investmentScore,
  };
}
