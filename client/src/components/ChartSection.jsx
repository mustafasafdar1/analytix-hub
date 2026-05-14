import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Each chart gets a unique vibrant multi-color palette — every bar is a different hue
const PALETTES = [
  ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0','#ff9f43','#10ac84'],
  ['#00cec9','#e17055','#6c5ce7','#fdcb6e','#e84393','#00b894','#0984e3','#fd79a8','#55efc4','#a29bfe'],
  ['#fc5c65','#45aaf2','#26de81','#fed330','#a55eea','#fd9644','#2bcbba','#eb3b5a','#4b7bec','#20bf6b'],
  ['#ff4757','#2ed573','#1e90ff','#ffa502','#ff6348','#7bed9f','#70a1ff','#eccc68','#a4b0be','#ff6b81'],
  ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#2980b9','#27ae60','#8e44ad'],
  ['#fd1d1d','#833ab4','#fcb045','#5851db','#c13584','#e1306c','#f56040','#ffdc80','#405de6','#2ecc71'],
];

// Accent colors for area charts — each chart gets a unique vibrant one
const CHART_ACCENTS = [
  '#ff6b6b', '#00cec9', '#a55eea', '#feca57', '#fc5c65', '#2ed573',
  '#e84393', '#0984e3', '#fdcb6e', '#6c5ce7', '#01a3a4', '#ff9f43'
];

const tooltipStyle = {
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  padding: '10px 14px'
};

function ChartSection({ columns, columnTypes, statistics, cleanedData }) {
  const [chartModes, setChartModes] = useState({});

  const toggleMode = (col, mode) => {
    setChartModes(prev => ({ ...prev, [col]: mode }));
  };

  const charts = [];
  let chartIndex = 0; // tracks which chart we're on for color assignment

  columns.forEach((col, idx) => {
    const stat = statistics[col];
    if (!stat) return;

    if (stat.type === 'categorical' && stat.topValues && stat.topValues.length > 0) {
      const mode = chartModes[col] || 'bar';
      const palette = PALETTES[chartIndex % PALETTES.length];
      chartIndex++;

      charts.push(
        <div className="chart-card" key={`cat-${col}`} style={{ animationDelay: `${idx * 0.08}s` }}>
          <h4>{col}</h4>
          <p className="chart-subtitle">Top {stat.topValues.length} values • {stat.unique} unique • {stat.count} total</p>
          <div className="chart-toggle">
            <button className={mode === 'bar' ? 'active' : ''} onClick={() => toggleMode(col, 'bar')}>Bar</button>
            <button className={mode === 'pie' ? 'active' : ''} onClick={() => toggleMode(col, 'pie')}>Pie</button>
          </div>
          {mode === 'bar' ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stat.topValues} margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="value" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
                  {stat.topValues.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stat.topValues} dataKey="count" nameKey="value" cx="50%" cy="50%"
                  outerRadius={100} innerRadius={50} paddingAngle={3} animationDuration={800}
                  label={({ value }) => value}>
                  {stat.topValues.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    }

    if (stat.type === 'numeric' && stat.count >= 2 && stat.max !== undefined && stat.min !== undefined) {
      const mode = chartModes[col] || 'bar';
      const palette = PALETTES[chartIndex % PALETTES.length];
      const accent = CHART_ACCENTS[chartIndex % CHART_ACCENTS.length];
      chartIndex++;

      const range = Math.max(0.0001, stat.max - stat.min);
      const bucketCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(stat.count))));
      const bucketSize = range / bucketCount;
      const buckets = Array.from({ length: bucketCount }, (_, i) => ({
        name: `${(stat.min + i * bucketSize).toFixed(1)}`,
        range: `${(stat.min + i * bucketSize).toFixed(1)} – ${(stat.min + (i + 1) * bucketSize).toFixed(1)}`,
        count: 0
      }));

      cleanedData.forEach((row) => {
        const val = Number(row[col]);
        if (isNaN(val)) return;
        let idx2 = Math.floor((val - stat.min) / bucketSize);
        if (idx2 >= bucketCount) idx2 = bucketCount - 1;
        if (idx2 < 0) idx2 = 0;
        buckets[idx2].count++;
      });

      charts.push(
        <div className="chart-card" key={`num-${col}`} style={{ animationDelay: `${idx * 0.08}s` }}>
          <h4>{col} — Distribution</h4>
          <p className="chart-subtitle">
            Mean: {stat.mean} • Median: {stat.median} • Std: {stat.std} • Range: [{stat.min}, {stat.max}]
          </p>
          <div className="chart-toggle">
            <button className={mode === 'bar' ? 'active' : ''} onClick={() => toggleMode(col, 'bar')}>Histogram</button>
            <button className={mode === 'area' ? 'active' : ''} onClick={() => toggleMode(col, 'area')}>Area</button>
          </div>
          {mode === 'bar' ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val, name, props) => [val, `Count (${props.payload.range})`]} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} animationDuration={800}>
                  {buckets.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={buckets} margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
                <defs>
                  <linearGradient id={`grad-${col}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke={accent} fill={`url(#grad-${col})`}
                  strokeWidth={2} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    }
  });

  // Scatter plot for first two numeric columns
  const numCols = columns.filter(c => columnTypes[c] === 'numeric' && statistics[c]?.count >= 2);
  if (numCols.length >= 2) {
    const xCol = numCols[0], yCol = numCols[1];
    const scatterData = cleanedData.slice(0, 300).map(row => ({
      x: Number(row[xCol]), y: Number(row[yCol])
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    if (scatterData.length > 0) {
      charts.push(
        <div className="chart-card" key="scatter" style={{ gridColumn: 'span 1' }}>
          <h4>{xCol} vs {yCol} — Correlation</h4>
          <p className="chart-subtitle">Scatter plot showing relationship • {scatterData.length} points</p>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="x" name={xCol} tick={{ fill: '#94a3b8', fontSize: 10 }}
                label={{ value: xCol, position: 'bottom', fill: '#94a3b8', fontSize: 11 }} />
              <YAxis dataKey="y" name={yCol} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#e879f9" fillOpacity={0.6} animationDuration={800} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }

  if (charts.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No chart data available.</p>;
  }

  return <div className="charts-grid">{charts}</div>;
}

export default ChartSection;
