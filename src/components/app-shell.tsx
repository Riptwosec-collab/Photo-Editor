"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Aperture,
  Bot,
  Cloud,
  Download,
  FolderKanban,
  HardDrive,
  Home,
  Images,
  Layers3,
  ListChecks,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { useStudioStore } from "@/features/studio/store";
import { cn } from "@/lib/cn";

const groups = [
  {
    label: "Primary",
    items: [
      ["/", "Home", Home],
      ["/editor", "Editor", Aperture],
      ["/ai-studio", "AI Studio", Bot],
      ["/beauty-studio", "Beauty Studio", Sparkles],
      ["/presets", "Presets", Palette],
      ["/batch-edit", "Batch Edit", ListChecks],
    ],
  },
  {
    label: "Library",
    items: [
      ["/gallery", "Gallery", Images],
      ["/projects", "Projects", FolderKanban],
    ],
  },
  {
    label: "Discover",
    items: [["/marketplace", "Marketplace", ShoppingBag]],
  },
  {
    label: "Output",
    items: [
      ["/export-center", "Export Center", Download],
      ["/cloud", "Cloud", Cloud],
    ],
  },
  {
    label: "System",
    items: [["/settings", "Settings", Settings]],
  },
] as const;

const mobileItems = [
  ["/", "Home", Home],
  ["/ai-studio", "AI", Bot],
  ["/editor", "Edit", Aperture],
  ["/gallery", "Gallery", Images],
  ["/auth", "Profile", UserRound],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useStudioStore((state) => state.sidebarCollapsed);
  const setCollapsed = useStudioStore((state) => state.setSidebarCollapsed);
  const editorMode = pathname.startsWith("/editor");
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed", editorMode && "editor-mode")}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand-row">
          <Link className="brand" href="/" title="LumaForge AI Studio">
            <span className="brand-mark"><Layers3 size={17} /></span>
            <span className="brand-copy"><strong>LumaForge</strong><small>AI Studio</small></span>
          </Link>
          <button
            type="button"
            className="sidebar-collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="desktop-navigation">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(([href, label, Icon]) => (
                <Link
                  className={cn("nav-item", isActive(href) && "active")}
                  href={href}
                  key={href}
                  title={collapsed ? label : undefined}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-account-stack">
          <div className="resource-card" title="Local cache usage">
            <div className="resource-head"><HardDrive size={14} /><span>Cloud storage</span><b>1.8 / 10 GB</b></div>
            <div className="resource-track"><span style={{ width: "18%" }} /></div>
          </div>
          <div className="resource-card credit-card" title="AI credits are simulated until a provider is connected">
            <div className="resource-head"><Zap size={14} /><span>AI credits</span><b>340</b></div>
            <small>Local demo mode</small>
          </div>
          <Link className="account-card" href="/auth">
            <span className="account-avatar">LF</span>
            <span className="account-copy"><strong>Local Creator</strong><small>Free plan · Synced locally</small></span>
            <span className="sync-indicator" aria-label="Local sync ready" />
          </Link>
        </div>
      </aside>

      <section className="app-content">{children}</section>

      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {mobileItems.map(([href, label, Icon]) => (
          <Link
            href={href}
            key={href}
            className={cn(isActive(href) && "active")}
            aria-current={isActive(href) ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
