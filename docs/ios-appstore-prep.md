# iOS App Store Preparation Checklist

This document outlines the steps to prepare the NEURABOT iOS app for App Store submission. After running `./scripts/ios-archive-for-testflight.sh`, follow these steps to complete submission.

## Prerequisites

- [ ] Archive script completed successfully
- [ ] Build uploaded to App Store Connect
- [ ] Apple Developer account with App Store Connect access

## App Store Connect Setup

### 1. App Information

- [ ] App name: "NEURABOT" (or your chosen name)
- [ ] Subtitle: Brief description (30 characters max)
- [ ] Category: Productivity / Utilities
- [ ] Privacy Policy URL: (required)
- [ ] Support URL: (required)

### 2. Version Information

- [ ] Version number: Update in `apps/ios/project.yml` or `Info.plist`
- [ ] Build number: Increment for each upload
- [ ] What's New: Release notes for this version

### 3. Screenshots

Required for each device size:

- [ ] 6.7" (iPhone 14 Pro Max, iPhone 13 Pro Max)
- [ ] 6.5" (iPhone 11 Pro Max, iPhone XS Max)
- [ ] 5.5" (iPhone 8 Plus)

**Quick generation:**

```bash
cd apps/ios
fastlane snapshot  # Requires UI tests configured
# Or manually capture from simulator
```

### 4. App Icon

- [ ] 1024×1024 PNG (no transparency)
- [ ] Already in app bundle (verify in Xcode)

### 5. App Review Information

- [ ] Contact information
- [ ] Demo account (if app requires login)
- [ ] Notes for reviewer (if needed)

### 6. Age Rating

- [ ] Complete questionnaire
- [ ] Select appropriate rating

### 7. Export Compliance

- [ ] Answer encryption questions
- [ ] Most apps: "No encryption"

### 8. Content Rights

- [ ] Confirm you have rights to all content

### 9. Advertising Identifier

- [ ] Indicate if app uses IDFA

## Final Steps

1. **Select Build**: In App Store Connect, select the uploaded build for this version
2. **Review**: Verify all information is correct
3. **Submit for Review**: Click "Submit for Review"

## Automated Metadata Upload

Use fastlane's `metadata` lane to upload metadata:

```bash
cd apps/ios
fastlane metadata
```

This requires metadata files in `fastlane/metadata/` directory.

## Troubleshooting

- **Build not appearing**: Wait 5-10 minutes after upload, refresh App Store Connect
- **Signing issues**: Verify team ID and provisioning profiles in Xcode
- **Upload fails**: Check fastlane logs, verify API key permissions

## References

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [fastlane documentation](https://docs.fastlane.tools/)
- [Xcode Archive Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
