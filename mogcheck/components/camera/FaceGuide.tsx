import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import Svg, { Defs, Rect, Mask, Ellipse } from 'react-native-svg';
import { colors } from '../../lib/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const OVAL_WIDTH = SCREEN_WIDTH * 0.65;
const OVAL_HEIGHT = OVAL_WIDTH * 1.35;
const OVAL_CX = SCREEN_WIDTH / 2;
const OVAL_CY = SCREEN_HEIGHT * 0.38;

interface FaceGuideProps {
  faceDetected: boolean;
  faceAligned: boolean;
}

export function FaceGuide({ faceDetected, faceAligned }: FaceGuideProps) {
  const borderPulse = useSharedValue(1);

  useEffect(() => {
    if (faceAligned) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      borderPulse.value = withTiming(1, { duration: 200 });
    }
  }, [faceAligned, borderPulse]);

  const borderColor = faceAligned
    ? colors.primary
    : faceDetected
      ? colors.warning
      : 'rgba(255,255,255,0.3)';

  const animatedBorder = useAnimatedStyle(() => ({
    transform: [{ scale: borderPulse.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark overlay with oval cutout */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="mask">
            <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            <Ellipse cx={OVAL_CX} cy={OVAL_CY} rx={OVAL_WIDTH / 2} ry={OVAL_HEIGHT / 2} fill="black" />
          </Mask>
        </Defs>
        <Rect
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0,0,0,0.6)"
          mask="url(#mask)"
        />
      </Svg>

      {/* Animated border around oval */}
      <Animated.View
        style={[
          styles.ovalBorder,
          animatedBorder,
          {
            width: OVAL_WIDTH + 4,
            height: OVAL_HEIGHT + 4,
            left: OVAL_CX - (OVAL_WIDTH + 4) / 2,
            top: OVAL_CY - (OVAL_HEIGHT + 4) / 2,
            borderColor,
          },
        ]}
      />
    </View>
  );
}

export const FACE_GUIDE_BOUNDS = {
  x: OVAL_CX - OVAL_WIDTH / 2,
  y: OVAL_CY - OVAL_HEIGHT / 2,
  width: OVAL_WIDTH,
  height: OVAL_HEIGHT,
  cx: OVAL_CX,
  cy: OVAL_CY,
};

const styles = StyleSheet.create({
  ovalBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 9999,
  },
});
