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

    if (stat.type === 'numeric' && stat.count > 0) {
      // Area chart for numeric distribution (sample first 100 data points)
      const sampleData = cleanedData.slice(0, 100).map((row, i) => ({
        index: i + 1,
        value: Number(row[col]) || 0
      }));

      charts.push(
        <div className="chart-card" key={`num-${col}`}>
          <h4>{col}</h4>
          <p className="chart-subtitle">
            Mean: {stat.mean} • Median: {stat.median} • Min: {stat.min} • Max: {stat.max}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sampleData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id={`grad-${col}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="index" tick={{ fill: '#9a9ab0', fontSize: 11 }} />
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6c5ce7"
                strokeWidth={2}
                fill={`url(#grad-${col})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );

      // Pie chart for numeric distribution buckets (if enough data)
      if (stat.count >= 5) {
        const range = stat.max - stat.min;
        const bucketCount = 5;
        const bucketSize = range / bucketCount;
        const buckets = Array.from({ length: bucketCount }, (_, i) => ({
          name: `${(stat.min + i * bucketSize).toFixed(1)} - ${(stat.min + (i + 1) * bucketSize).toFixed(1)}`,
          count: 0
        }));

        cleanedData.forEach((row) => {
          const val = Number(row[col]);
          if (isNaN(val)) return;
          let idx = Math.floor((val - stat.min) / bucketSize);
          if (idx >= bucketCount) idx = bucketCount - 1;
          if (idx < 0) idx = 0;
          buckets[idx].count++;
        });

        charts.push(
          <div className="chart-card" key={`pie-${col}`}>
            <h4>{col} — Distribution</h4>
            <p className="chart-subtitle">Value range distribution across {bucketCount} buckets</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={buckets}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {buckets.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1a3e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f0f0ff',
                    fontSize: 13
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9a9ab0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      }
    }
  });

  if (charts.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No chart data available.</p>;
  }

  return <div className="charts-grid">{charts}</div>;
}

export default ChartSection;
