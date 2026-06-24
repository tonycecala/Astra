"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AstrologyChartSnapshot } from "@astra/astrology";
import { ui } from "../lib/i18n";

type Placement = AstrologyChartSnapshot["placements"][number];
type Aspect = AstrologyChartSnapshot["aspects"][number];

const signs = [
  { abbr: "ARI", glyph: "♈" },
  { abbr: "TAU", glyph: "♉" },
  { abbr: "GEM", glyph: "♊" },
  { abbr: "CAN", glyph: "♋" },
  { abbr: "LEO", glyph: "♌" },
  { abbr: "VIR", glyph: "♍" },
  { abbr: "LIB", glyph: "♎" },
  { abbr: "SCO", glyph: "♏" },
  { abbr: "SAG", glyph: "♐" },
  { abbr: "CAP", glyph: "♑" },
  { abbr: "AQU", glyph: "♒" },
  { abbr: "PIS", glyph: "♓" }
];

const bodies: Record<string, { color: string; glyph: string; name: string }> = {
  sun: { name: "Sun", glyph: "☉", color: "#f3c969" },
  moon: { name: "Moon", glyph: "☾", color: "#b8c5ff" },
  mercury: { name: "Mercury", glyph: "☿", color: "#8cc7ff" },
  venus: { name: "Venus", glyph: "♀", color: "#7fd0b7" },
  mars: { name: "Mars", glyph: "♂", color: "#ef7b63" },
  jupiter: { name: "Jupiter", glyph: "♃", color: "#cf9df2" },
  saturn: { name: "Saturn", glyph: "♄", color: "#a5a0bb" },
  uranus: { name: "Uranus", glyph: "♅", color: "#83d8d1" },
  neptune: { name: "Neptune", glyph: "♆", color: "#79b9ff" },
  pluto: { name: "Pluto", glyph: "♇", color: "#d28bff" },
  chiron: { name: "Chiron", glyph: "⚷", color: "#d2b4a1" },
  ascendant: { name: "Ascendant", glyph: "AC", color: "#e2b86f" },
  midheaven: { name: "Midheaven", glyph: "MC", color: "#e2b86f" }
};

const legend = [
  { type: "square", label: ui.charts.aspectSquare },
  { type: "opposition", label: ui.charts.aspectOpposition },
  { type: "trine", label: ui.charts.aspectTrine },
  { type: "sextile", label: ui.charts.aspectSextile },
  { type: "conjunction", label: ui.charts.aspectConjunction }
];

function polarToCartesian(angle: number, radius: number) {
  const adjusted = ((angle - 90) * Math.PI) / 180;
  return {
    x: Number((50 + Math.cos(adjusted) * radius).toFixed(3)),
    y: Number((50 + Math.sin(adjusted) * radius).toFixed(3))
  };
}

function zodiacToScreenAngle(longitude: number, ascendantLongitude: number) {
  return (((270 - (longitude - ascendantLongitude)) % 360) + 360) % 360;
}

function midpointAngle(start: number, end: number) {
  return (start + ((end - start + 360) % 360) / 2) % 360;
}

function signLabelRotation(angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  return normalized > 90 && normalized < 270 ? normalized - 180 : normalized;
}

function aspectColor(type: string) {
  if (type === "conjunction") return "#f0d57a";
  if (type === "sextile") return "#5c8dff";
  if (type === "trine") return "#4caf6e";
  if (type === "square") return "#e35d66";
  if (type === "opposition") return "#d94d57";
  return "#a8adb6";
}

function bodyName(bodyId: string) {
  return bodies[bodyId]?.name ?? bodyId;
}

function bodyGlyph(bodyId: string) {
  return bodies[bodyId]?.glyph ?? bodyId.slice(0, 2).toUpperCase();
}

function aspectPeerName(aspect: Aspect, bodyId: string) {
  return bodyName(aspect.source === bodyId ? aspect.target : aspect.source);
}

function idealAspectAngle(type: Aspect["type"]) {
  if (type === "conjunction") return 0;
  if (type === "sextile") return 60;
  if (type === "square") return 90;
  if (type === "trine") return 120;
  return 180;
}

function angularDistance(left: number, right: number) {
  const distance = Math.abs(left - right) % 360;
  return distance > 180 ? 360 - distance : distance;
}

function aspectOrb(aspect: Aspect, placements: Map<string, Placement>) {
  const source = placements.get(aspect.source);
  const target = placements.get(aspect.target);
  if (!source || !target) return null;
  return Math.abs(angularDistance(source.angle, target.angle) - idealAspectAngle(aspect.type));
}

function houseGeometry(houseCusps: AstrologyChartSnapshot["houseCusps"]) {
  const sorted = [...houseCusps].sort((a, b) => a.house - b.house);
  return sorted.map((cusp, index) => {
    const next = sorted[(index + 1) % sorted.length] ?? sorted[0] ?? cusp;
    return { ...cusp, centerAngle: midpointAngle(cusp.angle, next.angle) };
  });
}

export function FullChartWheel({ chart }: { chart: AstrologyChartSnapshot }) {
  const placementByBody = useMemo(() => new Map(chart.placements.map((placement) => [placement.bodyId, placement])), [chart.placements]);
  const defaultBody = chart.placements.find((placement) => placement.bodyId === "sun")?.bodyId ?? chart.placements[0]?.bodyId ?? "";
  const [selectedBodyId, setSelectedBodyId] = useState(defaultBody);
  const [selectedAspectId, setSelectedAspectId] = useState<string | null>(null);
  const [hoveredBodyId, setHoveredBodyId] = useState<string | null>(null);
  const [hoveredAspectId, setHoveredAspectId] = useState<string | null>(null);
  const ascendantLongitude = placementByBody.get("ascendant")?.angle ?? chart.houseCusps.find((cusp) => cusp.house === 1)?.angle ?? 0;
  const houses = houseGeometry(chart.houseCusps);
  const selectedAspect = selectedAspectId ? chart.aspects.find((aspect) => aspect.id === selectedAspectId) ?? null : null;
  const selectedBody = placementByBody.get(selectedBodyId) ?? chart.placements[0] ?? null;
  const selectedBodyAspects = selectedBody ? chart.aspects.filter((aspect) => aspect.source === selectedBody.bodyId || aspect.target === selectedBody.bodyId) : [];
  const focusedAspectId = hoveredAspectId ?? selectedAspectId;
  const focusedBodyId = hoveredBodyId ?? selectedBody?.bodyId ?? null;

  return (
    <section className="fullChart" aria-label={ui.charts.fullChartLabel}>
      <section className="fullChartLegend" aria-label={ui.charts.aspectLegendLabel}>
        <div className="fullChartLegendGrid">
          {legend.map((item) => (
            <div className="fullChartLegendItem" key={item.type} style={{ "--legend-color": aspectColor(item.type) } as CSSProperties}>
              <span aria-hidden="true" />
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="fullChartCanvas">
        <svg className="fullChartWheel" viewBox="0 0 100 100" role="img" aria-label={ui.charts.fullChartWheelLabel}>
          <circle className="fullChartOuter" cx="50" cy="50" r="42" />
          <circle className="fullChartMiddle" cx="50" cy="50" r="33" />
          <circle className="fullChartInner" cx="50" cy="50" r="19" />
          {Array.from({ length: 360 }, (_, degree) => {
            const angle = zodiacToScreenAngle(degree, ascendantLongitude);
            const outer = polarToCartesian(angle, degree % 30 === 0 ? 42 : degree % 5 === 0 ? 41.4 : 40.8);
            const inner = polarToCartesian(angle, degree % 30 === 0 ? 36.5 : degree % 5 === 0 ? 38.4 : 39.6);
            return (
              <line
                className={degree % 30 === 0 ? "fullChartTick fullChartTickMajor" : degree % 5 === 0 ? "fullChartTick fullChartTickMedium" : "fullChartTick"}
                key={`tick-${degree}`}
                x1={inner.x}
                x2={outer.x}
                y1={inner.y}
                y2={outer.y}
              />
            );
          })}
          {signs.map((sign, index) => {
            const angle = zodiacToScreenAngle(index * 30 + 15, ascendantLongitude);
            const position = polarToCartesian(angle, 45.5);
            return (
              <text className="fullChartSignLabel" key={sign.abbr} transform={`rotate(${signLabelRotation(angle)} ${position.x} ${position.y})`} x={position.x} y={position.y}>
                {sign.glyph} {sign.abbr}
              </text>
            );
          })}
          {houses.map((house) => {
            const angle = zodiacToScreenAngle(house.angle, ascendantLongitude);
            const inner = polarToCartesian(angle, 19);
            const outer = polarToCartesian(angle, 42);
            const label = polarToCartesian(zodiacToScreenAngle(house.centerAngle, ascendantLongitude), 27);
            return (
              <g key={`house-${house.house}`}>
                <line className="fullChartHouseLine" x1={inner.x} x2={outer.x} y1={inner.y} y2={outer.y} />
                <text className="fullChartHouseLabel" x={label.x} y={label.y}>
                  {house.house}
                </text>
              </g>
            );
          })}
          {chart.aspects.map((aspect) => {
            const source = placementByBody.get(aspect.source);
            const target = placementByBody.get(aspect.target);
            if (!source || !target) return null;
            const sourcePoint = polarToCartesian(zodiacToScreenAngle(source.angle, ascendantLongitude), 17);
            const targetPoint = polarToCartesian(zodiacToScreenAngle(target.angle, ascendantLongitude), 17);
            const active = focusedAspectId === aspect.id || aspect.source === focusedBodyId || aspect.target === focusedBodyId;
            const dimmed = Boolean(focusedAspectId || focusedBodyId) && !active;
            return (
              <g key={aspect.id} style={{ "--aspect-color": aspectColor(aspect.type) } as CSSProperties}>
                <line className={`fullChartAspectLine ${active ? "fullChartAspectLineActive" : ""} ${dimmed ? "fullChartAspectLineDimmed" : ""} ${selectedAspectId === aspect.id ? "fullChartAspectLineSelected" : ""}`} x1={sourcePoint.x} x2={targetPoint.x} y1={sourcePoint.y} y2={targetPoint.y} />
                <line
                  className="fullChartAspectHitArea"
                  onClick={() => {
                    setSelectedAspectId(aspect.id);
                  }}
                  onPointerEnter={() => setHoveredAspectId(aspect.id)}
                  onPointerLeave={() => setHoveredAspectId(null)}
                  x1={sourcePoint.x}
                  x2={targetPoint.x}
                  y1={sourcePoint.y}
                  y2={targetPoint.y}
                />
              </g>
            );
          })}
        </svg>
        {chart.placements.map((placement) => {
          const body = bodies[placement.bodyId];
          const isAnglePoint = placement.bodyId === "ascendant" || placement.bodyId === "midheaven";
          const position = polarToCartesian(zodiacToScreenAngle(placement.angle, ascendantLongitude), isAnglePoint ? 37 : 30);
          const active = selectedBody?.bodyId === placement.bodyId;
          return (
            <button
              aria-label={ui.charts.selectBody(bodyName(placement.bodyId))}
              aria-pressed={active}
              className={`fullChartGlyph ${isAnglePoint ? "fullChartGlyphAngle" : ""} ${active ? "fullChartGlyphSelected" : ""} ${hoveredBodyId === placement.bodyId ? "fullChartGlyphHovered" : ""}`}
              key={placement.bodyId}
              onClick={() => {
                setSelectedBodyId(placement.bodyId);
                setSelectedAspectId(null);
              }}
              onFocus={() => setHoveredBodyId(placement.bodyId)}
              onBlur={() => setHoveredBodyId(null)}
              onPointerEnter={() => setHoveredBodyId(placement.bodyId)}
              onPointerLeave={() => setHoveredBodyId(null)}
              style={{ left: `${position.x}%`, top: `${position.y}%`, "--glyph-color": body?.color ?? "#e2b86f" } as CSSProperties}
              title={bodyName(placement.bodyId)}
              type="button"
            >
              <span aria-hidden="true">{bodyGlyph(placement.bodyId)}</span>
            </button>
          );
        })}
      </div>
      <div className="fullChartFocusTray" aria-live="polite">
        <div>
          <p className="fullChartTrayKicker">{selectedAspect ? ui.charts.selectedAspect : ui.charts.selectedObject}</p>
          <h3>
            {selectedAspect
              ? `${bodyName(selectedAspect.source)} ${selectedAspect.type} ${bodyName(selectedAspect.target)}`
              : selectedBody
                ? bodyName(selectedBody.bodyId)
                : ui.library.reportUnknownChartValue}
          </h3>
          <p>
            {selectedAspect
              ? `${ui.charts.orbLabel} ${aspectOrb(selectedAspect, placementByBody)?.toFixed(1) ?? "0.0"}°`
              : selectedBody
                ? `${selectedBody.sign}${selectedBody.house ? ` H${selectedBody.house}` : ""} · ${selectedBodyAspects.length} ${ui.charts.connectedAspects}`
                : ui.charts.selectAnotherObject}
          </p>
        </div>
        {!selectedAspect && selectedBodyAspects.length ? (
          <div className="fullChartAspectList" aria-label={ui.charts.bodyAspectsLabel(bodyName(selectedBody?.bodyId ?? ""))}>
            {selectedBodyAspects.map((aspect) => (
              <button
                key={aspect.id}
                onClick={() => setSelectedAspectId(aspect.id)}
                onPointerEnter={() => setHoveredAspectId(aspect.id)}
                onPointerLeave={() => setHoveredAspectId(null)}
                style={{ "--aspect-color": aspectColor(aspect.type) } as CSSProperties}
                type="button"
              >
                <span aria-hidden="true" />
                <strong>{`${aspect.type} ${aspectPeerName(aspect, selectedBody?.bodyId ?? "")}`}</strong>
                <small>{`${ui.charts.orbLabel} ${aspectOrb(aspect, placementByBody)?.toFixed(1) ?? "0.0"}°`}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
