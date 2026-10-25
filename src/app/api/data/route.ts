/**
 * Narrow public read endpoint for the two V8 datasets used by the dashboard.
 *
 * This is deliberately not a generic Supabase proxy: table, column, ordering,
 * and row-count choices are constrained before a query reaches Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolvePublicDataQuery } from "../../../lib/public-data-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const resolved = resolvePublicDataQuery(request.nextUrl.searchParams);
  if (!resolved) {
    return NextResponse.json(
      { error: "Unsupported public dataset query." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Public data service is unavailable." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from(resolved.table)
      .select(resolved.columns.join(","))
      .order(resolved.orderBy, { ascending: resolved.ascending })
      .limit(resolved.limit);

    if (error) {
      console.error("Public data query failed:", error.message);
      return NextResponse.json(
        { error: "Unable to load public data." },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { "cache-control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error: unknown) {
    console.error(
      "Public data route failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "Unable to load public data." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
