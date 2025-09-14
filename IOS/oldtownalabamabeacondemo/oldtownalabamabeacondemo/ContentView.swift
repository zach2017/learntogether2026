import SwiftUI
import CoreBluetooth
import SafariServices

struct ContentView: View {
    @StateObject private var beaconDetector = EddystoneBeaconDetector()
    @State private var showingSafari = false
    
    var body: some View {
        ZStack {
            // Natural gradient background - warm earth tones
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.96, green: 0.93, blue: 0.88), // Warm beige
                    Color(red: 0.85, green: 0.82, blue: 0.75), // Light tan
                    Color(red: 0.92, green: 0.88, blue: 0.82)  // Soft sand
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 25) {
                // Title Banner
                VStack(spacing: 8) {
                    Text("Old Town Montgomery")
                        .font(.system(size: 32, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.2, green: 0.15, blue: 0.1))
                    
                    Text("TOUR BEACONS")
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .tracking(3)
                        .foregroundColor(Color(red: 0.4, green: 0.3, blue: 0.2))
                    
                    // Decorative line
                    Rectangle()
                        .fill(Color(red: 0.6, green: 0.4, blue: 0.2))
                        .frame(width: 100, height: 2)
                        .padding(.top, 5)
                }
                .padding(.top, 40)
                .padding(.bottom, 10)
                
                // Walking Tour Tagline
                HStack(spacing: 8) {
                    Image(systemName: "figure.walk")
                        .font(.system(size: 20))
                    Text("Take Our Walking Tour")
                        .font(.system(size: 18, weight: .medium, design: .serif))
                        .italic()
                    Image(systemName: "building.columns")
                        .font(.system(size: 20))
                }
                .foregroundColor(Color(red: 0.3, green: 0.25, blue: 0.2))
                .padding(.horizontal)
                
                // Status Icon with Historic Touch
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.9))
                        .frame(width: 120, height: 120)
                        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                    
                    Image(systemName: beaconDetector.isDetected ? "location.north.fill" : "location.slash")
                        .font(.system(size: 50))
                        .foregroundColor(beaconDetector.isDetected ?
                            Color(red: 0.2, green: 0.5, blue: 0.3) : // Forest green
                            Color(red: 0.6, green: 0.5, blue: 0.4))  // Muted brown
                        .symbolEffect(.pulse, isActive: beaconDetector.isDetected)
                }
                .padding(.vertical, 10)
                
                // Status Text with Historic Feel
                VStack(spacing: 5) {
                    Text(beaconDetector.isDetected ? "Historic Site Detected!" : "Searching for Historic Sites...")
                        .font(.system(size: 20, weight: .semibold, design: .serif))
                        .multilineTextAlignment(.center)
                        .foregroundColor(beaconDetector.isDetected ?
                            Color(red: 0.2, green: 0.5, blue: 0.3) :
                            Color(red: 0.4, green: 0.35, blue: 0.3))
                    
                    if !beaconDetector.isDetected {
                        Text("Walk near a historic marker to learn more")
                            .font(.system(size: 14, design: .serif))
                            .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.35))
                            .italic()
                    }
                }
                .padding(.horizontal)
                
                // Beacon Info Card with Vintage Style
                if beaconDetector.isDetected {
                    VStack(alignment: .leading, spacing: 12) {
                        // Header
                        HStack {
                            Image(systemName: "building.columns.fill")
                                .font(.title2)
                                .foregroundColor(Color(red: 0.6, green: 0.4, blue: 0.2))
                            Text("Site Information")
                                .font(.system(size: 18, weight: .bold, design: .serif))
                                .foregroundColor(Color(red: 0.3, green: 0.25, blue: 0.2))
                            Spacer()
                        }
                        .padding(.bottom, 5)
                        
                        Divider()
                            .background(Color(red: 0.6, green: 0.4, blue: 0.2).opacity(0.3))
                        
                        // Beacon Details
                        VStack(alignment: .leading, spacing: 10) {
                            DetailRow(icon: "mappin.circle", label: "Location ID", value: beaconDetector.beaconType)
                            
                            if !beaconDetector.namespace.isEmpty && beaconDetector.namespace != "N/A" {
                                DetailRow(icon: "number.circle", label: "Site Code", value: String(beaconDetector.namespace.prefix(12)) + "...")
                            }
                            
                            DetailRow(icon: "antenna.radiowaves.left.and.right", label: "Signal", value: "\(beaconDetector.rssi) dBm")
                            
                            DetailRow(icon: "location.circle", label: "Distance", value: beaconDetector.distanceString)
                        }
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.white.opacity(0.95))
                            .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                    )
                    .padding(.horizontal)
                    .transition(.scale.combined(with: .opacity))
                }
                
                // Historic-styled CTA Button
                if beaconDetector.isDetected {
                    Button(action: {
                        if beaconDetector.detectedURL != nil {
                            showingSafari = true
                        }
                    }) {
                        VStack(spacing: 8) {
                            HStack {
                                Image(systemName: "book.fill")
                                Text("Explore Historic Site")
                                    .font(.system(size: 18, weight: .semibold, design: .serif))
                                Image(systemName: "arrow.right")
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 30)
                            .padding(.vertical, 15)
                            .background(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 0.5, green: 0.3, blue: 0.15),
                                        Color(red: 0.6, green: 0.4, blue: 0.2)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(25)
                            .shadow(color: Color.black.opacity(0.2), radius: 5, x: 0, y: 3)
                            
                            Text("Learn about this location's history")
                                .font(.system(size: 12, design: .serif))
                                .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.35))
                                .italic()
                        }
                    }
                    .disabled(beaconDetector.detectedURL == nil)
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer()
                
                // Bluetooth Status with Vintage Style
                if !beaconDetector.isBluetoothOn {
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(Color(red: 0.7, green: 0.4, blue: 0.2))
                            Text("Bluetooth Required")
                                .font(.system(size: 16, weight: .bold, design: .serif))
                                .foregroundColor(Color(red: 0.4, green: 0.3, blue: 0.2))
                        }
                        
                        Text("Enable Bluetooth to discover nearby historic sites on your walking tour.")
                            .font(.system(size: 14, design: .serif))
                            .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.35))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        
                        Button("Open Settings") {
                            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(settingsUrl)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Color(red: 0.6, green: 0.4, blue: 0.2))
                        .foregroundColor(.white)
                        .cornerRadius(20)
                        .font(.system(size: 14, weight: .semibold, design: .serif))
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.white.opacity(0.95))
                            .overlay(
                                RoundedRectangle(cornerRadius: 15)
                                    .stroke(Color(red: 0.7, green: 0.4, blue: 0.2), lineWidth: 2)
                            )
                    )
                    .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 3)
                    .padding(.horizontal)
                }
                
                // Footer with tour branding
                Text("Old Town Montgomery • Alabama")
                    .font(.system(size: 12, design: .serif))
                    .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.35))
                    .padding(.bottom, 20)
            }
        }
        .animation(.easeInOut, value: beaconDetector.isDetected)
        .sheet(isPresented: $showingSafari) {
            if let url = beaconDetector.detectedURL {
                SafariView(url: url)
            }
        }
        .onChange(of: beaconDetector.shouldOpenURL) { _, newValue in
            if newValue {
                if beaconDetector.detectedURL != nil {
                    showingSafari = true
                }
                beaconDetector.shouldOpenURL = false
            }
        }
    }
}

// Detail Row Component for Historic Theme
struct DetailRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(Color(red: 0.6, green: 0.4, blue: 0.2))
                .frame(width: 20)
            
            Text(label)
                .font(.system(size: 14, design: .serif))
                .foregroundColor(Color(red: 0.5, green: 0.4, blue: 0.35))
            
            Spacer()
            
            Text(value)
                .font(.system(size: 14, weight: .medium, design: .serif))
                .foregroundColor(Color(red: 0.3, green: 0.25, blue: 0.2))
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
