import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal, UploadCloud } from "lucide-react";

const features = [
  [SlidersHorizontal, "Pixel-level manual controls", "Exposure, contrast, color, detail, vignette and grain render through Canvas."],
  [Sparkles, "Transparent AI plans", "Local demo plans are labeled clearly and never presented as cloud AI."],
  [ShieldCheck, "Non-destructive workflow", "Original uploads remain unchanged while adjustments and history are stored separately."]
] as const;

export default function LandingPage() {
  return (
    <main className="landing-shell">
      <nav className="marketing-nav"><strong>LumaForge</strong><div><Link href="/editor">Editor</Link><Link href="/projects">Projects</Link></div></nav>
      <section className="hero">
        <div className="eyebrow"><Sparkles size={15}/> Professional editing, powered by transparent AI</div>
        <h1>แต่งภาพระดับมืออาชีพ<br/><span>โดยไม่ทำลายต้นฉบับ</span></h1>
        <p>อัปโหลดภาพ ปรับแสงและสีด้วย Canvas จริง ย้อนกลับทุกขั้นตอน ใช้ Preset และสร้าง AI edit plan ที่อธิบายสิ่งที่จะเปลี่ยนก่อนกดใช้</p>
        <div className="hero-actions"><Link className="button primary" href="/editor"><UploadCloud size={18}/> เริ่มแต่งภาพ</Link><Link className="button" href="/ai-studio">สำรวจ AI Studio <ArrowRight size={17}/></Link></div>
        <div className="truth-badge">Current release: functional browser editor MVP — advanced cloud AI, RAW and collaboration remain planned.</div>
      </section>
      <section className="feature-grid">{features.map(([Icon,title,body])=><article className="feature-card" key={title}><Icon/><h2>{title}</h2><p>{body}</p></article>)}</section>
    </main>
  );
}
