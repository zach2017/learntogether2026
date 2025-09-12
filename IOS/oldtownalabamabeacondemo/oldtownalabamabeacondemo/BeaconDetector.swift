// ===================================

// FILE 2: EddystoneBeaconDetector.swift

// Location: YourAppName/EddystoneBeaconDetector.swift

// Create a new Swift file for this

// ===================================



import Foundation

import CoreBluetooth

import SwiftUI



class EddystoneBeaconDetector: NSObject, ObservableObject {

// MARK: - Published Properties

@Published var statusText = "Scanning for Old Town Montgomery beacons..."

@Published var isDetected = false

@Published var beaconType = "Unknown"

@Published var namespace = ""

@Published var instance = ""

@Published var rssi: Int = 0

@Published var distanceString = "Unknown"

@Published var isBluetoothOn = true

@Published var shouldOpenURL = false



// MARK: - Configuration

// IMPORTANT: Configure your Eddystone beacon detection here

let targetURL = "https://touroldalabamatown.com/living-block/shotgun-house" // Your target URL



// Optional: Specify exact Eddystone-UID to detect (leave empty to detect any)

// Namespace: 10 bytes (20 hex chars), Instance: 6 bytes (12 hex chars)

 // let targetNamespace = "00000000000000000001"

 // let targetInstance = "000000000001"



let targetNamespace = "00000000000000000001"

let targetInstance = "000000000001"



// MARK: - Properties

private var centralManager: CBCentralManager!

private var detectedBeacons: Set<String> = []

private var hasAutoOpened = false

private let eddystoneServiceUUID = CBUUID(string: "FEAA")



// MARK: - Initialization

override init() {

super.init()

centralManager = CBCentralManager(delegate: self, queue: nil)

}



// MARK: - Helper Methods

private func calculateDistance(rssi: Int, measuredPower: Int = -59) -> Double {

if rssi == 0 { return -1.0 }



let ratio = Double(rssi) / Double(measuredPower)

if ratio < 1.0 {

return pow(ratio, 10)

} else {

let accuracy = (0.89976) * pow(ratio, 7.7095) + 0.111

return accuracy

}

}



private func formatDistance(_ distance: Double) -> String {

if distance < 0 {

return "Unknown"

} else if distance < 1 {

return String(format: "%.2f m (Immediate)", distance)

} else if distance < 5 {

return String(format: "%.2f m (Near)", distance)

} else {

return String(format: "%.2f m (Far)", distance)

}

}



private func parseEddystoneFrame(_ serviceData: Data) -> (type: String, namespace: String?, instance: String?) {

guard serviceData.count > 0 else { return ("Unknown", nil, nil) }



let frameType = serviceData[0]



switch frameType {

case 0x00: // UID frame

if serviceData.count >= 18 {

let namespaceData = serviceData.subdata(in: 2..<12)

let instanceData = serviceData.subdata(in: 12..<18)

let namespace = namespaceData.map { String(format: "%02X", $0) }.joined()

let instance = instanceData.map { String(format: "%02X", $0) }.joined()

return ("UID", namespace, instance)

}

case 0x10: // URL frame

return ("URL", nil, nil)

case 0x20: // TLM frame

return ("TLM", nil, nil)

case 0x30: // EID frame

return ("EID", nil, nil)

default:

break

}



return ("Unknown", nil, nil)

}

}



// MARK: - CBCentralManagerDelegate

extension EddystoneBeaconDetector: CBCentralManagerDelegate {

func centralManagerDidUpdateState(_ central: CBCentralManager) {

switch central.state {

case .poweredOn:

isBluetoothOn = true

statusText = "Scanning for Eddystone beacons..."

// Start scanning for Eddystone beacons

centralManager.scanForPeripherals(

withServices: [eddystoneServiceUUID],

options: [CBCentralManagerScanOptionAllowDuplicatesKey: true]

)

case .poweredOff:

isBluetoothOn = false

statusText = "Bluetooth is off"

case .unsupported:

statusText = "Bluetooth not supported"

case .unauthorized:

statusText = "Bluetooth unauthorized"

case .resetting:

statusText = "Bluetooth resetting..."

case .unknown:

statusText = "Bluetooth state unknown"

@unknown default:

statusText = "Bluetooth state unknown"

}

}



func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral,

 advertisementData: [String : Any], rssi RSSI: NSNumber) {



// Look for Eddystone service data

guard let serviceData = advertisementData[CBAdvertisementDataServiceDataKey] as? [CBUUID: Data],

 let eddystoneData = serviceData[eddystoneServiceUUID] else {

return

}



// Parse Eddystone frame

let (frameType, namespace, instance) = parseEddystoneFrame(eddystoneData)



// Check if this is the beacon we're looking for (if specified)

if !targetNamespace.isEmpty && namespace != targetNamespace {

return

}

if !targetInstance.isEmpty && instance != targetInstance {

return

}



// Update UI

DispatchQueue.main.async {

self.isDetected = true

self.statusText = "Eddystone Beacon Detected!"

self.beaconType = "Eddystone-\(frameType)"

self.namespace = namespace ?? "N/A"

self.instance = instance ?? "N/A"

self.rssi = RSSI.intValue



let distance = self.calculateDistance(rssi: RSSI.intValue)

self.distanceString = self.formatDistance(distance)



// Auto-open URL on first detection

if !self.hasAutoOpened && frameType == "UID" {

self.hasAutoOpened = true

self.shouldOpenURL = true

}

}



// Reset detection after delay

DispatchQueue.main.asyncAfter(deadline: .now() + 5) {

if self.rssi == RSSI.intValue {

self.isDetected = false

self.statusText = "Scanning for Old Town Montgomery beacons..."

}

}

}

}
