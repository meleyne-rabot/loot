import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Réessaie un appel réseau flaky (mobile) avant d'abandonner.
  const withRetry = async (fn, attempts = 3) => {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 600 * (i + 1)));
      }
    }
    throw lastErr;
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Retour d'OAuth (Google) : selon le flow, Supabase renvoie soit
        // #access_token=... (implicit, dans le hash), soit ?code=... (PKCE).
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.slice(1));

        if (hashParams.has("error")) {
          setAuthError(hashParams.get("error_description") || hashParams.get("error"));
        } else if (hashParams.has("access_token")) {
          const { error } = await withRetry(() =>
            supabase.auth.setSession({
              access_token: hashParams.get("access_token"),
              refresh_token: hashParams.get("refresh_token"),
            })
          );
          if (error) setAuthError(error.message);
          else window.history.replaceState({}, "", url.pathname);
        } else if (url.searchParams.has("code")) {
          const { error } = await withRetry(() => supabase.auth.exchangeCodeForSession(window.location.href));
          if (error) setAuthError(error.message);
          else window.history.replaceState({}, "", url.pathname);
        }

        const { data, error } = await withRetry(() => supabase.auth.getSession());
        if (error) setAuthError(error.message);
        setSession(data.session);
      } catch (err) {
        console.error("[Loot auth init error]", err);
        setAuthError(err?.message || "Erreur réseau, réessaie.");
      } finally {
        setLoading(false);
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
