"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { Outline } from "@/lib/outline";

// King County's own 2025 aerial survey: the same source as the parcel lines, so the two line up.
const AERIAL = {
  url: "https://gismaps.kingcounty.gov/arcgis/rest/services/BaseMaps/KingCo_Aerial_2025/MapServer/tile/{z}/{y}/{x}",
  attribution: "Aerial photo &copy; King County, EagleView",
  maxNativeZoom: 21,
};
const STREETS = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxNativeZoom: 19,
};
const LAYERS = { aerial: AERIAL, streets: STREETS };
type Layer = keyof typeof LAYERS;
const LAYER_LABEL: Record<Layer, string> = { aerial: "Aerial photo", streets: "Street map" };

/**
 * An interactive map of the property: King County's aerial photo or a street map, with the parcel's
 * real outline drawn on top and the neighbouring lot lines drawn faintly, so it is clear where this
 * lot ends. Scroll-zoom stays off until the map is clicked, so it never hijacks the page scroll.
 */
export function ParcelMap({ lat, lon, outline, label }: { lat: number; lon: number; outline: Outline | null; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const [layer, setLayer] = useState<Layer>("aerial");

  // Create the map once.
  useEffect(() => {
    if (!el.current || map.current) return;
    // fadeAnimation off: tiles show the moment they load instead of relying on Leaflet's fade loop,
    // which can stall at opacity 0 when the map is remounted.
    const m = L.map(el.current, {
      center: [lat, lon],
      zoom: 19,
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
    const t = LAYERS[layer];
    tiles.current = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 21, maxNativeZoom: t.maxNativeZoom }).addTo(m);
  }, [layer, lat, lon]);

  // Fit to the lot when its outline arrives (not on every layer switch, so a zoom the visitor chose stays).
  useEffect(() => {
    const m = map.current;
    if (!m || !outline) return;
    m.fitBounds(L.polygon(outline.subject).getBounds(), { padding: [72, 72], maxZoom: 20 });
  }, [outline, lat, lon]);

  // The lot lines: neighbours faint, the parcel strong. A marker at the address point if no outline.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const aerial = layer === "aerial";
    const drawn: L.Layer[] = [];
    if (outline) {
      const line = aerial ? "#f2f1eb" : "#1c1c1c";
      for (const rings of outline.neighbours) {
        drawn.push(
          L.polygon(rings, { color: line, weight: 1, opacity: aerial ? 0.55 : 0.35, fill: false, interactive: false }),
        );
      }
      // A dark casing under a light line reads on any photo, white roofs included.
      if (aerial) {
        drawn.push(L.polygon(outline.subject, { color: "#1c1c1c", weight: 7, opacity: 0.6, fill: false, interactive: false }));
      }
      drawn.push(
        L.polygon(outline.subject, {
          color: aerial ? "#f2f1eb" : "#2c3620",
          weight: 3,
          fillColor: aerial ? "#f2f1eb" : "#2c3620",
          fillOpacity: aerial ? 0.12 : 0.22,
          interactive: false,
        }),
      );
    } else {
      drawn.push(L.circleMarker([lat, lon], { radius: 9, color: "#e3e2da", weight: 3, fillColor: "#2c3620", fillOpacity: 1 }));
    }
    drawn.forEach((d) => d.addTo(m));
    return () => drawn.forEach((d) => d.remove());
  }, [outline, layer, lat, lon]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="h-full w-full bg-[var(--paper-2)]" role="region" aria-label={label} />
      <div className="absolute top-3 left-3 z-[500] flex bg-[var(--paper)]" role="group" aria-label="Map style">
        {(Object.keys(LAYERS) as Layer[]).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={layer === v}
            onClick={() => setLayer(v)}
            className={`press px-3 py-2 text-[length:var(--step-small)] ${
              layer === v ? "name bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink)] hover:bg-[var(--paper-2)]"
            }`}
          >
            {LAYER_LABEL[v]}
          </button>
        ))}
      </div>
      {outline ? (
        <p className="t-small absolute bottom-3 left-3 z-[500] bg-[var(--paper)] px-3 py-1.5">
          Bold line: this lot. Thin lines: neighbouring lots.
        </p>
      ) : null}
    </div>
  );
}
