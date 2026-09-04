import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { AKUN, useAuth } from "@/lib/auth";
import { catatAktivitas } from "@/lib/vehicles";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan Akun — Gadai Motor Dr. Cel" },
      {
        name: "description",
        content:
          "Ganti password akun Dr atau Cel dengan validasi password lama, password baru, dan konfirmasi.",
      },
      { property: "og:title", content: "Pengaturan Akun — Gadai Motor Dr. Cel" },
      {
        property: "og:description",
        content: "Keamanan akun portal gadai motor: penggantian password per peran.",
      },
    ],
  }),
  component: () => (
    <AppShell active="Pengaturan">
      <PengaturanPage />
    </AppShell>
  ),
});

function PengaturanPage() {
  const { role, username } = useAuth();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [proses, setProses] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    if (baru.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    if (baru !== konfirmasi) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setProses(true);
    try {
      const cek = await supabase.auth.signInWithPassword({
        email: AKUN[role].email,
        password: lama,
      });
      if (cek.error) {
        toast.error("Password lama salah.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: baru });
      if (error) throw error;
      await catatAktivitas({
        username: username ?? AKUN[role].username,
        role,
        action: "mengganti password akun",
      });
      toast.success("Password berhasil diperbarui.");
      setLama("");
      setBaru("");
      setKonfirmasi("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui password.");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <KeyRound className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Ganti Password</h2>
            <p className="text-[10px] text-muted-foreground">
              Berlaku untuk akun {username} ({role === "dr" ? "Halaman Dr" : "Halaman Cel"})
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Username (permanen)
          </Label>
          <div className="relative">
            <Input value={username ?? ""} readOnly disabled className="pr-10 font-semibold" />
            <Lock className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Password Lama
            </Label>
            <PasswordInput value={lama} onChange={setLama} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Password Baru
            </Label>
            <PasswordInput value={baru} onChange={setBaru} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Konfirmasi Password Baru
            </Label>
            <PasswordInput
              value={konfirmasi}
              onChange={setKonfirmasi}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            disabled={proses || !lama || !baru || !konfirmasi}
            className="w-full font-bold"
          >
            {proses ? "Menyimpan…" : "Simpan Password Baru"}
          </Button>
        </form>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary p-3">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Username tiap peran dikunci permanen. Hanya password yang dapat diubah, minimal 6
          karakter.
        </p>
      </div>
    </div>
  );
}
