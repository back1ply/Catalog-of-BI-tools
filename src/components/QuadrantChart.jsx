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

// Custom plugin to draw quadrant backgrounds, dividers, and gen labels
const quadrantPlugin = {
  id: 'quadrantBackground',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const { x, y } = chart.scales;
    const midX = x.getPixelForValue(2.5);
    const midY = y.getPixelForValue(0.5);

    // Quadrant zone fills
    const zones = [
      { x1: left, x2: midX, y1: top,    y2: midY,   color: 'rgba(99, 102, 241, 0.04)' },
      { x1: midX, x2: right, y1: top,    y2: midY,   color: 'rgba(16, 185, 129, 0.04)' },
      { x1: left, x2: midX, y1: midY,   y2: bottom, color: 'rgba(59, 130, 246, 0.04)' },
      { x1: midX, x2: right, y1: midY,   y2: bottom, color: 'rgba(245, 158, 11, 0.04)' },
    ];
    zones.forEach(z => {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x1, z.y1, z.x2 - z.x1, z.y2 - z.y1);
    });

    // Dashed divider lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, top);
    ctx.lineTo(midX, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, midY);
    ctx.lineTo(right, midY);
    ctx.stroke();
    ctx.restore();

    // Vertical gen boundary lines (lighter)
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    [1.5, 3.25].forEach(val => {
      const px = x.getPixelForValue(val);
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, bottom);
      ctx.stroke();
    });
    ctx.restore();
  },
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const { x, y } = chart.scales;

    // Generation labels below chart area
    ctx.save();
    ctx.fillStyle = '#6b7280';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const genLabels = [
      { val: 0.9,  label: 'Generation 1' },
      { val: 2.0,  label: 'Generation 2' },
      { val: 2.9,  label: 'Generation 3' },
      { val: 3.75, label: 'Gen 4+' },
    ];
    genLabels.forEach(g => {
      ctx.fillText(g.label, x.getPixelForValue(g.val), bottom + 8);
    });

    // Y-axis labels (Business / Technical) on left
    ctx.fillStyle = '#6b7280';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Business users', left - 8, y.getPixelForValue(0.95));
    ctx.fillText('Technical users', left - 8, y.getPixelForValue(0.05));
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
        bottom: 28,
        left: 100,
        top: 4,
        right: 16,
      },
    },
    scales: {
      x: {
        min: 0.3,
        max: 4.2,
        title: { display: false },
        ticks: { display: false },
        grid: { display: false },
        border: { display: true, color: '#d1d5db' },
      },
      y: {
        min: 0,
        max: 1,
        title: { display: false },
        ticks: { display: false },
        grid: { display: false },
        border: { display: true, color: '#d1d5db' },
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
      <div className="relative" style={{ height: '520px' }}>
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Scroll to zoom, drag to pan. Click a dot to see details.
      </p>
    </div>
  );
}
