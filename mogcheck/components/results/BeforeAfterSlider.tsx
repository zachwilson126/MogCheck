import { View, Image, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
} from 'react-native-reanimated';
import { colors } from '../../lib/constants/theme';

const SLIDER_HEIGHT = 380;

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
  width: number;
}

export function BeforeAfterSlider({ beforeUri, afterUri, width }: BeforeAfterSliderProps) {
  const offset = useSharedValue(width / 2);
  const position = useSharedValue(width / 2);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      offset.value = position.value;
    })
    .onUpdate((e) => {
      position.value = clamp(offset.value + e.translationX, 20, width - 20);
    });

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: position.value,
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value - 1 }],
  }));

  return (
    <View style={[styles.container, { width, height: SLIDER_HEIGHT }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[StyleSheet.absoluteFill]}>
          {/* After image (full width, behind) */}
          <Image
            source={{ uri: afterUri }}
            style={[styles.image, { width, height: SLIDER_HEIGHT }]}
            resizeMode="cover"
          />

          {/* Before image (clipped to left portion) */}
          <Animated.View style={[styles.beforeClip, beforeClipStyle]}>
            <Image
              source={{ uri: beforeUri }}
              style={[styles.image, { width, height: SLIDER_HEIGHT }]}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Divider line */}
          <Animated.View style={[styles.divider, dividerStyle]}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerHandle}>
              <Text style={styles.dividerIcon}>{'◀ ▶'}</Text>
            </View>
          </Animated.View>

          {/* Labels */}
          <View style={styles.labelRow}>
            <View style={styles.label}>
              <Text style={styles.labelText}>BEFORE</Text>
            </View>
            <View style={styles.label}>
              <Text style={styles.labelText}>AFTER</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  beforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: SLIDER_HEIGHT,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: SLIDER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: colors.primary,
  },
  dividerHandle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dividerIcon: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '700',
  },
  labelRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  label: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    color: colors.text,
    letterSpacing: 2,
  },
});
