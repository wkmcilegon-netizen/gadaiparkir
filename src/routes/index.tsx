import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import logoAsset from "@/assets/ghighais-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { AKUN, useAuth, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — Gadai Motor Dr. Cel" },
      {
        name: "description",
        content:
          "Portal masuk sistem gadai motor Dr. Cel untuk peran Dr (pencatatan unit) dan peran Cel (konfirmasi laporan).",
      },
      { property: "og:title", content: "Masuk — Gadai Motor Dr. Cel" },
      {
        property: "og:description",
        content: "Portal internal dua peran untuk pencatatan dan konfirmasi gadai motor.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, role, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [pilihan, setPilihan] = useState<AppRole>("dr");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (!loading && session && role) {
      navigate({ to: role === "dr" ? "/dr" : "/cel", replace: true });
    }
  }, [loading, session, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setError(null);
    const res = await signIn(pilihan, password);
    setProses(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate({ to: pilihan === "dr" ? "/dr" : "/cel", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logoAsset.url}
              alt="Logo Gadai Motor Dr. Cel"
              className="size-20 object-contain"
            />
            <h1 className="mt-3 text-lg font-bold tracking-tight text-navy-foreground">
              Gadai Motor Dr. Cel
            </h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              Enterprise Portal
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-panel">
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["dr", "cel"] as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setPilihan(r);
                    setError(null);
                  }}
                  className={
                    pilihan === r
                      ? "rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                      : "rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {AKUN[r].label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    value={AKUN[pilihan].username}
                    readOnly
                    disabled
                    className="pr-10 font-semibold"
                  />
                  <Lock className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Username dikunci permanen dan tidak dapat diubah.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={proses || !password} className="w-full font-bold">
                {proses ? "Memproses…" : `Masuk sebagai ${AKUN[pilihan].username}`}
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary p-3">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Password bawaan <span className="font-semibold text-foreground">123456</span>. Ganti
                melalui menu Pengaturan setelah masuk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
