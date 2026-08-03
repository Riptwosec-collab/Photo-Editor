"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ClipboardPaste, ImagePlus, LoaderCircle } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 30 * 1024 * 1024;

async function decodeDimensions(file: File, objectUrl: string) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Some headless/browser decoders reject otherwise valid images. Fall back to Image.decode().
    }
  }
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export function ImportZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const setImage = useEditorStore((state) => state.setImage);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState(
    "File picker, drag and drop, clipboard or camera",
  );

  const load = useCallback(
    async (file?: File, source = "file") => {
      if (!file) return;
      setError("");
      if (!allowed.has(file.type)) {
        setError("รองรับ JPG, PNG และ WebP ใน MVP นี้");
        return;
      }
      if (file.size > maxSize) {
        setError("ไฟล์ต้องไม่เกิน 30 MB");
        return;
      }
      setLoading(true);
      setSourceLabel(`Reading from ${source}…`);
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
        const dimensions = await decodeDimensions(file, objectUrl);
        if (!dimensions.width || !dimensions.height) {
          throw new Error("Image dimensions are unavailable");
        }
        setImage({
          name:
            file.name ||
            `clipboard-${Date.now()}.${file.type === "image/png" ? "png" : "jpg"}`,
          type: file.type,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
          objectUrl,
        });
        objectUrl = null;
      } catch (decodeError) {
        console.error("LumaForge image decode failed", decodeError);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setError(
          decodeError instanceof Error
            ? `ไม่สามารถถอดรหัสภาพนี้ได้: ${decodeError.message}`
            : "ไม่สามารถถอดรหัสภาพนี้ได้",
        );
        setSourceLabel("Try another supported image");
      } finally {
        setLoading(false);
      }
    },
    [setImage],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      const file = imageItem?.getAsFile();
      if (file) {
        event.preventDefault();
        void load(file, "clipboard");
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [load]);

  async function readClipboard() {
    if (!navigator.clipboard?.read) {
      setError("Browser นี้ไม่รองรับการอ่านรูปจาก Clipboard โดยตรง — ใช้ Ctrl/Cmd + V แทน");
      return;
    }
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const type = item.types.find((candidate) => candidate.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        await load(
          new File(
            [blob],
            `clipboard-${Date.now()}.${type === "image/png" ? "png" : "jpg"}`,
            { type },
          ),
          "clipboard",
        );
        return;
      }
      setError("Clipboard ไม่มีรูปภาพ");
    } catch {
      setError("ไม่ได้รับสิทธิ์อ่าน Clipboard — ใช้ Ctrl/Cmd + V แทน");
    }
  }

  return (
    <div className="import-wrap">
      <button
        className="import-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void load(event.dataTransfer.files[0], "drag and drop");
        }}
      >
        {loading ? <LoaderCircle className="spin" /> : <ImagePlus />}
        <strong>{loading ? "กำลังอ่านภาพ…" : "ลากภาพมาวาง หรือคลิกเพื่อเลือก"}</strong>
        <span>JPG · PNG · WebP · สูงสุด 30 MB</span>
        <small>{sourceLabel}</small>
      </button>
      <div className="import-actions">
        <button className="button" onClick={() => void readClipboard()}>
          <ClipboardPaste size={16} /> Paste image
        </button>
        <button className="button" onClick={() => cameraRef.current?.click()}>
          <Camera size={16} /> Open camera
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => void load(event.target.files?.[0], "file picker")}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => void load(event.target.files?.[0], "camera")}
      />
      {error && <p role="alert" className="error-text">{error}</p>}
    </div>
  );
}
