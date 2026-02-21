import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import * as Haptics from 'expo-haptics';
import { colors } from '../lib/constants/theme';
import { FaceGuide, FACE_GUIDE_BOUNDS } from '../components/camera/FaceGuide';
import { ScanAnimation } from '../components/camera/ScanAnimation';
import { GlowButton } from '../components/shared/GlowButton';
import { useScanStore } from '../lib/store/useScanStore';
import { useUserStore } from '../lib/store/useUserStore';
import { mapMLKitToFacialPoints, MLKitFaceData } from '../lib/analysis/landmarkMapper';
import { analyzeface } from '../lib/analysis/scoreEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEADY_THRESHOLD = 2; // seconds face must be aligned

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const {
    phase, faceAligned, steadySeconds,
    startScan, setFaceAligned, incrementSteady, resetSteady,
    setAnalyzing, setResult, setError, reset,
  } = useScanStore();
  const addScan = useUserStore((s) => s.addScan);

  const [faceDetected, setFaceDetected] = useState(false);
  const [feedbackText, setFeedbackText] = useState('Position your face in the oval');
  const steadyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFaceDataRef = useRef<MLKitFaceData | null>(null);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    startScan();
    return () => {
      if (steadyTimerRef.current) clearInterval(steadyTimerRef.current);
      reset();
    };
  }, []);

  // Handle steady timer
  useEffect(() => {
    if (faceAligned && phase === 'detecting') {
      steadyTimerRef.current = setInterval(() => {
        incrementSteady();
      }, 1000);
    } else {
      if (steadyTimerRef.current) {
        clearInterval(steadyTimerRef.current);
        steadyTimerRef.current = null;
      }
      if (!faceAligned) resetSteady();
    }
    return () => {
      if (steadyTimerRef.current) clearInterval(steadyTimerRef.current);
    };
  }, [faceAligned, phase]);

  // Trigger capture when steady threshold reached
  useEffect(() => {
    if (steadySeconds >= STEADY_THRESHOLD && phase === 'detecting') {
      handleCapture();
    }
  }, [steadySeconds, phase]);

  /**
   * Process face detection results from the camera.
   * In a real implementation, this would be called from a frame processor.
   * For now, we simulate face detection for the UI flow.
   */
  const onFaceDetected = useCallback((faces: MLKitFaceData[]) => {
    if (phase !== 'detecting') return;

    if (faces.length === 0) {
      setFaceDetected(false);
      setFaceAligned(false);
      setFeedbackText('No face detected');
      return;
    }

    const face = faces[0];
    setFaceDetected(true);
    lastFaceDataRef.current = face;

    // Check if face is within the guide oval
    const faceCenterX = face.bounds.x + face.bounds.width / 2;
    const faceCenterY = face.bounds.y + face.bounds.height / 2;

    const guideCenter = FACE_GUIDE_BOUNDS;
    const xDiff = Math.abs(faceCenterX - guideCenter.cx) / guideCenter.width;
    const yDiff = Math.abs(faceCenterY - guideCenter.cy) / guideCenter.height;
    const sizeRatio = face.bounds.width / guideCenter.width;

    if (xDiff > 0.3 || yDiff > 0.3) {
      setFaceAligned(false);
      setFeedbackText('Center your face');
    } else if (sizeRatio < 0.5) {
      setFaceAligned(false);
      setFeedbackText('Move closer');
    } else if (sizeRatio > 1.3) {
      setFaceAligned(false);
      setFeedbackText('Move back');
    } else {
      setFaceAligned(true);
      setFeedbackText('Hold still...');
    }
  }, [phase, setFaceAligned, setFaceDetected]);

  const handleCapture = async () => {
    if (!cameraRef.current || phase !== 'detecting') return;

    setAnalyzing();
    setFeedbackText('Analyzing...');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Take photo
      const photo = await cameraRef.current.takePhoto();

      // In a full implementation, we'd run the face detector on the photo
      // and get detailed contour/landmark data. For now, if we have face data
      // from the live preview, use that.
      const faceData = lastFaceDataRef.current;

      if (!faceData) {
        setError('Face lost during capture. Please try again.');
        return;
      }

      // Map MLKit data to our facial points
      const points = mapMLKitToFacialPoints(faceData);
      if (!points) {
        setError('Could not detect enough facial features. Try better lighting.');
        return;
      }

      // Dramatic pause for the "scanning" animation (3-5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Run analysis
      const result = analyzeface(points);

      // Save to stores
      const photoUri = `file://${photo.path}`;
      setResult(result, photoUri);
      addScan(result, photoUri);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to results
      const scanHistory = useUserStore.getState().scanHistory;
      const latestScan = scanHistory[0];
      if (latestScan) {
        router.replace(`/results/${latestScan.id}`);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  // Permission denied
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Camera permission is required to scan your face.</Text>
          <GlowButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No front camera found.</Text>
          <GlowButton title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={phase === 'detecting' || phase === 'analyzing'}
        photo
      />

      {/* Face Guide Overlay */}
      <FaceGuide faceDetected={faceDetected} faceAligned={faceAligned} />

      {/* Scan Animation */}
      <ScanAnimation visible={phase === 'analyzing'} />

      {/* Feedback Text */}
      <SafeAreaView style={styles.feedbackContainer}>
        <View style={styles.feedbackBadge}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
          {phase === 'detecting' && faceAligned && (
            <Text style={styles.countdownText}>
              {Math.max(0, STEADY_THRESHOLD - steadySeconds)}s
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* Back Button */}
      <SafeAreaView style={styles.backContainer}>
        <GlowButton
          title="Cancel"
          onPress={() => { reset(); router.back(); }}
          variant="outline"
          size="small"
          color="rgba(255,255,255,0.5)"
        />
      </SafeAreaView>

      {/* Error State */}
      {useScanStore.getState().error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{useScanStore.getState().error}</Text>
          <GlowButton title="Try Again" onPress={startScan} size="medium" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  feedbackText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  countdownText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: colors.primary,
  },
  backContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
