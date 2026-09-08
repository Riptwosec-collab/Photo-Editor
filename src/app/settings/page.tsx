"use client";
import { OfflineSettings } from "@/components/offline-settings";
import { T } from "@/features/i18n/text";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { usePreferences } from "@/features/studio/preferences";
import { Gauge, Activity, Save, HardDrive } from "lucide-react";
const subscribeReady = () => () => {};
export default function SettingsPage() {
  const preferences = usePreferences();
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const [storage, setStorage] = useState("กำลังตรวจสอบ…");
  useEffect(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => setStorage(`${(usage / 1048576).toFixed(1)} MB / ${(quota / 1073741824).toFixed(1)} GB`)).catch(() => setStorage("ไม่สามารถอ่านพื้นที่จัดเก็บได้"));
  }, []);
  return <AppShell><main className="studio-home settings-page"><span className="studio-kicker">MAKE IT YOURS</span><h1> <T text={"Settings"} /> </h1><p> <T text={"ปรับสตูดิโอให้เหมาะกับอุปกรณ์และวิธีทำงานของคุณ"} /> </p><fieldset className="settings-list" disabled={!ready}><label className="setting-row"><span> <T text={"Theme"} /> </span><select aria-label="Theme" value={preferences.theme} onChange={(e) => preferences.setTheme(e.target.value as "midnight" | "blue-glass" | "graphite")}><option value="blue-glass">Blue Glass</option><option value="midnight">Midnight</option><option value="graphite">Graphite</option></select></label><label className="setting-row"><span> <T text={"Language / ภาษา"} /> </span><select aria-label="Language" value={preferences.language} onChange={(e) => preferences.setLanguage(e.target.value as "th" | "en")}><option value="th">ไทย</option><option value="en">English</option></select></label><label className="setting-row"><span> <T text={"Mobile panel height"} /> </span><input aria-label="Mobile panel height" type="range" min="40" max="85" value={preferences.panelHeight} onChange={(e) => preferences.setPanelHeight(+e.target.value)} /></label>{[
    { key: "performanceMode" as const, icon: Gauge, title: "Performance mode", detail: "ลดขนาดพรีวิวเหลือ 1,000 พิกเซล และลดเอฟเฟกต์กระจก เพื่อให้ปรับภาพได้ไวขึ้น คุณภาพส่งออกยังใช้ค่าที่เลือก" },
    { key: "reducedMotion" as const, icon: Activity, title: "Reduce motion", detail: "ลดการเคลื่อนไหวและแอนิเมชัน ระบบเคารพการตั้งค่าลดการเคลื่อนไหวของอุปกรณ์ด้วย" },
    { key: "autosave" as const, icon: Save, title: "Autosave saved projects", detail: "บันทึกการแก้ไขหลังหยุดปรับ 1.4 วินาที สำหรับโปรเจกต์ที่เคยกด Save แล้ว" },
  ].map(({ key, icon: Icon, title, detail }) => <label className="setting-row" key={key}><Icon size={22} /><span><strong><T text={title} /></strong><small><T text={detail} /></small></span><input type="checkbox" role="switch" aria-label={title} checked={preferences[key]} onChange={(event) => preferences.setPreference(key, event.target.checked)} /></label>)}</fieldset><section className="setting-row storage-summary"><HardDrive size={22} /><span><strong> <T text={"พื้นที่เบราว์เซอร์ที่ใช้ / โควตาประมาณ"} /> </strong><small>{storage}</small><small> <T text={"เป็นพื้นที่รวมของเว็บไซต์บนอุปกรณ์นี้ เก็บไฟล์ส่งออกสำรองไว้ก่อนล้างข้อมูลเบราว์เซอร์"} /> </small></span></section><OfflineSettings/><section className="shortcut-card"><h2> <T text={"Keyboard shortcuts"} /> </h2><p><kbd>Ctrl / ⌘ K</kbd> <T text={"ค้นหาเมนู"} /> <kbd>Ctrl / ⌘ S</kbd> <T text={"บันทึก"} /> <kbd>Ctrl / ⌘ Z</kbd> <T text={"ย้อนกลับ"} /> <kbd>\</kbd> <T text={"ดูต้นฉบับ"} /> </p></section></main></AppShell>;
}
