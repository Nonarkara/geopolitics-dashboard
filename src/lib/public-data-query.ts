const MAX_PUBLIC_ROWS = 50;

const PUBLIC_DATASETS = {
  v8_asean_currencies_daily: {
    columns: ["currency_pair", "rate", "change_percent"],
    orderBy: "captured_at",
  },
  v8_commodity_prices_daily: {
    columns: ["commodity_name", "price", "change_percent", "unit"],
    orderBy: "captured_at",
  },
} as const;

type PublicDatasetName = keyof typeof PUBLIC_DATASETS;

export type PublicDataQuery = {
  table: PublicDatasetName;
  columns: string[];
  orderBy: string;
  limit: number;
  ascending: boolean;
};

export function resolvePublicDataQuery(
  searchParams: URLSearchParams,
): PublicDataQuery | null {
  const table = searchParams.get("table");
  if (!table || !(table in PUBLIC_DATASETS)) {
    return null;
  }

  const dataset = PUBLIC_DATASETS[table as PublicDatasetName];
  const allowedColumns = new Set<string>(dataset.columns);
  const requestedColumns = (searchParams.get("select") ?? dataset.columns.join(","))
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  if (
    requestedColumns.length === 0 ||
    requestedColumns.some((column) => !allowedColumns.has(column))
  ) {
    return null;
  }

  const requestedOrder = searchParams.get("order") ?? dataset.orderBy;
  if (requestedOrder !== dataset.orderBy) {
    return null;
  }

  const rawLimit = searchParams.get("limit") ?? "20";
  const parsedLimit = Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return null;
  }

  const ascendingParam = searchParams.get("ascending");
  if (ascendingParam !== null && ascendingParam !== "true" && ascendingParam !== "false") {
    return null;
  }

  return {
    table: table as PublicDatasetName,
    columns: requestedColumns,
    orderBy: dataset.orderBy,
    limit: Math.min(parsedLimit, MAX_PUBLIC_ROWS),
    ascending: ascendingParam === "true",
  };
}
