// ===================================
// FILE: ContentView.swift
// Location: YourAppName/ContentView.swift
// Corrected to work with multiple beacon URLs
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
                            Label("Type", systemImage: "beacon.max")
                                .font(.headline)
                            Spacer()
                            Text(beaconDetector.beaconType)
                                .fontWeight(.medium)
                        }
                        
                        if !beaconDetector.namespace.isEmpty && beaconDetector.namespace != "N/A" {
                            HStack {
                                Label("Namespace", systemImage: "number")
                                    .font(.headline)
                                Spacer()
                                Text(beaconDetector.namespace)
                                    .fontWeight(.medium)
                                    .font(.system(.caption, design: .monospaced))
                                    .lineLimit(1)
                                    .truncationMode(.middle)
                            }
                        }
                        
                        if !beaconDetector.instance.isEmpty && beaconDetector.instance != "N/A" {
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
                        if beaconDetector.detectedURL != nil {
                            showingSafari = true
                        }
                    }) {
                        Label("Open Exhibit Info", systemImage: "safari")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: 250)
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                    .disabled(beaconDetector.detectedURL == nil) // Disable button if no URL is available
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer()
                
                // Permission Status
                if !beaconDetector.isBluetoothOn {
                    VStack(spacing: 10) {
                        Label("Bluetooth Required", systemImage: "bluetooth.slash")
                            .font(.headline)
                            .foregroundColor(.red)
                        
                        Text("Please enable Bluetooth in Settings to find nearby exhibits.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
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
            // Safely unwrap the detectedURL from the beacon detector
            if let url = beaconDetector.detectedURL {
                SafariView(url: url)
            }
        }
        .onChange(of: beaconDetector.shouldOpenURL) { _, newValue in
            if newValue {
                // Ensure a URL has been detected before triggering the sheet
                if beaconDetector.detectedURL != nil {
                    showingSafari = true
                }
                // Reset the trigger flag in the detector
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
