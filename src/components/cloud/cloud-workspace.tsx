"use client";
import { T } from "@/features/i18n/text";


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
import { listProjects, saveProject } from "@/lib/idb";
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
    if (!client) return;
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
  }, [client]);

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

  async function resolveConflict(conflict: SyncConflict, direction: "push" | "pull" | "both") {
    if (!client || !session?.user) return;
    setSyncing(true);
    setError("");
    try {
      // Keep a local copy of the losing version before changing either canonical copy.
      if (direction === "push") {
        await pullCloudProject(client, session.user.id, conflict.cloud, crypto.randomUUID());
        const pushed = await pushLocalProject(client, session.user.id, conflict.local, conflict.cloud.server_version);
        await markConflictResolved(conflict.localId, session.user.id, conflict.local, pushed);
      } else {
        const now = new Date().toISOString();
        await saveProject({ ...conflict.local, id: crypto.randomUUID(), name: `${conflict.local.name} — local backup`, createdAt: now, updatedAt: now });
        const pulled = await pullCloudProject(client, session.user.id, conflict.cloud);
        await markConflictResolved(conflict.localId, session.user.id, pulled, conflict.cloud);
      }
      setConflicts((current) => current.filter((item) => item.localId !== conflict.localId));
      setMessage(`Resolved “${conflict.local.name}”. The other version is preserved in local Projects.`);
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
            <div><span className="kicker">Local-first safety</span><h1> <T text={"Cloud Sync"} /> </h1><p> <T text={"Cloud is not configured on this deployment. Your local projects remain available."} /> </p></div>
            <CloudOff size={38} />
          </header>
          <section className="cloud-configuration-card warning">
            <AlertTriangle />
            <div><h2> <T text={"Environment configuration required"} /> </h2><p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel Preview and Production, then redeploy. Local projects remain fully functional while cloud is unavailable.</p></div>
          </section>
          <section className="cloud-security-grid">
            <article><ShieldCheck /><strong> <T text={"Owner protection required"} /> </strong><span>Configure and verify owner-isolation policies before enabling cloud access.</span></article>
            <article><HardDrive /><strong> <T text={"Private bucket"} /> </strong><span>`lumaforge-assets` accepts only authenticated owner-prefixed object paths.</span></article>
            <article><Database /><strong> <T text={"Local data preserved"} /> </strong><span>IndexedDB remains the source of continuity until a successful cloud sync.</span></article>
          </section>
          <div className="cloud-actions"><Link className="button primary" href="/projects"> <T text={"Open local projects"} /> </Link><Link className="button" href="/editor"> <T text={"Open editor"} /> </Link></div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="cloud-workspace-page">
        <header className="cloud-hero">
          <div><span className="kicker">Encrypted transport · owner-isolated rows</span><h1> <T text={"Cloud Sync"} /> </h1><p>Synchronize local originals and non-destructive recipes without replacing the local-first project cache.</p></div>
          <Cloud size={38} />
        </header>

        {loadingSession ? (
          <section className="cloud-auth-card"><LoaderCircle className="spin" /><div><h2> <T text={"Restoring session"} /> </h2><p>Checking the persisted Supabase PKCE session…</p></div></section>
        ) : !session ? (
          <section className="cloud-auth-card">
            <Mail />
            <div><h2> <T text={"Sign in with a magic link"} /> </h2><p>The authenticated user ID becomes the RLS owner and the first folder in every private Storage path.</p><div className="cloud-auth-form"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email address" /><button className="button primary" disabled={sendingLink || !email.includes("@")} onClick={() => void sendMagicLink()}>{sendingLink ? <LoaderCircle className="spin" size={15} /> : <Mail size={15} />} <T text={"Send magic link"} /> </button></div></div>
          </section>
        ) : (
          <>
            <section className="cloud-account-bar"><div><span className="cloud-online-dot" /><div><strong>{session.user.email ?? "Authenticated creator"}</strong><small>Owner ID {session.user.id}</small></div></div><button className="button" onClick={() => void signOut()}><LogOut size={15} /> <T text={"Sign out"} /> </button></section>

            <section className="cloud-stat-grid">
              <article><Database /><span> <T text={"Local projects"} /> </span><strong>{localCount}</strong><small>IndexedDB on this device</small></article>
              <article><Cloud /><span> <T text={"Cloud projects"} /> </span><strong>{cloudCount}</strong><small>RLS-visible rows only</small></article>
              <article><HardDrive /><span> <T text={"Cloud assets"} /> </span><strong>{formatBytes(usageBytes)}</strong><small>Private bucket usage</small></article>
              <article><ShieldCheck /><span> <T text={"Security"} /> </span><strong> <T text={"Owner only"} /> </strong><small>Database and Storage RLS</small></article>
            </section>

            <section className="cloud-sync-card">
              <div className="cloud-sync-heading"><div><h2>Newest-safe synchronization</h2><p>Projects changed on both sides after the last successful sync are stopped as conflicts instead of being overwritten.</p></div><button className="button" onClick={() => void refresh().catch(() => setError("Unable to refresh cloud state"))} disabled={syncing}><RefreshCw size={15} /> <T text={"Refresh"} /> </button></div>
              {progress && syncing && <div className="cloud-progress"><div><span>{progress.message}</span><output>{progress.completed}/{progress.total}</output></div><div><span style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }} /></div></div>}
              <button className="button primary cloud-sync-button" disabled={syncing} onClick={() => void runSync()}>{syncing ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} <T text={"Synchronize local and cloud projects"} /> </button>
              {lastResult && <div className="cloud-result-row"><span><ArrowUpFromLine size={14} />{lastResult.pushed} <T text={"pushed"} /> </span><span><ArrowDownToLine size={14} />{lastResult.pulled} <T text={"pulled"} /> </span><span><CheckCircle2 size={14} />{lastResult.equal} <T text={"unchanged"} /> </span><span className={lastResult.errors.length ? "danger" : ""}><AlertTriangle size={14} />{lastResult.errors.length} <T text={"errors"} /> </span></div>}
              {lastResult?.errors.map((item) => <p role="alert" key={item.localId}>{item.message}</p>)}
              {lastRefresh && <small className="cloud-last-refresh"> <T text={"Last refreshed"} /> {new Date(lastRefresh).toLocaleString()}</small>}
            </section>

            {conflicts.length > 0 && <section className="cloud-conflict-list"><header><AlertTriangle /><div><h2> <T text={"Version conflicts"} /> </h2><p>Choose which copy should become the new baseline. No automatic overwrite is performed.</p></div></header>{conflicts.map((conflict) => <article key={conflict.localId}><div><strong>{conflict.local.name}</strong><span>{conflict.reason}</span><small>Local {new Date(conflict.local.updatedAt).toLocaleString()} · Cloud {new Date(conflict.cloud.updated_at).toLocaleString()}</small></div><button className="button" disabled={syncing} onClick={() => void resolveConflict(conflict, "pull")}><ArrowDownToLine size={14} /> <T text={"Keep cloud"} /> </button><button className="button" disabled={syncing} onClick={() => void resolveConflict(conflict, "both")}> <T text={"Keep both"} /> </button><button className="button primary" disabled={syncing} onClick={() => void resolveConflict(conflict, "push")}><ArrowUpFromLine size={14} /> <T text={"Keep local"} /> </button></article>)}</section>}
          </>
        )}

        {message && <p className="cloud-message success"><CheckCircle2 size={15} /><T text={message} /></p>}
        {error && <p className="cloud-message error"><AlertTriangle size={15} /><T text={error} /></p>}
      </main>
    </AppShell>
  );
}
