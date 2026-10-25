-- ============================================================
-- ASEAN Economics & Markets Schema
-- Tracks daily currency snapshots, commodity prices, and
-- annual country economic indicators for trend analysis.
--
-- Apply via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<YOUR_PROJECT>/sql/new
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- ── ASEAN CURRENCIES: Daily snapshot (24h deltas) ──
CREATE TABLE IF NOT EXISTS v8_asean_currencies_daily (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    currency_pair TEXT NOT NULL,
    rate DOUBLE PRECISION NOT NULL,
    change_percent DOUBLE PRECISION,
    source TEXT,
    raw JSONB,
    UNIQUE (currency_pair, captured_at)
);
CREATE INDEX IF NOT EXISTS v8_currency_daily_pair_idx ON v8_asean_currencies_daily(currency_pair, captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_currency_daily_idx ON v8_asean_currencies_daily(captured_at DESC);

-- ── COMMODITY PRICES: Daily snapshot (oil, metals, etc.) ──
CREATE TABLE IF NOT EXISTS v8_commodity_prices_daily (
    pk BIGSERIAL PRIMARY KEY,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    commodity_name TEXT NOT NULL,
    unit TEXT,
    price DOUBLE PRECISION NOT NULL,
    change_percent DOUBLE PRECISION,
    source TEXT,
    raw JSONB,
    UNIQUE (commodity_name, captured_at)
);
CREATE INDEX IF NOT EXISTS v8_commodity_daily_name_idx ON v8_commodity_prices_daily(commodity_name, captured_at DESC);
CREATE INDEX IF NOT EXISTS v8_commodity_daily_idx ON v8_commodity_prices_daily(captured_at DESC);

-- ── COUNTRY ECONOMICS: Annual series (slower-moving indicators) ──
CREATE TABLE IF NOT EXISTS v8_country_economics_annual (
    pk BIGSERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    country_name TEXT,
    gdp_usd_billions DOUBLE PRECISION,
    gdp_per_capita_usd DOUBLE PRECISION,
    population_millions DOUBLE PRECISION,
    area_km2 DOUBLE PRECISION,
    year INTEGER NOT NULL,
    source TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (country_code, year)
);
CREATE INDEX IF NOT EXISTS v8_country_econ_code_idx ON v8_country_economics_annual(country_code, year DESC);
CREATE INDEX IF NOT EXISTS v8_country_econ_year_idx ON v8_country_economics_annual(year DESC);

-- ── RLS: Enable public read access ──
ALTER TABLE v8_asean_currencies_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_commodity_prices_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE v8_country_economics_annual ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies: Anonymous + authenticated can read ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_asean_currencies_daily' AND policyname = 'v8_currency_read') THEN
    CREATE POLICY v8_currency_read ON v8_asean_currencies_daily FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_commodity_prices_daily' AND policyname = 'v8_commodity_read') THEN
    CREATE POLICY v8_commodity_read ON v8_commodity_prices_daily FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v8_country_economics_annual' AND policyname = 'v8_country_read') THEN
    CREATE POLICY v8_country_read ON v8_country_economics_annual FOR SELECT USING (true);
  END IF;
END $$;

-- Note: writes are via service_role key (bypasses RLS by design)
