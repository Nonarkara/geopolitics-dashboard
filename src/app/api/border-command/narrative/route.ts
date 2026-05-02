export const runtime = 'edge';

import { NextResponse } from "next/server";
import { generateNarrative } from "../../../../lib/ai-narrative";

export const revalidate = 3600;

export async function GET() {
  try {
    const result = await generateNarrative();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      narrative:
        "Narrative generation unavailable. Refer to signal archive for current intelligence picture.",
      generatedAt: new Date().toISOString(),
      signalCount: 0,
    });
  }
}
