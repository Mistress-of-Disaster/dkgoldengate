export function calcLTV(loanAmount: number, value: number): number {
  if (!value) return 0;
  return (loanAmount / value) * 100;
}

export function calcDTI(monthlyDebts: number, annualIncome: number): number {
  const monthlyIncome = annualIncome / 12;
  if (!monthlyIncome) return 0;
  return (monthlyDebts / monthlyIncome) * 100;
}

export function monthlyPayment(
  loanAmount: number,
  annualRatePct: number,
  years: number
): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return loanAmount / n;
  return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export type RiskLevel = "low" | "moderate" | "high";

export function ltvRisk(ltv: number): RiskLevel {
  if (ltv <= 80) return "low";
  if (ltv <= 95) return "moderate";
  return "high";
}

export function dtiRisk(dti: number): RiskLevel {
  if (dti <= 36) return "low";
  if (dti <= 43) return "moderate";
  return "high";
}

export function creditRisk(score: number): RiskLevel {
  if (score >= 740) return "low";
  if (score >= 660) return "moderate";
  return "high";
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "text-emerald-600";
    case "moderate":
      return "text-amber-600";
    case "high":
      return "text-red-600";
  }
}

export function riskBg(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-emerald-100 text-emerald-700";
    case "moderate":
      return "bg-amber-100 text-amber-700";
    case "high":
      return "bg-red-100 text-red-700";
  }
}

export function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
