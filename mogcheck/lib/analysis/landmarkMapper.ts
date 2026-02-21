/**
 * Maps raw MLKit face detection landmarks/contour points to named facial points
 * used by the ratio calculator.
 *
 * MLKit Face Detection returns:
 * - Face contour types with arrays of {x, y} points
 * - Face landmark types with single {x, y} positions
 *
 * This module normalizes those into a consistent FacialPoints structure.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Named facial points extracted from raw landmark data.
 * All coordinates are in image pixel space.
 */
export interface FacialPoints {
  // Forehead / hairline (estimated)
  hairline: Point;

  // Brow points
  leftBrowInner: Point;
  leftBrowOuter: Point;
  rightBrowInner: Point;
  rightBrowOuter: Point;
  browCenter: Point; // midpoint between inner brows

  // Eye points
  leftEyeInner: Point;
  leftEyeOuter: Point;
  leftEyeCenter: Point;
  rightEyeInner: Point;
  rightEyeOuter: Point;
  rightEyeCenter: Point;

  // Nose points
  nasion: Point; // bridge of nose (between eyes)
  noseTip: Point;
  noseBase: Point; // subnasale
  leftNoseAlar: Point;
  rightNoseAlar: Point;

  // Mouth points
  mouthLeft: Point;
  mouthRight: Point;
  upperLipTop: Point;
  upperLipBottom: Point;
  lowerLipTop: Point;
  lowerLipBottom: Point;

  // Chin
  chin: Point; // menton (lowest point)

  // Jaw points
  leftJaw: Point; // gonion
  rightJaw: Point; // gonion

  // Face outline
  leftCheek: Point; // widest point (bizygomatic)
  rightCheek: Point;

  // All contour points for symmetry analysis
  leftContour: Point[];
  rightContour: Point[];
}

/**
 * MLKit Face contour/landmark data structure
 */
export interface MLKitFaceData {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: {
    LEFT_EYE?: Point;
    RIGHT_EYE?: Point;
    NOSE_BASE?: Point;
    LEFT_CHEEK?: Point;
    RIGHT_CHEEK?: Point;
    LEFT_EAR?: Point;
    RIGHT_EAR?: Point;
    MOUTH_LEFT?: Point;
    MOUTH_RIGHT?: Point;
    MOUTH_BOTTOM?: Point;
  };
  contours?: {
    FACE?: Point[];
    LEFT_EYEBROW_TOP?: Point[];
    LEFT_EYEBROW_BOTTOM?: Point[];
    RIGHT_EYEBROW_TOP?: Point[];
    RIGHT_EYEBROW_BOTTOM?: Point[];
    LEFT_EYE?: Point[];
    RIGHT_EYE?: Point[];
    UPPER_LIP_TOP?: Point[];
    UPPER_LIP_BOTTOM?: Point[];
    LOWER_LIP_TOP?: Point[];
    LOWER_LIP_BOTTOM?: Point[];
    NOSE_BRIDGE?: Point[];
    NOSE_BOTTOM?: Point[];
  };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Estimate hairline position from face bounds and brow points.
 * The hairline is approximately the same distance above the brows
 * as the brows are from the nose base (equal facial thirds).
 */
function estimateHairline(browCenter: Point, noseBase: Point, faceBounds: MLKitFaceData['bounds']): Point {
  const browToNose = noseBase.y - browCenter.y;
  return {
    x: browCenter.x,
    y: Math.max(faceBounds.y, browCenter.y - browToNose),
  };
}

/**
 * Map MLKit face detection results to named FacialPoints.
 * Returns null if insufficient landmarks are detected.
 */
export function mapMLKitToFacialPoints(face: MLKitFaceData): FacialPoints | null {
  const { landmarks, contours, bounds } = face;

  if (!landmarks || !contours) {
    return null;
  }

  const faceContour = contours.FACE ?? [];
  const leftEyeContour = contours.LEFT_EYE ?? [];
  const rightEyeContour = contours.RIGHT_EYE ?? [];
  const leftBrowTop = contours.LEFT_EYEBROW_TOP ?? [];
  const rightBrowTop = contours.RIGHT_EYEBROW_TOP ?? [];
  const noseBridge = contours.NOSE_BRIDGE ?? [];
  const noseBottom = contours.NOSE_BOTTOM ?? [];
  const upperLipTop = contours.UPPER_LIP_TOP ?? [];
  const upperLipBottom = contours.UPPER_LIP_BOTTOM ?? [];
  const lowerLipTop = contours.LOWER_LIP_TOP ?? [];
  const lowerLipBottom = contours.LOWER_LIP_BOTTOM ?? [];

  // We need minimum contour data to proceed
  if (faceContour.length < 10 || leftEyeContour.length < 4 || rightEyeContour.length < 4) {
    return null;
  }

  // Eye centers from landmarks or contour midpoints
  const leftEyeCenter = landmarks.LEFT_EYE ?? midpoint(leftEyeContour[0], leftEyeContour[Math.floor(leftEyeContour.length / 2)]);
  const rightEyeCenter = landmarks.RIGHT_EYE ?? midpoint(rightEyeContour[0], rightEyeContour[Math.floor(rightEyeContour.length / 2)]);

  // Eye inner/outer from contours
  const leftEyeInner = leftEyeContour[0];
  const leftEyeOuter = leftEyeContour[Math.floor(leftEyeContour.length / 2)];
  const rightEyeInner = rightEyeContour[Math.floor(rightEyeContour.length / 2)];
  const rightEyeOuter = rightEyeContour[0];

  // Brow points
  const leftBrowInner = leftBrowTop.length > 0 ? leftBrowTop[leftBrowTop.length - 1] : { x: leftEyeInner.x, y: leftEyeInner.y - bounds.height * 0.05 };
  const leftBrowOuter = leftBrowTop.length > 0 ? leftBrowTop[0] : { x: leftEyeOuter.x, y: leftEyeOuter.y - bounds.height * 0.05 };
  const rightBrowInner = rightBrowTop.length > 0 ? rightBrowTop[0] : { x: rightEyeInner.x, y: rightEyeInner.y - bounds.height * 0.05 };
  const rightBrowOuter = rightBrowTop.length > 0 ? rightBrowTop[rightBrowTop.length - 1] : { x: rightEyeOuter.x, y: rightEyeOuter.y - bounds.height * 0.05 };
  const browCenter = midpoint(leftBrowInner, rightBrowInner);

  // Nose
  const nasion = noseBridge.length > 0 ? noseBridge[0] : midpoint(leftEyeCenter, rightEyeCenter);
  const noseTip = noseBridge.length > 1 ? noseBridge[noseBridge.length - 1] : landmarks.NOSE_BASE ?? midpoint(leftEyeCenter, rightEyeCenter);
  const noseBase = landmarks.NOSE_BASE ?? (noseBottom.length > 0 ? noseBottom[Math.floor(noseBottom.length / 2)] : noseTip);
  const leftNoseAlar = noseBottom.length > 0 ? noseBottom[0] : { x: noseBase.x - bounds.width * 0.05, y: noseBase.y };
  const rightNoseAlar = noseBottom.length > 0 ? noseBottom[noseBottom.length - 1] : { x: noseBase.x + bounds.width * 0.05, y: noseBase.y };

  // Mouth
  const mouthLeft = landmarks.MOUTH_LEFT ?? (upperLipTop.length > 0 ? upperLipTop[0] : { x: bounds.x + bounds.width * 0.35, y: bounds.y + bounds.height * 0.7 });
  const mouthRight = landmarks.MOUTH_RIGHT ?? (upperLipTop.length > 0 ? upperLipTop[upperLipTop.length - 1] : { x: bounds.x + bounds.width * 0.65, y: bounds.y + bounds.height * 0.7 });
  const upperLipTopPt = upperLipTop.length > 0 ? upperLipTop[Math.floor(upperLipTop.length / 2)] : midpoint(mouthLeft, mouthRight);
  const upperLipBottomPt = upperLipBottom.length > 0 ? upperLipBottom[Math.floor(upperLipBottom.length / 2)] : { x: upperLipTopPt.x, y: upperLipTopPt.y + 3 };
  const lowerLipTopPt = lowerLipTop.length > 0 ? lowerLipTop[Math.floor(lowerLipTop.length / 2)] : { x: upperLipBottomPt.x, y: upperLipBottomPt.y + 2 };
  const lowerLipBottomPt = lowerLipBottom.length > 0 ? lowerLipBottom[Math.floor(lowerLipBottom.length / 2)] : landmarks.MOUTH_BOTTOM ?? { x: lowerLipTopPt.x, y: lowerLipTopPt.y + 5 };

  // Chin — lowest point on face contour
  const chin = faceContour.reduce((lowest, pt) => pt.y > lowest.y ? pt : lowest, faceContour[0]);

  // Hairline (estimated)
  const hairline = estimateHairline(browCenter, noseBase, bounds);

  // Jaw (gonion) — find the points on face contour that are roughly at mouth height
  const mouthY = mouthLeft.y;
  const leftSide = faceContour.filter(p => p.x < bounds.x + bounds.width / 2);
  const rightSide = faceContour.filter(p => p.x > bounds.x + bounds.width / 2);
  const leftJaw = leftSide.reduce((best, pt) => Math.abs(pt.y - mouthY) < Math.abs(best.y - mouthY) ? pt : best, leftSide[0] ?? { x: bounds.x, y: mouthY });
  const rightJaw = rightSide.reduce((best, pt) => Math.abs(pt.y - mouthY) < Math.abs(best.y - mouthY) ? pt : best, rightSide[0] ?? { x: bounds.x + bounds.width, y: mouthY });

  // Cheeks (widest points — bizygomatic)
  const leftCheek = landmarks.LEFT_CHEEK ?? leftSide.reduce((widest, pt) => pt.x < widest.x ? pt : widest, leftSide[0] ?? { x: bounds.x, y: bounds.y + bounds.height / 2 });
  const rightCheek = landmarks.RIGHT_CHEEK ?? rightSide.reduce((widest, pt) => pt.x > widest.x ? pt : widest, rightSide[0] ?? { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 });

  // Split contour into left/right for symmetry
  const faceMidX = (leftCheek.x + rightCheek.x) / 2;
  const leftContour = faceContour.filter(p => p.x <= faceMidX);
  const rightContour = faceContour.filter(p => p.x > faceMidX);

  return {
    hairline,
    leftBrowInner, leftBrowOuter, rightBrowInner, rightBrowOuter, browCenter,
    leftEyeInner, leftEyeOuter, leftEyeCenter,
    rightEyeInner, rightEyeOuter, rightEyeCenter,
    nasion, noseTip, noseBase, leftNoseAlar, rightNoseAlar,
    mouthLeft, mouthRight,
    upperLipTop: upperLipTopPt, upperLipBottom: upperLipBottomPt,
    lowerLipTop: lowerLipTopPt, lowerLipBottom: lowerLipBottomPt,
    chin, leftJaw, rightJaw, leftCheek, rightCheek,
    leftContour, rightContour,
  };
}
