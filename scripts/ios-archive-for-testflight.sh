#!/bin/bash
# iOS Archive Script for TestFlight
#
# Builds and archives the iOS app, then uploads to TestFlight via fastlane.
#
# Usage:
#   ./scripts/ios-archive-for-testflight.sh [scheme] [team-id]
#
# If scheme/team-id not provided, attempts to auto-detect.

set -e

SCHEME="${1:-OpenClaw}"
TEAM_ID="${2:-$(./scripts/ios-team-id.sh)}"

if [ -z "$TEAM_ID" ]; then
  echo "Error: Team ID not found. Please provide as second argument or ensure Xcode is configured."
  exit 1
fi

echo "Building iOS app for TestFlight..."
echo "Scheme: $SCHEME"
echo "Team ID: $TEAM_ID"

cd apps/ios

# Build and archive
echo "Creating archive..."
xcodebuild archive \
  -scheme "$SCHEME" \
  -destination 'generic/platform=iOS' \
  -archivePath build/OpenClaw.xcarchive \
  CODE_SIGN_IDENTITY="iPhone Distribution" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PROVISIONING_PROFILE_SPECIFIER=""

# Upload via fastlane
echo "Uploading to TestFlight..."
fastlane beta

echo "✅ Archive created and uploaded to TestFlight"
