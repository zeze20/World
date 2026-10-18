import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Geodetic } from "../geo/index.js";
import type { ViewerHandle } from "../cesium/Viewer";
import { cacheGet, cacheSet } from "../cache/tileCache";
import { useAppStore } from "../store";

interface SearchResult {
  displayName: string;
  lat: number;
  lon: number;
}

interface Props {
  viewer: ViewerHandle | null;
}

function parseCoordinates(q: string): Geodetic | null {
  const cleaned = q.trim().replace(/,/g, " ").replace(/\s+/g, " ");
  const parts = cleaned.split(" ");
  if (parts.length < 2) return null;
  const a = parseFloat(parts[0]);
  const b = parseFloat(parts[1]);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return { latitude: a, longitude: b, height: 2500 };
  }
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
    return { latitude: b, longitude: a, height: 2500 };
  }
  return null;
}

async function searchNominatim(query: string): Promise<SearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = await cacheGet<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "AetherGlobe/0.1 (independent educational project)",
    },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  const results = data.map((d) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
  await cacheSet(cacheKey, results);
  return results;
}

export function SearchBar({ viewer }: Props) {
  const { t } = useTranslation();
  const setErrorMessage = useAppStore((s) => s.setErrorMessage);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setError(null);
    setResults([]);

    const coord = parseCoordinates(q);
    if (coord && viewer) {
      viewer.flyTo(coord);
      return;
    }

    setLoading(true);
    try {
      const list = await searchNominatim(q);
      setResults(list);
      if (list.length === 0) setError(t("noResults"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Search error";
      setError(msg);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [query, viewer, t, setErrorMessage]);

  const flyToResult = (r: SearchResult) => {
    viewer?.flyTo({ latitude: r.lat, longitude: r.lon, height: 2500 });
    setResults([]);
    setQuery("");
  };

  return (
    <div className="panel search-panel">
      <label className="sr-only" htmlFor="search-input">
        {t("search")}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="search-input"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          enterKeyHint="search"
          inputMode="search"
          data-testid="search-input"
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={doSearch}
          disabled={loading}
          aria-busy={loading}
          data-testid="search-button"
        >
          {t("search")}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: "var(--danger)", margin: "8px 0 0", fontSize: 13 }}>
          {error}
        </p>
      )}
      {results.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: "8px 0 0",
            padding: 0,
            maxHeight: "30vh",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          data-testid="search-results"
        >
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  marginTop: 4,
                  fontSize: 14,
                  minHeight: 48,
                }}
                onClick={() => flyToResult(r)}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
