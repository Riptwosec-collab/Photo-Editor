"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CloudOff, LoaderCircle, Mail, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuthStore } from "@/features/auth/session";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthScreen() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const signOut = useAuthStore((state) => state.signOut);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "Guest Creator");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  function startGuest() {
    continueAsGuest(displayName.trim() || "Guest Creator");
    router.push("/editor");
  }

  async function requestMagicLink(event: FormEvent) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Cloud authentication is not configured for this deployment.");
      return;
    }
    setLoading(true);
    setStatus("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/projects` },
    });
    setLoading(false);
    setStatus(error ? error.message : "Check your email for the secure sign-in link.");
  }

  return (
    <AppShell>
      <main className="auth-page">
        <section className="auth-card">
          <span className="kicker">Account foundation</span>
          <h1>Choose how to continue</h1>
          <p>Guest mode is fully local. Supabase magic-link authentication activates only when real environment variables are configured.</p>

          {profile ? (
            <div className="signed-session"><UserRound /><div><strong>{profile.displayName}</strong><small>Local guest session</small></div><button className="button" onClick={signOut}>Sign out</button></div>
          ) : (
            <div className="auth-section">
              <label>Display name<input value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} /></label>
              <button className="button primary" onClick={startGuest}><UserRound size={17} /> Continue in guest mode <ArrowRight size={16} /></button>
              <small>Projects remain on this browser until cloud sync is configured.</small>
            </div>
          )}

          <div className="auth-divider"><span>or</span></div>

          <form className="auth-section" onSubmit={(event) => void requestMagicLink(event)}>
            <div className={configured ? "provider-state ready" : "provider-state"}>{configured ? <Mail size={15} /> : <CloudOff size={15} />}{configured ? "Supabase connected" : "Supabase not configured"}</div>
            <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={!configured} /></label>
            <button className="button" type="submit" disabled={!configured || loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <Mail size={16} />} Send magic link</button>
            {status && <p role="status" className="auth-status">{status}</p>}
          </form>
        </section>
      </main>
    </AppShell>
  );
}
