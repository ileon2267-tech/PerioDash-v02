import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface PerioCategoryItem {
  name: string;
  shortName?: string;
  total: number;
  completados: number;
  tasaExito: number;
}

interface PerioSuccessBarChartProps {
  categoriesData: PerioCategoryItem[];
}

const BAR_COLORS = ["#0d9488", "#0ea5e9", "#10b981", "#6366f1"];

export const PerioSuccessBarChart: React.FC<PerioSuccessBarChartProps> = ({ categoriesData }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const yTicks = [0, 25, 50, 75, 100];
  const count = categoriesData.length;
  const slotW = count > 0 ? chartW / count : chartW;
  const barW = Math.min(48, slotW * 0.55);

  return (
    <div className="relative w-full h-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y Grid lines & labels */}
        {yTicks.map((tick) => {
          const y = paddingTop + chartH - (tick / 100) * chartH;
          return (
            <g key={tick} className="text-slate-400 dark:text-slate-500">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity={tick === 0 ? 0.3 : 0.12}
                strokeDasharray={tick === 0 ? undefined : "3 3"}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10}
                fontFamily="monospace"
                fill="currentColor"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {categoriesData.map((item, idx) => {
          const x = paddingLeft + idx * slotW + (slotW - barW) / 2;
          const barHeight = Math.max(4, (item.tasaExito / 100) * chartH);
          const y = paddingTop + chartH - barHeight;
          const isHovered = hoveredIdx === idx;
          const color = BAR_COLORS[idx % BAR_COLORS.length];

          return (
            <g
              key={idx}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Background Hit Area */}
              <rect
                x={paddingLeft + idx * slotW + 4}
                y={paddingTop}
                width={slotW - 8}
                height={chartH}
                fill={isHovered ? "rgba(13, 148, 136, 0.08)" : "transparent"}
                rx={8}
                className="transition-colors duration-150"
              />

              {/* Bar Rect */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barHeight}
                rx={6}
                fill={color}
                opacity={isHovered ? 1 : 0.88}
                filter={isHovered ? "drop-shadow(0 4px 10px rgba(13, 148, 136, 0.35))" : undefined}
                className="transition-all duration-200"
              />

              {/* Percentage label on top of bar */}
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fontFamily="monospace"
                fill={isHovered ? color : "#94a3b8"}
                className="transition-colors duration-150"
              >
                {item.tasaExito}%
              </text>

              {/* X Axis Label */}
              <text
                x={x + barW / 2}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={isHovered ? "700" : "500"}
                fill={isHovered ? "#0d9488" : "#94a3b8"}
                className="transition-colors duration-150"
              >
                {item.shortName || item.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip Card */}
      <AnimatePresence>
        {hoveredIdx !== null && categoriesData[hoveredIdx] && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 right-2 sm:right-6 pointer-events-none z-20 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1 backdrop-blur-md max-w-xs"
          >
            <p className="font-bold text-teal-400 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: BAR_COLORS[hoveredIdx % BAR_COLORS.length] }}
              />
              <span>{categoriesData[hoveredIdx].name}</span>
            </p>
            <div className="flex justify-between gap-4 text-slate-300 pt-0.5">
              <span>Tasa de Éxito:</span>
              <strong className="text-emerald-400 font-mono">
                {categoriesData[hoveredIdx].tasaExito}%
              </strong>
            </div>
            <div className="flex justify-between gap-4 text-slate-400 text-[11px]">
              <span>Procedimientos Completados:</span>
              <span className="font-mono text-white">
                {categoriesData[hoveredIdx].completados} de {categoriesData[hoveredIdx].total}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface StatusDistItem {
  name: string;
  value: number;
  color: string;
}

interface ClinicalCohortDonutChartProps {
  statusDistributionData: StatusDistItem[];
  totalPatients: number;
}

export const ClinicalCohortDonutChart: React.FC<ClinicalCohortDonutChartProps> = ({
  statusDistributionData,
  totalPatients,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 62;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~389.55

  const totalValue = Math.max(
    1,
    statusDistributionData.reduce((acc, curr) => acc + curr.value, 0)
  );

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full select-none">
      <div className="relative w-44 h-44 flex items-center justify-center my-auto">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {/* Subtle Background Track */}
          <circle
            cx={80}
            cy={80}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200/40 dark:text-slate-800/40"
          />

          {/* Slices */}
          {statusDistributionData.map((item, idx) => {
            const pct = item.value / totalValue;
            const strokeDash = pct * circumference;
            const strokeOffset = accumulatedPercent * circumference;
            accumulatedPercent += pct;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx={80}
                cy={80}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                strokeDashoffset={-strokeOffset}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHovered ? "drop-shadow(0 0 8px rgba(13, 148, 136, 0.5))" : undefined,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Donut Center Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {hoveredIdx !== null && statusDistributionData[hoveredIdx] ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <span
                className="text-xl font-mono font-black block leading-none"
                style={{ color: statusDistributionData[hoveredIdx].color }}
              >
                {statusDistributionData[hoveredIdx].value}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                Pacientes
              </span>
            </motion.div>
          ) : (
            <div>
              <span className="text-xl font-mono font-black text-slate-900 dark:text-white block leading-none">
                {totalPatients}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                Total Cohorte
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Micro Legend */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] w-full px-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
        {statusDistributionData.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 truncate cursor-pointer p-1 rounded-md transition-colors ${
                isHovered ? "bg-teal-500/10 font-bold" : ""
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span
                className={`truncate ${
                  isHovered ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.name.split("(")[0]}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 ml-auto">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface DayTimelineItem {
  date: string;
  label: string;
  citas: number;
  confirmadas: number;
  ocupacionPct: number;
  sillon1: number;
  sillon2: number;
  sillon3: number;
  gabineteQx: number;
}

interface ChairOccupancyAreaChartProps {
  dailyTimeline: DayTimelineItem[];
}

export const ChairOccupancyAreaChart: React.FC<ChairOccupancyAreaChartProps> = ({ dailyTimeline }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 650;
  const height = 250;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const N = dailyTimeline.length;
  const yTicks = [0, 25, 50, 75, 100];

  // Coordinates calculation
  const points = dailyTimeline.map((item, i) => {
    const x = N > 1 ? paddingLeft + (i / (N - 1)) * chartW : paddingLeft + chartW / 2;
    const y = paddingTop + chartH - (item.ocupacionPct / 100) * chartH;
    return { x, y, item, i };
  });

  // Construct smooth SVG path using Catmull-Rom or Bezier spline
  let linePath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const baselineY = paddingTop + chartH;
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : "";

  // 80% Benchmark Reference Line Y
  const benchmarkY = paddingTop + chartH - (80 / 100) * chartH;

  return (
    <div className="relative w-full h-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradientOccupancy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity={0.45} />
            <stop offset="90%" stopColor="#0284c7" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Horizontal Y Grid lines & labels */}
        {yTicks.map((tick) => {
          const y = paddingTop + chartH - (tick / 100) * chartH;
          return (
            <g key={tick} className="text-slate-400 dark:text-slate-500">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity={tick === 0 ? 0.35 : 0.12}
                strokeDasharray={tick === 0 ? undefined : "3 3"}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10}
                fontFamily="monospace"
                fill="currentColor"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* 80% Benchmark Reference Line */}
        <g className="text-amber-500">
          <line
            x1={paddingLeft}
            y1={benchmarkY}
            x2={width - paddingRight}
            y2={benchmarkY}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeOpacity={0.75}
          />
          <text
            x={width - paddingRight - 4}
            y={benchmarkY - 5}
            textAnchor="end"
            fontSize={9.5}
            fontWeight="bold"
            fill="#f59e0b"
          >
            Objetivo (80%)
          </text>
        </g>

        {/* Filled Area */}
        {areaPath && (
          <path d={areaPath} fill="url(#areaGradientOccupancy)" />
        )}

        {/* Stroke Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#0284c7"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Active Cursor & Highlights */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <g>
            {/* Vertical crosshair line */}
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={baselineY}
              stroke="#0284c7"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
            {/* Highlighted point circle */}
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].y}
              r={5.5}
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth={2.5}
              filter="drop-shadow(0 0 6px rgba(2, 132, 199, 0.8))"
            />
          </g>
        )}

        {/* Interactive Point Targets & X-axis Labels */}
        {points.map((p, idx) => {
          const showLabel = idx === 0 || idx === Math.floor(N / 2) || idx === N - 1 || idx % 4 === 0;
          return (
            <g key={idx}>
              {/* Invisible wide hover target */}
              <rect
                x={p.x - chartW / (2 * N)}
                y={paddingTop}
                width={chartW / N}
                height={chartH + paddingBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Small normal dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 5 : 2.5}
                fill={p.item.ocupacionPct >= 80 ? "#10b981" : "#0284c7"}
                stroke="#ffffff"
                strokeWidth={1}
                className="transition-all duration-150 pointer-events-none"
              />

              {/* X Axis Date Label */}
              {showLabel && (
                <text
                  x={p.x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="monospace"
                  fill={hoveredIdx === idx ? "#0284c7" : "#94a3b8"}
                  fontWeight={hoveredIdx === idx ? "700" : "500"}
                  className="transition-colors duration-150 pointer-events-none"
                >
                  {p.item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Rich Tooltip Card */}
      <AnimatePresence>
        {hoveredIdx !== null && dailyTimeline[hoveredIdx] && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 right-2 sm:right-6 pointer-events-none z-20 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-md min-w-[220px]"
          >
            <p className="font-bold text-sky-400 flex items-center justify-between">
              <span>{dailyTimeline[hoveredIdx].label}</span>
              <span className="text-[10px] font-mono text-slate-400">
                {dailyTimeline[hoveredIdx].date}
              </span>
            </p>
            <div className="space-y-1 border-t border-slate-700/80 pt-1.5 font-mono">
              <div className="text-slate-300 flex justify-between gap-4">
                <span>Ocupación Global:</span>
                <strong className="text-sky-300">
                  {dailyTimeline[hoveredIdx].ocupacionPct}%
                </strong>
              </div>
              <div className="text-slate-300 flex justify-between gap-4">
                <span>Citas Atendidas/Conf:</span>
                <strong className="text-emerald-400">
                  {dailyTimeline[hoveredIdx].confirmadas} de {dailyTimeline[hoveredIdx].citas}
                </strong>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 grid grid-cols-2 gap-1 border-t border-slate-800">
                <span>Sillón 1 (Perio): {dailyTimeline[hoveredIdx].sillon1}</span>
                <span>Sillón 2 (Gen): {dailyTimeline[hoveredIdx].sillon2}</span>
                <span>Sillón 3 (Rehab): {dailyTimeline[hoveredIdx].sillon3}</span>
                <span>Gabinete Qx: {dailyTimeline[hoveredIdx].gabineteQx}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
