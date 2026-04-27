import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ dbSet: !!process.env.DATABASE_URL });
}
