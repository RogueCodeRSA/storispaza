import type { ReactNode } from "react";
import "./review-status.css";

export default function ReviewStatus({ badge = "Language review pending", children }: { badge?: string; children: ReactNode }) {
  return <details className="review-status"><summary>Review status <span className="review-badge">{badge}</span></summary><div className="review-status-copy">{children}</div></details>;
}
