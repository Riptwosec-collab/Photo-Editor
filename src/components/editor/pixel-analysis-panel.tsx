"use client";
import { T } from "@/features/i18n/text";

import { useEffect, useRef, useState } from "react";
import { ScanSearch } from "lucide-react";
import { analyzeImage, type PixelAnalysis } from "@/features/ai/pixel-analysis";
import { useEditorStore } from "@/features/editor/store";

export function PixelAnalysisPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const image = useEditorStore((s) => s.image);
  const apply = useEditorStore((s) => s.applyAdjustments);
  const [result, setResult] = useState<{ url: string; data: PixelAnalysis } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  async function analyze() {
    if (!image) return;
    const token = ++request.current;
    setBusy(true); setError("");
    try {
      const data = await analyzeImage(image.objectUrl);
      if (token === request.current) setResult({ url: image.objectUrl, data });
    } catch (caught) {
      if (token === request.current) setError(caught instanceof Error ? caught.message : "Analysis failed");
    } finally { if (token === request.current) setBusy(false); }
  }
  const current = result?.url === image?.objectUrl ? result?.data : null;
  return <section className="pixel-analysis"><h3><ScanSearch size={14} /> <T text={"Smart light analysis"} /> </h3><p> <T text={"วัดความสว่างจากภาพต้นฉบับบนอุปกรณ์ ไม่ส่งรูปไปเซิร์ฟเวอร์"} /> </p><button disabled={!image || busy} onClick={() => void analyze()}><T text={busy ? "Analyzing pixels…" : "Analyze photo"} /></button>{error && <p role="alert"><T text={error} /></p>}{current && <><dl><dt> <T text={"Mean luminance"} /> </dt><dd>{Math.round(current.luminance)} / 255</dd><dt> <T text={"Deep shadows"} /> </dt><dd>{current.shadows.toFixed(1)}%</dd><dt> <T text={"Bright highlights"} /> </dt><dd>{current.highlights.toFixed(1)}%</dd><dt> <T text={"Suggested exposure"} /> </dt><dd>{current.changes.exposure} EV</dd></dl><p> <T text={"ข้อเสนอเป็นการปรับแสงทั้งภาพ ค่าแสง เงา และไฮไลต์เดิมจะถูกแทนที่ ย้อนกลับได้ด้วย Undo"} /> </p><div className="pixel-actions"><button onClick={() => { apply(current.changes); onNotice("Measured light correction applied — Undo to revert"); }}> <T text={"Apply light correction"} /> </button></div></>}</section>;
}
