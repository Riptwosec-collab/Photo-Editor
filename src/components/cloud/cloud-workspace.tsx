"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  HardDrive,
  LoaderCircle,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listProjects } from "@/lib/idb";
import {
  getCloudStorageUsage,
  listCloudProjects,
  markConflictResolved,
  pullCloudProject,
  pushLocalProject,
  syncAllProjects,
  type SyncConflict,
  type SyncProgress,
  type SyncResult,
} from "@/lib/cloud/project-sync";
import {
  getCloudConfiguration,
  getSupabaseBrowserClient,
} from "@/lib/cloud/supabase-browser";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 2 : 0)} ${units[index]}`;
}

export function CloudWorkspace() {
  const configuration = useMemo(() => getCloudConfiguration(), []);
  const [client] = useState(() => getSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(Boolean(client));
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [localCount, setLocalCount] = useState(0);
  const [cloudCount, setCloudCount] = useState(0);
  const [usageBytes, setUsageBytes] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const local = await listProjects({ includeArchived: true });
    setLocalCount(local.length);
    if (!client || !session) {
      setCloudCount(0);
      setUsageBytes(0);
      setLastRefresh(new Date().toISOString());
      return;
    }
    const [cloud, usage] = await Promise.all([
      listCloudProjects(client),
      getCloudStorageUsage(client),
    ]);
    setCloudCount(cloud.length);
    setUsageBytes(usage);
    setLastRefresh(new Date().toISOString());
  }, [client, session]);

  useEffect(() => {
    if (!client) {
      setLoadingSession(false);
      void refresh();
      return;
    }
    let active = true;
    const initialize = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const exchanged = await client.auth.exchangeCodeForSession(code);
          if (exchanged.error) throw exchanged.error;
          window.history.replaceState({}, document.title, "/cloud");
        }
        const response = await client.auth.getSession();
        if (response.error) throw response.error;
        if (active) setSession(response.data.session);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to restore the cloud session.");
      } finally {
        if (active) setLoadingSession(false);
      }
    };
    void initialize();
    const subscription = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [client, refresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Unable to refresh cloud state.");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function sendMagicLink() {
    if (!client || !email.trim()) return;
    setSendingLink(true);
    setError("");
    setMessage("");
    try {
      const response = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/cloud`,
        },
      });
      if (response.error) throw response.error;
      setMessage("Magic link sent. Open it on this device to continue cloud synchronization.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the magic link.");
    } finally {
      setSendingLink(false);
    }
  }

  async function runSync() {
    if (!client || !session?.user) return;
    setSyncing(true);
    setError("");
    setMessage("");
    setProgress({ completed: 0, total: Math.max(1, localCount + cloudCount), message: "Preparing sync…" });
    try {
      const result = await syncAllProjects(client, session.user.id, setProgress);
      setLastResult(result);
      setConflicts(result.conflicts);
      setMessage(
        `Sync finished: ${result.pushed} pushed, ${result.pulled} pulled, ${result.equal} unchanged, ${result.conflicts.length} conflicts.`,
      );
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function resolveConflict(conflict: SyncConflict, direction: "push" | "pull") {
    if (!client || !session?.user) return;
    setSyncing(true);
    setError("");
    try {
      if (direction === "push") {
        await pushLocalProject(client, session.user.id, conflict.local);
      } else {
        await pullCloudProject(client, session.user.id, conflict.cloud);
      }
      markConflictResolved(conflict.localId);
      setConflicts((current) => current.filter((item) => item.localId !== conflict.localId));
      setMessage(`${direction === "push" ? "Local" : "Cloud"} copy kept for “${conflict.local.name}”.`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conflict resolution failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
    setConflicts([]);
    setMessage("Signed out. Local projects remain available on this device.");
  }

  if (!configuration || !client) {
    return (
      <AppShell>
        <main className="cloud-workspace-page">
          <header className="cloud-hero">
            <div><span className="kicker">Local-first safety</span><h1>Cloud Sync</h1><p>The database and private bucket are ready, but this deployment has no public Supabase environment configuration.</p></div>
            <CloudOff size={38} />
          </header>
          <section className="cloud-configuration-card warning">
            <AlertTriangle />
            <div><h2>Environment configuration required</h2><p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel Preview and Production, then redeploy. Local projects remain fully functional while cloud is unavailable.</p></div>
          </section>
          <section className="cloud-security-grid">
            <article><ShieldCheck /><strong>RLS applied</strong><span>Owner-isolation policies protect projects, assets, versions, presets and export records.</span></article>
            <article><HardDrive /><strong>Private bucket</strong><span>`lumaforge-assets` accepts only authenticated owner-prefixed object paths.</span></article>
            <article><Database /><strong>Local data preserved</strong><span>IndexedDB remains the source of continuity until a successful cloud sync.</span></article>
          </section>
          <div className="cloud-actions"><Link className="button primary" href="/projects">Open local projects</Link><Link className="button" href="/editor">Open editor</Link></div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="cloud-workspace-page">
        <header className="cloud-hero">
          <div><span className="kicker">Encrypted transport · owner-isolated rows</span><h1>Cloud Sync</h1><p>Synchronize local originals and non-destructive recipes without replacing the local-first project cache.</p></div>
          <Cloud size={38} />
        </header>

        {loadingSession ? (
          <section className="cloud-auth-card"><LoaderCircle className="spin" /><div><h2>Restoring session</h2><p>Checking the persisted Supabase PKCE session…</p></div></section>
        ) : !session ? (
          <section className="cloud-auth-card">
            <Mail />
            <div><h2>Sign in with a magic link</h2><p>The authenticated user ID becomes the RLS owner and the first folder in every private Storage path.</p><div className="cloud-auth-form"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email address" /><button className="button primary" disabled={sendingLink || !email.includes("@")} onClick={() => void sendMagicLink()}>{sendingLink ? <LoaderCircle className="spin" size={15} /> : <Mail size={15} />} Send magic link</button></div></div>
          </section>
        ) : (
          <>
            <section className="cloud-account-bar"><div><span className="cloud-online-dot" /><div><strong>{session.user.email ?? "Authenticated creator"}</strong><small>Owner ID {session.user.id}</small></div></div><button className="button" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></section>

            <section className="cloud-stat-grid">
              <article><Database /><span>Local projects</span><strong>{localCount}</strong><small>IndexedDB on this device</small></article>
              <article><Cloud /><span>Cloud projects</span><strong>{cloudCount}</strong><small>RLS-visible rows only</small></article>
              <article><HardDrive /><span>Cloud assets</span><strong>{formatBytes(usageBytes)}</strong><small>Private bucket usage</small></article>
              <article><ShieldCheck /><span>Security</span><strong>Owner only</strong><small>Database and Storage RLS</small></article>
            </section>

            <section className="cloud-sync-card">
              <div className="cloud-sync-heading"><div><h2>Newest-safe synchronization</h2><p>Projects changed on both sides after the last successful sync are stopped as conflicts instead of being overwritten.</p></div><button className="button" onClick={() => void refresh()} disabled={syncing}><RefreshCw size={15} /> Refresh</button></div>
              {progress && syncing && <div className="cloud-progress"><div><span>{progress.message}</span><output>{progress.completed}/{progress.total}</output></div><div><span style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }} /></div></div>}
              <button className="button primary cloud-sync-button" disabled={syncing} onClick={() => void runSync()}>{syncing ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} Synchronize local and cloud projects</button>
              {lastResult && <div className="cloud-result-row"><span><ArrowUpFromLine size={14} />{lastResult.pushed} pushed</span><span><ArrowDownToLine size={14} />{lastResult.pulled} pulled</span><span><CheckCircle2 size={14} />{lastResult.equal} unchanged</span><span className={lastResult.errors.length ? "danger" : ""}><AlertTriangle size={14} />{lastResult.errors.length} errors</span></div>}
              {lastRefresh && <small className="cloud-last-refresh">Last refreshed {new Date(lastRefresh).toLocaleString()}</small>}
            </section>

            {conflicts.length > 0 && <section className="cloud-conflict-list"><header><AlertTriangle /><div><h2>Version conflicts</h2><p>Choose which copy should become the new baseline. No automatic overwrite is performed.</p></div></header>{conflicts.map((conflict) => <article key={conflict.localId}><div><strong>{conflict.local.name}</strong><span>{conflict.reason}</span><small>Local {new Date(conflict.local.updatedAt).toLocaleString()} · Cloud {new Date(conflict.cloud.updated_at).toLocaleString()}</small></div><button className="button" disabled={syncing} onClick={() => void resolveConflict(conflict, "pull")}><ArrowDownToLine size={14} /> Keep cloud</button><button className="button primary" disabled={syncing} onClick={() => void resolveConflict(conflict, "push")}><ArrowUpFromLine size={14} /> Keep local</button></article>)}</section>}
          </>
        )}

        {message && <p className="cloud-message success"><CheckCircle2 size={15} />{message}</p>}
        {error && <p className="cloud-message error"><AlertTriangle size={15} />{error}</p>}
      </main>
    </AppShell>
  );
}
