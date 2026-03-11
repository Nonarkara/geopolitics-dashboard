import { NextResponse } from "next/server";
import { getErrorMessage } from "../../../lib/errors";
import { fallbackNews } from "../../../lib/mock-data";
import {
  buildNewsFromReports,
  buildReferenceNewsResponse,
  fetchReferenceNewsFeed,
  fetchReferenceReports,
} from "../../../lib/reference-data";

export async function GET() {
  try {
    const [reports, newsFeed] = await Promise.all([
      fetchReferenceReports(),
      fetchReferenceNewsFeed(),
    ]);

    return NextResponse.json(buildReferenceNewsResponse(newsFeed, reports));
  } catch (error: unknown) {
    console.error("Reference news error:", getErrorMessage(error));
  }

  try {
    const reports = await fetchReferenceReports();
    return NextResponse.json(buildNewsFromReports(reports));
  } catch (error: unknown) {
    console.error("Fallback news synthesis error:", getErrorMessage(error));
    return NextResponse.json(fallbackNews, { status: 200 });
  }
}
