import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "dr" | "cel";

export const AKUN: Record<AppRole, { username: string; email: string; label: string }> = {
  dr: { username: "omdru", email: "omdru@drcel.app", label: "Halaman Dr" },
  cel: { username: "Pecel", email: "pecel@drcel.app", label: "Halaman Cel" },
};

const DEFAULT_PASSWORD = "123456";

type AuthState = {
  session: Session | null;
  role: AppRole | null;
  username: string | null;
  loading: boolean;
  signIn: (role: AppRole, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function roleFromEmail(email: string | undefined): AppRole | null {
  if (!email) return null;
  if (email === AKUN.dr.email) return "dr";
  if (email === AKUN.cel.email) return "cel";
  return null;
}

async function ensureProfile(userId: string, role: AppRole) {
  await supabase
    .from("profiles")
    .upsert({ id: userId, username: AKUN[role].username }, { onConflict: "id" });
  const { data: existing } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  if (!existing) {
    await supabase.from("user_roles").insert({ user_id: userId, role });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState["signIn"] = async (role, password) => {
    const email = AKUN[role].email;
    const first = await supabase.auth.signInWithPassword({ email, password });
    if (!first.error && first.data.user) {
      await ensureProfile(first.data.user.id, role);
      return { error: null };
    }

    // Akun belum pernah dibuat: buat sekali dengan password bawaan.
    if (password === DEFAULT_PASSWORD) {
      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (!signUp.error) {
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (!retry.error && retry.data.user) {
          await ensureProfile(retry.data.user.id, role);
          return { error: null };
        }
      }
    }
    return { error: "Password salah. Silakan periksa kembali." };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const role = roleFromEmail(session?.user?.email ?? undefined);

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        username: role ? AKUN[role].username : null,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
