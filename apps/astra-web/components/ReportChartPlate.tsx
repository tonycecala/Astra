import type { AstrologyChartSnapshot } from "@astra/astrology";
import type { AstrologyReportRequest } from "@astra/contracts";
import { ui } from "../lib/i18n";

type ChartPlacement = AstrologyChartSnapshot["placements"][number];

const signGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const majorBodyIds = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "ascendant", "midheaven"]);
const bodyGlyphs: Record<string, string> = {
  sun: "☉",
  moon: "☾",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  chiron: "⚷",
  ascendant: "AC",
  midheaven: "MC"
};

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

function aspectClass(type: string) {
  return `reportChartAspect reportChartAspect-${type}`;
}

function bodyGlyph(bodyId: string) {
  return bodyGlyphs[bodyId] ?? bodyId.slice(0, 2).toUpperCase();
}

function formatHouse(house?: number) {
  return house ? `H${house}` : "";
}

function formatChartSetting(value: string) {
  if (value === "whole-sign") return ui.library.reportChartWholeSign;
  return value.slice(0, 1).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

function placementLine(label: string, placement?: ChartPlacement) {
  if (!placement) return null;
  return `${label} ${placement.sign} ${formatHouse(placement.house)}`.trim();
}

function formatBirth(request: AstrologyReportRequest | null) {
  const birthData = request?.birthData;
  if (!birthData) return ui.library.reportUnknownChartValue;
  return [
    birthData.date,
    birthData.birthTimeKnown === false ? ui.self.birthMomentUnknownTimeShort : birthData.time
  ].filter(Boolean).join(" · ") || ui.library.reportUnknownChartValue;
}

export function ReportChartPlate({
  request,
  chart
}: {
  request: AstrologyReportRequest | null;
  chart: AstrologyChartSnapshot | null;
}) {
  if (!chart || chart.placements.length === 0) return null;

  const placementByBody = new Map(chart.placements.map((placement) => [placement.bodyId, placement]));
  const ascendantLongitude = placementByBody.get("ascendant")?.angle ?? chart.houseCusps.find((cusp) => cusp.house === 1)?.angle ?? 0;
  const visiblePlacements = chart.placements.filter((placement) => majorBodyIds.has(placement.bodyId));
  const visibleAspects = chart.aspects.slice(0, 18);
  const anchors = [
    placementLine(ui.library.reportChartSun, placementByBody.get("sun")),
    placementLine(ui.library.reportChartMoon, placementByBody.get("moon")),
    placementLine(ui.library.reportChartAsc, placementByBody.get("ascendant"))
  ].filter((line): line is string => Boolean(line));

  return (
    <aside className="reportDocumentPlate" aria-label={ui.library.reportChartPlateLabel}>
      <svg className="reportChartMini" viewBox="0 0 100 100" role="img" aria-label={ui.library.reportChartWheelLabel}>
        <circle className="reportChartHalo" cx="50" cy="50" r="45" />
        <circle className="reportChartOuter" cx="50" cy="50" r="39" />
        <circle className="reportChartInner" cx="50" cy="50" r="17" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = zodiacToScreenAngle(index * 30, ascendantLongitude);
          const inner = polarToCartesian(angle, index % 3 === 0 ? 29 : 33);
          const outer = polarToCartesian(angle, 39);
          const label = polarToCartesian(zodiacToScreenAngle(index * 30 + 15, ascendantLongitude), 44);
          return (
            <g key={`sign-${index}`}>
              <line className="reportChartTick" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
              <text className="reportChartSign" x={label.x} y={label.y}>
                {signGlyphs[index]}
              </text>
            </g>
          );
        })}
        {chart.houseCusps.map((cusp) => {
          const angle = zodiacToScreenAngle(cusp.angle, ascendantLongitude);
          const inner = polarToCartesian(angle, 17);
          const outer = polarToCartesian(angle, 39);
          return <line className="reportChartHouseLine" key={`house-${cusp.house}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />;
        })}
        {visibleAspects.map((aspect) => {
          const source = placementByBody.get(aspect.source);
          const target = placementByBody.get(aspect.target);
          if (!source || !target) return null;
          const sourcePoint = polarToCartesian(zodiacToScreenAngle(source.angle, ascendantLongitude), 15);
          const targetPoint = polarToCartesian(zodiacToScreenAngle(target.angle, ascendantLongitude), 15);
          return <line className={aspectClass(aspect.type)} key={aspect.id} x1={sourcePoint.x} y1={sourcePoint.y} x2={targetPoint.x} y2={targetPoint.y} />;
        })}
        {visiblePlacements.map((placement) => {
          const position = polarToCartesian(zodiacToScreenAngle(placement.angle, ascendantLongitude), placement.bodyId === "ascendant" || placement.bodyId === "midheaven" ? 35 : 28);
          return (
            <text className="reportChartGlyph" key={placement.bodyId} x={position.x} y={position.y}>
              {bodyGlyph(placement.bodyId)}
            </text>
          );
        })}
      </svg>
      <div className="reportDocumentPlateText">
        <p className="reportDocumentPlateKicker">{ui.library.reportChartBirthData}</p>
        <p className="reportDocumentPlatePrimary">{formatBirth(request)}</p>
        {request?.birthData.location ? <p className="reportDocumentPlateSecondary">{request.birthData.location}</p> : null}
        <dl className="reportDocumentPlateFacts">
          <div>
            <dt>{ui.library.reportChartZodiac}</dt>
            <dd>{formatChartSetting(chart.zodiacMode)}</dd>
          </div>
          {anchors.map((line) => (
            <div key={line}>
              <dt>{line.split(" ")[0]}</dt>
              <dd>{line.split(" ").slice(1).join(" ")}</dd>
            </div>
          ))}
          <div>
            <dt>{ui.library.reportChartHouses}</dt>
            <dd>{formatChartSetting(chart.houseSystem)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
