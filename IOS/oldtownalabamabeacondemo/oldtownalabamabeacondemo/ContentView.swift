// ===================================
// FILE 1: ContentView.swift
// Location: YourAppName/ContentView.swift
// ===================================

import SwiftUI
import CoreBluetooth
import SafariServices

struct ContentView: View {
    @StateObject private var beaconDetector = EddystoneBeaconDetector()
    @State private var showingSafari = false
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Title
                Text("Eddystone Beacon Detector")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top, 50)
                
                // Status Icon
                Image(systemName: beaconDetector.isDetected ? "dot.radiowaves.left.and.right" : "antenna.radiowaves.left.and.right.slash")
                    .font(.system(size: 60))
                    .foregroundColor(beaconDetector.isDetected ? .green : .gray)
                    .symbolEffect(.pulse, isActive: beaconDetector.isDetected)
                
                // Status Text
                Text(beaconDetector.statusText)
                    .font(.title2)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                    .foregroundColor(beaconDetector.isDetected ? .green : .primary)
                
                // Beacon Info Card
                if beaconDetector.isDetected {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Label("Type", systemImage: "beacon")
                                .font(.headline)
                            Spacer()
                            Text(beaconDetector.beaconType)
                                .fontWeight(.medium)
                        }
                        
                        if !beaconDetector.namespace.isEmpty {
                            HStack {
                                Label("Namespace", systemImage: "number")
                                    .font(.headline)
                                Spacer()
                                Text(beaconDetector.namespace)
                                    .fontWeight(.medium)
                                    .font(.system(.caption, design: .monospaced))
                            }
                        }
                        
                        if !beaconDetector.instance.isEmpty {
                            HStack {
                                Label("Instance", systemImage: "tag")
                                    .font(.headline)
                                Spacer()
                                Text(beaconDetector.instance)
                                    .fontWeight(.medium)
                                    .font(.system(.caption, design: .monospaced))
                            }
                        }
                        
                        HStack {
                            Label("Signal", systemImage: "wifi")
                                .font(.headline)
                            Spacer()
                            Text("\(beaconDetector.rssi) dBm")
                                .fontWeight(.medium)
                        }
                        
                        HStack {
                            Label("Distance", systemImage: "ruler")
                                .font(.headline)
                            Spacer()
                            Text(beaconDetector.distanceString)
                                .fontWeight(.medium)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(15)
                    .shadow(radius: 5)
                    .padding(.horizontal)
                    .transition(.scale.combined(with: .opacity))
                }
                
                // Manual Open URL Button
                if beaconDetector.isDetected {
                    Button(action: {
                        showingSafari = true
                    }) {
                        Label("Open URL", systemImage: "safari")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: 200)
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer()
                
                // Permission Status
                if !beaconDetector.isBluetoothOn {
                    VStack(spacing: 10) {
                        Label("Bluetooth Required", systemImage: "bluetooth.slash")
                            .font(.headline)
                            .foregroundColor(.red)
                        
                        Text("Please enable Bluetooth in Settings")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Button("Open Settings") {
                            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(settingsUrl)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(15)
                    .shadow(radius: 5)
                    .padding(.horizontal)
                }
            }
        }
        .animation(.easeInOut, value: beaconDetector.isDetected)
        .sheet(isPresented: $showingSafari) {
            SafariView(url: URL(string: beaconDetector.targetURL)!)
        }
        .onChange(of: beaconDetector.shouldOpenURL) { _, newValue in
            if newValue {
                showingSafari = true
                beaconDetector.shouldOpenURL = false
            }
        }
    }
}

// Safari View Controller wrapper for SwiftUI
struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> SFSafariViewController {
        return SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

// ===================================
// INFO.PLIST CONFIGURATION
// Location: YourAppName/Info.plist
// ===================================

/*
 For Eddystone detection, you only need Bluetooth permissions:
 
 1. Click on your project in the navigator
 2. Select your app target
 3. Go to the "Info" tab
 4. Add these keys under "Custom iOS Target Properties":
 
 Key: NSBluetoothAlwaysUsageDescription
 Type: String
 Value: This app uses Bluetooth to detect nearby beacons
 
 Key: NSBluetoothPeripheralUsageDescription (for older iOS versions)
 Type: String
 Value: This app uses Bluetooth to detect nearby beacons
 
 That's it! Eddystone uses Bluetooth scanning, not location services like iBeacon.
 
 Alternative method - Add directly to Info.plist source:
 
 <key>NSBluetoothAlwaysUsageDescription</key>
 <string>This app uses Bluetooth to detect nearby beacons</string>
 <key>NSBluetoothPeripheralUsageDescription</key>
 <string>This app uses Bluetooth to detect nearby beacons</string>
 */

// ===================================
// CONFIGURING YOUR BLUECHARM BEACON
// ===================================

/*
 In your BlueCharm configuration app:
 
 1. Set Slot Type/Frame Type to: Eddystone-UID
 2. Configure:
    - Namespace: Any 10-byte hex value (20 characters)
      Example: EDD1EBEAC04E5DEFA017
    - Instance: Any 6-byte hex value (12 characters)
      Example: 000000000001
    - TX Power: -4 dBm (for better range)
    - Advertising Interval: 1000ms
 
 3. If you want to detect a SPECIFIC beacon:
    - Copy your Namespace and Instance values
    - Update them in EddystoneBeaconDetector.swift:
      let targetNamespace = "YOUR_NAMESPACE_HERE"
      let targetInstance = "YOUR_INSTANCE_HERE"
 
 4. If you want to detect ANY Eddystone beacon:
    - Leave targetNamespace and targetInstance as empty strings ""
 
 The app will now detect Eddystone-UID beacons instead of iBeacons!
 */
