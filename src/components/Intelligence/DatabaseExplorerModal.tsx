"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Table2,
  X,
} from "lucide-react";
import type {
  DatabaseCatalogResponse,
  DatabaseTablePreviewResponse,
  DatabaseTableSummary,
} from "../../types/dashboard";

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_LIMIT_OPTIONS = [25, 50, 100] as const;
const TOKEN_STORAGE_KEY = "data-explorer-token";
type ExportFormat = "csv" | "json";

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDatabaseTableSummary(value: unknown): value is DatabaseTableSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    Array.isArray(value.columns)
  );
}

function isDatabaseCatalogResponse(value: unknown): value is DatabaseCatalogResponse {
  return (
    isRecord(value) &&
    typeof value.databaseConfigured === "boolean" &&
    typeof value.generatedAt === "string" &&
    typeof value.totalRows === "number" &&
    Array.isArray(value.tables) &&
    value.tables.every(isDatabaseTableSummary)
  );
}

function isDatabaseTablePreviewResponse(
  value: unknown,
): value is DatabaseTablePreviewResponse {
  return (
    isRecord(value) &&
    typeof value.databaseConfigured === "boolean" &&
    typeof value.generatedAt === "string" &&
    typeof value.limit === "number" &&
    isDatabaseTableSummary(value.table) &&
    Array.isArray(value.rows)
  );
}

function formatCount(value: number | null) {
  if (value === null) {
    return "--";
  }

  return value.toLocaleString();
}

function formatLatest(value: string | null) {
  if (!value) {
    return "No snapshot yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderCellValue(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-sm border border-[var(--line)] bg-[rgba(10,15,26,0.72)] p-4">
      <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-[26px] font-bold tracking-[-0.03em] text-[var(--ink)]">
        {value}
      </div>
      <p className="mt-2 text-[14px] leading-5 text-[var(--muted)]">{helper}</p>
    </article>
  );
}

export default function DatabaseExplorerModal({
  isOpen,
  onClose,
}: DatabaseExplorerModalProps) {
  const [catalog, setCatalog] = useState<DatabaseCatalogResponse | null>(null);
  const [preview, setPreview] = useState<DatabaseTablePreviewResponse | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [previewLimit, setPreviewLimit] = useState<number>(50);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const selectedTable =
    catalog?.tables.find((table) => table.id === selectedTableId) ?? null;
  const databaseConfigured = catalog?.databaseConfigured ?? null;

  const buildAuthHeaders = useCallback((token: string) => {
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, []);

  const loadCatalog = useCallback(async (tokenOverride?: string) => {
    setLoadingCatalog(true);
    setError(null);
    const effectiveToken = tokenOverride ?? authToken;

    try {
      const response = await fetch("/api/data/catalog", {
        cache: "no-store",
        headers: buildAuthHeaders(effectiveToken),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        setCatalog(null);
        setPreview(null);
        throw new Error("Authentication required");
      }

      if (response.status === 403) {
        setCatalog(null);
        setPreview(null);
        throw new Error("Data explorer is disabled for this deployment.");
      }

      const payload: unknown = await response.json();

      if (!isDatabaseCatalogResponse(payload)) {
        throw new Error("Database catalog payload was not recognized");
      }

      setAuthRequired(false);
      setCatalog(payload);
      setSelectedTableId((current) => {
        const existing = current
          ? payload.tables.find((table) => table.id === current)
          : null;

        if (existing) {
          return existing.id;
        }

        return (
          payload.tables.find((table) => (table.rowCount ?? 0) > 0)?.id ??
          payload.tables[0]?.id ??
          null
        );
      });
    } catch (caught) {
      setCatalog(null);
      setPreview(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load the database catalog.",
      );
    } finally {
      setLoadingCatalog(false);
    }
  }, [authToken, buildAuthHeaders]);

  const loadPreview = useCallback(async (tableId: string, limit: number, tokenOverride?: string) => {
    setLoadingPreview(true);
    setError(null);
    const effectiveToken = tokenOverride ?? authToken;

    try {
      const params = new URLSearchParams({
        table: tableId,
        limit: String(limit),
      });
      const response = await fetch(`/api/data/table?${params.toString()}`, {
        cache: "no-store",
        headers: buildAuthHeaders(effectiveToken),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        setPreview(null);
        throw new Error("Authentication required");
      }

      if (response.status === 403) {
        setPreview(null);
        throw new Error("Data explorer is disabled for this deployment.");
      }

      const payload: unknown = await response.json();

      if (!response.ok || !isDatabaseTablePreviewResponse(payload)) {
        throw new Error("Database preview payload was not recognized");
      }

      setAuthRequired(false);
      setPreview(payload);
    } catch (caught) {
      setPreview(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load the selected table preview.",
      );
    } finally {
      setLoadingPreview(false);
    }
  }, [authToken, buildAuthHeaders]);

  const downloadExport = useCallback(
    async (format: ExportFormat) => {
      if (!selectedTableId || databaseConfigured !== true) {
        return;
      }

      setDownloadingFormat(format);
      setError(null);

      try {
        const response = await fetch(
          `/api/data/export?table=${encodeURIComponent(selectedTableId)}&format=${format}`,
          {
            headers: buildAuthHeaders(authToken),
          },
        );

        if (response.status === 401) {
          setAuthRequired(true);
          throw new Error("Authentication required");
        }

        if (response.status === 403) {
          throw new Error("Data explorer is disabled for this deployment.");
        }

        if (!response.ok) {
          throw new Error(`Export failed with ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const disposition = response.headers.get("content-disposition") ?? "";
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        const filename =
          filenameMatch?.[1] ?? `${selectedTableId}.${format === "csv" ? "csv" : "json"}`;
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = filename;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(downloadUrl);
        setAuthRequired(false);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to export the selected table.",
        );
      } finally {
        setDownloadingFormat(null);
      }
    },
    [authToken, buildAuthHeaders, databaseConfigured, selectedTableId],
  );

  const submitToken = useCallback(() => {
    const nextToken = tokenDraft.trim();

    if (!nextToken) {
      setError("Enter the admin token to unlock the data explorer.");
      return;
    }

    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setAuthToken(nextToken);
    setAuthRequired(false);
    setError(null);
    void loadCatalog(nextToken);
    if (selectedTableId) {
      void loadPreview(selectedTableId, previewLimit, nextToken);
    }
  }, [loadCatalog, loadPreview, previewLimit, selectedTableId, tokenDraft]);

  const clearToken = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken("");
    setTokenDraft("");
    setAuthRequired(true);
    setCatalog(null);
    setPreview(null);
    setError("Admin token cleared.");
  }, []);

  const handleClose = () => {
    onClose();
  };

  const closeExplorerFromEffect = useEffectEvent(() => {
    handleClose();
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const storedToken = window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    setAuthToken(storedToken);
    setTokenDraft(storedToken);

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusHandle = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const catalogHandle = window.setTimeout(() => {
      void loadCatalog();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExplorerFromEffect();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (!activeElement || !dialogRef.current?.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(catalogHandle);
      window.cancelAnimationFrame(focusHandle);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, loadCatalog]);

  useEffect(() => {
    if (!isOpen || !selectedTableId) {
      return;
    }

    const previewHandle = window.setTimeout(() => {
      void loadPreview(selectedTableId, previewLimit);
    }, 0);

    return () => {
      window.clearTimeout(previewHandle);
    };
  }, [isOpen, loadPreview, previewLimit, selectedTableId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[125] flex items-end justify-center bg-[rgba(2,6,23,0.82)] p-0 sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="dashboard-panel-strong flex h-[100dvh] w-full flex-col rounded-none border-[var(--line-bright)] sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-[min(1380px,100%)] sm:rounded-[28px]"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.22em] text-[var(--cool)]">
              <Database size={15} />
              Data Explorer
            </div>
            <h2
              id={titleId}
              className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[var(--ink)] sm:text-[30px]"
            >
              Visualize and export the database
            </h2>
            <p
              id={descriptionId}
              className="mt-1 max-w-3xl text-[14px] leading-5 text-[var(--muted)] sm:text-[15px]"
            >
              Preview stored tables, inspect freshness and row volume, and export
              any surfaced table as CSV or JSON without writing SQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {authToken ? (
              <button
                type="button"
                onClick={clearToken}
                className="rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] px-3 py-1.5 text-[13px] font-mono uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--cool)]"
              >
                Clear token
              </button>
            ) : null}
            <div className="rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] px-3 py-1.5 text-[13px] font-mono uppercase tracking-[0.16em] text-[var(--muted)]">
              {databaseConfigured === null
                ? "Checking database"
                : databaseConfigured
                  ? "Database ready"
                  : "Database unavailable"}
            </div>
            <button
              type="button"
              onClick={() => {
                void loadCatalog();
                if (selectedTableId) {
                  void loadPreview(selectedTableId, previewLimit);
                }
              }}
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] px-4 py-2 text-[14px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
            >
              <RefreshCw
                size={15}
                className={loadingCatalog || loadingPreview ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] text-[var(--ink)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--cool)]"
              aria-label="Close data explorer"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard
                label="Database"
                value={
                  databaseConfigured === null
                    ? "Checking"
                    : databaseConfigured
                      ? "Online"
                      : "Offline"
                }
                helper={
                  databaseConfigured
                    ? "Live previews and exports are available."
                    : databaseConfigured === false
                      ? "Configure DATABASE_URL and apply the schema to enable previews."
                      : "Checking connectivity and available tables."
                }
              />
              <StatCard
                label="Tables"
                value={catalog ? String(catalog.tables.length) : "--"}
                helper="Curated tables surfaced for non-SQL inspection."
              />
              <StatCard
                label="Visible Rows"
                value={catalog ? formatCount(catalog.totalRows) : "--"}
                helper="Total rows across the exposed exportable tables."
              />
            </div>

            <div className="mt-4 rounded-sm border border-[var(--line)] bg-[rgba(10,15,26,0.72)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="eyebrow">Tables</div>
                  <div className="mt-1 text-[16px] font-semibold text-[var(--ink)]">
                    Choose a dataset
                  </div>
                </div>
                {loadingCatalog && (
                  <span className="text-[13px] font-mono uppercase tracking-[0.16em] text-[var(--dim)]">
                    Loading
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {(catalog?.tables ?? []).map((table) => {
                  const isActive = table.id === selectedTableId;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      className={`w-full rounded-sm border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "border-[var(--cool)] bg-[var(--line-bright)]"
                          : "border-[var(--line)] bg-[var(--bg-surface)] hover:border-[var(--line-bright)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[var(--ink)]">
                          {table.label}
                        </span>
                        <span className="text-[13px] font-mono uppercase tracking-[0.16em] text-[var(--muted)]">
                          {formatCount(table.rowCount)}
                        </span>
                      </div>
                      <div className="mt-1 text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--cool)]">
                        {table.category}
                      </div>
                      <div className="mt-2 line-clamp-2 text-[14px] leading-4 text-[var(--muted)]">
                        {table.description}
                      </div>
                      <div className="mt-2 text-[13px] text-[var(--dim)]">
                        Latest: {formatLatest(table.latestValue)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto">
            {error && (
              <div className="mb-4 rounded-sm border border-[#ef4444] bg-[rgba(127,29,29,0.22)] px-4 py-3 text-[14px] text-[#fecaca]">
                {error}
              </div>
            )}

            {authRequired && (
              <section className="mb-4 rounded-sm border border-[var(--line)] bg-[rgba(10,15,26,0.72)] p-4 sm:p-5">
                <div className="eyebrow">Admin Auth</div>
                <h3 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[var(--ink)]">
                  Enter the data explorer token
                </h3>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[var(--muted)]">
                  This deployment protects preview and export endpoints with a
                  server-side bearer token. The token is stored only in this browser
                  session.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="password"
                    value={tokenDraft}
                    onChange={(event) => setTokenDraft(event.target.value)}
                    placeholder="Paste admin token"
                    className="min-w-0 flex-1 rounded-sm border border-[var(--line)] bg-[var(--bg-surface)] px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--dim)] focus:border-[var(--cool)]"
                  />
                  <button
                    type="button"
                    onClick={submitToken}
                    className="inline-flex items-center justify-center rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] px-4 py-3 text-[14px] font-semibold text-[var(--ink)] transition-colors hover:text-[var(--cool)]"
                  >
                    Unlock
                  </button>
                </div>
              </section>
            )}

            {databaseConfigured === false && (
              <section className="dashboard-panel rounded-sm p-5">
                <div className="eyebrow">Database Required</div>
                <h3 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[var(--ink)]">
                  Connect Postgres to unlock previews and exports
                </h3>
                <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[var(--muted)]">
                  The explorer is ready, but this runtime is not currently connected to
                  a live database. Once <code>DATABASE_URL</code> is configured and the
                  schema is applied, this screen will show row counts, latest snapshots,
                  table previews, and one-click CSV or JSON exports.
                </p>
              </section>
            )}

            {selectedTable && (
              <section className="dashboard-panel rounded-sm p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Table2 size={17} className="text-[var(--cool)]" />
                      <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--cool)]">
                        {selectedTable.category}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[var(--ink)]">
                      {selectedTable.label}
                    </h3>
                    <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[var(--muted)]">
                      {selectedTable.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {PREVIEW_LIMIT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPreviewLimit(option)}
                        className={`rounded-sm border px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.16em] transition-colors ${
                          previewLimit === option
                            ? "border-[var(--cool)] bg-[var(--line-bright)] text-[var(--ink)]"
                            : "border-[var(--line-bright)] bg-[var(--bg-surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {option} rows
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => void downloadExport("csv")}
                      disabled={!selectedTableId || databaseConfigured !== true || downloadingFormat !== null}
                      className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-[14px] font-semibold transition-colors ${
                        selectedTableId && databaseConfigured === true && downloadingFormat === null
                          ? "border-[var(--line-bright)] bg-[var(--bg-surface)] text-[var(--ink)] hover:text-[var(--cool)]"
                          : "pointer-events-none border-[var(--line)] bg-[var(--bg-surface)] text-[var(--dim)] opacity-50"
                      }`}
                    >
                      <FileSpreadsheet size={15} />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadExport("json")}
                      disabled={!selectedTableId || databaseConfigured !== true || downloadingFormat !== null}
                      className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-[14px] font-semibold transition-colors ${
                        selectedTableId && databaseConfigured === true && downloadingFormat === null
                          ? "border-[var(--line-bright)] bg-[var(--bg-surface)] text-[var(--ink)] hover:text-[var(--cool)]"
                          : "pointer-events-none border-[var(--line)] bg-[var(--bg-surface)] text-[var(--dim)] opacity-50"
                      }`}
                    >
                      <FileJson size={15} />
                      JSON
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StatCard
                    label="Rows"
                    value={formatCount(preview?.table.rowCount ?? selectedTable.rowCount)}
                    helper="Current row volume in the surfaced table."
                  />
                  <StatCard
                    label="Latest"
                    value={formatLatest(preview?.table.latestValue ?? selectedTable.latestValue)}
                    helper="Most recent timestamp or period seen in this dataset."
                  />
                  <StatCard
                    label="Columns"
                    value={String(selectedTable.columns.length)}
                    helper="Columns included in the preview and export output."
                  />
                </div>

                <div className="mt-4 rounded-sm border border-[var(--line)] bg-[rgba(10,15,26,0.72)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="eyebrow">Preview</div>
                      <div className="mt-1 text-[16px] font-semibold text-[var(--ink)]">
                        Latest {previewLimit} rows
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[13px] font-mono uppercase tracking-[0.16em] text-[var(--dim)]">
                      <Download size={14} />
                      Export uses the same curated columns
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTable.columns.map((column) => (
                      <span
                        key={`${selectedTable.id}-${column}`}
                        className="rounded-sm border border-[var(--line-bright)] bg-[var(--bg-surface)] px-2.5 py-1 text-[13px] font-medium text-[var(--ink)]"
                      >
                        {column}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-sm border border-[var(--line)]">
                    <div className="max-h-[520px] overflow-auto">
                      <table className="min-w-full border-collapse text-left text-[14px]">
                        <thead className="sticky top-0 bg-[rgba(10,15,26,0.94)]">
                          <tr>
                            {selectedTable.columns.map((column) => (
                              <th
                                key={`${selectedTable.id}-head-${column}`}
                                className="border-b border-[var(--line)] px-3 py-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loadingPreview ? (
                            <tr>
                              <td
                                colSpan={selectedTable.columns.length}
                                className="px-3 py-10 text-center text-[14px] text-[var(--muted)]"
                              >
                                Loading preview…
                              </td>
                            </tr>
                          ) : (preview?.rows.length ?? 0) === 0 ? (
                            <tr>
                              <td
                                colSpan={selectedTable.columns.length}
                                className="px-3 py-10 text-center text-[14px] text-[var(--muted)]"
                              >
                                No rows are available for this preview yet.
                              </td>
                            </tr>
                          ) : (
                            preview?.rows.map((row, rowIndex) => (
                              <tr
                                key={`${selectedTable.id}-row-${rowIndex}`}
                                className="border-b border-[var(--line)] last:border-b-0"
                              >
                                {selectedTable.columns.map((column) => (
                                  <td
                                    key={`${selectedTable.id}-row-${rowIndex}-${column}`}
                                    className="max-w-[260px] px-3 py-2 align-top font-mono text-[14px] leading-5 text-[var(--ink)]"
                                    title={renderCellValue(row[column])}
                                  >
                                    <div className="line-clamp-3 break-words">
                                      {renderCellValue(row[column])}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
