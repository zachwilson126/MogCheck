import { useEffect, useRef, useState } from 'react';
import { Alert, NativeModules, View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { colors } from '../lib/constants/theme';
import { useScanStore } from '../lib/store/useScanStore';
import { useUserStore } from '../lib/store/useUserStore';
import { mapMLKitToFacialPoints, validateFacialPoints } from '../lib/analysis/landmarkMapper';
import { analyzeface } from '../lib/analysis/scoreEngine';
import { preloadInterstitial, showInterstitial, preloadRewarded } from '../lib/ads/adManager';

const SCAN_PHOTOS_ROOT = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;
const SCAN_PHOTOS_DIR = SCAN_PHOTOS_ROOT ? `${SCAN_PHOTOS_ROOT}scan-photos/` : null;

const IDLE_TEXTS = [
  'take a straight-on photo with good light',
  'keep your whole face visible and level',
  'the less weird the angle, the better the read',
];

const ANALYZING_TEXTS = [
  'the algorithm is cooking...',
  'checking the damage...',
  'calculating mog potential...',
  'consulting the golden ratio gods...',
  'running bone structure diagnostics...',
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const FACE_DETECTION_PASSES = [
  {
    performanceMode: 'accurate',
    landmarkMode: 'all',
    contourMode: 'all',
    classificationMode: 'all',
    minFaceSize: 0.1,
  },
  {
    performanceMode: 'fast',
    landmarkMode: 'all',
    contourMode: 'none',
    classificationMode: 'none',
    minFaceSize: 0.08,
  },
  {
    performanceMode: 'fast',
    landmarkMode: 'none',
    contourMode: 'none',
    classificationMode: 'none',
    minFaceSize: 0.05,
  },
] as const;

type ScanDetectedFace = {
  bounds?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
};

type ScanCapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

type ScanAnalyzerModules = {
  detectFaces: typeof import('react-native-vision-camera-face-detector/src/ImageFaceDetector').detectFaces;
};

let scanAnalyzerModules: ScanAnalyzerModules | null = null;

function normalizeFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

async function ensureScanPhotosDirectory(): Promise<void> {
  if (!SCAN_PHOTOS_DIR) {
    return;
  }

  await FileSystem.makeDirectoryAsync(SCAN_PHOTOS_DIR, { intermediates: true }).catch(() => {});
}

async function persistSelectedPhoto(uri: string): Promise<ScanCapturedPhoto> {
  await ensureScanPhotosDirectory();

  const normalizedUri = normalizeFileUri(uri);
  const sourceUri = normalizedUri;
  const destinationUri = SCAN_PHOTOS_DIR
    ? `${SCAN_PHOTOS_DIR}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    : normalizedUri;

  if (destinationUri !== sourceUri) {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    }).catch(async () => {
      const manipulated = await manipulateAsync(
        sourceUri,
        [],
        { compress: 1, format: SaveFormat.JPEG },
      );
      if (manipulated.uri !== destinationUri) {
        await FileSystem.copyAsync({ from: manipulated.uri, to: destinationUri });
      }
    });
  }

  const info = await manipulateAsync(
    destinationUri,
    [],
    { compress: 1, format: SaveFormat.JPEG },
  );

  return {
    uri: info.uri,
    width: info.width,
    height: info.height,
  };
}

async function buildDetectionImageCandidates(photo: ScanCapturedPhoto): Promise<string[]> {
  const candidates = [photo.uri];

  if (photo.width <= photo.height) {
    return candidates;
  }

  for (const rotation of [90, -90]) {
    try {
      const rotated = await manipulateAsync(
        photo.uri,
        [{ rotate: rotation }],
        {
          compress: 1,
          format: SaveFormat.JPEG,
        },
      );
      candidates.push(rotated.uri);
    } catch (rotationError) {
      if (__DEV__) {
        console.warn('[MogCheck] Failed to rotate scan candidate:', rotation, rotationError);
      }
    }
  }

  return [...new Set(candidates)];
}

function getScanAnalyzerModules(): ScanAnalyzerModules {
  if (!scanAnalyzerModules) {
    const imageFaceDetector = require('react-native-vision-camera-face-detector/src/ImageFaceDetector') as typeof import('react-native-vision-camera-face-detector/src/ImageFaceDetector');

    if (!NativeModules.ImageFaceDetector) {
      throw new Error('Face detector native module is unavailable in this build.');
    }

    scanAnalyzerModules = {
      detectFaces: imageFaceDetector.detectFaces,
    };
  }

  return scanAnalyzerModules;
}

async function detectFacesWithFallbacks(photo: ScanCapturedPhoto) {
  const { detectFaces } = getScanAnalyzerModules();
  const imageCandidates = await buildDetectionImageCandidates(photo);

  for (const imageUri of imageCandidates) {
    for (const options of FACE_DETECTION_PASSES) {
      try {
        const faces = await detectFaces({
          image: imageUri,
          options,
        });

        if (Array.isArray(faces) && faces.length > 0) {
          return {
            faces,
            imageUri,
          };
        }
      } catch (detectionError) {
        if (__DEV__) {
          console.warn('[MogCheck] Face detection pass failed:', options, detectionError);
        }
      }
    }
  }

  return {
    faces: [] as ScanDetectedFace[],
    imageUri: photo.uri,
  };
}

export default function ScanScreen() {
  const router = useRouter();
  const phase = useScanStore((s) => s.phase);
  const error = useScanStore((s) => s.error);
  const startScan = useScanStore((s) => s.startScan);
  const setAnalyzing = useScanStore((s) => s.setAnalyzing);
  const setResult = useScanStore((s) => s.setResult);
  const setError = useScanStore((s) => s.setError);
  const reset = useScanStore((s) => s.reset);
  const addScan = useUserStore((s) => s.addScan);

  const [feedbackText, setFeedbackText] = useState(pick(IDLE_TEXTS));
  const [working, setWorking] = useState(false);
  const analyzingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startScan();
    preloadInterstitial();
    preloadRewarded();

    return () => {
      reset();
      if (analyzingIntervalRef.current) {
        clearInterval(analyzingIntervalRef.current);
      }
    };
  }, [reset, startScan]);

  const clearAnalyzingInterval = () => {
    if (analyzingIntervalRef.current) {
      clearInterval(analyzingIntervalRef.current);
      analyzingIntervalRef.current = null;
    }
  };

  const beginAnalyzing = () => {
    setAnalyzing();
    setFeedbackText(pick(ANALYZING_TEXTS));
    clearAnalyzingInterval();
    analyzingIntervalRef.current = setInterval(() => {
      setFeedbackText(pick(ANALYZING_TEXTS));
    }, 1200);
  };

  const finishWithFaces = async (photo: ScanCapturedPhoto) => {
    const { faces, imageUri } = await detectFacesWithFallbacks(photo);

    if (!Array.isArray(faces) || faces.length === 0) {
      throw new Error('NO_FACE');
    }

    const sortedFaces = [...faces].sort((a, b) => {
      const aArea = (a.bounds?.width ?? 0) * (a.bounds?.height ?? 0);
      const bArea = (b.bounds?.width ?? 0) * (b.bounds?.height ?? 0);
      return bArea - aArea;
    });

    const mapped = sortedFaces
      .map((face) => mapMLKitToFacialPoints(face as any))
      .filter((candidate): candidate is NonNullable<typeof candidate> => !!candidate);

    const validPoints = mapped.find((candidate) => validateFacialPoints(candidate));
    const points = validPoints ?? mapped[0];

    if (!points) {
      throw new Error('BAD_READ');
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));
    clearAnalyzingInterval();

    const result = analyzeface(points);
    setResult(result, imageUri);
    addScan(result, imageUri);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await showInterstitial();

    const scanHistory = useUserStore.getState().scanHistory;
    const latestScan = scanHistory[0];
    if (latestScan) {
      router.replace(`/results/${latestScan.id}`);
    }
  };

  const handlePickedAsset = async (asset?: ImagePicker.ImagePickerAsset) => {
    if (!asset?.uri) {
      return;
    }

    setWorking(true);
    beginAnalyzing();

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const persistedPhoto = await persistSelectedPhoto(asset.uri);
      await finishWithFaces(persistedPhoto);
    } catch (scanError) {
      clearAnalyzingInterval();

      if (__DEV__) {
        console.error('[MogCheck] Scan error:', scanError);
      }

      if (scanError instanceof Error && scanError.message === 'NO_FACE') {
        setError('we got the photo but could not lock onto a face. move closer and try better light.');
      } else if (scanError instanceof Error && scanError.message === 'BAD_READ') {
        setError('we got a bad read on that photo. keep your face level and centered.');
      } else {
        setError('the scanner blew up mid-run. try one more time.');
      }
    } finally {
      setWorking(false);
    }
  };

  const launchCamera = async () => {
    if (working) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Required', 'We need camera permission to take a scan photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        cameraType: ImagePicker.CameraType.front,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled) {
        await handlePickedAsset(result.assets?.[0]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[MogCheck] launchCamera failed:', error);
      }
      setError('camera launch failed on this device. try picking a photo instead.');
    }
  };

  const pickFromLibrary = async () => {
    if (working) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos Required', 'We need photo access if you want to pick an existing image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });

      if (!result.canceled) {
        await handlePickedAsset(result.assets?.[0]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[MogCheck] launchImageLibrary failed:', error);
      }
      setError('photo picker failed on this device. try the camera button again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>start scan</Text>
        <Text style={styles.subtitle}>
          {phase === 'analyzing'
            ? feedbackText
            : 'use the system camera for the safest iPad path, then we will analyze the photo.'}
        </Text>

        <View style={styles.guideCard}>
          <Text style={styles.guideHeadline}>Best results</Text>
          <Text style={styles.guideBullet}>Face straight toward the camera</Text>
          <Text style={styles.guideBullet}>Good light, no harsh shadow</Text>
          <Text style={styles.guideBullet}>Whole face visible, no weird angle</Text>
        </View>

        {working ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{feedbackText}</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <ActionButton title="take photo" onPress={() => void launchCamera()} />
            <ActionButton title="pick existing photo" onPress={() => void pickFromLibrary()} variant="secondary" />
            <ActionButton title="go back" onPress={() => router.back()} variant="ghost" />
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton
            title="run it back"
            onPress={() => {
              startScan();
              clearAnalyzingInterval();
              setFeedbackText(pick(IDLE_TEXTS));
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function ActionButton({
  title,
  onPress,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'secondary' && styles.actionButtonSecondary,
        variant === 'ghost' && styles.actionButtonGhost,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.actionButtonTextSecondary,
          variant === 'ghost' && styles.actionButtonTextGhost,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 2,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  guideHeadline: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  guideBullet: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },
  actions: {
    gap: 12,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  actionButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    textTransform: 'uppercase',
    color: colors.background,
  },
  actionButtonTextSecondary: {
    color: colors.text,
  },
  actionButtonTextGhost: {
    color: colors.textSecondary,
  },
});
