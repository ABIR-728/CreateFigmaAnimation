import { useEffect, useRef, useState } from "react";

const DATA = [
  { month: "Jan", value: 24 },
  { month: "Feb", value: 38 },
  { month: "Mar", value: 29 },
  { month: "Apr", value: 52 },
  { month: "May", value: 46 },
  { month: "Jun", value: 71 },
  { month: "Jul", value: 63 },
  { month: "Aug", value: 88 },
  { month: "Sep", value: 79 },
  { month: "Oct", value: 104 },
  { month: "Nov", value: 97 },
  { month: "Dec", value: 121 },
];

const W = 640;
const H = 280;
const PAD = { top: 32, right: 32, bottom: 44, left: 52 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

const vals = DATA.map((d) => d.value);
const MIN = Math.min(...vals) * 0.8;
const MAX = Math.max(...vals) * 1.08;

function sx(i: number) {
  return PAD.left + (i / (DATA.length - 1)) * IW;
}
function sy(v: number) {
  return PAD.top + IH - ((v - MIN) / (MAX - MIN)) * IH;
}

function linePath(progress: number) {
  const total = DATA.length - 1;
  const visible = Math.floor(progress * total);
  const frac = progress * total - visible;
  const pts = DATA.slice(0, visible + 1).map((d, i) => [sx(i), sy(d.value)]);
  if (visible < total) {
    const [x1, y1] = [sx(visible), sy(DATA[visible].value)];
    const [x2, y2] = [sx(visible + 1), sy(DATA[visible + 1].value)];
    pts.push([x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac]);
  }
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function areaPath(progress: number) {
  const line = linePath(progress);
  if (!line) return "";
  const total = DATA.length - 1;
  const visible = Math.floor(progress * total);
  const frac = progress * total - visible;
  let endX = sx(visible);
  if (visible < total) {
    endX = sx(visible) + (sx(visible + 1) - sx(visible)) * frac;
  }
  const base = PAD.top + IH;
  return `${line} L${endX.toFixed(1)},${base} L${PAD.left},${base} Z`;
}

const YTICKS = 5;

export default function App() {
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      const animate = (ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const t = Math.min((ts - startRef.current) / 1600, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(eased);
        if (t < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, 300);
    return () => { clearTimeout(delay); cancelAnimationFrame(rafRef.current); };
  }, []);

  const yTicks = Array.from({ length: YTICKS }, (_, i) => {
    const v = MIN + ((MAX - MIN) * i) / (YTICKS - 1);
    return { v: Math.round(v), y: sy(v) };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (progress < 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left - PAD.left;
    const idx = Math.round((relX / IW) * (DATA.length - 1));
    if (idx >= 0 && idx < DATA.length) setTooltip(idx);
  };

  const color = "#7C6FF7";

  return (
    <div style={{
      width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0f1117", fontFamily: "'DM Sans', sans-serif", gap: "1.5rem",
    }}>
      {/* Header */}
      <div style={{ width: W }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#717182", margin: "0 0 0.3rem" }}>
          Monthly Growth
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 600, color: "#f0f0f4", margin: 0 }}>
            Revenue
          </h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", color: "#57CC99" }}>
            +404% YoY
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative" }}>
        <svg
          width={W} height={H}
          style={{ overflow: "visible", cursor: progress >= 1 ? "crosshair" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#ffffff0d" strokeWidth={1} />
              <text x={PAD.left - 10} y={t.y + 4} textAnchor="end" fill="#4a4a5a"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem" }}>
                {t.v}k
              </text>
            </g>
          ))}

          {/* X labels */}
          {DATA.map((d, i) => (
            <text key={i} x={sx(i)} y={H - 10} textAnchor="middle" fill={tooltip === i ? "#f0f0f4" : "#4a4a5a"}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", transition: "fill 0.15s" }}>
              {d.month}
            </text>
          ))}

          {/* Crosshair */}
          {tooltip !== null && (
            <line x1={sx(tooltip)} y1={PAD.top} x2={sx(tooltip)} y2={PAD.top + IH}
              stroke="#ffffff18" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {/* Area */}
          <path d={areaPath(progress)} fill="url(#area-fill)" />

          {/* Line */}
          <path
            d={linePath(progress)}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Moving dot at tip */}
          {progress < 1 && (() => {
            const total = DATA.length - 1;
            const visible = Math.floor(progress * total);
            const frac = progress * total - visible;
            const x = visible < total
              ? sx(visible) + (sx(visible + 1) - sx(visible)) * frac
              : sx(total);
            const v1 = DATA[visible].value;
            const v2 = visible < total ? DATA[visible + 1].value : v1;
            const y = sy(v1 + (v2 - v1) * frac);
            return (
              <circle cx={x} cy={y} r={4} fill={color} stroke="#0f1117" strokeWidth={2} />
            );
          })()}

          {/* Static dots on hover */}
          {tooltip !== null && DATA.map((d, i) => (
            <circle key={i} cx={sx(i)} cy={sy(d.value)} r={i === tooltip ? 5 : 3}
              fill={i === tooltip ? color : "#0f1117"}
              stroke={color}
              strokeWidth={i === tooltip ? 0 : 1.5}
              opacity={i === tooltip ? 1 : 0.4}
              style={{ transition: "r 0.15s, opacity 0.15s" }}
            />
          ))}
        </svg>

        {/* Tooltip card */}
        {tooltip !== null && progress >= 1 && (() => {
          const flip = sx(tooltip) > W * 0.72;
          return (
            <div style={{
              position: "absolute",
              top: PAD.top - 8,
              left: flip ? sx(tooltip) - 120 : sx(tooltip) + 14,
              background: "#1a1d2e",
              border: "1px solid #ffffff12",
              borderRadius: 10,
              padding: "0.6rem 0.9rem",
              pointerEvents: "none",
            }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "#717182", margin: "0 0 0.2rem", letterSpacing: "0.06em" }}>
                {DATA[tooltip].month} 2024
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1rem", color, margin: 0, fontWeight: 500 }}>
                {DATA[tooltip].value}k
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
