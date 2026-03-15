import type {
  CountryCapital,
  CountryCurrency,
  CountryLanguage,
  CountryMetadata,
} from "../types/dashboard";
import type { AseanCountryCode } from "./asean-country-registry";

const REST_COUNTRIES_BASE_URL = "https://restcountries.com/v3.1/alpha";
const REQUEST_TIMEOUT_MS = 4_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const COUNTRY_METADATA_FIELDS = [
  "cca2",
  "name",
  "flags",
  "region",
  "subregion",
  "capital",
  "capitalInfo",
  "currencies",
  "languages",
  "timezones",
  "borders",
].join(",");

interface CachedCountryMetadata {
  fetchedAt: number;
  metadata: CountryMetadata;
}

const countryMetadataCache = new Map<string, CachedCountryMetadata>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildFlagEmoji(alpha2: string | null) {
  if (!alpha2 || alpha2.length !== 2) {
    return null;
  }

  return alpha2
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function buildFlagSvgUrl(alpha2: string | null) {
  if (!alpha2) {
    return null;
  }

  return `https://flagcdn.com/${alpha2.toLowerCase()}.svg`;
}

function createEmptyCountryMetadata(alpha3: string): CountryMetadata {
  return {
    alpha2: null,
    alpha3,
    officialName: null,
    flagEmoji: null,
    flagSvgUrl: null,
    region: null,
    subregion: null,
    capital: null,
    capitalLatLng: null,
    currencies: [],
    languages: [],
    timezones: [],
    borders: [],
  };
}

function createFallbackMetadata(input: {
  alpha2: string;
  alpha3: AseanCountryCode;
  officialName: string;
  capital: CountryCapital;
  currencies: CountryCurrency[];
  languages: CountryLanguage[];
  timezones: string[];
  borders: string[];
}): CountryMetadata {
  return {
    alpha2: input.alpha2,
    alpha3: input.alpha3,
    officialName: input.officialName,
    flagEmoji: buildFlagEmoji(input.alpha2),
    flagSvgUrl: buildFlagSvgUrl(input.alpha2),
    region: "Asia",
    subregion: "South-Eastern Asia",
    capital: input.capital.name,
    capitalLatLng: input.capital.latlng,
    currencies: input.currencies,
    languages: input.languages,
    timezones: input.timezones,
    borders: input.borders,
  };
}

const ASEAN_FALLBACK_METADATA: Record<AseanCountryCode, CountryMetadata> = {
  BRN: createFallbackMetadata({
    alpha2: "BN",
    alpha3: "BRN",
    officialName: "Nation of Brunei, Abode of Peace",
    capital: {
      name: "Bandar Seri Begawan",
      latlng: [4.883333, 114.933333],
    },
    currencies: [{ code: "BND", name: "Brunei dollar", symbol: "$" }],
    languages: [{ code: "msa", name: "Malay" }],
    timezones: ["UTC+08:00"],
    borders: ["MYS"],
  }),
  KHM: createFallbackMetadata({
    alpha2: "KH",
    alpha3: "KHM",
    officialName: "Kingdom of Cambodia",
    capital: {
      name: "Phnom Penh",
      latlng: [11.55, 104.916667],
    },
    currencies: [{ code: "KHR", name: "Cambodian riel", symbol: "៛" }],
    languages: [{ code: "khm", name: "Khmer" }],
    timezones: ["UTC+07:00"],
    borders: ["LAO", "THA", "VNM"],
  }),
  IDN: createFallbackMetadata({
    alpha2: "ID",
    alpha3: "IDN",
    officialName: "Republic of Indonesia",
    capital: {
      name: "Jakarta",
      latlng: [-6.175, 106.816667],
    },
    currencies: [{ code: "IDR", name: "Indonesian rupiah", symbol: "Rp" }],
    languages: [{ code: "ind", name: "Indonesian" }],
    timezones: ["UTC+07:00", "UTC+08:00", "UTC+09:00"],
    borders: ["MYS", "PNG", "TLS"],
  }),
  LAO: createFallbackMetadata({
    alpha2: "LA",
    alpha3: "LAO",
    officialName: "Lao People's Democratic Republic",
    capital: {
      name: "Vientiane",
      latlng: [17.966667, 102.6],
    },
    currencies: [{ code: "LAK", name: "Lao kip", symbol: "₭" }],
    languages: [{ code: "lao", name: "Lao" }],
    timezones: ["UTC+07:00"],
    borders: ["KHM", "CHN", "MMR", "THA", "VNM"],
  }),
  MMR: createFallbackMetadata({
    alpha2: "MM",
    alpha3: "MMR",
    officialName: "Republic of the Union of Myanmar",
    capital: {
      name: "Naypyidaw",
      latlng: [19.75, 96.1],
    },
    currencies: [{ code: "MMK", name: "Burmese kyat", symbol: "Ks" }],
    languages: [{ code: "mya", name: "Burmese" }],
    timezones: ["UTC+06:30"],
    borders: ["BGD", "CHN", "IND", "LAO", "THA"],
  }),
  MYS: createFallbackMetadata({
    alpha2: "MY",
    alpha3: "MYS",
    officialName: "Malaysia",
    capital: {
      name: "Kuala Lumpur",
      latlng: [3.166667, 101.7],
    },
    currencies: [{ code: "MYR", name: "Malaysian ringgit", symbol: "RM" }],
    languages: [{ code: "msa", name: "Malay" }],
    timezones: ["UTC+08:00"],
    borders: ["BRN", "IDN", "THA"],
  }),
  PHL: createFallbackMetadata({
    alpha2: "PH",
    alpha3: "PHL",
    officialName: "Republic of the Philippines",
    capital: {
      name: "Manila",
      latlng: [14.6, 120.966667],
    },
    currencies: [{ code: "PHP", name: "Philippine peso", symbol: "₱" }],
    languages: [
      { code: "eng", name: "English" },
      { code: "fil", name: "Filipino" },
    ],
    timezones: ["UTC+08:00"],
    borders: [],
  }),
  SGP: createFallbackMetadata({
    alpha2: "SG",
    alpha3: "SGP",
    officialName: "Republic of Singapore",
    capital: {
      name: "Singapore",
      latlng: [1.283333, 103.85],
    },
    currencies: [{ code: "SGD", name: "Singapore dollar", symbol: "$" }],
    languages: [
      { code: "eng", name: "English" },
      { code: "msa", name: "Malay" },
      { code: "tam", name: "Tamil" },
      { code: "zho", name: "Chinese" },
    ],
    timezones: ["UTC+08:00"],
    borders: [],
  }),
  THA: createFallbackMetadata({
    alpha2: "TH",
    alpha3: "THA",
    officialName: "Kingdom of Thailand",
    capital: {
      name: "Bangkok",
      latlng: [13.75, 100.516667],
    },
    currencies: [{ code: "THB", name: "Thai baht", symbol: "฿" }],
    languages: [{ code: "tha", name: "Thai" }],
    timezones: ["UTC+07:00"],
    borders: ["KHM", "LAO", "MMR", "MYS"],
  }),
  TLS: createFallbackMetadata({
    alpha2: "TL",
    alpha3: "TLS",
    officialName: "Democratic Republic of Timor-Leste",
    capital: {
      name: "Dili",
      latlng: [-8.583333, 125.6],
    },
    currencies: [{ code: "USD", name: "United States dollar", symbol: "$" }],
    languages: [
      { code: "por", name: "Portuguese" },
      { code: "tet", name: "Tetum" },
    ],
    timezones: ["UTC+09:00"],
    borders: ["IDN"],
  }),
  VNM: createFallbackMetadata({
    alpha2: "VN",
    alpha3: "VNM",
    officialName: "Socialist Republic of Vietnam",
    capital: {
      name: "Hanoi",
      latlng: [21.033333, 105.85],
    },
    currencies: [{ code: "VND", name: "Vietnamese dong", symbol: "₫" }],
    languages: [{ code: "vie", name: "Vietnamese" }],
    timezones: ["UTC+07:00"],
    borders: ["CHN", "KHM", "LAO"],
  }),
};

function normalizeCapital(value: unknown, capitalInfo: unknown): CountryCapital {
  const name =
    Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
  const latlng =
    isRecord(capitalInfo) &&
    Array.isArray(capitalInfo.latlng) &&
    typeof capitalInfo.latlng[0] === "number" &&
    typeof capitalInfo.latlng[1] === "number"
      ? [capitalInfo.latlng[0], capitalInfo.latlng[1]] as [number, number]
      : null;

  return {
    name,
    latlng,
  };
}

function normalizeCurrencies(value: unknown): CountryCurrency[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([code, details]) => {
    if (!isRecord(details)) {
      return [];
    }

    return [
      {
        code,
        name: typeof details.name === "string" ? details.name : null,
        symbol: typeof details.symbol === "string" ? details.symbol : null,
      },
    ];
  });
}

function normalizeLanguages(value: unknown): CountryLanguage[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([code, name]) =>
    typeof name === "string" ? [{ code, name }] : [],
  );
}

function normalizeCountryMetadata(
  value: unknown,
  requestedAlpha3: string,
): CountryMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  const alpha2 = typeof value.cca2 === "string" ? value.cca2 : null;
  const capital = normalizeCapital(value.capital, value.capitalInfo);
  const flags = isRecord(value.flags) ? value.flags : null;

  return {
    alpha2,
    alpha3: requestedAlpha3,
    officialName:
      isRecord(value.name) && typeof value.name.official === "string"
        ? value.name.official
        : null,
    flagEmoji: buildFlagEmoji(alpha2),
    flagSvgUrl:
      flags && typeof flags.svg === "string"
        ? flags.svg
        : buildFlagSvgUrl(alpha2),
    region: typeof value.region === "string" ? value.region : null,
    subregion: typeof value.subregion === "string" ? value.subregion : null,
    capital: capital.name,
    capitalLatLng: capital.latlng,
    currencies: normalizeCurrencies(value.currencies),
    languages: normalizeLanguages(value.languages),
    timezones: Array.isArray(value.timezones)
      ? value.timezones.filter(
          (timezone): timezone is string => typeof timezone === "string",
        )
      : [],
    borders: Array.isArray(value.borders)
      ? value.borders.filter(
          (border): border is string => typeof border === "string",
        )
      : [],
  };
}

async function fetchCountryMetadataFromRestCountries(alpha3: string) {
  const response = await fetch(
    `${REST_COUNTRIES_BASE_URL}/${encodeURIComponent(alpha3)}?fields=${COUNTRY_METADATA_FIELDS}`,
    {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`REST Countries request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const country = Array.isArray(payload) ? payload[0] : payload;
  const metadata = normalizeCountryMetadata(country, alpha3);

  if (!metadata) {
    throw new Error("REST Countries payload was not recognized");
  }

  return metadata;
}

export function getFallbackCountryMetadata(alpha3: string) {
  return ASEAN_FALLBACK_METADATA[alpha3 as AseanCountryCode] ?? null;
}

export async function loadCountryMetadata(countryCode: string) {
  const alpha3 = countryCode.trim().toUpperCase();
  const cached = countryMetadataCache.get(alpha3);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.metadata;
  }

  try {
    const metadata = await fetchCountryMetadataFromRestCountries(alpha3);
    countryMetadataCache.set(alpha3, {
      fetchedAt: Date.now(),
      metadata,
    });
    return metadata;
  } catch {
    const fallback = getFallbackCountryMetadata(alpha3) ?? createEmptyCountryMetadata(alpha3);

    countryMetadataCache.set(alpha3, {
      fetchedAt: Date.now(),
      metadata: fallback,
    });

    return fallback;
  }
}
