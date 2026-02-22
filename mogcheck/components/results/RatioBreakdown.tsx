import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { RatioResult } from '../../lib/analysis';
import { colors } from '../../lib/constants/theme';

interface RatioBreakdownProps {
  ratios: RatioResult[];
  tierColor: string;
}

const CHART_SIZE = 240;
const CHART_CENTER = CHART_SIZE / 2;
const CHART_RADIUS = CHART_SIZE / 2 - 30;

/**
 * Radar/spider chart showing individual ratio scores,
 * plus a list of each ratio with its score bar.
 */
export function RatioBreakdown({ ratios, tierColor }: RatioBreakdownProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ratio Breakdown 📐</Text>

      {/* Radar Chart */}
      <View style={styles.chartContainer}>
        <RadarChart ratios={ratios} color={tierColor} />
      </View>

      {/* Ratio List */}
      <View style={styles.ratioList}>
        {ratios.map((ratio) => (
          <RatioBar key={ratio.id} ratio={ratio} />
        ))}
      </View>
    </View>
  );
}

function RadarChart({ ratios, color }: { ratios: RatioResult[]; color: string }) {
  const count = ratios.length;
  const angleStep = (2 * Math.PI) / count;

  // Generate points for the score polygon
  const scorePoints = ratios.map((r, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = r.score * CHART_RADIUS;
    return {
      x: CHART_CENTER + radius * Math.cos(angle),
      y: CHART_CENTER + radius * Math.sin(angle),
    };
  });

  const polygonPoints = scorePoints.map(p => `${p.x},${p.y}`).join(' ');

  // Grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <Svg width={CHART_SIZE} height={CHART_SIZE}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const gridPoints = Array.from({ length: count }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = level * CHART_RADIUS;
          return `${CHART_CENTER + r * Math.cos(angle)},${CHART_CENTER + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <Polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke={colors.border}
            strokeWidth={0.5}
          />
        );
      })}

      {/* Axis lines */}
      {ratios.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <Line
            key={i}
            x1={CHART_CENTER}
            y1={CHART_CENTER}
            x2={CHART_CENTER + CHART_RADIUS * Math.cos(angle)}
            y2={CHART_CENTER + CHART_RADIUS * Math.sin(angle)}
            stroke={colors.border}
            strokeWidth={0.5}
          />
        );
      })}

      {/* Score polygon */}
      <Polygon
        points={polygonPoints}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={2}
      />

      {/* Score dots */}
      {scorePoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* Labels */}
      {ratios.map((ratio, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = CHART_RADIUS + 18;
        const x = CHART_CENTER + labelRadius * Math.cos(angle);
        const y = CHART_CENTER + labelRadius * Math.sin(angle);
        // Abbreviate long names
        const label = ratio.name.length > 10 ? ratio.name.slice(0, 8) + '..' : ratio.name;
        return (
          <SvgText
            key={i}
            x={x}
            y={y}
            fill={colors.textMuted}
            fontSize={8}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function RatioBar({ ratio }: { ratio: RatioResult }) {
  const scorePercent = Math.round(ratio.score * 100);
  const barColor = ratio.score >= 0.7
    ? colors.primary
    : ratio.score >= 0.4
      ? colors.warning
      : colors.error;

  return (
    <View style={styles.ratioItem}>
      <View style={styles.ratioHeader}>
        <Text style={styles.ratioName}>{ratio.name}</Text>
        <Text style={[styles.ratioScore, { color: barColor }]}>
          {(ratio.score * 10).toFixed(1)}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${scorePercent}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.ratioDetail}>
        {ratio.measured.toFixed(3)} (ideal: {ratio.ideal.toFixed(3)})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratioList: {
    gap: 16,
  },
  ratioItem: {
    gap: 4,
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioName: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: colors.text,
  },
  ratioScore: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
  },
  barBg: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratioDetail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
