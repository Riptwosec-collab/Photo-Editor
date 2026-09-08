import { createHmac, timingSafeEqual } from "node:crypto";
export function signJob(id: string, owner: string, secret: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ id, owner, expires: now + 24*60*60*1000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
export function verifyJob(token: string, owner: string, secret: string, now = Date.now()): string {
  if (token.length > 2048 || token.split(".").length !== 2) throw new Error("Invalid job receipt");
  const [body, signature] = token.split(".");
  const expected = createHmac("sha256", secret).update(body ?? "").digest();
  const supplied = Buffer.from(signature ?? "", "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected,supplied)) throw new Error("Invalid job receipt");
  const claim = JSON.parse(Buffer.from(body,"base64url").toString());
  if (claim.owner !== owner || !Number.isFinite(claim.expires) || claim.expires <= now || !/^[a-zA-Z0-9_-]+$/.test(claim.id)) throw new Error("Expired or unauthorized job receipt");
  return claim.id;
}
