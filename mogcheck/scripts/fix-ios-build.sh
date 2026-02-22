#!/bin/bash
# fix-ios-build.sh
# Run after `npx expo prebuild --platform ios` to fix build issues
# caused by spaces in the project path and deployment target reset.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_DIR/ios"

echo "Fixing iOS build issues..."

# 1. Fix deployment target (prebuild resets Podfile.properties.json)
PROPS="$IOS_DIR/Podfile.properties.json"
if [ -f "$PROPS" ]; then
  if ! grep -q '"ios.deploymentTarget"' "$PROPS"; then
    # Add deploymentTarget before the closing brace
    sed -i '' 's/"newArchEnabled": "true"/"newArchEnabled": "true",\n  "ios.deploymentTarget": "16.0"/' "$PROPS"
    echo "  Fixed: Added ios.deploymentTarget to Podfile.properties.json"
  else
    echo "  OK: ios.deploymentTarget already set"
  fi
fi

# 2. Fix "Bundle React Native code and images" script phase (spaces in path)
PBXPROJ="$IOS_DIR/MogCheck.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
  if grep -q '`\\"\\$NODE_BINARY\\".*react-native-xcode' "$PBXPROJ"; then
    sed -i '' 's/`\\"\\$NODE_BINARY\\" --print \\"require('\''path'\'').dirname(require.resolve('\''react-native\/package.json'\'')) + '\''\/scripts\/react-native-xcode.sh'\''\\"`/RN_SCRIPT=\\"\\$(\\"\\"\\$NODE_BINARY\\"\\\" --print \\\"require('\'path\'').dirname(require.resolve('\'react-native\/package.json\'')) + '\'\/scripts\/react-native-xcode.sh\'\\\")\\\"\\n\/bin\/sh \\"\\$RN_SCRIPT\\"/g' "$PBXPROJ"
    echo "  Fixed: Patched react-native-xcode.sh invocation for spaces in path"
  else
    echo "  OK: react-native-xcode.sh invocation already patched (or not found)"
  fi
fi

echo "Done. Now run: cd ios && pod install"
