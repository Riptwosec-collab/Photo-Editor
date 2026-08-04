import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  Construction,
  Database,
  ListChecks,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

const redirects: Record<string, string> = {
  "photo-editor": "/editor",
  ai: "/ai-studio",
  beauty: "/beauty-studio",
  batch: "/batch-edit",
  exports: "/export-center",
  looks: "/presets",
  library: "/gallery",
};

const sections = {
  "ai-studio": {
    title: "AI Studio",
    icon: Bot,
    status: "PARTIAL",
    summary: "One unified AI workspace owns scene understanding, conversational planning, AI Director, Auto Enhance, reference presets and color consistency. Local operations are functional; trained cloud vision and generative providers remain unconnected.",
    ready: ["Unified AI Assistant", "AI Director workflow", "Nine Auto Enhance modes", "Reference-image recipe generation", "Cross-photo color matching"],
    next: ["Real vision provider", "Durable server job queue", "Credits and audit ledger", "Generative object workflows"],
  },
  "beauty-studio": {
    title: "Beauty Studio",
    icon: Sparkles,
    status: "PLANNED",
    summary: "The canonical portrait workspace will reuse the Editor history, mask and rendering engines. Identity preservation rules are active in AI planning, but face segmentation and local beauty rendering are not presented as complete.",
    ready: ["Identity and skin-tone locks", "Portrait-safe Auto Enhance mode", "Texture-preserving global controls"],
    next: ["Face and skin segmentation", "Per-person masks", "Natural retouch controls", "Background and makeup modules"],
  },
  "batch-edit": {
    title: "Batch Edit",
    icon: ListChecks,
    status: "PARTIAL",
    summary: "The existing Batch workflow remains the single canonical batch system. It processes real browser-supported images and presets; AI culling, durable pause and per-image override management remain incomplete.",
    ready: ["Multi-file queue", "Shared renderer", "Preset application", "Progress and stop-after-current"],
    next: ["Durable pause/resume", "AI culling", "Duplicate grouping", "Per-image overrides"],
  },
  cloud: {
    title: "Cloud",
    icon: Cloud,
    status: "BLOCKED",
    summary: "Local-first projects, snapshots, presets and export history are functional. Supabase restoration and owner-isolation validation must complete before cloud sync can be labeled operational.",
    ready: ["IndexedDB offline persistence", "Cloud-aware UI states", "Draft Supabase schema and RLS"],
    next: ["Apply migrations", "Permission-test RLS", "Private asset storage", "Conflict-safe synchronization"],
  },
  marketplace: {
    title: "Marketplace",
    icon: ShoppingBag,
    status: "NOT STARTED",
    summary: "Marketplace is the only canonical discovery destination. No fake products, payments, purchases or entitlements are shown.",
    ready: ["Canonical route and navigation ownership", "Preset JSON import/export foundation"],
    next: ["Catalog and seller schema", "Verified checkout", "Entitlement checks", "Moderation and reporting"],
  },
  settings: {
    title: "Settings",
    icon: Settings,
    status: "PARTIAL",
    summary: "Local editor state, reduced-motion support and responsive layout preferences persist. Account, privacy, cloud storage and processing settings require the cloud foundation.",
    ready: ["Local autosave", "Collapsible panels", "Reduced-motion handling", "Responsive navigation"],
    next: ["Cloud and privacy controls", "Storage management", "Performance mode", "Account deletion"],
  },
  community: {
    title: "Community moved",
    icon: Database,
    status: "CONSOLIDATED",
    summary: "Community is no longer a main navigation destination. Future public discovery belongs inside Marketplace, while private collaboration belongs inside Projects and Share.",
    ready: ["Duplicate navigation removed", "Clear product ownership"],
    next: ["Project collaboration", "Marketplace discovery", "Moderation controls"],
  },
} as const;

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const destination = redirects[section];
  if (destination) redirect(destination);
  const data = sections[section as keyof typeof sections];
  if (!data) notFound();
  const Icon = data.icon;
  return (
    <AppShell>
      <main className="module-page">
        <div className="module-head">
          <div>
            <span className="kicker">Canonical product area</span>
            <h1>{data.title}</h1>
            <p>{data.summary}</p>
          </div>
          <span className={`status-pill ${data.status.toLowerCase().replaceAll(" ", "-")}`}>{data.status}</span>
        </div>
        <div className="module-grid">
          <section className="module-card">
            <CheckCircle2 />
            <h2>Available now</h2>
            <ul>{data.ready.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="module-card">
            <Construction />
            <h2>Required next</h2>
            <ul>{data.next.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="module-card truth">
            <ShieldAlert />
            <h2>Evidence-qualified state</h2>
            <p>Unconnected backend, trained AI, payment and collaboration capabilities remain visibly labeled instead of returning simulated success.</p>
          </section>
        </div>
        <div className="module-actions">
          <Link className="button primary" href="/editor"><Icon size={16} /> Open unified editor <ArrowRight size={16} /></Link>
          {section === "community" && <Link className="button" href="/marketplace">Open Marketplace</Link>}
        </div>
      </main>
    </AppShell>
  );
}
