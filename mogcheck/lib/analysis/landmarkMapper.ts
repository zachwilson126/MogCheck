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

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function medianPoint(points: Point[]): Point {
  return {
    x: medianOf(points.map(p => p.x)),
    y: medianOf(points.map(p => p.y)),
  };
}

/**
 * Combine multiple FacialPoints using median (not average) to reject outliers.
 * A single bad MLKit frame won't poison the result — median is robust.
 * Contour arrays use the most recent frame since they vary in point count.
 */
export function medianFacialPoints(pointSets: FacialPoints[]): FacialPoints {
  if (pointSets.length === 1) return pointSets[0];

  const keys: (keyof Omit<FacialPoints, 'leftContour' | 'rightContour'>)[] = [
    'hairline', 'leftBrowInner', 'leftBrowOuter', 'rightBrowInner', 'rightBrowOuter', 'browCenter',
    'leftEyeInner', 'leftEyeOuter', 'leftEyeCenter',
    'rightEyeInner', 'rightEyeOuter', 'rightEyeCenter',
    'nasion', 'noseTip', 'noseBase', 'leftNoseAlar', 'rightNoseAlar',
    'mouthLeft', 'mouthRight', 'upperLipTop', 'upperLipBottom', 'lowerLipTop', 'lowerLipBottom',
    'chin', 'leftJaw', 'rightJaw', 'leftCheek', 'rightCheek',
  ];

  const result: Partial<FacialPoints> = {};
  for (const key of keys) {
    result[key] = medianPoint(pointSets.map(ps => ps[key]));
  }

  // Use contours from the most recent frame
  const last = pointSets[pointSets.length - 1];
  result.leftContour = last.leftContour;
  result.rightContour = last.rightContour;

  return result as FacialPoints;
}

/**
 * Validate that facial points have correct vertical ordering.
 * Rejects nonsensical frames where e.g. chin is above nose.
 */
export function validateFacialPoints(points: FacialPoints): boolean {
  // Vertical ordering: hairline.y < browCenter.y < noseBase.y < chin.y
  if (points.hairline.y >= points.browCenter.y) return false;
  if (points.browCenter.y >= points.noseBase.y) return false;
  if (points.noseBase.y >= points.chin.y) return false;

  // Cheeks should be separated horizontally
  const cheekWidth = Math.abs(points.rightCheek.x - points.leftCheek.x);
  if (cheekWidth < 10) return false;

  // Eyes should be between cheeks
  const eyeSpan = Math.abs(points.rightEyeCenter.x - points.leftEyeCenter.x);
  if (eyeSpan < 5) return false;

  return true;
}

/**
 * Estimate hairline position from face bounds and brow points.
 *
 * Strategy: average two estimation methods and clamp to a reasonable range.
 * - Method 1: mirror the brow-to-nose distance above the brows
 * - Method 2: top of the MLKit face bounding box
 *
 * Previously took min (highest) of both which could place hairline
 * unrealistically high, inflating face length and skewing facial thirds.
 * Now we average them and cap at 1.3x the brow-to-nose distance above
 * the brows (the upper third shouldn't exceed ~130% of the middle third).
 */
function estimateHairline(browCenter: Point, noseBase: Point, faceBounds: MLKitFaceData['bounds']): Point {
  const browToNose = Math.abs(noseBase.y - browCenter.y);

  // Method 1: mirror brow-to-nose distance above the brows
  const mirrorY = browCenter.y - browToNose;
  // Method 2: top of the face bounding box
  const bboxTopY = faceBounds.y;

  // Average the two estimates
  const avgY = (mirrorY + bboxTopY) / 2;

  // Cap: hairline should not be more than 1.3x the middle-third distance
  // above the brows (prevents wild overestimates from loose bounding boxes)
  const maxDistance = browToNose * 1.3;
  const cappedY = Math.max(avgY, browCenter.y - maxDistance);

  return {
    x: browCenter.x,
    y: cappedY,
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

  // Eye inner/outer from contours — use position-based detection (closest/furthest
  // from face center) instead of index-based, which is fragile if MLKit contour
  // point ordering varies between devices or SDK versions.
  const faceCenterX = bounds.x + bounds.width / 2;
  const leftEyeInner = leftEyeContour.reduce((best, pt) =>
    Math.abs(pt.x - faceCenterX) < Math.abs(best.x - faceCenterX) ? pt : best, leftEyeContour[0]);
  const leftEyeOuter = leftEyeContour.reduce((best, pt) =>
    Math.abs(pt.x - faceCenterX) > Math.abs(best.x - faceCenterX) ? pt : best, leftEyeContour[0]);
  const rightEyeInner = rightEyeContour.reduce((best, pt) =>
    Math.abs(pt.x - faceCenterX) < Math.abs(best.x - faceCenterX) ? pt : best, rightEyeContour[0]);
  const rightEyeOuter = rightEyeContour.reduce((best, pt) =>
    Math.abs(pt.x - faceCenterX) > Math.abs(best.x - faceCenterX) ? pt : best, rightEyeContour[0]);

  // Brow points — use position-based detection (same approach as eyes)
  const leftBrowInner = leftBrowTop.length > 0
    ? leftBrowTop.reduce((best, pt) => Math.abs(pt.x - faceCenterX) < Math.abs(best.x - faceCenterX) ? pt : best, leftBrowTop[0])
    : { x: leftEyeInner.x, y: leftEyeInner.y - bounds.height * 0.05 };
  const leftBrowOuter = leftBrowTop.length > 0
    ? leftBrowTop.reduce((best, pt) => Math.abs(pt.x - faceCenterX) > Math.abs(best.x - faceCenterX) ? pt : best, leftBrowTop[0])
    : { x: leftEyeOuter.x, y: leftEyeOuter.y - bounds.height * 0.05 };
  const rightBrowInner = rightBrowTop.length > 0
    ? rightBrowTop.reduce((best, pt) => Math.abs(pt.x - faceCenterX) < Math.abs(best.x - faceCenterX) ? pt : best, rightBrowTop[0])
    : { x: rightEyeInner.x, y: rightEyeInner.y - bounds.height * 0.05 };
  const rightBrowOuter = rightBrowTop.length > 0
    ? rightBrowTop.reduce((best, pt) => Math.abs(pt.x - faceCenterX) > Math.abs(best.x - faceCenterX) ? pt : best, rightBrowTop[0])
    : { x: rightEyeOuter.x, y: rightEyeOuter.y - bounds.height * 0.05 };
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
  // Prefer MOUTH_BOTTOM landmark for lip bottom — it's the true outer bottom edge.
  // The LOWER_LIP_BOTTOM contour middle point can be too close to the lip opening.
  const lowerLipBottomPt = landmarks.MOUTH_BOTTOM
    ?? (lowerLipBottom.length > 0 ? lowerLipBottom[Math.floor(lowerLipBottom.length / 2)] : { x: lowerLipTopPt.x, y: lowerLipTopPt.y + 5 });

  // Chin — lowest point on face contour
  const chin = faceContour.reduce((lowest, pt) => pt.y > lowest.y ? pt : lowest, faceContour[0]);

  // Hairline (estimated)
  const hairline = estimateHairline(browCenter, noseBase, bounds);

  // Split contour into left/right halves
  const faceMidX = bounds.x + bounds.width / 2;
  const leftSide = faceContour.filter(p => p.x < faceMidX);
  const rightSide = faceContour.filter(p => p.x >= faceMidX);

  // Jaw (gonion) — the angle of the mandible, located below the mouth.
  // Find the widest contour points in the jaw region: from mouth level
  // down to ~80% of the way to the chin. Previously searched AT mouth
  // level, which gave cheek points instead of the true gonion.
  const mouthY = mouthLeft.y;
  const jawRegionTop = mouthY;
  const jawRegionBottom = mouthY + (chin.y - mouthY) * 0.8;
  const leftJawRegion = leftSide.filter(p => p.y >= jawRegionTop && p.y <= jawRegionBottom);
  const rightJawRegion = rightSide.filter(p => p.y >= jawRegionTop && p.y <= jawRegionBottom);
  // Find widest point on each side (most extreme x)
  const leftJaw = leftJawRegion.length > 0
    ? leftJawRegion.reduce((best, pt) => pt.x < best.x ? pt : best, leftJawRegion[0])
    : leftSide.length > 0
      ? leftSide.reduce((best, pt) => Math.abs(pt.y - mouthY) < Math.abs(best.y - mouthY) ? pt : best, leftSide[0])
      : { x: bounds.x, y: mouthY };
  const rightJaw = rightJawRegion.length > 0
    ? rightJawRegion.reduce((best, pt) => pt.x > best.x ? pt : best, rightJawRegion[0])
    : rightSide.length > 0
      ? rightSide.reduce((best, pt) => Math.abs(pt.y - mouthY) < Math.abs(best.y - mouthY) ? pt : best, rightSide[0])
      : { x: bounds.x + bounds.width, y: mouthY };

  // Cheeks (bizygomatic width) — widest contour points in the CHEEKBONE region only.
  // The full contour includes ears/temples which are wider than the bizygomatic arch.
  // Restrict to points between eye level and nose level for accurate cheek width.
  const eyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
  const cheekMinY = eyeY;
  const cheekMaxY = noseBase.y;
  const leftCheekRegion = leftSide.filter(p => p.y >= cheekMinY && p.y <= cheekMaxY);
  const rightCheekRegion = rightSide.filter(p => p.y >= cheekMinY && p.y <= cheekMaxY);

  // Find widest point in cheek region; fall back to widest overall if region is empty
  const leftCheek = leftCheekRegion.length > 0
    ? leftCheekRegion.reduce((widest, pt) => pt.x < widest.x ? pt : widest, leftCheekRegion[0])
    : leftSide.length > 0
      ? leftSide.reduce((widest, pt) => pt.x < widest.x ? pt : widest, leftSide[0])
      : { x: bounds.x, y: bounds.y + bounds.height / 2 };
  const rightCheek = rightCheekRegion.length > 0
    ? rightCheekRegion.reduce((widest, pt) => pt.x > widest.x ? pt : widest, rightCheekRegion[0])
    : rightSide.length > 0
      ? rightSide.reduce((widest, pt) => pt.x > widest.x ? pt : widest, rightSide[0])
      : { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };

  // Split contour into left/right for symmetry (use cheek midpoint as center)
  const symmetryMidX = (leftCheek.x + rightCheek.x) / 2;
  const leftContour = faceContour.filter(p => p.x <= symmetryMidX);
  const rightContour = faceContour.filter(p => p.x > symmetryMidX);

  const result: FacialPoints = {
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

  if (__DEV__) {
    const faceLength = distance(hairline, chin);
    const faceWidth = distance(leftCheek, rightCheek);
    const jawWidth = distance(leftJaw, rightJaw);
    const upper = distance(hairline, browCenter);
    const middle = distance(browCenter, noseBase);
    const lower = distance(noseBase, chin);
    console.log('[MogCheck] Landmark mapping:', {
      faceLength: faceLength.toFixed(1),
      faceWidth: faceWidth.toFixed(1),
      faceLW: (faceLength / faceWidth).toFixed(3),
      jawWidth: jawWidth.toFixed(1),
      jawFaceRatio: (jawWidth / faceWidth).toFixed(3),
      thirds: `${((upper / (upper + middle + lower)) * 100).toFixed(0)}/${((middle / (upper + middle + lower)) * 100).toFixed(0)}/${((lower / (upper + middle + lower)) * 100).toFixed(0)}`,
      eyeSpacing: (distance(leftEyeCenter, rightEyeCenter) / faceWidth).toFixed(3),
      contourPts: `${faceContour.length} (L:${leftContour.length} R:${rightContour.length})`,
      jawRegion: `L:${leftJawRegion.length}pts R:${rightJawRegion.length}pts`,
    });
  }

  return result;
}
