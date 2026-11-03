"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { Outline } from "@/lib/outline";

const STREETS = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
const SATELLITE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
};

/**
 * An interactive map of the property: street or satellite tiles, with the parcel's real outline
 * from King County drawn on top. Scroll-zoom stays off until the map is clicked, so it never
 * hijacks the page scroll.
 */
export function ParcelMap({ lat, lon, outline, label }: { lat: number; lon: number; outline: Outline | null; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const shape = useRef<L.Polygon | null>(null);
  const [layer, setLayer] = useState<"streets" | "satellite">("streets");

  // Create the map once.
  useEffect(() => {
    if (!el.current || map.current) return;
    // fadeAnimation off: tiles show the moment they load instead of relying on Leaflet's fade loop,
    // which can stall at opacity 0 when the map is remounted.
    const m = L.map(el.current, {
      center: [lat, lon],
      zoom: 18,
      scrollWheelZoom: false,
      zoomControl: false,
      fadeAnimation: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    m.attributionControl.setPrefix(false);
    m.on("click", () => m.scrollWheelZoom.enable());
    m.on("mouseout", () => m.scrollWheelZoom.disable());
    map.current = m;
    // Leaflet measures its box once; re-measure when the layout settles or the window resizes.
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, [lat, lon]);

  // Base tiles.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    const t = layer === "streets" ? STREETS : SATELLITE;
    tiles.current = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 20, maxNativeZoom: 19 }).addTo(m);
  }, [layer, lat, lon]);

  // The parcel outline, or a marker at the address point when the outline isn't available.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    shape.current?.remove();
    if (outline) {
      const satellite = layer === "satellite";
      // A dark casing under a light line reads on any imagery, white roofs included.
      const casing = satellite
        ? L.polygon(outline, { color: "#1c1c1c", weight: 7, opacity: 0.7, fill: false, interactive: false }).addTo(m)
        : null;
      shape.current = L.polygon(outline, {
        color: satellite ? "#f2f1eb" : "#2c3620",
        weight: 3,
        fillColor: "#2c3620",
        fillOpacity: satellite ? 0.12 : 0.28,
      }).addTo(m);
      m.fitBounds(shape.current.getBounds(), { padding: [64, 64], maxZoom: 19 });
      return () => {
        casing?.remove();
      };
    } else {
      const dot = L.circleMarker([lat, lon], { radius: 9, color: "#e3e2da", weight: 3, fillColor: "#2c3620", fillOpacity: 1 }).addTo(m);
      return () => {
        dot.remove();
      };
    }
  }, [outline, layer, lat, lon]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="h-full w-full bg-[var(--paper-2)]" role="region" aria-label={label} />
      <div className="absolute top-3 left-3 z-[500] flex bg-[var(--paper)]" role="group" aria-label="Map style">
        {(["streets", "satellite"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={layer === v}
            onClick={() => setLayer(v)}
            className={`press px-3 py-2 text-[length:var(--step-small)] capitalize ${
              layer === v ? "name bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink)] hover:bg-[var(--paper-2)]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
