# demo Flutter

Awesome project. Here’s a clean, end-to-end path to get a Flutter app running on a real phone that listens for an iBeacon and, when it sees a specific beacon, opens a web page.

---

# 1) Prereqs & what you’ll build

* **Goal:** A Flutter app that **ranges** for an iBeacon (UUID/major/minor) and **launches a URL** when it’s detected nearby.
* **You’ll need:**

  * A real **Android** or **iOS** device (BLE isn’t available in the iOS simulator). ([Dart packages][1])
  * An **iBeacon** (or a second phone broadcasting iBeacon format).
* **Plugin choices:** We’ll use `flutter_beacon` (stable, iOS uses CoreLocation; Android uses the AltBeacon library) + `url_launcher`. ([Dart packages][1])

---

# 2) Install Flutter (Windows focus, macOS notes included)

**Windows**

1. Install Flutter: download the latest **Flutter SDK** (stable) and unzip to `C:\src\flutter`. Add `C:\src\flutter\bin` to PATH.
2. Open **PowerShell** → `flutter doctor`.
3. Install **Android Studio** → open it once to install **Android SDK**, **Platform Tools**, and a device image if you want an emulator.
4. In Android Studio > **SDK Manager**, ensure **Android SDK 34+** is installed.
5. Back in shell: `flutter doctor` again and follow any fix-ups.

**macOS (for iOS)**

1. Install **Xcode** from the App Store.
2. `xcode-select --install` (command line tools).
3. `brew install --cask android-studio` if you also want Android.
4. `flutter doctor` and resolve items (signing for iOS will be guided by Xcode the first time you run).

---

# 3) Create the app

```bash
flutter create beacon_linker
cd beacon_linker
```

---

# 4) Add packages

Edit `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_beacon: ^0.5.1
  url_launcher: ^6.3.2
```

`flutter pub get`

Why these?

* `flutter_beacon` exposes **ranging/monitoring** APIs and handles permission prompts via `initializeAndCheckScanning`. ([Dart packages][1])
* `url_launcher` opens a web page from Flutter. ([Dart packages][2])

---

# 5) Platform permissions (required)

## Android

Open `android/app/src/main/AndroidManifest.xml` and add **inside** `<manifest>` (but **outside** `<application>`):

```xml
<!-- BLE + Location (Android 12+ needs explicit Bluetooth runtime perms) -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Background ranging (optional; only if you need it) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Android 12+ runtime permissions -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Use BLE hardware -->
<uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />
```

Notes:

* Android 12 (API 31+) introduced **BLUETOOTH\_SCAN/CONNECT** runtime permissions. If you **never** derive location from scan results, you may mark `BLUETOOTH_SCAN` with `android:usesPermissionFlags="neverForLocation"`, but iBeacon proximity is commonly considered location-adjacent—so skip that unless you’re sure. ([Android Developers][3])
* Background scanning requires `ACCESS_BACKGROUND_LOCATION`. ([GitHub][4])

## iOS

Open `ios/Runner/Info.plist` and add:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses Bluetooth beacons to trigger exhibit content nearby.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app uses Bluetooth beacons to trigger content even when the app is not active.</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth is required to detect nearby beacons.</string>
```

(iOS requires location permission for iBeacon monitoring/ranging, and runs via CoreLocation.) Also: test on a **physical device**, not the simulator. ([Dart packages][1])

---

# 6) App code (replace the contents of `lib/main.dart`)

This version opens a **specific link** when it detects a beacon with your UUID/major/minor. It also debounces so it doesn’t keep popping the browser.

```dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_beacon/flutter_beacon.dart';
import 'package:url_launcher/url_launcher.dart';

/// TODO: Replace with your beacon identifiers and target link
const String kBeaconUUID = 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0'; // sample UUID from Apple's AirLocate docs
const int kBeaconMajor = 100;   // put your beacon's Major
const int kBeaconMinor = 1;     // put your beacon's Minor
const String kTargetUrl = 'https://your-museum-site.example/exhibit/100-1';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BeaconLinkerApp());
}

class BeaconLinkerApp extends StatefulWidget {
  const BeaconLinkerApp({super.key});

  @override
  State<BeaconLinkerApp> createState() => _BeaconLinkerAppState();
}

class _BeaconLinkerAppState extends State<BeaconLinkerApp> {
  StreamSubscription<RangingResult>? _rangingSub;
  bool _hasOpenedForThisBeacon = false;
  String _status = 'Initializing…';

  @override
  void initState() {
    super.initState();
    _initBeacon();
  }

  Future<void> _initBeacon() async {
    try {
      // Prompts for Bluetooth/Location as needed and verifies services
      await flutterBeacon.initializeAndCheckScanning(); // plugin manages permissions
      setState(() => _status = 'Scanning…');

      final regions = <Region>[
        // iOS requires at least identifier + proximityUUID
        // Android can also filter by proximityUUID; do it to reduce noise.
        Region(identifier: 'museum-region', proximityUUID: kBeaconUUID),
      ];

      _rangingSub = flutterBeacon.ranging(regions).listen((RangingResult result) {
        for (final beacon in result.beacons) {
          final uuid = beacon.proximityUUID?.toUpperCase() ?? '';
          final major = beacon.major;
          final minor = beacon.minor;

          // Basic proximity check using RSSI to avoid false triggers far away
          final nearEnough = (beacon.rssi != null) ? beacon.rssi! > -75 : true;

          if (!_hasOpenedForThisBeacon &&
              uuid == kBeaconUUID.toUpperCase() &&
              major == kBeaconMajor &&
              minor == kBeaconMinor &&
              nearEnough) {
            _hasOpenedForThisBeacon = true;
            _openLink();
            setState(() => _status = 'Beacon found → launching link');
            // Optional: stop scanning after first open
            _rangingSub?.cancel();
          }
        }
      });
    } on BeaconStatusError catch (e) {
      setState(() => _status = 'Beacon init error: ${e.message}');
    } catch (e) {
      setState(() => _status = 'Init failed: $e');
    }
  }

  Future<void> _openLink() async {
    final uri = Uri.parse(kTargetUrl);
    if (!await canLaunchUrl(uri)) return;
    // Use external application (browser)
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  void dispose() {
    _rangingSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Beacon Linker',
      home: Scaffold(
        appBar: AppBar(title: const Text('Beacon → Link')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Status: $_status\n\n'
              'Looking for:\nUUID: $kBeaconUUID\nMajor: $kBeaconMajor  Minor: $kBeaconMinor',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
```

**Why this works**

* `initializeAndCheckScanning` prompts for the right permissions and ensures services are on.
* `ranging(regions)` provides continuous beacon updates; we match UUID/major/minor and then open the link via `url_launcher`. ([Dart packages][1])

---

# 7) Run it

* **Android:** enable **Location** + **Bluetooth** on the phone, plug in USB, then:

  ```bash
  flutter run -d android
  ```
* **iOS:** use a **physical device** with Bluetooth on. In Xcode the first run will prompt you to set a signing team, then:

  ```bash
  flutter run -d ios
  ```

(iOS simulators don’t support Bluetooth scanning.) ([Dart packages][1])

---

# 8) Map multiple beacons → different pages (optional)

If you have many exhibits, keep a map:

```dart
const beaconsToUrls = {
  // (uuid, major, minor) -> url
  ('E2C56DB5-DFFB-48D2-B060-D0F5A71096E0', 100, 1): 'https://site/exhibit/a',
  ('E2C56DB5-DFFB-48D2-B060-D0F5A71096E0', 100, 2): 'https://site/exhibit/b',
};
```

Then look up the tuple inside the ranging loop and open the corresponding link.

---

# 9) Background behavior (optional)

If you want a link to open **only when the app is foregrounded** (recommended UX), you’re done.
If you want to **notify** the user when a beacon appears in the background, use `monitoring(regions)` + a local-notification plugin to nudge them to tap back into the app (both Android & iOS support background **monitoring**, but opening a browser automatically from the background is poor UX and often restricted). ([Dart packages][1])

---

# 10) Troubleshooting

* **Nothing appears on iOS:** use a real device and ensure the **location prompt** was granted; check that Bluetooth is on. ([Dart packages][1])
* **Android 12+ permissions:** you must accept **Bluetooth** runtime prompts (SCAN/CONNECT) and generally still grant **location** for beacon use cases. ([Android Developers][3])
* **Wrong UUID/major/minor:** confirm your beacon’s identifiers; the sample UUID in the code is just a known demo value from Apple docs. ([Dart packages][1])

---

Want me to tailor this to your exact beacon UUID/major/minor and your museum URLs? Share those values and I’ll drop them into the code.

[1]: https://pub.dev/documentation/flutter_beacon/latest/ "flutter_beacon - Dart API docs"
[2]: https://pub.dev/packages/url_launcher?utm_source=chatgpt.com "url_launcher | Flutter package"
[3]: https://developer.android.com/develop/connectivity/bluetooth/bt-permissions?utm_source=chatgpt.com "Bluetooth permissions | Connectivity"
[4]: https://github.com/AltBeacon/android-beacon-library/issues/1063?utm_source=chatgpt.com "Beacon scanning not working with Android 12 Bluetooth ..."
