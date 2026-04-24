"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Crosshair, X, Search } from "lucide-react";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
        Loading map…
      </div>
    ),
  }
);

export type Location = {
  address: string;
  lat: number;
  lng: number;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

// Rough city-center fallbacks so the map has a sensible starting view.
const CITY_CENTERS: Record<string, [number, number]> = {
  Rewa: [24.533, 81.303],
  Indore: [22.7196, 75.8577],
  Lucknow: [26.8467, 80.9462],
  Bhopal: [23.2599, 77.4126],
};

async function nominatimSearch(q: string, hint?: string): Promise<SearchResult[]> {
  const full = hint ? `${q}, ${hint}` : q;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    full
  )}&format=json&limit=5&countrycodes=in`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) return [];
  return res.json();
}

async function nominatimReverse(
  lat: number,
  lng: number
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name ?? null;
}

export function LocationPicker({
  label,
  color,
  value,
  onChange,
  cityName,
}: {
  label: string;
  color: string;
  value: Location | null;
  onChange: (loc: Location | null) => void;
  cityName: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState<Location | null>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial center — city fallback, else value's own coords
  const [center, setCenter] = useState<[number, number]>(
    CITY_CENTERS[cityName] ?? [22.5726, 78.9629] // India center
  );

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setQuery("");
    setResults([]);
  }, [open, value]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await nominatimSearch(query, cityName);
        setResults(list);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, cityName]);

  function choose(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setDraft({ address: r.display_name, lat, lng });
    setCenter([lat, lng]);
    setResults([]);
    setQuery("");
  }

  async function handleMapPick(lat: number, lng: number) {
    const address =
      (await nominatimReverse(lat, lng)) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setDraft({ address, lat, lng });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address =
          (await nominatimReverse(latitude, longitude)) ??
          `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setDraft({ address, lat: latitude, lng: longitude });
        setCenter([latitude, longitude]);
      },
      () => {
        // user declined or error — ignore
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function confirm() {
    if (!draft) return;
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setDraft(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-slate-400 hover:text-red-600"
          >
            Clear
          </button>
        )}
      </div>

      {value ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-start gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm hover:border-brand-500"
        >
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color }}
          />
          <div className="flex-1">
            <div className="line-clamp-2 text-slate-900">{value.address}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500 hover:border-brand-500 hover:text-brand-600"
        >
          <MapPin className="h-4 w-4" />
          Pick {label.toLowerCase()} on map
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <div className="text-xs text-slate-500">Pick location</div>
              <div className="text-sm font-semibold text-slate-900">
                {label} ({cityName})
              </div>
            </div>
          </div>

          <div className="relative border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search in ${cityName}…`}
                className="flex-1 text-sm outline-none"
              />
              <button
                type="button"
                onClick={useMyLocation}
                title="Use my current location"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </div>
            {(searching || results.length > 0) && (
              <div className="absolute inset-x-4 top-full z-[1000] mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {searching && (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    Searching…
                  </div>
                )}
                {!searching &&
                  results.map((r, i) => (
                    <button
                      key={`${r.lat}-${r.lon}-${i}`}
                      type="button"
                      onClick={() => choose(r)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {r.display_name}
                    </button>
                  ))}
              </div>
            )}
            <div className="mt-1 text-[10px] text-slate-400">
              Tap anywhere on the map to drop a pin, or search above
            </div>
          </div>

          <div className="flex-1">
            <LocationPickerMap
              center={center}
              pin={draft ? [draft.lat, draft.lng] : null}
              color={color}
              onPick={handleMapPick}
            />
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            {draft ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color }}
                />
                <div className="flex-1 text-xs text-slate-700">
                  <div className="line-clamp-2">{draft.address}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                Tap on the map or search to place a pin
              </div>
            )}
            <button
              type="button"
              onClick={confirm}
              disabled={!draft}
              className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Confirm location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
