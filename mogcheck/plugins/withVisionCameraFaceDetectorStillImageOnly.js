const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = 'MOGCHECK_BEGIN_FACE_DETECTOR_STILL_IMAGE_ONLY';

const PATCH = `    # ${PATCH_MARKER}
    # MogCheck uses react-native-vision-camera-face-detector for still-image
    # analysis only. The live frame processor files require WorkletsCore, which
    # is intentionally not shipped in the App Store build.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'VisionCameraFaceDetector'

      target.source_build_phase.files.to_a.each do |build_file|
        basename = File.basename(build_file.file_ref&.path.to_s)

        if [
          'VisionCameraFaceDetector.m',
          'VisionCameraFaceDetector.swift',
          'VisionCameraFaceDetectorOrientation.swift',
        ].include?(basename)
          target.source_build_phase.remove_build_file(build_file)
        end
      end
    end
    # MOGCHECK_END_FACE_DETECTOR_STILL_IMAGE_ONLY
`;

function patchPodfile(contents) {
  if (
    contents.includes(PATCH_MARKER) ||
    contents.includes("target.name == 'VisionCameraFaceDetector'")
  ) {
    return contents;
  }

  const anchor = '  post_install do |installer|\n';

  if (!contents.includes(anchor)) {
    throw new Error('Unable to patch Podfile: post_install block was not found.');
  }

  return contents.replace(anchor, `${anchor}${PATCH}\n`);
}

module.exports = function withVisionCameraFaceDetectorStillImageOnly(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfile = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');
      const nextContents = patchPodfile(contents);

      if (nextContents !== contents) {
        fs.writeFileSync(podfile, nextContents);
      }

      return modConfig;
    },
  ]);
};
