import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector/src/FaceDetector';
import type { Face } from 'react-native-vision-camera-face-detector/src/FaceDetector';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import * as Haptics from 'expo-haptics';
import { colors } from '../lib/constants/theme';
import { FaceGuide } from '../components/camera/FaceGuide';
import { ScanAnimation } from '../components/camera/ScanAnimation';
import { GlowButton } from '../components/shared/GlowButton';
import { useScanStore } from '../lib/store/useScanStore';
import { useUserStore } from '../lib/store/useUserStore';
import { mapMLKitToFacialPoints } from '../lib/analysis/landmarkMapper';
import { analyzeface } from '../lib/analysis/scoreEngine';

// Rotating meme text for each scan phase
const IDLE_TEXTS = [
  'show me what ur working with',
  'put ur face in the circle bro',
  'we need to see the damage',
  'step into the mog zone',
  'face in the oval. no hiding.',
];
const DETECTED_TEXTS = [
  'face locked in. moment of truth.',
  'ok we see u. tap to get rated.',
  'victim identified. tap to scan.',
  'aura detected. ready when u are.',
  'bone structure loading... tap go.',
  'locking onto ur canthal tilt rn',
];
const ANALYZING_TEXTS = [
  'calculating mog potential...',
  'measuring ur orbital rim rn...',
  'consulting the golden ratio gods...',
  'running bone structure diagnostics...',
  'scanning for NPC energy...',
  'cross-referencing with gigachads...',
  'checking canthal tilt angle...',
  'computing facial harmony index...',
  'this might hurt ur feelings...',
  'no cap analyzing rn...',
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const {
    phase,
    startScan, setAnalyzing, setResult, setError, reset,
  } = useScanStore();
  const addScan = useUserStore((s) => s.addScan);

  const [feedbackText, setFeedbackText] = useState(pick(IDLE_TEXTS));
  const [capturing, setCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const lastFaceRef = useRef<Face | null>(null);
  const analyzingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Face detection via frame processor (no Skia dependency)
  const { detectFaces } = useFaceDetector({
    performanceMode: 'accurate',
    landmarkMode: 'all',
    contourMode: 'all',
    classificationMode: 'all',
    minFaceSize: 0.1,
  });
  const isAsyncBusy = useSharedValue(false);

  const handleFacesDetected = useCallback((faces: Face[]) => {
    if (phase !== 'detecting') return;

    if (faces.length > 0) {
      lastFaceRef.current = faces[0];
      setFaceDetected(true);
      setFeedbackText(pick(DETECTED_TEXTS));
    } else {
      lastFaceRef.current = null;
      setFaceDetected(false);
      setFeedbackText(pick(IDLE_TEXTS));
    }
  }, [phase]);

  const handleFacesJS = Worklets.createRunOnJS(handleFacesDetected);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (isAsyncBusy.value) return;
    isAsyncBusy.value = true;
    try {
      const faces = detectFaces(frame);
      handleFacesJS(faces);
    } catch (_e) {
      // skip frame on error
    } finally {
      isAsyncBusy.value = false;
    }
  }, [detectFaces, handleFacesJS]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    startScan();
    return () => {
      reset();
      if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);
    };
  }, []);

  const handleManualCapture = async () => {
    if (!cameraRef.current || phase !== 'detecting' || capturing) return;

    const faceData = lastFaceRef.current;
    if (!faceData) {
      setError('No face detected. Position your face in the oval and try again.');
      return;
    }

    setCapturing(true);
    setAnalyzing();
    setFeedbackText(pick(ANALYZING_TEXTS));

    // Cycle through meme analyzing messages
    analyzingIntervalRef.current = setInterval(() => {
      setFeedbackText(pick(ANALYZING_TEXTS));
    }, 1200);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Take photo
      const photo = await cameraRef.current.takePhoto();
      const photoUri = `file://${photo.path}`;

      console.log('[MogCheck] Photo captured:', photo.width, 'x', photo.height);
      console.log('[MogCheck] Face data - bounds:', JSON.stringify(faceData.bounds));
      console.log('[MogCheck] Has landmarks:', !!faceData.landmarks);
      console.log('[MogCheck] Has contours:', !!faceData.contours);

      // Map face data from live preview to our facial points
      const points = mapMLKitToFacialPoints(faceData as any);
      if (!points) {
        if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);
        setError('bro we literally cannot find ur face rn. try better lighting fr.');
        setCapturing(false);
        return;
      }

      if (__DEV__) {
        console.log('[MogCheck] Key points:', JSON.stringify({
          hairline: points.hairline,
          browCenter: points.browCenter,
          noseBase: points.noseBase,
          chin: points.chin,
          leftCheek: points.leftCheek,
          rightCheek: points.rightCheek,
          leftJaw: points.leftJaw,
          rightJaw: points.rightJaw,
          nasion: points.nasion,
        }));
      }

      // Dramatic pause for the scanning animation
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Stop cycling text
      if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);

      // Run analysis
      const result = analyzeface(points);

      if (__DEV__) {
        console.log('[MogCheck] Ratios:', result.ratios.map(r =>
          `${r.name}: ${r.measured.toFixed(3)} (ideal ${r.ideal.toFixed(3)}) → ${(r.score * 10).toFixed(1)}`
        ).join('\n'));
      }

      // Save to stores
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
      console.error('[MogCheck] Scan error:', err);
      if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);
      setError('the algorithm broke. even AI gave up on u. try again.');
    } finally {
      setCapturing(false);
    }
  };

  // Permission denied
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>bro said no to camera</Text>
          <Text style={styles.errorText}>we literally cannot rate you without seeing your face. that's how this works.</Text>
          <GlowButton title="fine, allow it" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>no camera found</Text>
          <Text style={styles.errorText}>ur device is a literal brick. how do u even take selfies.</Text>
          <GlowButton title="go back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera with face detection frame processor */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={phase === 'detecting' || phase === 'analyzing'}
        photo
        pixelFormat="yuv"
        frameProcessor={frameProcessor}
      />

      {/* Face Guide Overlay */}
      <FaceGuide faceDetected={faceDetected} faceAligned={faceDetected} />

      {/* Scan Animation */}
      <ScanAnimation visible={phase === 'analyzing'} />

      {/* Feedback Text */}
      <SafeAreaView style={styles.feedbackContainer}>
        <View style={styles.feedbackBadge}>
          <View style={[styles.indicator, faceDetected && styles.indicatorActive]} />
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomControls}>
        {phase === 'detecting' && (
          <>
            {/* Capture Button */}
            <Pressable
              onPress={handleManualCapture}
              disabled={capturing}
              style={({ pressed }) => [
                styles.captureButton,
                faceDetected && styles.captureButtonReady,
                pressed && styles.captureButtonPressed,
              ]}
            >
              <View style={[
                styles.captureButtonInner,
                faceDetected && styles.captureButtonInnerReady,
              ]} />
            </Pressable>

            <Text style={styles.captureHint}>
              {faceDetected ? 'tap to find out the truth' : 'we need to see ur face bro'}
            </Text>
          </>
        )}

        {phase === 'analyzing' && (
          <Text style={styles.analyzingText}>{feedbackText}</Text>
        )}

        {/* Cancel Button */}
        <Pressable
          onPress={() => {
            if (analyzingIntervalRef.current) clearInterval(analyzingIntervalRef.current);
            reset();
            router.back();
          }}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>nah im good</Text>
        </Pressable>
      </SafeAreaView>

      {/* Error State */}
      {useScanStore.getState().error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{useScanStore.getState().error}</Text>
          <GlowButton
            title="run it back"
            onPress={() => {
              startScan();
              setCapturing(false);
              setFeedbackText(pick(IDLE_TEXTS));
            }}
            size="medium"
          />
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
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    color: colors.primary,
    textAlign: 'center',
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
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  feedbackText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    gap: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonReady: {
    borderColor: '#fff',
  },
  captureButtonPressed: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonInnerReady: {
    backgroundColor: '#fff',
  },
  captureHint: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  analyzingText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
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
