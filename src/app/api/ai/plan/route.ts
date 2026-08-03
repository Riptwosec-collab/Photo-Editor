import { NextResponse } from "next/server";
import { z } from "zod";
import { createLocalEditPlan } from "@/features/ai/local-provider";
const bodySchema=z.object({prompt:z.string().trim().min(3).max(500)});
export async function POST(request:Request){try{const body=bodySchema.parse(await request.json());return NextResponse.json(createLocalEditPlan(body.prompt),{headers:{"Cache-Control":"no-store"}});}catch(error){return NextResponse.json({error:"Invalid edit request",detail:error instanceof Error?error.message:"Unknown validation error"},{status:400});}}
