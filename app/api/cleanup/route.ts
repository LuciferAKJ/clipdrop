import { NextResponse } from "next/server";
import { cleanupExpiredShares } from "@/lib/cleanup";


export async function GET() {

  const deleted = await cleanupExpiredShares();


  return NextResponse.json({
    deleted
  });

}