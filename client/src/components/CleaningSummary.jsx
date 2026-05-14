import { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, '')) || 0;
    const start = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };

    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

function CleaningSummary({ data }) {
  const efficiency = data.originalRows > 0
    ? ((data.cleanedRows / data.originalRows) * 100).toFixed(1)
    : '100';

  const stats = [
    { icon: '📁', value: data.originalRows || 0, label: 'Original Rows' },
    { icon: '✅', value: data.cleanedRows || 0, label: 'Clean Rows' },
    { icon: '🚫', value: data.nullsRemoved || 0, label: 'Nulls Removed' },
    { icon: '🔄', value: data.duplicatesRemoved || 0, label: 'Duplicates Removed' },
    { icon: '📊', value: data.columns?.length || 0, label: 'Columns Detected' },
  ];

  const qualityScore = data.dataQualityScore || Math.round(parseFloat(efficiency));
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (qualityScore / 100) * circumference;
  const scoreColor = qualityScore >= 80 ? 'var(--accent-3)' : qualityScore >= 50 ? 'var(--accent-6)' : 'var(--accent-4)';

  return (
    <>
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value"><AnimatedNumber value={stat.value} /></div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="quality-score-card">
        <div className="quality-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle className="quality-ring-bg" cx="40" cy="40" r="34" />
            <circle className="quality-ring-fill" cx="40" cy="40" r="34"
              stroke={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="quality-ring-text" style={{ color: scoreColor }}>{qualityScore}</div>
        </div>
        <div className="quality-info">
          <h4>Data Quality Score</h4>
          <p>
            {efficiency}% data retention rate. {data.nullsRemoved > 0 ? `Removed ${data.nullsRemoved} null values. ` : ''}
            {data.duplicatesRemoved > 0 ? `Removed ${data.duplicatesRemoved} duplicates.` : ''}
            {data.nullsRemoved === 0 && data.duplicatesRemoved === 0 ? 'Your data was already clean!' : ''}
          </p>
        </div>
      </div>
    </>
  );
}

export default CleaningSummary;
