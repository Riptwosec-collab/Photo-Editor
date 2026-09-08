import { createClient } from "@supabase/supabase-js";
export function positiveInteger(value:string|undefined) { const n=Number(value);return Number.isSafeInteger(n)&&n>0&&n<=1_000_000?n:0; }
export function budgetConfig() { return {dailyCents:positiveInteger(process.env.AI_DAILY_BUDGET_CENTS),dailyJobs:positiveInteger(process.env.AI_DAILY_JOBS_PER_USER)}; }
export function budgetClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new Error("AI usage storage is not configured");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function budgetEnabled() {const b=budgetConfig();return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY&&b.dailyCents&&b.dailyJobs);}
export async function reserveAi(id:string,owner:string,kind:string,fingerprint:string,cents:number) {
 const config=budgetConfig();
 const {error}=await budgetClient().rpc("lumaforge_reserve_ai",{p_id:id,p_owner:owner,p_kind:kind,p_fingerprint:fingerprint,p_cents:cents,p_daily_cents:config.dailyCents,p_daily_jobs:config.dailyJobs});
 if(error) throw new Error(error.message.includes("allowance")?"Daily AI allowance reached. Try again after 00:00 UTC.":"Could not reserve AI allowance. No new provider job was started.");
}
