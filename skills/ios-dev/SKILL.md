# iOS Development Skill

This skill provides context for the Dev persona executor when working on iOS-related tasks.

## Repository Layout

- **`apps/ios/`**: Main iOS app directory
  - `Sources/`: Swift source files
  - `project.yml`: XcodeGen project configuration
  - `fastlane/`: CI/CD configuration
- **`apps/shared/OpenClawKit/`**: Shared Swift package used by iOS app
- **`scripts/ios-archive-for-testflight.sh`**: Build and upload script
- **`scripts/ios-team-id.sh`**: Extract development team ID

## Build Commands

### Development Build

```bash
cd apps/ios
xcodebuild -scheme OpenClaw -destination 'platform=iOS Simulator,name=iPhone 16' build
```

### Archive for TestFlight

```bash
./scripts/ios-archive-for-testflight.sh [scheme] [team-id]
```

### Run Tests

```bash
cd apps/ios
xcodebuild test -scheme OpenClaw -destination 'platform=iOS Simulator,name=iPhone 16'
```

## Code Signing

- **Development**: Automatic signing with team ID from Xcode settings
- **Distribution**: Uses App Store Connect API key (configured in `fastlane/.env`)
- **Team ID**: Extract via `./scripts/ios-team-id.sh` or Xcode → Signing & Capabilities

## Adding New Screens

1. Create SwiftUI view in `apps/ios/Sources/OpenClawApp/Views/`
2. Add navigation in `OpenClawApp.swift`
3. Update `project.yml` if adding new files (XcodeGen will regenerate Xcode project)

## Adding Capabilities

1. Edit `apps/ios/project.yml` → `targets.OpenClaw.capabilities`
2. Regenerate Xcode project: `xcodegen generate`
3. Configure in Xcode → Signing & Capabilities

## Architecture

- **SwiftUI**: UI framework
- **Combine**: Reactive programming
- **OpenClawKit**: Shared networking and models
- **Gateway Connection**: WebSocket connection to NEURABOT gateway

## Common Tasks

- **Add feature**: Create SwiftUI view, add to navigation, update project.yml
- **Fix bug**: Check logs, trace execution flow, update code
- **Update dependencies**: Edit `Package.swift`, run `swift package update`
- **Deploy**: Run archive script, follow App Store prep checklist

## Testing

- Unit tests: `apps/ios/Tests/`
- UI tests: Use Xcode's UI testing framework
- Manual testing: Run on simulator or device

## Deployment

1. Update version/build number in `project.yml`
2. Run `./scripts/ios-archive-for-testflight.sh`
3. Follow `docs/ios-appstore-prep.md` checklist
4. Submit via App Store Connect
