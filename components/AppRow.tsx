import Link from "next/link";
import { LoanApplication } from "@/lib/types";
import { calcLTV, calcDTI, fmtMoney, fmtDate } from "@/lib/calculations";
import StatusBadge from "./StatusBadge";

export default function AppRow({ app }: { app: LoanApplication }) {
  const ltv = calcLTV(app.loanAmount, app.appraisedValue);
  const dti = calcDTI(app.monthlyDebts, app.annualIncome);

  return (
    <Link
      href={`/underwriter/${app.id}`}
      className="card flex flex-col gap-2 p-4 transition hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{app.id}</span>
          <StatusBadge status={app.status} />
        </div>
        <p className="mt-1 truncate font-semibold text-slate-900">
          {app.borrowerName}
        </p>
        <p className="truncate text-sm text-slate-500">{app.propertyAddress}</p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right">
          <p className="text-slate-400">Loan</p>
          <p className="font-semibold text-slate-900">{fmtMoney(app.loanAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">LTV</p>
          <p className="font-semibold text-slate-900">{ltv.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">DTI</p>
          <p className="font-semibold text-slate-900">{dti.toFixed(1)}%</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-slate-400">Credit</p>
          <p className="font-semibold text-slate-900">{app.borrowerCreditScore}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-slate-400">Submitted</p>
          <p className="text-slate-600">{fmtDate(app.submittedAt)}</p>
        </div>
      </div>
    </Link>
  );
}
