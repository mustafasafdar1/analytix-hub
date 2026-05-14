const Papa = require('papaparse');

/**
 * Clean CSV data: remove nulls, NaN, empty rows, duplicates, trim whitespace
 * and compute advanced statistics per column including correlations and outliers.
 */
function cleanCSV(csvString) {
  // Parse CSV
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim()
  });

  const columns = parsed.meta.fields || [];
  let rows = parsed.data;
  const originalRows = rows.length;

  // --- 1. Remove entirely empty rows ---
  let emptyRowsRemoved = 0;
  rows = rows.filter((row) => {
    const allEmpty = columns.every((col) => {
      const v = row[col];
      return v === undefined || v === null || String(v).trim() === '';
    });
    if (allEmpty) emptyRowsRemoved++;
    return !allEmpty;
  });

  // --- 2. Replace null-like values with null ---
  const nullPatterns = ['null', 'nan', 'none', 'n/a', 'na', 'undefined', '-', '--', '', '#n/a', '?', '#name?', '#value!', '#ref!', '#div/0!'];
  let nullsRemoved = 0;

  rows = rows.map((row) => {
    const cleaned = {};
    columns.forEach((col) => {
      let val = row[col];
      if (val === undefined || val === null) {
        cleaned[col] = null;
        return;
      }
      const trimmed = String(val).trim();
      if (nullPatterns.includes(trimmed.toLowerCase())) {
        cleaned[col] = null;
      } else {
        cleaned[col] = trimmed;
      }
    });
    return cleaned;
  });

  // --- 3. Track per-column null counts before removal ---
  const columnNullCounts = {};
  columns.forEach((col) => {
    columnNullCounts[col] = rows.filter((row) => row[col] === null).length;
  });

  // --- 4. Remove rows that have ANY null cell ---
  const beforeNullRemoval = rows.length;
  rows = rows.filter((row) => {
    return !columns.some((col) => row[col] === null);
  });
  nullsRemoved = beforeNullRemoval - rows.length;

  // --- 5. Remove duplicate rows ---
  const seen = new Set();
  const beforeDupRemoval = rows.length;
  rows = rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const duplicatesRemoved = beforeDupRemoval - rows.length;

  // --- 6. Detect column types & cast numerics ---
  const columnTypes = {};
  columns.forEach((col) => {
    const sampleValues = rows.slice(0, Math.min(100, rows.length)).map((r) => r[col]).filter(Boolean);
    const numericCount = sampleValues.filter((v) => !isNaN(Number(v))).length;
    columnTypes[col] = numericCount > sampleValues.length * 0.7 ? 'numeric' : 'categorical';
  });

  // Cast numeric columns and ensure we don't end up with numeric NaNs
  const validRows = [];
  let invalidNumericCount = 0;

  rows.forEach((row) => {
    const casted = { ...row };
    let hasInvalid = false;

    columns.forEach((col) => {
      if (columnTypes[col] === 'numeric' && casted[col] !== null) {
        const num = Number(casted[col]);
        if (Number.isNaN(num)) {
          hasInvalid = true;
        } else {
          casted[col] = num;
        }
      }
    });

    if (hasInvalid) {
      invalidNumericCount++;
    } else {
      validRows.push(casted);
    }
  });

  nullsRemoved += invalidNumericCount;
  rows = validRows;

  // --- 7. Compute advanced statistics ---
  const statistics = {};
  columns.forEach((col) => {
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined);

    if (columnTypes[col] === 'numeric') {
      const nums = values.map(Number).filter((n) => !isNaN(n));
      if (nums.length === 0) {
        statistics[col] = { type: 'numeric', count: 0 };
        return;
      }
      const sorted = [...nums].sort((a, b) => a - b);
      const n = nums.length;
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / n;

      // Median
      const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

      // Quartiles
      const q1 = computePercentile(sorted, 25);
      const q3 = computePercentile(sorted, 75);
      const iqr = q3 - q1;

      // Variance & Std Dev
      const variance = nums.reduce((acc, val) => acc + (val - mean) ** 2, 0) / n;
      const std = Math.sqrt(variance);

      // Skewness (Fisher's)
      let skewness = 0;
      if (std > 0 && n >= 3) {
        const m3 = nums.reduce((acc, val) => acc + ((val - mean) / std) ** 3, 0) / n;
        skewness = round(m3);
      }

      // Kurtosis (excess)
      let kurtosis = 0;
      if (std > 0 && n >= 4) {
        const m4 = nums.reduce((acc, val) => acc + ((val - mean) / std) ** 4, 0) / n;
        kurtosis = round(m4 - 3);
      }

      // Outlier detection (IQR method)
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = nums.filter((v) => v < lowerBound || v > upperBound);

      // Completeness
      const completeness = round((values.length / rows.length) * 100);

      statistics[col] = {
        type: 'numeric',
        count: n,
        mean: round(mean),
        median: round(median),
        min: sorted[0],
        max: sorted[n - 1],
        std: round(std),
        sum: round(sum),
        q1: round(q1),
        q3: round(q3),
        iqr: round(iqr),
        skewness,
        kurtosis,
        outlierCount: outliers.length,
        outlierBounds: { lower: round(lowerBound), upper: round(upperBound) },
        completeness
      };
    } else {
      // Categorical — compute value counts
      const counts = {};
      values.forEach((v) => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      // Top 10 values
      const sortedEntries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const completeness = round((values.length / rows.length) * 100);

      statistics[col] = {
        type: 'categorical',
        count: values.length,
        unique: Object.keys(counts).length,
        topValues: sortedEntries.map(([value, count]) => ({ value, count })),
        completeness
      };
    }
  });

  // --- 8. Compute Correlation Matrix ---
  const numericCols = columns.filter((col) => columnTypes[col] === 'numeric' && statistics[col]?.count >= 2);
  const correlationMatrix = {};

  if (numericCols.length >= 2) {
    numericCols.forEach((colA) => {
      correlationMatrix[colA] = {};
      numericCols.forEach((colB) => {
        if (colA === colB) {
          correlationMatrix[colA][colB] = 1;
        } else {
          correlationMatrix[colA][colB] = computePearson(rows, colA, colB);
        }
      });
    });
  }

  // --- 9. Data Quality Score ---
  const totalOriginal = originalRows;
  const nullRatio = totalOriginal > 0 ? nullsRemoved / totalOriginal : 0;
  const dupRatio = totalOriginal > 0 ? duplicatesRemoved / totalOriginal : 0;
  const emptyRatio = totalOriginal > 0 ? emptyRowsRemoved / totalOriginal : 0;
  const retentionRate = totalOriginal > 0 ? rows.length / totalOriginal : 1;

  // Weighted quality score (0-100)
  const qualityScore = Math.round(
    Math.max(0, Math.min(100,
      retentionRate * 50 +
      (1 - nullRatio) * 25 +
      (1 - dupRatio) * 15 +
      (1 - emptyRatio) * 10
    ))
  );

  // --- 10. Outlier Summary ---
  const outlierSummary = {};
  numericCols.forEach((col) => {
    const stat = statistics[col];
    if (stat && stat.outlierCount > 0) {
      outlierSummary[col] = {
        count: stat.outlierCount,
        percentage: round((stat.outlierCount / stat.count) * 100),
        bounds: stat.outlierBounds
      };
    }
  });

  // --- 11. Generate Full Analysis ---
  const analysis = generateFullAnalysis(statistics, columns, columnTypes, correlationMatrix, outlierSummary, rows.length, originalRows, nullsRemoved, duplicatesRemoved, qualityScore);

  return {
    columns,
    columnTypes,
    statistics,
    correlationMatrix,
    outlierSummary,
    dataQualityScore: qualityScore,
    analysis,
    cleanedData: rows,
    summary: {
      originalRows,
      cleanedRows: rows.length,
      nullsRemoved,
      duplicatesRemoved,
      emptyRowsRemoved,
      totalRemoved: originalRows - rows.length,
      dataQualityScore: qualityScore,
      conclusion: analysis.conclusion
    }
  };
}

// --- Helper Functions ---

function round(val, decimals = 2) {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

function computePercentile(sortedArr, percentile) {
  const idx = (percentile / 100) * (sortedArr.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  const weight = idx - lower;
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

function computePearson(rows, colA, colB) {
  const pairs = rows
    .map((r) => [Number(r[colA]), Number(r[colB])])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b));

  if (pairs.length < 2) return 0;

  const n = pairs.length;
  const sumA = pairs.reduce((s, [a]) => s + a, 0);
  const sumB = pairs.reduce((s, [, b]) => s + b, 0);
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);

  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt(
    (n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2)
  );

  if (denominator === 0) return 0;
  return round(numerator / denominator, 3);
}

/**
 * Generate comprehensive analysis with three pillars:
 * 1. Descriptive Analysis — What happened in the data
 * 2. Predictive Analysis — What is likely to happen based on trends
 * 3. Prescriptive Analysis — What actions should be taken
 */
function generateFullAnalysis(statistics, columns, columnTypes, correlationMatrix, outlierSummary, cleanedRows, originalRows, nullsRemoved, duplicatesRemoved, qualityScore) {
  const numStats = Object.entries(statistics).filter(([, s]) => s.type === 'numeric' && s.count > 0);
  const catStats = Object.entries(statistics).filter(([, s]) => s.type === 'categorical' && s.topValues?.length > 0);
  const efficiency = originalRows > 0 ? round((cleanedRows / originalRows) * 100, 1) : 100;

  // Find key business column
  const keyCol = numStats.find(([col]) =>
    /sale|price|revenue|total|profit|amount|qty|quantity|score|rating|income|cost|salary|age|marks|grade/i.test(col)
  ) || numStats[0] || null;

  // ==========================================
  // 1. DESCRIPTIVE ANALYSIS — What happened
  // ==========================================
  const descriptive = [];

  descriptive.push(`The dataset "${columns.length > 0 ? 'with ' + columns.length + ' columns' : ''}" originally contained ${originalRows.toLocaleString()} records. After automated data cleaning, ${cleanedRows.toLocaleString()} clean records remain — a ${efficiency}% retention rate with a data quality score of ${qualityScore}/100.`);

  if (nullsRemoved > 0 || duplicatesRemoved > 0) {
    const removed = [];
    if (nullsRemoved > 0) removed.push(`${nullsRemoved} rows with missing/null/NaN values`);
    if (duplicatesRemoved > 0) removed.push(`${duplicatesRemoved} duplicate entries`);
    descriptive.push(`During cleaning, ${removed.join(' and ')} were identified and removed to ensure data integrity.`);
  } else {
    descriptive.push('The data arrived in excellent condition with no missing values or duplicates detected.');
  }

  if (keyCol) {
    const [colName, stat] = keyCol;
    descriptive.push(`The key numeric metric "${colName}" shows a mean value of ${stat.mean}, with a median of ${stat.median}. Values range from a minimum of ${stat.min} to a maximum of ${stat.max}, with a standard deviation of ${stat.std}. The interquartile range (Q1=${stat.q1}, Q3=${stat.q3}) indicates that the middle 50% of data falls within a spread of ${stat.iqr}.`);

    if (stat.skewness > 0.5) {
      descriptive.push(`The distribution is positively skewed (skewness: ${stat.skewness}), meaning there are more high-value outliers pulling the average upward. Most records cluster below the mean, with a long tail extending toward higher values.`);
    } else if (stat.skewness < -0.5) {
      descriptive.push(`The distribution is negatively skewed (skewness: ${stat.skewness}), indicating a concentration of higher values with some lower-end outliers dragging the mean below the median.`);
    } else {
      descriptive.push(`The distribution is approximately symmetric (skewness: ${stat.skewness}), showing a well-balanced, bell-curve-like pattern around the central tendency.`);
    }
  }

  // Additional numeric columns
  numStats.slice(0, 4).forEach(([col, stat]) => {
    if (keyCol && col === keyCol[0]) return;
    descriptive.push(`Column "${col}": average ${stat.mean}, median ${stat.median}, range [${stat.min} to ${stat.max}], ${stat.outlierCount || 0} outliers detected.`);
  });

  if (catStats.length > 0) {
    catStats.slice(0, 3).forEach(([col, stat]) => {
      const top3 = stat.topValues.slice(0, 3);
      const segments = top3.map(v => `"${v.value}" (${v.count} occurrences, ${round((v.count / stat.count) * 100, 1)}%)`).join(', ');
      descriptive.push(`Categorical column "${col}" contains ${stat.unique} unique categories. The dominant segments are: ${segments}.`);
    });
  }

  // Correlation insights
  const strongCorrs = [];
  if (correlationMatrix && Object.keys(correlationMatrix).length > 0) {
    const numCols = Object.keys(correlationMatrix);
    for (let i = 0; i < numCols.length; i++) {
      for (let j = i + 1; j < numCols.length; j++) {
        const r = correlationMatrix[numCols[i]]?.[numCols[j]];
        if (r !== undefined && Math.abs(r) >= 0.5) {
          strongCorrs.push({ colA: numCols[i], colB: numCols[j], r });
        }
      }
    }
    if (strongCorrs.length > 0) {
      const corrDesc = strongCorrs.slice(0, 3).map(c =>
        `"${c.colA}" and "${c.colB}" (r=${c.r}, ${c.r > 0 ? 'positive' : 'negative'})`
      ).join('; ');
      descriptive.push(`Correlation analysis reveals significant relationships between: ${corrDesc}. These correlations suggest linked behavior patterns in the data.`);
    }
  }

  // Outlier summary
  const outlierEntries = Object.entries(outlierSummary || {});
  if (outlierEntries.length > 0) {
    const totalOutliers = outlierEntries.reduce((s, [, o]) => s + o.count, 0);
    descriptive.push(`Outlier analysis using the IQR method identified ${totalOutliers} anomalous data points across ${outlierEntries.length} column(s). These outliers may represent exceptional cases, data entry errors, or genuine extreme values that warrant further investigation.`);
  }

  // ==========================================
  // 2. PREDICTIVE ANALYSIS — What could happen
  // ==========================================
  const predictive = [];

  if (keyCol) {
    const [colName, stat] = keyCol;
    const trend = stat.mean > stat.median ? 'upward' : stat.mean < stat.median ? 'downward' : 'stable';

    predictive.push(`Based on the current data distribution for "${colName}", the ${trend} tendency between mean (${stat.mean}) and median (${stat.median}) suggests that future values are likely to ${trend === 'upward' ? 'continue trending higher, with potential for increased peaks' : trend === 'downward' ? 'see downward pressure, with values gravitating toward the lower range' : 'remain stable and consistent around the current central tendency'}.`);

    // Variance-based prediction
    const cv = stat.mean !== 0 ? round((stat.std / Math.abs(stat.mean)) * 100, 1) : 0;
    if (cv > 50) {
      predictive.push(`The high coefficient of variation (${cv}%) for "${colName}" indicates significant volatility. Future data points are expected to show wide fluctuations, making precise point predictions difficult. A range of ${round(stat.mean - stat.std)} to ${round(stat.mean + stat.std)} covers approximately 68% of expected future values.`);
    } else if (cv > 20) {
      predictive.push(`With a moderate coefficient of variation (${cv}%), "${colName}" shows reasonable predictability. Future values will most likely fall between ${round(stat.mean - stat.std)} and ${round(stat.mean + stat.std)}, with the majority clustering near the mean of ${stat.mean}.`);
    } else {
      predictive.push(`The low coefficient of variation (${cv}%) signals strong predictability for "${colName}". Future values are expected to closely match historical patterns, staying near ${stat.mean} with minimal deviation.`);
    }

    // Outlier-based prediction
    if (stat.outlierCount > 0) {
      const outlierRate = round((stat.outlierCount / stat.count) * 100, 1);
      predictive.push(`With ${outlierRate}% of current values being outliers, there is a measurable probability of encountering extreme values in future data. ${outlierRate > 10 ? 'This high outlier rate suggests systemic factors causing extreme values — expect continued occurrence.' : 'These appear to be occasional anomalies rather than a systemic pattern.'}`);
    }
  }

  // Correlation-based predictions
  if (strongCorrs.length > 0) {
    const strongest = strongCorrs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0];
    if (strongest.r > 0) {
      predictive.push(`The strong positive correlation (r=${strongest.r}) between "${strongest.colA}" and "${strongest.colB}" predicts that as "${strongest.colA}" increases, "${strongest.colB}" will also increase proportionally. This relationship can be leveraged for forecasting — a 10% increase in "${strongest.colA}" would likely correspond to approximately a ${round(Math.abs(strongest.r) * 10)}% increase in "${strongest.colB}".`);
    } else {
      predictive.push(`The strong negative correlation (r=${strongest.r}) between "${strongest.colA}" and "${strongest.colB}" indicates an inverse relationship. As "${strongest.colA}" rises, "${strongest.colB}" is expected to decline. This trade-off pattern should be factored into future planning.`);
    }
  }

  if (catStats.length > 0) {
    const [col, stat] = catStats[0];
    const topVal = stat.topValues[0];
    const dominance = round((topVal.count / stat.count) * 100, 1);
    if (dominance > 50) {
      predictive.push(`In "${col}", the category "${topVal.value}" dominates with ${dominance}% share. This concentration is expected to persist, meaning future records will most likely fall into this dominant category.`);
    } else {
      predictive.push(`The "${col}" distribution is relatively diversified across ${stat.unique} categories. Future data is expected to maintain this diverse pattern, though "${topVal.value}" (${dominance}%) will likely remain the most common segment.`);
    }
  }

  // ==========================================
  // 3. PRESCRIPTIVE ANALYSIS — What to do
  // ==========================================
  const prescriptive = [];

  if (qualityScore < 70) {
    prescriptive.push(`ACTION NEEDED: The data quality score of ${qualityScore}/100 is below optimal. Improve data collection processes at the source to reduce nulls and duplicates. Implement input validation rules and mandatory fields in data entry systems.`);
  } else if (qualityScore < 90) {
    prescriptive.push(`The data quality score of ${qualityScore}/100 is good but can be improved. Consider implementing automated data validation pipelines to catch inconsistencies earlier.`);
  } else {
    prescriptive.push(`Excellent data quality (${qualityScore}/100). Current data collection processes are robust. Maintain existing validation procedures.`);
  }

  if (keyCol) {
    const [colName, stat] = keyCol;
    if (stat.outlierCount > 0) {
      prescriptive.push(`INVESTIGATE OUTLIERS: ${stat.outlierCount} outlier values were detected in "${colName}" (outside the range ${stat.outlierBounds?.lower} to ${stat.outlierBounds?.upper}). Review these records individually — they may represent errors requiring correction, or genuine extreme cases that need special handling in analysis.`);
    }

    if (stat.skewness > 1) {
      prescriptive.push(`CONSIDER TRANSFORMATION: The highly skewed distribution of "${colName}" (skewness: ${stat.skewness}) may affect statistical analyses. Consider using logarithmic or square root transformations for more accurate modeling. Use median-based metrics rather than mean for reporting.`);
    }

    const cv = stat.mean !== 0 ? round((stat.std / Math.abs(stat.mean)) * 100, 1) : 0;
    if (cv > 50) {
      prescriptive.push(`REDUCE VARIABILITY: "${colName}" shows high variability (CV: ${cv}%). Investigate the root causes of this variation. Segment the data by categorical variables to identify if specific groups are driving the variance. This will improve forecast accuracy and operational consistency.`);
    }
  }

  if (strongCorrs.length > 0) {
    const strongest = strongCorrs[0];
    prescriptive.push(`LEVERAGE CORRELATIONS: The strong relationship between "${strongest.colA}" and "${strongest.colB}" (r=${strongest.r}) is actionable. ${strongest.r > 0 ? `Improvements to "${strongest.colA}" will likely drive proportional gains in "${strongest.colB}". Focus resources on optimizing "${strongest.colA}" for maximum downstream impact.` : `Be aware that improving "${strongest.colA}" may come at the cost of "${strongest.colB}". Balance these competing factors in strategic decisions.`}`);
  }

  if (catStats.length > 0) {
    const [col, stat] = catStats[0];
    if (stat.unique > 20) {
      prescriptive.push(`SIMPLIFY CATEGORIES: "${col}" has ${stat.unique} unique values, which may be too granular for effective analysis. Consider grouping low-frequency categories into an "Other" bucket for cleaner segmentation and more actionable insights.`);
    }
    const topVal = stat.topValues[0];
    const dominance = round((topVal.count / stat.count) * 100, 1);
    if (dominance > 70) {
      prescriptive.push(`DIVERSIFICATION OPPORTUNITY: "${col}" is heavily concentrated in "${topVal.value}" (${dominance}%). If this represents a business category, consider strategies to diversify and reduce dependency on a single segment.`);
    }
  }

  prescriptive.push(`NEXT STEPS: Use the cleaned dataset for deeper analysis — build regression models for prediction, create segmented dashboards for monitoring, and set up automated alerts for key metric thresholds based on the statistical bounds identified in this analysis.`);

  // ==========================================
  // CONCLUSION — Summary story
  // ==========================================
  const conclusionParts = [];
  conclusionParts.push(`This analysis processed ${originalRows.toLocaleString()} records across ${columns.length} columns, yielding ${cleanedRows.toLocaleString()} clean data points (${efficiency}% retention, quality: ${qualityScore}/100).`);

  if (keyCol) {
    const [colName, stat] = keyCol;
    conclusionParts.push(`The primary metric "${colName}" averages ${stat.mean} with a median of ${stat.median}, showing a ${stat.skewness > 0.3 ? 'right-skewed' : stat.skewness < -0.3 ? 'left-skewed' : 'symmetric'} distribution.`);
  }

  if (strongCorrs.length > 0) {
    conclusionParts.push(`${strongCorrs.length} significant correlation(s) were found, enabling predictive insights.`);
  }

  conclusionParts.push('The data is fully cleaned and ready for business intelligence, predictive modeling, and strategic decision-making.');

  return {
    descriptive: descriptive.join('\n\n'),
    predictive: predictive.join('\n\n'),
    prescriptive: prescriptive.join('\n\n'),
    conclusion: conclusionParts.join(' ')
  };
}

module.exports = { cleanCSV };
