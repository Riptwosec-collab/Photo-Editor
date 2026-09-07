import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { signJob, verifyJob } from "@/features/ai/job-security";
export const runtime = "nodejs";
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const providers = () => ({
  background: { version: process.env.REPLICATE_BACKGROUND_VERSION, imageKey: process.env.REPLICATE_BACKGROUND_IMAGE_KEY || "image", cost: process.env.AI_BACKGROUND_COST_LABEL },
  inpaint: { version: process.env.REPLICATE_INPAINT_VERSION, imageKey: process.env.REPLICATE_INPAINT_IMAGE_KEY || "image", cost: process.env.AI_INPAINT_COST_LABEL },
});
async function owner(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!url || !key || !token) throw new Error("Sign in to use cloud AI");
  const { data, error } = await createClient(url,key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.getUser(token);
  if (error || !data.user) throw new Error("Your session expired. Sign in again.");
  const allowed = (process.env.AI_ALLOWED_USER_IDS || "").split(",").map((s) => s.trim());
  if (!allowed.includes(data.user.id)) throw new Error("Cloud AI is not enabled for this account");
  return data.user.id;
}
async function api(path: string, method = "GET", body?: unknown) {
  const result = await fetch(`https://api.replicate.com/v1/predictions${path}`, { method, headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!result.ok) throw new Error(`AI provider request failed (${result.status}). Check provider configuration and billing.`);
  return result.json();
}
export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  if (!search.has("token")) {
    const configured = Boolean(process.env.REPLICATE_API_TOKEN && process.env.AI_ALLOWED_USER_IDS);
    return response(Object.fromEntries(Object.entries(providers()).map(([kind,p]) => [kind, { enabled: configured && Boolean(p.version && p.cost), cost: p.cost || "Not configured" }])));
  }
  try {
    const user = await owner(request);
    const id = verifyJob(search.get("token")!,user,process.env.REPLICATE_API_TOKEN ?? "");
    const job = await api(`/${id}`);
    if (search.get("download") === "1") {
      if (job.status !== "succeeded") return response({ error: "The image is not ready" },409);
      const output = Array.isArray(job.output) ? job.output[0] : job.output;
      const url = new URL(output);
      if (url.protocol !== "https:" || !(url.hostname === "replicate.delivery" || url.hostname.endsWith(".replicate.delivery"))) throw new Error("Unsupported provider output URL");
      const file = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20000) });
      const mime = file.headers.get("content-type")?.split(";")[0] ?? "";
      if (!file.ok || !["image/png","image/jpeg","image/webp"].includes(mime)) throw new Error("Provider returned an unsupported image");
      const reader = file.body!.getReader(); const chunks: Uint8Array[] = []; let length = 0;
      while (true) { const r = await reader.read(); if (r.done) break; length += r.value.length; if (length > 20*1048576) { await reader.cancel(); throw new Error("AI result exceeds 20 MB"); } chunks.push(r.value); }
      return new Response(new Blob(chunks as BlobPart[], { type: mime }), { headers: { "Content-Type": mime, "Cache-Control": "no-store" } });
    }
    return response({ status: job.status, error: job.status === "failed" ? "The model could not complete this edit. Try a smaller image or a different prompt." : undefined });
  } catch (error) { return response({ error: error instanceof Error ? error.message : "Could not read job" },400); }
}
const image = z.string().max(3_800_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/);
export async function POST(request: Request) {
  try {
    const user = await owner(request);
    // Enforce a real streaming limit even without Content-Length.
    const reader = request.body?.getReader(); if (!reader) return response({ error: "Missing request" },400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const r = await reader.read(); if (r.done) break; size += r.value.length; if (size > 5_000_000) { await reader.cancel(); return response({ error: "Image request exceeds 5 MB" },413); } chunks.push(r.value); }
    const raw = JSON.parse(await new Blob(chunks as BlobPart[]).text());
    if (raw.action === "cancel") {
      const id = verifyJob(z.string().parse(raw.token), user, process.env.REPLICATE_API_TOKEN ?? "");
      const job = await api(`/${id}/cancel`, "POST"); return response({ status: job.status });
    }
    const body = z.object({ kind: z.enum(["background","inpaint"]), image, mask: image.optional(), prompt: z.string().max(500).optional(), consent: z.literal(true) }).parse(raw);
    const provider = providers()[body.kind];
    if (!process.env.REPLICATE_API_TOKEN || !provider.version || !provider.cost) return response({ error: "AI provider is not configured" },503);
    if (body.kind === "inpaint" && !body.mask) return response({ error: "Paint the area to remove first" },400);
    const input: Record<string,unknown> = { [provider.imageKey]: body.image };
    if (body.kind === "inpaint") { input[process.env.REPLICATE_INPAINT_MASK_KEY || "mask"] = body.mask; input.prompt = body.prompt || "Clean natural background, seamless texture, no object"; }
    const job = await api("", "POST", { version: provider.version, input });
    return response({ token: signJob(job.id,user,process.env.REPLICATE_API_TOKEN), status: job.status },201);
  } catch (error) { return response({ error: error instanceof z.ZodError ? "Invalid image or mask request" : error instanceof Error ? error.message : "AI request failed" },400); }
}
