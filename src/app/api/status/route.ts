export async function GET() {
    return Response.json({
        status: "operational",
        version: "4.2.0",
        signal_strength: 0.98,
        services: {
            database: process.env.DATABASE_URL ? "configured" : "fallback",
            basemap:
                process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN
                    ? "configured"
                    : "missing",
        },
    });
}
