// lib/eddystone_scanner.dart
import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';
import 'package:permission_handler/permission_handler.dart';

/// Matches Swift's TargetBeacon mapping (namespace+instance → URL)
class TargetBeacon {
  final String namespace; // 20 hex chars (10 bytes)
  final String instance; // 12 hex chars (6 bytes)
  final String url;

  String get identifier =>
      '${namespace.toUpperCase()}-${instance.toUpperCase()}';

  const TargetBeacon({
    required this.namespace,
    required this.instance,
    required this.url,
  });
}

/// Eddystone scanner and UI state (ChangeNotifier for Flutter)
class EddystoneScanner extends ChangeNotifier {
  // ---- Public UI state (mirrors your Swift ObservableObject) ----
  String statusText = "Scanning for Old Town Montgomery beacons...";
  bool isDetected = false;
  String beaconType = "Unknown"; // e.g., "Eddystone-UID"
  String namespace = "";
  String instance = "";
  int rssi = 0;
  String distanceString = "Unknown";
  bool isBluetoothOn = true;

  /// Signal to auto-open the matched URL exactly once per unique beacon
  bool shouldOpenURL = false;
  Uri? detectedURL;

  // ---- Config: target beacons (namespace/instance → URL) ----
  final List<TargetBeacon> targetBeacons = const [
    TargetBeacon(
      namespace: "00000000000000000001",
      instance: "000000000004",
      url: "https://touroldalabamatown.com/living-block/shotgun-house",
    ),
    TargetBeacon(
      namespace: "00000000000000000001",
      instance: "000000000001",
      url: "https://touroldalabamatown.com/living-block/pole-barn",
    ),
  ];

  // ---- BLE scanning ----
  final _ble = FlutterReactiveBle();
  StreamSubscription<DiscoveredDevice>? _scanSub;

  // Eddystone (GATT) Service UUID 0xFEAA
  final Uuid _eddystoneService = Uuid.parse("FEAA");

  Timer? _resetTimer;

  // Track first-time auto-open per-unique beacon & current beacon
  final Set<String> _openedBeaconIds = <String>{};
  String? _currentBeaconId;

  // ---- Public API ----
  Future<void> start() async {
    // Request runtime permissions (Android 12+ and older)
    final statuses =
        await [
          Permission.bluetoothScan,
          Permission.bluetoothConnect,
          Permission
              .location, // still required on some devices / Android versions
        ].request();

    if (statuses.values.any((s) => s.isDenied || s.isPermanentlyDenied)) {
      statusText = "Bluetooth permissions required";
      isBluetoothOn = false;
      notifyListeners();
      return;
    }

    // Observe adapter status for UX parity
    _ble.statusStream.listen((s) {
      isBluetoothOn = (s == BleStatus.ready);
      if (!isBluetoothOn) {
        statusText =
            s == BleStatus.poweredOff
                ? "Bluetooth is off"
                : "Bluetooth not ready";
        _stopScan();
      } else if (_scanSub == null) {
        _startScan();
      }
      notifyListeners();
    });

    _startScan();
  }

  void disposeScanner() {
    _stopScan();
    super.dispose();
  }

  // ---- Internal scanning control ----
  void _startScan() {
    statusText = "Scanning for Eddystone beacons...";
    notifyListeners();

    _scanSub?.cancel();
    _scanSub = _ble
        .scanForDevices(
          withServices: [_eddystoneService],
          scanMode: ScanMode.lowLatency,
        )
        .listen(
          _onDiscovered,
          onError: (e) {
            statusText = "Scan error: $e";
            notifyListeners();
          },
        );
  }

  void _stopScan() {
    _scanSub?.cancel();
    _scanSub = null;
  }

  // ---- Device discovery handler ----
  void _onDiscovered(DiscoveredDevice device) {
    // flutter_reactive_ble 5.x exposes serviceData directly on device
    final Map<Uuid, Uint8List> serviceData = device.serviceData;
    if (!serviceData.containsKey(_eddystoneService)) return;

    final data = serviceData[_eddystoneService]!;
    if (data.isEmpty) return;

    // Eddystone frame type is first byte
    final frameType = data[0]; // 0x00 UID, 0x10 URL, 0x20 TLM, 0x30 EID
    String typeLabel = "Unknown";

    String? nsHex;
    String? instHex;

    switch (frameType) {
      case 0x00: // UID
        typeLabel = "UID";
        // Byte layout:
        // [0]=type, [1]=txPower, [2..11]=namespace(10 bytes), [12..17]=instance(6 bytes), [18..19]=RFU (optional)
        if (data.length >= 18) {
          final nsBytes = data.sublist(2, 12);
          final instBytes = data.sublist(12, 18);
          nsHex = _toHex(nsBytes);
          instHex = _toHex(instBytes);
        }
        break;
      case 0x10:
        typeLabel = "URL";
        break;
      case 0x20:
        typeLabel = "TLM";
        break;
      case 0x30:
        typeLabel = "EID";
        break;
      default:
        break;
    }

    // We only care about UID frames to match namespace+instance
    if (nsHex == null || instHex == null) return;

    // Match against targets
    final matched = targetBeacons.firstWhere(
      (t) =>
          t.namespace.toUpperCase() == nsHex!.toUpperCase() &&
          t.instance.toUpperCase() == instHex!.toUpperCase(),
      orElse: () => const TargetBeacon(namespace: "", instance: "", url: ""),
    );
    if (matched.namespace.isEmpty) return;

    // Update UI state
    _resetTimer?.cancel();

    isDetected = true;
    statusText = "Historic Site Detected!";
    beaconType = "Eddystone-$typeLabel";
    namespace = nsHex!;
    instance = instHex!;
    rssi = device.rssi;
    distanceString = _formatDistance(_estimateDistance(device.rssi));

    detectedURL = Uri.tryParse(matched.url);

    final beaconId = matched.identifier;
    final beaconChanged = _currentBeaconId != beaconId;
    if (beaconChanged) {
      _currentBeaconId = beaconId;
      // Auto-open the first time we ever see this unique beacon (UID)
      if (!_openedBeaconIds.contains(beaconId) && typeLabel == "UID") {
        _openedBeaconIds.add(beaconId);
        shouldOpenURL = true;
      }
    }

    // Reset to scanning state after 5 seconds of silence
    _resetTimer = Timer(const Duration(seconds: 5), _resetDetectionStatus);

    notifyListeners();
  }

  // ---- Helpers ----
  void _resetDetectionStatus() {
    isDetected = false;
    statusText = "Scanning for Old Town Montgomery beacons...";
    beaconType = "Unknown";
    namespace = "";
    instance = "";
    rssi = 0;
    distanceString = "Unknown";
    _currentBeaconId = null;
    // keep detectedURL so user can still tap Explore if desired
    notifyListeners();
  }

  static String _toHex(Uint8List bytes) =>
      bytes
          .map((b) => b.toRadixString(16).padLeft(2, '0'))
          .join()
          .toUpperCase();

  // Rough distance estimation from RSSI (same shape as common iBeacon/Eddystone heuristics)
  double _estimateDistance(int rssi, {int measuredPower = -59}) {
    if (rssi == 0) return -1.0;
    final ratio = rssi / measuredPower;
    if (ratio < 1.0) {
      return math.pow(ratio, 10).toDouble();
    } else {
      return 0.89976 * math.pow(ratio, 7.7095).toDouble() + 0.111;
    }
  }

  String _formatDistance(double d) {
    if (d.isNaN || d < 0) return "Unknown";
    if (d < 1) return "${d.toStringAsFixed(2)} m (Immediate)";
    if (d < 5) return "${d.toStringAsFixed(2)} m (Near)";
    return "${d.toStringAsFixed(2)} m (Far)";
  }
}
