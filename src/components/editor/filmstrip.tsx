"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clipboard,
  Copy,
  Filter,
  Flag,
  Grid3X3,
  Heart,
  ListFilter,
  Star,
  X,
} from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { StoredProject } from "@/features/editor/types";
import { listProjects, saveProject } from "@/lib/idb";
import { cn } from "@/lib/cn";

const colorOptions = ["none", "red", "orange", "yellow", "green", "blue", "purple"] as const;
type ColorLabel = (typeof colorOptions)[number];
type FilmstripEntryMeta = { rating: number; color: ColorLabel; favorite: boolean; rejected: boolean };
type FilmstripMeta = Record<string, FilmstripEntryMeta>;
const DEFAULT_META: FilmstripEntryMeta = { rating: 0, color: "none", favorite: false, rejected: false };

type FilmstripItem = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  project?: StoredProject;
  current?: boolean;
};

export function Filmstrip({ onNotice }: { onNotice: (message: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const image = useEditorStore((state) => state.image);
  const currentProjectId = useEditorStore((state) => state.currentProjectId);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const [projects, setProjects] = useState<Array<StoredProject & { objectUrl: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [filter, setFilter] = useState<"all" | "edited" | "favorite" | "rejected">("all");
  const [meta, setMeta] = useState<FilmstripMeta>({});
  const [colorMenu, setColorMenu] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lumaforge-filmstrip-meta-v1");
      if (stored) setMeta(JSON.parse(stored) as FilmstripMeta);
    } catch {
      // Ignore invalid local metadata and start clean.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lumaforge-filmstrip-meta-v1", JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    void listProjects({ includeArchived: false }).then((rows) => {
      if (!active) return;
      const hydrated = rows.map((project) => {
        const objectUrl = URL.createObjectURL(project.imageBlob);
        urls.push(objectUrl);
        return { ...project, objectUrl };
      });
      setProjects(hydrated);
    });
    return () => {
      active = false;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [currentProjectId, image]);

  const items = useMemo(() => {
    const rows: FilmstripItem[] = [];
    if (image) {
      rows.push({
        id: currentProjectId ?? "current-draft",
        name: image.name,
        src: image.objectUrl,
        width: image.width,
        height: image.height,
        current: true,
      });
    }
    for (const project of projects) {
      if (project.id === currentProjectId) continue;
      rows.push({
        id: project.id,
        name: project.name,
        src: project.objectUrl,
        width: project.width,
        height: project.height,
        project,
      });
    }
    const filtered = rows.filter((item) => {
      const itemMeta = meta[item.id];
      if (filter === "favorite") return itemMeta?.favorite;
      if (filter === "rejected") return itemMeta?.rejected;
      if (filter === "edited") return item.current || Boolean(item.project);
      return true;
    });
    return filtered.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : Number(Boolean(b.current)) - Number(Boolean(a.current)),
    );
  }, [currentProjectId, filter, image, meta, projects, sort]);

  function selectItem(event: React.MouseEvent, id: string) {
    const ids = items.map((item) => item.id);
    if (event.shiftKey && anchor) {
      const start = ids.indexOf(anchor);
      const end = ids.indexOf(id);
      if (start !== -1 && end !== -1) {
        const range = ids.slice(Math.min(start, end), Math.max(start, end) + 1);
        setSelected(Array.from(new Set([...selected, ...range])));
        return;
      }
    }
    if (event.metaKey || event.ctrlKey) {
      setSelected((state) => state.includes(id) ? state.filter((item) => item !== id) : [...state, id]);
      setAnchor(id);
      return;
    }
    setSelected([id]);
    setAnchor(id);
  }

  function updateSelectedMeta(values: Partial<FilmstripEntryMeta>) {
    if (!selected.length) return;
    setMeta((state) => {
      const next = { ...state };
      for (const id of selected) {
        const current = next[id] ?? DEFAULT_META;
        next[id] = {
          rating: values.rating ?? current.rating,
          color: values.color ?? current.color,
          favorite: values.favorite ?? current.favorite,
          rejected: values.rejected ?? current.rejected,
        };
      }
      return next;
    });
  }

  async function copySettings() {
    const payload = JSON.stringify({ version: 1, adjustments, geometry });
    localStorage.setItem("lumaforge-copied-settings", payload);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Local copy remains available even if clipboard permission is denied.
    }
    onNotice("Edit settings copied");
  }

  function pasteSettings() {
    const stored = localStorage.getItem("lumaforge-copied-settings");
    if (!stored) {
      onNotice("No copied settings found");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { adjustments?: typeof adjustments };
      if (!parsed.adjustments) throw new Error("Invalid settings");
      apply(parsed.adjustments);
      onNotice("Copied settings applied as one undoable step");
    } catch {
      onNotice("Copied settings are invalid");
    }
  }

  async function syncEdits() {
    const targets = projects.filter((project) => selected.includes(project.id));
    if (!targets.length) {
      onNotice("Select saved projects to sync edits");
      return;
    }
    await Promise.all(
      targets.map((project) =>
        saveProject({
          ...project,
          adjustments: { ...adjustments },
          geometry: { ...geometry },
          updatedAt: new Date().toISOString(),
        }),
      ),
    );
    onNotice(`Synced edits to ${targets.length} project${targets.length === 1 ? "" : "s"}`);
  }

  const selectedRating = selected.length ? meta[selected[0]]?.rating ?? 0 : 0;

  return (
    <section className="professional-filmstrip" aria-label="Project filmstrip">
      <header className="filmstrip-toolbar">
        <div className="filmstrip-left-controls">
          <button className="filmstrip-icon" title="Grid view"><Grid3X3 size={14} /></button>
          <label className="filmstrip-select"><span>Album</span><select aria-label="Album selector"><option>All Photos</option><option>Current Project</option></select></label>
          <span className="filmstrip-count">{items.length} photos</span>
          <span className="filmstrip-selected">{selected.length} selected</span>
        </div>
        <div className="filmstrip-middle-controls">
          <div className="rating-control" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} className={selectedRating >= value ? "active" : ""} disabled={!selected.length} onClick={() => updateSelectedMeta({ rating: value })} aria-label={`${value} stars`}><Star size={13} fill={selectedRating >= value ? "currentColor" : "none"} /></button>
            ))}
          </div>
          <button className={selected.some((id) => meta[id]?.rejected) ? "filmstrip-icon active danger" : "filmstrip-icon"} disabled={!selected.length} title="Reject selected" onClick={() => updateSelectedMeta({ rejected: !selected.some((id) => meta[id]?.rejected) })}><Flag size={14} /></button>
          <div className="color-label-menu">
            <button className="filmstrip-icon" disabled={!selected.length} title="Color label" onClick={() => setColorMenu((value) => !value)}><ListFilter size={14} /></button>
            {colorMenu && <div className="color-label-popover">{colorOptions.map((color) => <button key={color} aria-label={`${color} label`} className={`color-label ${color}`} onClick={() => { updateSelectedMeta({ color }); setColorMenu(false); }}>{color === "none" ? <X size={12} /> : selected.some((id) => meta[id]?.color === color) ? <Check size={12} /> : null}</button>)}</div>}
          </div>
          <button className={selected.some((id) => meta[id]?.favorite) ? "filmstrip-icon active favorite" : "filmstrip-icon"} disabled={!selected.length} title="Favorite selected" onClick={() => updateSelectedMeta({ favorite: !selected.some((id) => meta[id]?.favorite) })}><Heart size={14} fill={selected.some((id) => meta[id]?.favorite) ? "currentColor" : "none"} /></button>
        </div>
        <div className="filmstrip-right-controls">
          <button className="filmstrip-text-button" onClick={() => void syncEdits()}><Copy size={13} /> Sync edits</button>
          <button className="filmstrip-icon" onClick={() => void copySettings()} title="Copy settings"><Copy size={14} /></button>
          <button className="filmstrip-icon" onClick={pasteSettings} title="Paste settings"><Clipboard size={14} /></button>
          <button className="filmstrip-icon" title={`Sort: ${sort}`} onClick={() => setSort((value) => value === "recent" ? "name" : "recent")}><ArrowUpDown size={14} /></button>
          <button className="filmstrip-icon" title={`Filter: ${filter}`} onClick={() => setFilter((value) => value === "all" ? "edited" : value === "edited" ? "favorite" : value === "favorite" ? "rejected" : "all")}><Filter size={14} /></button>
        </div>
      </header>

      <div className="filmstrip-scroller-wrap">
        <button className="filmstrip-scroll-button left" aria-label="Scroll filmstrip left" onClick={() => scrollRef.current?.scrollBy({ left: -420, behavior: "smooth" })}><ArrowLeft size={15} /></button>
        <div className="filmstrip-scroller" ref={scrollRef} tabIndex={0} onKeyDown={(event) => {
          const ids = items.map((item) => item.id);
          const current = selected.length ? ids.indexOf(selected[selected.length - 1]) : -1;
          if (event.key === "ArrowRight") setSelected([ids[Math.min(ids.length - 1, current + 1)]].filter(Boolean));
          if (event.key === "ArrowLeft") setSelected([ids[Math.max(0, current - 1)]].filter(Boolean));
        }}>
          {items.map((item, index) => {
            const itemMeta = meta[item.id] ?? DEFAULT_META;
            return (
              <button
                key={`${item.id}-${index}`}
                className={cn("filmstrip-thumbnail", selected.includes(item.id) && "selected", item.current && "current", itemMeta.rejected && "rejected")}
                onClick={(event) => selectItem(event, item.id)}
                title={`${item.name} · ${item.width} × ${item.height}`}
              >
                <span className="thumbnail-image-wrap"><img src={item.src} alt="" /><span className={`thumbnail-color-label ${itemMeta.color}`} /></span>
                <span className="thumbnail-name">{item.name}</span>
                <span className="thumbnail-meta">{item.width}×{item.height}</span>
                <span className="thumbnail-badges">
                  {item.current && <b>EDITING</b>}
                  {item.project && <b className="edited-badge">EDITED</b>}
                  {itemMeta.favorite && <Heart size={11} fill="currentColor" />}
                  {itemMeta.rejected && <Flag size={11} />}
                  {itemMeta.rating > 0 && <span><Star size={10} fill="currentColor" />{itemMeta.rating}</span>}
                </span>
              </button>
            );
          })}
          {!items.length && <div className="filmstrip-empty">Import or save photos to populate the filmstrip.</div>}
        </div>
        <button className="filmstrip-scroll-button right" aria-label="Scroll filmstrip right" onClick={() => scrollRef.current?.scrollBy({ left: 420, behavior: "smooth" })}><ArrowRight size={15} /></button>
      </div>
    </section>
  );
}
