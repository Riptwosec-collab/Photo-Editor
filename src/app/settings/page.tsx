"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePreferences } from "@/features/studio/preferences";
import { Gauge, Activity, Save, HardDrive } from "lucide-react";
export default function SettingsPage() {
  const preferences = usePreferences();
  const [storage, setStorage] = useState("กำลังตรวจสอบ…");
  useEffect(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => setStorage(`${(usage / 1048576).toFixed(1)} MB / ${(quota / 1073741824).toFixed(1)} GB`)).catch(() => setStorage("ไม่สามารถอ่านพื้นที่จัดเก็บได้"));
  }, []);
  return <AppShell><main className="studio-home settings-page"><span className="studio-kicker">MAKE IT YOURS</span><h1>Settings</h1><p>ปรับสตูดิโอให้เหมาะกับอุปกรณ์และวิธีทำงานของคุณ</p><section className="settings-list">{[
    { key: "performanceMode" as const, icon: Gauge, title: "Performance mode", detail: "ลดขนาดพรีวิวเหลือ 1,000 พิกเซล และลดเอฟเฟกต์กระจก เพื่อให้ปรับภาพได้ไวขึ้น คุณภาพส่งออกยังใช้ค่าที่เลือก" },
    { key: "reducedMotion" as const, icon: Activity, title: "Reduce motion", detail: "ลดการเคลื่อนไหวและแอนิเมชัน ระบบเคารพการตั้งค่าลดการเคลื่อนไหวของอุปกรณ์ด้วย" },
    { key: "autosave" as const, icon: Save, title: "Autosave saved projects", detail: "บันทึกการแก้ไขหลังหยุดปรับ 1.4 วินาที สำหรับโปรเจกต์ที่เคยกด Save แล้ว" },
  ].map(({ key, icon: Icon, title, detail }) => <label className="setting-row" key={key}><Icon size={22} /><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" role="switch" aria-label={title} checked={preferences[key]} onChange={(event) => preferences.setPreference(key, event.target.checked)} /></label>)}</section><section className="setting-row storage-summary"><HardDrive size={22} /><span><strong>พื้นที่เบราว์เซอร์ที่ใช้ / โควตาประมาณ</strong><small>{storage}</small><small>เป็นพื้นที่รวมของเว็บไซต์บนอุปกรณ์นี้ เก็บไฟล์ส่งออกสำรองไว้ก่อนล้างข้อมูลเบราว์เซอร์</small></span></section><section className="shortcut-card"><h2>Keyboard shortcuts</h2><p><kbd>Ctrl / ⌘ K</kbd> ค้นหาเมนู <kbd>Ctrl / ⌘ S</kbd> บันทึก <kbd>Ctrl / ⌘ Z</kbd> ย้อนกลับ <kbd>\</kbd> ดูต้นฉบับ</p></section></main></AppShell>;
}
