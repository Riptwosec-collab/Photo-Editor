import { budgetClient,budgetConfig,budgetEnabled,reserveAi,positiveInteger } from "@/features/ai/budget";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { signJob, verifyJob } from "@/features/ai/job-security";
export const runtime = "nodejs";
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const providers = () => ({
  selection: { version: process.env.REPLICATE_SELECTION_VERSION,imageKey:process.env.REPLICATE_SELECTION_IMAGE_KEY||"image",cents:positiveInteger(process.env.AI_SELECTION_RESERVE_CENTS),cost:process.env.AI_SELECTION_COST_LABEL },
  background: { version: process.env.REPLICATE_BACKGROUND_VERSION, imageKey: process.env.REPLICATE_BACKGROUND_IMAGE_KEY || "image", cents: positiveInteger(process.env.AI_BACKGROUND_RESERVE_CENTS), cost: process.env.AI_BACKGROUND_COST_LABEL },
  inpaint: { version: process.env.REPLICATE_INPAINT_VERSION, imageKey: process.env.REPLICATE_INPAINT_IMAGE_KEY || "image", cents: positiveInteger(process.env.AI_INPAINT_RESERVE_CENTS), cost: process.env.AI_INPAINT_COST_LABEL },
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
  if(search.get("history")==="1") {
    try {
      const user=await owner(request);const client=budgetClient();const day=new Date().toISOString().slice(0,10)+"T00:00:00Z";
      const [history,usage]=await Promise.all([client.from("lumaforge_ai_usage").select("id,kind,status,provider_id,fingerprint,created_at,reserved_cents").eq("owner_id",user).order("created_at",{ascending:false}).limit(20),client.from("lumaforge_ai_usage").select("reserved_cents").eq("owner_id",user).gte("created_at",day)]);
      if(history.error||usage.error) throw new Error("AI usage history is unavailable");
      return response({jobs:history.data.map(row=>({id:row.id,kind:row.kind,status:row.status,signature:row.fingerprint,createdAt:row.created_at,reservedCents:row.reserved_cents,token:row.provider_id?signJob(row.provider_id,user,process.env.REPLICATE_API_TOKEN??""):null})),usedCents:usage.data.reduce((sum,row)=>sum+row.reserved_cents,0),usedJobs:usage.data.length,...budgetConfig()});
    }catch(error){return response({error:error instanceof Error?error.message:"History unavailable"},400);}
  }
  if (!search.has("token")) {
    const configured = Boolean(process.env.REPLICATE_API_TOKEN && process.env.AI_ALLOWED_USER_IDS && budgetEnabled());
    return response(Object.fromEntries(Object.entries(providers()).map(([kind,p]) => [kind, { enabled: configured && Boolean(p.version && p.cost && p.cents), cost: p.cost || "Not configured", reserveCents:p.cents, dailyBudgetCents:budgetConfig().dailyCents, dailyJobs:budgetConfig().dailyJobs }])));
  }
  try {
    const user = await owner(request);
    const id = verifyJob(search.get("token")!,user,process.env.REPLICATE_API_TOKEN ?? "");
    const job = await api(`/${id}`);
    if(budgetEnabled() && ["starting","processing","succeeded","failed","canceled"].includes(job.status)) await budgetClient().from("lumaforge_ai_usage").update({status:job.status}).eq("owner_id",user).eq("provider_id",id);
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
    const body = z.object({ requestId:z.uuid(), fingerprint:z.string().regex(/^[0-9a-f]{64}$/), kind: z.enum(["background","inpaint","selection"]), image, mask: image.optional(), prompt: z.string().max(500).optional(), consent: z.literal(true) }).parse(raw);
    const provider = providers()[body.kind];
    if (!process.env.REPLICATE_API_TOKEN || !provider.version || !provider.cost || !provider.cents || !budgetEnabled()) return response({ error: "AI provider is not configured" },503);
    if (body.kind === "inpaint" && !body.mask) return response({ error: "Paint the area to remove first" },400);
    const input: Record<string,unknown> = { [provider.imageKey]: body.image };
    if (body.kind === "inpaint") { input[process.env.REPLICATE_INPAINT_MASK_KEY || "mask"] = body.mask; input.prompt = body.prompt || "Clean natural background, seamless texture, no object"; }
    if(body.kind==="selection") { if(!["person","sky","background","object"].includes(body.prompt??"")) return response({error:"Choose a selection target"},400);input[process.env.REPLICATE_SELECTION_PROMPT_KEY||"text_prompt"]=body.prompt; }
    await reserveAi(body.requestId,user,body.kind,body.fingerprint,provider.cents);
    let job;
    try {job = await api("", "POST", { version: provider.version, input });}
    catch {await budgetClient().from("lumaforge_ai_usage").update({status:"unknown"}).eq("id",body.requestId).eq("owner_id",user);throw new Error("Provider did not confirm the request. Allowance remains reserved; check provider history before retrying.");}
    const recorded=await budgetClient().from("lumaforge_ai_usage").update({provider_id:job.id,status:job.status==="processing"?"processing":"starting"}).eq("id",body.requestId).eq("owner_id",user);
    // Still return the signed receipt if the ledger update fails: it permits cancel/recovery.
    if(recorded.error) return response({token:signJob(job.id,user,process.env.REPLICATE_API_TOKEN),status:job.status,warning:"Keep this receipt: server history could not be updated"},201);
    return response({ token: signJob(job.id,user,process.env.REPLICATE_API_TOKEN), status: job.status },201);
  } catch (error) { return response({ error: error instanceof z.ZodError ? "Invalid image or mask request" : error instanceof Error ? error.message : "AI request failed" },400); }
}
