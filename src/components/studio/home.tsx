"use client";
import { T } from "@/features/i18n/text";


import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Aperture, ArrowRight, Sparkles, SlidersHorizontal, Layers3, Clock3, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listProjects } from "@/lib/idb";

const workflows = [
  { href: "/editor", icon: SlidersHorizontal, title: "Photo editor", caption: "แสง สี และรายละเอียด", color: "blue" },
  { href: "/ai-studio", icon: Sparkles, title: "AI assistant", caption: "จากไอเดียสู่แผนแต่งภาพ", color: "violet" },
  { href: "/presets", icon: Aperture, title: "Your signature look", caption: "พรีเซ็ตและโทนสีของคุณ", color: "amber" },
  { href: "/batch", icon: Layers3, title: "Batch studio", caption: "แต่งหลายภาพในครั้งเดียว", color: "mint" },
];

export function StudioHome() {
  const [recent, setRecent] = useState<Array<{ id: string; name: string; width: number; height: number }>>([]);
  const [status, setStatus] = useState("กำลังโหลดโปรเจกต์…");
  useEffect(() => {
    let active = true;
    listProjects().then((items) => {
      if (!active) return;
      setRecent(items.slice(0, 4));
      setStatus(items.length ? `${items.length} โปรเจกต์บนอุปกรณ์นี้` : "พื้นที่สำหรับไอเดียต่อไปของคุณ");
    }).catch(() => { if (active) setStatus("อ่านโปรเจกต์ไม่ได้ ลองเปิดหน้า Projects อีกครั้ง"); });
    return () => { active = false; };
  }, []);
  return <AppShell><main className="studio-home">
    <header className="studio-heading"><div><span className="studio-kicker"> <T text={"YOUR CREATIVE SPACE"} /> </span><h1> <T text={"ให้ทุกภาพ เล่าเรื่องของคุณ"} /> <span>.</span></h1></div><Link className="button" href="/projects"><Clock3 size={16} /> <T text={"Projects"} /> </Link></header>
    <section className="studio-hero">
      <div className="studio-hero-copy"><span className="studio-kicker"><span className="live-dot" /> LUMAFORGE STUDIO</span><h2> <T text={"A little light."} /> <br /> <T text={"A whole new"} /> <em> <T text={"feeling."} /> </em></h2><p> <T text={"ปรับแสง สร้างโทนสี และทดลองไอเดียใหม่"} /> <br /> <T text={"ทุกการแก้ไขย้อนกลับได้ ต้นฉบับอยู่ครบ"} /> </p><div className="hero-actions"><Link className="button primary" href="/editor"> <T text={"เริ่มแต่งภาพ"} /> <ArrowRight size={18} /></Link><Link className="studio-text-link" href="/ai-studio"> <T text={"สำรวจ AI Studio"} /> <ArrowUpRight size={16} /></Link></div><small> <T text={"JPG · PNG · WebP / ทำงานบนเบราว์เซอร์"} /> </small></div>
      <div className="studio-art" aria-label="Abstract light study: flowing blue and violet ribbons" role="img"><div className="light-orbit orbit-one" /><div className="light-orbit orbit-two" /><div className="light-orbit orbit-three" /><div className="art-grain" /><span className="art-caption">LIGHT STUDY — 001<br /><b> <T text={"Find your own atmosphere."} /> </b></span><span className="art-coordinate">COLOR / FORM / LIGHT</span></div>
    </section>
    <div className="studio-section-title"><h2> <T text={"เริ่มสร้างสรรค์"} /> </h2><span> <T text={"เครื่องมือที่เชื่อมถึงกัน"} /> </span></div>
    <section className="studio-workflows">{workflows.map(({ href, icon: Icon, title, caption, color }) => <Link href={href} className={`studio-workflow ${color}`} key={href}><span className="workflow-icon"><Icon size={23} /></span><ArrowUpRight className="workflow-arrow" size={17} /><h3>{title}</h3><p>{caption}</p></Link>)}</section>
    <div className="studio-section-title"><div><h2> <T text={"กลับไปแต่งต่อ"} /> </h2><span>{status}</span></div><Link href="/projects"> <T text={"ดูทั้งหมด"} /> <ArrowRight size={15} /></Link></div>
    <section className="studio-recent">{recent.length ? recent.map((project) => <Link key={project.id} href={`/editor?project=${encodeURIComponent(project.id)}`} className="recent-project"><span className="recent-icon"><Aperture size={26} /></span><div><strong>{project.name}</strong><small>{project.width} × {project.height}</small></div><ArrowUpRight size={16} /></Link>) : <div className="studio-empty"><Layers3 size={25} /><div><strong> <T text={"เริ่มจากภาพที่คุณชอบ"} /> </strong><p> <T text={"เปิดภาพแล้วกด Save เพื่อกลับมาแต่งต่อได้จากที่นี่"} /> </p></div><Link href="/editor" className="button"> <T text={"เปิดภาพ"} /> <ArrowRight size={16} /></Link></div>}</section>
    <footer className="studio-footnote"><ShieldCheck size={15} /> <T text={"แต่งภาพและบันทึกบนอุปกรณ์ได้โดยไม่ต้องเข้าสู่ระบบ"} /> <Link href="/cloud"> <T text={"จัดการคลาวด์"} /> <ArrowUpRight size={13} /></Link></footer>
  </main></AppShell>;
}
