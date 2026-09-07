"use client";

import { useEffect, useRef, useState } from "react";
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
  Search,
  X,
} from "lucide-react";
import { useStudioStore } from "@/features/studio/store";
import { cn } from "@/lib/cn";

const groups: Array<{ label: string; items: Array<[string, string, typeof Home]> }> = [
  {
    label: "Primary",
    items: [
      ["/", "Home", Home],
      ["/editor", "Editor", Aperture],
      ["/ai-studio", "AI Studio", Bot],
      ["/beauty-studio", "Beauty Studio", Sparkles],
      ["/presets", "Presets", Palette],
      ["/batch", "Batch Edit", ListChecks],
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
];

const mobileItems = [
  ["/", "Home", Home],
  ["/ai-studio", "AI", Bot],
  ["/editor", "Edit", Aperture],
  ["/gallery", "Gallery", Images],
  ["/auth", "Profile", UserRound],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const openMenu = () => { setQuery(""); menu.current?.showModal(); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (menu.current?.open) menu.current.close();
        else menu.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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

        <button className="studio-menu-trigger" onClick={openMenu} title="Search menus (Ctrl/⌘ K)"><Search size={16} /><span>Search menus</span></button>
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
          <div className="resource-card" title="Projects are stored in this browser">
            <div className="resource-head"><HardDrive size={14} /><span>Device storage</span><b>LOCAL</b></div>
          </div>
          <Link className="account-card" href="/auth">
            <span className="account-avatar">LF</span>
            <span className="account-copy"><strong>Local Creator</strong><small>Projects on this device</small></span>
            <span className="sync-indicator" aria-label="Local workspace" />
          </Link>
        </div>
      </aside>

      <a className="skip-link" href="#workspace-content">Skip to content</a>
      <section id="workspace-content" className="app-content">{children}</section>

      <dialog ref={menu} className="studio-command-menu" aria-labelledby="menu-title" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <div className="command-heading"><h2 id="menu-title">Explore your studio</h2><button aria-label="Close menu" onClick={() => menu.current?.close()}><X size={20} /></button></div>
        <label className="command-search"><Search size={18} /><input autoFocus placeholder="Search tools and pages…" aria-label="Search menus" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="command-results">{groups.flatMap((group) => group.items).filter(([, label]) => label.toLowerCase().includes(query.toLowerCase())).map(([href, label, Icon]) => <Link href={href} key={href} onClick={() => menu.current?.close()}><Icon size={19} /><span>{label}</span><small>Open →</small></Link>)}{!groups.flatMap((group) => group.items).some(([, label]) => label.toLowerCase().includes(query.toLowerCase())) && <p>No matching tools. Try “Editor” or “Cloud”.</p>}<Link href="/auth" onClick={() => menu.current?.close()}><UserRound size={19} /><span>Account / Sign in</span></Link></div>
      </dialog>
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {mobileItems.slice(0, 4).map(([href, label, Icon]) => (
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
        <button onClick={openMenu} aria-label="All menus"><Search size={19} /><span>More</span></button>
      </nav>
    </div>
  );
}
