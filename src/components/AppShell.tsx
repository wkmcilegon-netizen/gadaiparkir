import { type ReactNode, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import logoAsset from "@/assets/ghighais-logo.png.asset.json";
import { AKUN, useAuth, type AppRole } from "@/lib/auth";

type NavItem = { label: string; to: "/dr" | "/cel" | "/pengaturan"; hash?: string };

const NAV: Record<AppRole, NavItem[]> = {
  dr: [
    { label: "Dashboard", to: "/dr" },
    { label: "Input Kendaraan", to: "/dr", hash: "input" },
    { label: "Aktivitas", to: "/dr", hash: "aktivitas" },
    { label: "Pengaturan", to: "/pengaturan" },
  ],
  cel: [
    { label: "Konfirmasi", to: "/cel" },
    { label: "Aktivitas", to: "/cel", hash: "aktivitas" },
    { label: "Pengaturan", to: "/pengaturan" },
  ],
};

export function AppShell({
  requireRole,
  active,
  children,
}: {
  requireRole?: AppRole;
  active: string;
  children: ReactNode;
}) {
  const { session, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session || !role) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (requireRole && role !== requireRole) {
      navigate({ to: role === "dr" ? "/dr" : "/cel", replace: true });
    }
  }, [loading, session, role, requireRole, navigate]);

  if (loading || !session || !role || (requireRole && role !== requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const items = NAV[role];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-navy px-4 py-3 text-navy-foreground shadow-md">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Logo Gadai Motor Dr. Cel"
            className="size-9 rounded-lg bg-navy-muted object-contain p-1"
          />
          <div>
            <h1 className="text-sm font-bold leading-none tracking-tight">Gadai Motor Dr. Cel</h1>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">
              Enterprise Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] font-semibold opacity-70">Masuk sebagai</p>
            <p className="text-xs font-bold text-primary">{AKUN[role].username}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/", replace: true });
            }}
            aria-label="Keluar"
            className="flex size-9 items-center justify-center rounded-full border border-navy-muted bg-navy-muted transition-opacity hover:opacity-80"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <nav className="no-scrollbar flex gap-4 overflow-x-auto border-b border-border bg-card px-4 py-2">
        {items.map((item) => {
          const isActive = active === item.label;
          return (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className={
                isActive
                  ? "whitespace-nowrap border-b-2 border-primary pb-1 text-xs font-bold text-primary"
                  : "whitespace-nowrap pb-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 p-4">{children}</main>

      <footer className="border-t border-border bg-card px-4 py-3 text-center text-[10px] text-muted-foreground">
        Gadai Motor Dr. Cel — Portal internal operasional
      </footer>
    </div>
  );
}
