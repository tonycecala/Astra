"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Search, X } from "lucide-react";
import type { BirthPlaceSearchResult } from "@astra/contracts";
import { displayTimezone } from "../lib/display";
import { ui } from "../lib/i18n";
import styles from "./BirthLocationSheet.module.css";

export type BirthLocationValue = {
  location: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
};

type BirthLocationSheetProps = {
  ctaLabel: string;
  disabled?: boolean;
  onClose: () => void;
  onSave: (value: BirthLocationValue) => void;
  open: boolean;
  value: BirthLocationValue;
};

export function BirthLocationSheet({
  ctaLabel,
  disabled = false,
  onClose,
  onSave,
  open,
  value
}: BirthLocationSheetProps) {
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BirthPlaceSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  function choosePlace(place: BirthPlaceSearchResult) {
    if (disabled) return;
    setDraft({
      location: place.label,
      timezone: place.timezone,
      latitude: place.latitude,
      longitude: place.longitude
    });
    setResults([]);
    setMessage(ui.self.placeSearchSelected(place.label));
  }

  function clearPlace() {
    if (disabled) return;
    setDraft({ location: "", timezone: value.timezone, latitude: undefined, longitude: undefined });
    setResults([]);
    setMessage("");
  }

  async function searchPlaces() {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setMessage(ui.self.placeSearchQueryRequired);
      return;
    }

    setIsSearching(true);
    setMessage(ui.self.placeSearchWorking);
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(cleanQuery)}&limit=5`);
      const payload = (await response.json()) as { results?: BirthPlaceSearchResult[]; error?: string; message?: string };
      if (!response.ok) {
        setResults([]);
        setMessage(payload.message || payload.error || ui.self.placeSearchError);
        return;
      }

      const nextResults = payload.results ?? [];
      setResults(nextResults);
      setMessage(nextResults.length ? ui.self.placeSearchResultCount(nextResults.length) : ui.self.placeSearchEmpty);
    } catch {
      setResults([]);
      setMessage(ui.self.placeSearchError);
    } finally {
      setIsSearching(false);
    }
  }

  return createPortal(
    <div className={styles.backdrop} role="presentation">
      <section aria-labelledby="birth-location-sheet-title" aria-modal="true" className={styles.sheet} role="dialog">
        <header className={styles.header}>
          <button aria-label={ui.self.birthLocationClose} className={styles.iconButton} onClick={onClose} type="button">
            <X aria-hidden="true" size={16} />
          </button>
          <h2 id="birth-location-sheet-title">{ui.self.birthLocationSheetTitle}</h2>
          <button className={styles.primaryAction} disabled={disabled} onClick={() => onSave(draft)} type="button">
            {ctaLabel}
          </button>
        </header>

        <div className={styles.searchControl}>
          <label>
            <span>{ui.self.placeSearchLabel}</span>
            <input
              aria-label={ui.self.placeSearchLabel}
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchPlaces();
                }
              }}
              placeholder={ui.self.placeSearchPlaceholder}
              value={query}
            />
          </label>
          <button aria-label={ui.self.placeSearchSubmit} className={styles.searchButton} disabled={disabled || isSearching} onClick={() => void searchPlaces()} type="button">
            <Search aria-hidden="true" size={18} />
            <span>{isSearching ? ui.self.placeSearchWorking : ui.self.placeSearchSubmit}</span>
          </button>
        </div>

        {message ? <p className={styles.status} aria-live="polite">{message}</p> : null}
        {results.length ? (
          <ul className={styles.results} aria-label={ui.self.placeSearchResultsLabel}>
            {results.map((place) => (
              <li key={place.id}>
                <button onClick={() => choosePlace(place)} type="button">
                  <strong>{place.label}</strong>
                  <span>{displayTimezone(place.timezone)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div aria-label={ui.self.birthLocationCurrentSelection} className={styles.currentPlace}>
          <span>
            <MapPin aria-hidden="true" size={17} />
            {ui.self.chartLocationLabel}
          </span>
          <strong>{draft.location || ui.self.birthLocationNotSelected}</strong>
          {draft.location && draft.timezone ? <em>{displayTimezone(draft.timezone)}</em> : null}
          {draft.location ? (
            <button className={styles.clearButton} disabled={disabled} onClick={clearPlace} type="button">
              {ui.self.birthLocationClear}
            </button>
          ) : null}
        </div>
        <p className={styles.hint}>{ui.self.birthDetailsOptionalHint}</p>
      </section>
    </div>,
    document.body
  );
}
