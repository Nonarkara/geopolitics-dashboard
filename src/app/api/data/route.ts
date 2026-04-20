/**
 * Generic Supabase data read endpoint
 * Query params:
 *   table: table name (required)
 *   select: columns to select (default: *)
 *   order: column to order by (default: captured_at)
 *   limit: row count (default: 100)
 *   where: simple filter (not yet implemented)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const select = searchParams.get("select") || "*";
  const order = searchParams.get("order") || "captured_at";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const ascending = searchParams.get("ascending") !== "false";

  if (!table) {
    return NextResponse.json({ error: "table parameter required" }, { status: 400 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supa = createClient(supabaseUrl, supabaseKey);

    let query = supa.from(table).select(select);

    if (order) {
      query = query.order(order, { ascending });
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
