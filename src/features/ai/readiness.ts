import { positiveInteger } from "./budget";
export function aiReadiness(env:Record<string,string|undefined>,kind:"background"|"inpaint"|"selection") {
 const prefix=kind.toUpperCase();
 const checks = {
  cloudUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
  cloudPublicKey: Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  usageStorage: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  providerToken: Boolean(env.REPLICATE_API_TOKEN),
  allowedAccounts: Boolean(env.AI_ALLOWED_USER_IDS?.split(",").some(v=>v.trim())),
  modelVersion: /^[a-f0-9]{64}$/i.test(env[`REPLICATE_${prefix}_VERSION`]??""),
  priceEstimate: Boolean(env[`AI_${prefix}_COST_LABEL`]?.trim()),
  requestAllowance: positiveInteger(env[`AI_${prefix}_RESERVE_CENTS`])>0,
  dailyAllowance: positiveInteger(env.AI_DAILY_BUDGET_CENTS)>0,
  accountLimit: positiveInteger(env.AI_DAILY_JOBS_PER_USER)>0,
 };
 return {enabled:Object.values(checks).every(Boolean),missing:Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key)};
}
