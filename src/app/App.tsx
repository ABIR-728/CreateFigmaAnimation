import { useEffect, useRef, useState } from "react";

const DATA = [
  { label: "Product Design", value: 34, color: "#7C6FF7" },
  { label: "Engineering", value: 28, color: "#4FC4CF" },
  { label: "Marketing", value: 18, color: "#F4A261" },
  { label: "Operations", value: 12, color: "#E76F88" },
  { label: "Research", value: 8, color: "#57CC99" },
];

const TOTAL = DATA.reduce((s, d) => s + d.value, 0);
const TAU = Math.PI * 2;
const GAP = 0.025; // radians gap between slices

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function slicePath(
  startAngle: number,
  endAngle: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number
) {
  const [x1, y1] = polarToXY(startAngle, outerR, cx, cy);
  const [x2, y2] = polarToXY(endAngle, outerR, cx, cy);
  const [x3, y3] = polarToXY(endAngle, innerR, cx, cy);
  const [x4, y4] = polarToXY(startAngle, innerR, cx, cy);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [legendHovered, setLegendHovered] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const duration = 1400;

  useEffect(() => {
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const cx = 200;
  const cy = 200;
  const outerR = 150;
  const innerR = 82;

  // Build slice angles
  let cursor = -Math.PI / 2;
  const slices = DATA.map((d) => {
    const sweep = (d.value / TOTAL) * TAU * progress;
    const start = cursor + GAP / 2;
    const end = cursor + sweep - GAP / 2;
    cursor += (d.value / TOTAL) * TAU * progress;
    return { ...d, start, end, sweep };
  });

  const active = hovered ?? legendHovered;

  return (
    <div
      className="size-full flex items-center justify-center"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--background)" }}
    >
      <div className="flex flex-col lg:flex-row items-center gap-12 px-8">
        {/* Chart */}
        <div className="relative flex-shrink-0">
          <svg
            width={400}
            height={400}
            viewBox="0 0 400 400"
            style={{ overflow: "visible" }}
          >
            {slices.map((slice, i) => {
              if (slice.sweep <= 0.001) return null;
              const isActive = active === i;
              const scale = isActive ? 1.05 : 1;
              return (
                <path
                  key={i}
                  d={slicePath(slice.start, slice.end, outerR, innerR, cx, cy)}
                  fill={slice.color}
                  opacity={active !== null && !isActive ? 0.35 : 1}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: `scale(${scale})`,
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                    cursor: "pointer",
                    filter: isActive
                      ? `drop-shadow(0 0 12px ${slice.color}88)`
                      : "none",
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Center label */}
            <text
              x={cx}
              y={cy - 10}
              textAnchor="middle"
              fill={active !== null ? DATA[active].color : "#f0f0f4"}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "2rem",
                fontWeight: 500,
                transition: "fill 0.2s ease",
              }}
            >
              {active !== null ? `${DATA[active].value}%` : `${TOTAL}%`}
            </text>
            <text
              x={cx}
              y={cy + 18}
              textAnchor="middle"
              fill={active !== null ? DATA[active].color : "#717182"}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "fill 0.2s ease",
              }}
            >
              {active !== null ? DATA[active].label : "Budget Allocation"}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#717182",
              marginBottom: "0.5rem",
            }}
          >
            Breakdown
          </p>
          {DATA.map((d, i) => {
            const isActive = active === i;
            return (
              <div
                key={i}
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  opacity: active !== null && !isActive ? 0.4 : 1,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={() => setLegendHovered(i)}
                onMouseLeave={() => setLegendHovered(null)}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: d.color,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 8px ${d.color}` : "none",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
                <div className="flex-1 flex items-center justify-between gap-6">
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: isActive ? "#f0f0f4" : "#a0a0b0",
                      fontWeight: isActive ? 500 : 400,
                      transition: "color 0.2s ease, font-weight 0.2s ease",
                    }}
                  >
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.8rem",
                      color: isActive ? d.color : "#717182",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {d.value}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
