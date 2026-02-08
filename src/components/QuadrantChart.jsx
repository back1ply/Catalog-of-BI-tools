import { useRef, useCallback } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, zoomPlugin);

const GEN_COLORS = {
  1: { bg: 'rgba(99, 102, 241, 0.7)', border: '#6366f1' },
  2: { bg: 'rgba(59, 130, 246, 0.7)', border: '#3b82f6' },
  3: { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
  4: { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
  0: { bg: 'rgba(156, 163, 175, 0.7)', border: '#9ca3af' },
};

// Generation column boundaries in data units
const GEN_BOUNDS = [
  { min: 0.3, max: 1.5, label: 'Generation 1', color: '#6366f1', zoneBg: 'rgba(99,102,241,0.04)', zoneBot: 'rgba(99,102,241,0.025)' },
  { min: 1.5, max: 2.5, label: 'Generation 2', color: '#3b82f6', zoneBg: 'rgba(59,130,246,0.04)', zoneBot: 'rgba(59,130,246,0.025)' },
  { min: 2.5, max: 3.25, label: 'Generation 3', color: '#10b981', zoneBg: 'rgba(16,185,129,0.04)', zoneBot: 'rgba(16,185,129,0.025)' },
  { min: 3.25, max: 4.2, label: 'Gen 4+', color: '#f59e0b', zoneBg: 'rgba(245,158,11,0.04)', zoneBot: 'rgba(245,158,11,0.025)' },
];

const quadrantPlugin = {
  id: 'quadrantBackground',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const { x, y } = chart.scales;
    const midY = y.getPixelForValue(0.5);

    // Subtle quadrant zone fills per generation column
    GEN_BOUNDS.forEach(gen => {
      const x1 = x.getPixelForValue(gen.min);
      const x2 = x.getPixelForValue(gen.max);
      ctx.fillStyle = gen.zoneBg;
      ctx.fillRect(x1, top, x2 - x1, midY - top);
      ctx.fillStyle = gen.zoneBot;
      ctx.fillRect(x1, midY, x2 - x1, bottom - midY);
    });
  },
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const { x, y } = chart.scales;
    const midY = y.getPixelForValue(0.5);

    ctx.save();

    // ── Main axes (solid dark lines) ──
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;

    // Y-axis (left edge)
    ctx.beginPath();
    ctx.moveTo(left, bottom + 2);
    ctx.lineTo(left, top - 6);
    ctx.stroke();
    // Y-axis arrow
    ctx.beginPath();
    ctx.moveTo(left - 4, top);
    ctx.lineTo(left, top - 8);
    ctx.lineTo(left + 4, top);
    ctx.stroke();

    // X-axis (bottom edge)
    ctx.beginPath();
    ctx.moveTo(left - 2, bottom);
    ctx.lineTo(right + 6, bottom);
    ctx.stroke();
    // X-axis arrow
    ctx.beginPath();
    ctx.moveTo(right, bottom - 4);
    ctx.lineTo(right + 8, bottom);
    ctx.lineTo(right, bottom + 4);
    ctx.stroke();

    // ── Horizontal midline (business/technical divider) ──
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, midY);
    ctx.lineTo(right, midY);
    ctx.stroke();

    // ── Vertical generation dividers ──
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1;
    [1.5, 2.5, 3.25].forEach(val => {
      const px = x.getPixelForValue(val);
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, bottom);
      ctx.stroke();
    });

    // ── Generation labels (colored, centered in each column) ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    GEN_BOUNDS.forEach(gen => {
      const cx = (x.getPixelForValue(gen.min) + x.getPixelForValue(gen.max)) / 2;
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillStyle = gen.color;
      ctx.fillText(gen.label, cx, bottom + 8);
    });

    // ── "Generation" label at far right of x-axis ──
    ctx.fillStyle = '#374151';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('Generation', right + 4, bottom + 8);

    // ── Y-axis labels ──
    ctx.fillStyle = '#374151';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Business users', left + 2, top - 22);

    ctx.textBaseline = 'bottom';
    ctx.fillText('Technical users', left + 2, bottom + 36);

    ctx.restore();
  },
};

ChartJS.register(quadrantPlugin);

export default function QuadrantChart({ data, highlightedTool, onHighlight, onSelectTool }) {
  const chartRef = useRef(null);

  const chartData = {
    datasets: [
      {
        label: 'Gen 1',
        data: data.filter(t => t.generationNum === 1).map(t => ({ x: t.quadrant.x, y: t.quadrant.y, tool: t })),
        backgroundColor: GEN_COLORS[1].bg,
        borderColor: GEN_COLORS[1].border,
        borderWidth: 1.5,
        pointRadius: data.length > 30 ? 6 : 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Gen 2',
        data: data.filter(t => t.generationNum === 2).map(t => ({ x: t.quadrant.x, y: t.quadrant.y, tool: t })),
        backgroundColor: GEN_COLORS[2].bg,
        borderColor: GEN_COLORS[2].border,
        borderWidth: 1.5,
        pointRadius: data.length > 30 ? 6 : 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Gen 3',
        data: data.filter(t => t.generationNum === 3).map(t => ({ x: t.quadrant.x, y: t.quadrant.y, tool: t })),
        backgroundColor: GEN_COLORS[3].bg,
        borderColor: GEN_COLORS[3].border,
        borderWidth: 1.5,
        pointRadius: data.length > 30 ? 6 : 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Gen 4+',
        data: data.filter(t => t.generationNum === 4).map(t => ({ x: t.quadrant.x, y: t.quadrant.y, tool: t })),
        backgroundColor: GEN_COLORS[4].bg,
        borderColor: GEN_COLORS[4].border,
        borderWidth: 1.5,
        pointRadius: data.length > 30 ? 6 : 8,
        pointHoverRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 40,
        left: 8,
        top: 24,
        right: 80,
      },
    },
    scales: {
      x: {
        min: 0.3,
        max: 4.2,
        title: { display: false },
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 1,
        title: { display: false },
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: ctx => {
            const t = ctx.raw.tool;
            return [
              t.name,
              `${t.generationShort} | ${t.userFocus.join(', ') || 'N/A'}`,
              t.deployment.length ? `Deploy: ${t.deployment.join(', ')}` : '',
            ].filter(Boolean);
          },
        },
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleFont: { size: 0 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'xy' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
        },
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const el = elements[0];
        const point = chartData.datasets[el.datasetIndex].data[el.index];
        onSelectTool(point.tool);
      }
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const el = elements[0];
        const point = chartData.datasets[el.datasetIndex].data[el.index];
        onHighlight(point.tool.name);
        event.native.target.style.cursor = 'pointer';
      } else {
        onHighlight(null);
        if (event.native) event.native.target.style.cursor = 'default';
      }
    },
  };

  const resetZoom = useCallback(() => {
    chartRef.current?.resetZoom();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">BI Tool Quadrant</h2>
        <button
          onClick={resetZoom}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      <div className="relative" style={{ height: '540px' }}>
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Scroll to zoom, drag to pan. Click a dot to see details.
      </p>
    </div>
  );
}
