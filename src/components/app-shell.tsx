"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Aperture,
  Bot,
  Download,
  FolderKanban,
  Images,
  LayoutDashboard,
  ListChecks,
  Palette,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  ["/", "Home", LayoutDashboard],
  ["/editor", "Editor", Aperture],
  ["/ai-studio", "AI Studio", Bot],
  ["/beauty", "Beauty", Sparkles],
  ["/batch", "Batch", ListChecks],
  ["/gallery", "Gallery", Images],
  ["/projects", "Projects", FolderKanban],
  ["/export-center", "Export", Download],
  ["/presets", "Presets", Palette],
  ["/community", "Community", Users],
  ["/marketplace", "Marketplace", ShoppingBag],
  ["/settings", "Settings", Settings],
  ["/auth", "Profile", UserRound],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">L</span><span>LumaForge</span></Link>
        <nav>
          {items.map(([href, label, Icon]) => (
            <Link className={cn("nav-item", pathname === href && "active")} href={href} key={href}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="status-dot" /> Local editor ready</div>
      </aside>
      <section className="app-content">{children}</section>
    </div>
  );
}
