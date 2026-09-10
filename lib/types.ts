export type Role = "broker" | "underwriter";

export type AppStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "denied"
  | "conditional";

export type PropertyType =
  | "Single Family"
  | "Condominium"
  | "Townhouse"
  | "Multi-Family"
  | "Mixed-Use";

export type EmploymentStatus =
  | "Employed"
  | "Self-Employed"
  | "Retired"
  | "Unemployed";

export interface LoanApplication {
  id: string;
  // Borrower
  borrowerName: string;
  borrowerCreditScore: number;
  annualIncome: number;
  employmentStatus: EmploymentStatus;
  monthlyDebts: number;
  // Property
  propertyAddress: string;
  propertyType: PropertyType;
  purchasePrice: number;
  appraisedValue: number;
  // Loan
  loanAmount: number;
  loanTermYears: number;
  interestRate: number;
  // Meta
  status: AppStatus;
  submittedBy: string; // broker name
  submittedAt: string;
  underwriterNotes: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export interface NewAppInput {
  borrowerName: string;
  borrowerCreditScore: number;
  annualIncome: number;
  employmentStatus: EmploymentStatus;
  monthlyDebts: number;
  propertyAddress: string;
  propertyType: PropertyType;
  purchasePrice: number;
  appraisedValue: number;
  loanAmount: number;
  loanTermYears: number;
  interestRate: number;
}
