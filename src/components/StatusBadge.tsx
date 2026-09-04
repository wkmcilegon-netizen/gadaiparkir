import { cn } from "@/lib/utils";

export type VehicleStatus = "Pending" | "Jasa Parkir" | "Lunas";

const styles: Record<VehicleStatus, string> = {
  Pending: "bg-warning text-warning-foreground",
  "Jasa Parkir": "bg-info text-info-foreground",
  Lunas: "bg-success text-success-foreground",
};

export function StatusBadge({ status, className }: { status: VehicleStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
