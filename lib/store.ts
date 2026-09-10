import { LoanApplication, NewAppInput, AppStatus } from "./types";

let apps: LoanApplication[] = [
  {
    id: "APP-2026-001",
    borrowerName: "James Okafor",
    borrowerCreditScore: 762,
    annualIncome: 145000,
    employmentStatus: "Employed",
    monthlyDebts: 1200,
    propertyAddress: "4821 Linden Blvd, Queens, NY 11303",
    propertyType: "Single Family",
    purchasePrice: 685000,
    appraisedValue: 690000,
    loanAmount: 548000,
    loanTermYears: 30,
    interestRate: 6.875,
    status: "in_review",
    submittedBy: "Maria Chen — Apex Realty",
    submittedAt: "2026-09-08T14:30:00Z",
    underwriterNotes: "",
    decidedAt: null,
    decidedBy: null,
  },
  {
    id: "APP-2026-002",
    borrowerName: "Sarah Whitfield",
    borrowerCreditScore: 691,
    annualIncome: 92000,
    employmentStatus: "Self-Employed",
    monthlyDebts: 2100,
    propertyAddress: "1900 Pine St, San Francisco, CA 94109",
    propertyType: "Condominium",
    purchasePrice: 875000,
    appraisedValue: 860000,
    loanAmount: 700000,
    loanTermYears: 30,
    interestRate: 7.125,
    status: "submitted",
    submittedBy: "David Park — Bridgepoint Mortgage",
    submittedAt: "2026-09-09T09:15:00Z",
    underwriterNotes: "",
    decidedAt: null,
    decidedBy: null,
  },
  {
    id: "APP-2026-003",
    borrowerName: "Michael Torres",
    borrowerCreditScore: 805,
    annualIncome: 210000,
    employmentStatus: "Employed",
    monthlyDebts: 800,
    propertyAddress: "335 River Rd, Edgewater, NJ 07020",
    propertyType: "Multi-Family",
    purchasePrice: 1250000,
    appraisedValue: 1275000,
    loanAmount: 937500,
    loanTermYears: 30,
    interestRate: 6.5,
    status: "approved",
    submittedBy: "Maria Chen — Apex Realty",
    submittedAt: "2026-09-05T11:00:00Z",
    underwriterNotes: "Strong borrower, excellent credit, LTV under 75%. Approved.",
    decidedAt: "2026-09-06T16:00:00Z",
    decidedBy: "Underwriter",
  },
  {
    id: "APP-2026-004",
    borrowerName: "Patricia Nguyen",
    borrowerCreditScore: 645,
    annualIncome: 78000,
    employmentStatus: "Employed",
    monthlyDebts: 1850,
    propertyAddress: "77 Maple Ave, Jersey City, NJ 07305",
    propertyType: "Townhouse",
    purchasePrice: 520000,
    appraisedValue: 510000,
    loanAmount: 468000,
    loanTermYears: 30,
    interestRate: 7.5,
    status: "denied",
    submittedBy: "David Park — Bridgepoint Mortgage",
    submittedAt: "2026-09-03T10:00:00Z",
    underwriterNotes:
      "DTI above 43% threshold, LTV above 90%. Credit score below minimum. Denied.",
    decidedAt: "2026-09-04T13:00:00Z",
    decidedBy: "Underwriter",
  },
  {
    id: "APP-2026-005",
    borrowerName: "Robert Callahan",
    borrowerCreditScore: 728,
    annualIncome: 168000,
    employmentStatus: "Employed",
    monthlyDebts: 1500,
    propertyAddress: "12 Harbor View Dr, Boston, MA 02110",
    propertyType: "Condominium",
    purchasePrice: 950000,
    appraisedValue: 945000,
    loanAmount: 760000,
    loanTermYears: 30,
    interestRate: 6.75,
    status: "conditional",
    submittedBy: "Maria Chen — Apex Realty",
    submittedAt: "2026-09-07T15:45:00Z",
    underwriterNotes:
      "Conditioned on updated appraisal and 2 years of tax returns.",
    decidedAt: "2026-09-08T10:00:00Z",
    decidedBy: "Underwriter",
  },
];

export function getAll(): LoanApplication[] {
  return [...apps].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function getById(id: string): LoanApplication | undefined {
  return apps.find((a) => a.id === id);
}

export function getByBroker(brokerName: string): LoanApplication[] {
  return getAll().filter((a) => a.submittedBy === brokerName);
}

export function create(input: NewAppInput, brokerName: string): LoanApplication {
  const num = String(apps.length + 1).padStart(3, "0");
  const app: LoanApplication = {
    id: `APP-2026-${num}`,
    ...input,
    status: "submitted",
    submittedBy: brokerName,
    submittedAt: new Date().toISOString(),
    underwriterNotes: "",
    decidedAt: null,
    decidedBy: null,
  };
  apps = [app, ...apps];
  return app;
}

export function updateStatus(
  id: string,
  status: AppStatus,
  notes: string,
  decidedBy: string
): LoanApplication | undefined {
  const app = apps.find((a) => a.id === id);
  if (!app) return undefined;
  app.status = status;
  app.underwriterNotes = notes;
  app.decidedAt = new Date().toISOString();
  app.decidedBy = decidedBy;
  return app;
}
