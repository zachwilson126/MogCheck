import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../lib/constants/theme';

interface ScoreRevealProps {
  score: number;
  tierName: string;
  tierColor: string;
  onRevealComplete?: () => void;
}

export function ScoreReveal({ score, tierName, tierColor, onRevealComplete }: ScoreRevealProps) {
  const [displayValue, setDisplayValue] = useState('0.0');
  const [showTier, setShowTier] = useState(false);

  useEffect(() => {
    const duration = 2000;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * score;

      setDisplayValue(current.toFixed(1));

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(score.toFixed(1));
      }
    }, 16);

    const revealTimer = setTimeout(() => {
      setShowTier(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onRevealComplete?.();
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(revealTimer);
    };
  }, [onRevealComplete, score]);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: tierColor }]}>{displayValue}</Text>
      </View>

      {showTier && (
        <View style={styles.tierContainer}>
          <View style={[styles.tierBadge, { borderColor: tierColor }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{tierName}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 96,
    letterSpacing: 2,
  },
  tierContainer: {
    marginTop: 8,
  },
  tierBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tierText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    letterSpacing: 4,
  },
});
