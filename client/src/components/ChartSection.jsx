import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6c5ce7', '#a29bfe', '#00cec9', '#55efc4', '#fd79a8', '#e17055', '#ffeaa7', '#fdcb6e', '#74b9ff', '#0984e3'];

function ChartSection({ columns, columnTypes, statistics, cleanedData }) {
  const charts = [];

  columns.forEach((col) => {
    const stat = statistics[col];
    if (!stat) return;

    if (stat.type === 'categorical' && stat.topValues && stat.topValues.length > 0) {
      // Bar chart for categorical data
      charts.push(
        <div className="chart-card" key={`cat-${col}`}>
          <h4>{col}</h4>
          <p className="chart-subtitle">Top {stat.topValues.length} values • {stat.unique} unique • {stat.count} total</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stat.topValues} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="value"
                tick={{ fill: '#9a9ab0', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#9a9ab0', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a3e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f0f0ff',
                  fontSize: 13
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stat.topValues.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (stat.type === 'numeric' && stat.count >= 2) {
      // Create Histogram buckets for numeric distribution
      const range = Math.max(0.0001, stat.max - stat.min);
      const bucketCount = Math.min(10, stat.count);
      const bucketSize = range / bucketCount;
      const buckets = Array.from({ length: bucketCount }, (_, i) => ({
        name: `${(stat.min + i * bucketSize).toFixed(1)} - ${(stat.min + (i + 1) * bucketSize).toFixed(1)}`,
        count: 0
      }));

      cleanedData.forEach((row) => {
        const val = Number(row[col]);
        if (Number.isNaN(val) || val === null || val === undefined) return;
        let idx = Math.floor((val - stat.min) / bucketSize);
        if (idx >= bucketCount) idx = bucketCount - 1;
        if (idx < 0) idx = 0;
        buckets[idx].count++;
      });

      charts.push(
        <div className="chart-card" key={`histogram-${col}`}>
          <h4>{col} — Distribution</h4>
          <p className="chart-subtitle">
            Mean: {stat.mean} • Median: {stat.median} • Min: {stat.min} • Max: {stat.max}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9a9ab0', fontSize: 10 }} 
                angle={-25} 
                textAnchor="end" 
                height={50} 
              />
              <YAxis tick={{ fill: '#9a9ab0', fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: '#1a1a3e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f0f0ff',
                  fontSize: 13
                }}
              />
              <Bar dataKey="count" fill="#00cec9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
  });

  if (charts.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No chart data available.</p>;
  }

  return <div className="charts-grid">{charts}</div>;
}

export default ChartSection;
