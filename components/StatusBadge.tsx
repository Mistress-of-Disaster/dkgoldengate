import { AppStatus } from "@/lib/types";

const styles: Record<AppStatus, string> = {
  submitted: "bg-slate-100 text-slate-600",
  in_review: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
  conditional: "bg-amber-100 text-amber-700",
};

const labels: Record<AppStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  denied: "Denied",
  conditional: "Conditional",
};

export default function StatusBadge({ status }: { status: AppStatus }) {
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}
