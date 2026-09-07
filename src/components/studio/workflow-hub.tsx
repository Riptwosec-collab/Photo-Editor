import { T } from "@/features/i18n/text";
import Link from "next/link";
import { ArrowUpRight, Sparkles, ScanSearch, Palette, WandSparkles, Sun, Aperture, ImageUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
export function WorkflowHub({ portrait = false }: { portrait?: boolean }) {
  const tools = portrait ? [
    { title: "Portrait light", description: "ปรับแสง เงา และไฮไลต์ทั้งภาพเพื่อเริ่มแต่งภาพบุคคล", tool: "light", icon: Sun },
    { title: "Skin color balance", description: "ปรับช่วงสีส้มและสีแดงด้วย Color Mixer โดยไม่เปลี่ยนรูปหน้า", tool: "color", icon: Palette },
    { title: "Portrait looks", description: "เลือกพรีเซ็ต Portrait แล้วปรับความเข้มให้เหมาะกับภาพ", href: "/presets", icon: Aperture },
  ] : [
    { title: "Smart light analysis", description: "อ่านพิกเซลจริง วัดความสว่าง แล้วเลือกใช้ค่าปรับแสงแบบย้อนกลับได้", tool: "assistant", icon: ScanSearch },
    { title: "Prompt to edit plan", description: "พิมพ์โทนที่ต้องการเป็นไทยหรืออังกฤษ แล้วตรวจรายการปรับก่อนกดใช้", tool: "assistant", icon: Sparkles },
    { title: "Auto Enhance", description: "เลือกแนวภาพ 9 แบบ พร้อมปรับความเข้มด้วยสูตรแต่งภาพบนอุปกรณ์", tool: "auto-enhance", icon: WandSparkles },
    { title: "Creative director", description: "เลือกทิศทาง Natural, Premium, Cinematic หรือ Dramatic", tool: "ai-director", icon: Aperture },
    { title: "Reference to look", description: "ใช้ภาพอ้างอิงสร้างสูตรสีสำหรับภาพของคุณ", tool: "reverse-preset", icon: ImageUp },
    { title: "Layers & Masks", description: "ปรับเฉพาะจุดด้วยแปรง มาสก์วงกลม ไล่ระดับ และเพิ่มข้อความ", tool: "layers", icon: Palette },
    { title: "Background removal & Inpainting", description: "ส่งงานไปโมเดลที่เชื่อมต่อ ตรวจผลลัพธ์ แล้วรับเป็นเลเยอร์ใหม่", tool: "assistant", icon: Sparkles },
    { title: "Color consistency", description: "จับคู่ค่าเฉลี่ยสีระหว่างภาพเพื่อเริ่มปรับโทนให้ต่อเนื่องกัน", tool: "color-consistency", icon: Palette },
  ];
  return <AppShell><main className="studio-home"><span className="studio-kicker">{portrait ? "NATURAL PORTRAITS" : "ASSISTED CREATIVITY"}</span><div className="studio-heading"><h1>{portrait ? "Beauty Studio" : "AI Studio"}</h1><Link className="button primary" href="/editor"> <T text={"เปิดภาพ"} /> <ArrowUpRight size={16} /></Link></div><p className="hub-intro">{portrait ? "ให้แสงและสีช่วยเล่าเรื่องของคนในภาพ" : "จากไอเดีย สู่ภาพที่คุณต้องการ"}</p><div className="studio-workflows hub-tools">{tools.map(({ title, description, tool, href, icon: Icon }) => <Link className="studio-workflow" href={href ?? `/editor?tool=${tool}`} key={title}><span className="workflow-icon"><Icon size={23} /></span><ArrowUpRight size={17} className="workflow-arrow" /><h3><T text={title} /></h3><p><T text={description} /></p></Link>)}</div><section className="shortcut-card"><h2>{portrait ? "เกี่ยวกับการปรับภาพบุคคล" : "Local tools & optional cloud AI"}</h2><p>{portrait ? "เครื่องมือปรับแสงและสีมีผลกับภาพทั้งภาพ ใช้ Layers & Masks เพื่อปรับเฉพาะจุด หรือใช้ Cloud AI เมื่อตั้งค่าผู้ให้บริการแล้ว" : "การวิเคราะห์แสงใช้สถิติพิกเซล ส่วนแผนจากข้อความใช้กฎและสูตรแต่งภาพ ไม่ใช่โมเดลสร้างภาพหรือระบบจดจำวัตถุ ทุกเครื่องมือเปิดใน Editor เดียวกันเพื่อใช้ประวัติ Undo และการส่งออกร่วมกัน"}</p></section></main></AppShell>;
}
