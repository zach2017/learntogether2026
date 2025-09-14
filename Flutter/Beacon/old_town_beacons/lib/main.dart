import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'eddystone_scanner.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const OldTownApp());
}

class OldTownApp extends StatelessWidget {
  const OldTownApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Old Town Montgomery • Beacons',
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF8C673A),
        useMaterial3: true,
        fontFamily: 'Georgia',
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final scanner = EddystoneScanner();
  Uri? activeUrl;

  @override
  void initState() {
    super.initState();
    scanner.addListener(_onUpdate);
    scanner.start();
  }

  @override
  void dispose() {
    scanner.removeListener(_onUpdate);
    scanner.disposeScanner();
    super.dispose();
  }

  void _onUpdate() {
    // Auto-open once when scanner shouldOpenURL flips true
    if (scanner.shouldOpenURL && scanner.detectedURL != null) {
      scanner.shouldOpenURL = false;
      setState(() => activeUrl = scanner.detectedURL);
    } else {
      setState(() {}); // refresh UI
    }
  }

  @override
  Widget build(BuildContext context) {
    if (activeUrl != null) {
      return WebViewPage(
        url: activeUrl!,
        onBack: () => setState(() => activeUrl = null),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color.fromARGB(255, 245, 238, 225), // warm beige
              Color.fromARGB(255, 217, 210, 191), // light tan
              Color.fromARGB(255, 235, 225, 209), // soft sand
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 24),
              _TitleBanner(),
              const SizedBox(height: 8),
              _SubtitleRow(),
              const SizedBox(height: 16),
              _PulseBadge(isDetected: scanner.isDetected),
              const SizedBox(height: 8),
              _StatusText(isDetected: scanner.isDetected),
              const SizedBox(height: 8),
              if (scanner.isDetected) _InfoCard(instance: scanner.instance),
              const Spacer(),
              if (scanner.isDetected && scanner.detectedURL != null)
                _ExploreButton(
                  onTap: () => setState(() => activeUrl = scanner.detectedURL),
                ),
              const SizedBox(height: 16),
              if (!scanner.isBluetoothOn) _BluetoothWarning(),
              const SizedBox(height: 16),
              const Text(
                "Old Town Montgomery • Alabama",
                style: TextStyle(
                  fontSize: 12,
                  color: Color.fromARGB(255, 108, 94, 84),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

// --- UI widgets (styled to echo your Swift look & feel) ---

class _TitleBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text(
          "Old Town Montgomery",
          style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          "TOUR BEACONS",
          style: TextStyle(
            fontSize: 18,
            letterSpacing: 3,
            color: Colors.brown.shade700,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        Container(width: 100, height: 2, color: const Color(0xFF8C673A)),
      ],
    );
  }
}

class _SubtitleRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final color = const Color(0xFF57483C);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.directions_walk, color: color),
        const SizedBox(width: 6),
        Text(
          "Take Our Walking Tour",
          style: TextStyle(
            fontSize: 18,
            fontStyle: FontStyle.italic,
            color: color,
          ),
        ),
        const SizedBox(width: 6),
        Icon(Icons.account_balance, color: color),
      ],
    );
  }
}

class _PulseBadge extends StatefulWidget {
  final bool isDetected;
  const _PulseBadge({required this.isDetected});
  @override
  State<_PulseBadge> createState() => _PulseBadgeState();
}

class _PulseBadgeState extends State<_PulseBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
    lowerBound: 0.9,
    upperBound: 1.05,
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color =
        widget.isDetected ? const Color(0xFF347F4D) : const Color(0xFF9B8877);
    final icon = widget.isDetected ? Icons.explore : Icons.location_off;
    return ScaleTransition(
      scale: _c,
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.9),
          shape: BoxShape.circle,
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: Icon(icon, size: 54, color: color),
      ),
    );
  }
}

class _StatusText extends StatelessWidget {
  final bool isDetected;
  const _StatusText({required this.isDetected});
  @override
  Widget build(BuildContext context) {
    final color =
        isDetected ? const Color(0xFF347F4D) : const Color(0xFF6A5D51);
    return Column(
      children: [
        Text(
          isDetected
              ? "Historic Site Detected!"
              : "Searching for Historic Sites...",
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
        if (!isDetected)
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Text(
              "Walk near a historic marker to learn more",
              style: TextStyle(
                fontSize: 14,
                fontStyle: FontStyle.italic,
                color: Color(0xFF8A7868),
              ),
            ),
          ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String instance;
  const _InfoCard({required this.instance});

  @override
  Widget build(BuildContext context) {
    String value;
    switch (instance) {
      case "000000000004":
        value = "Shotgun House";
        break;
      case "000000000001":
        value = "Pole Barn";
        break;
      default:
        value = "Unknown";
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.95),
          borderRadius: BorderRadius.circular(15),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.account_balance,
              color: const Color(0xFF8C673A),
              size: 24,
            ),
            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              children: [
                const SizedBox(
                  width: 20,
                  child: Icon(
                    Icons.location_pin,
                    size: 18,
                    color: Color(0xFF8C673A),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  "Location",
                  style: TextStyle(fontSize: 14, color: Color(0xFF8A7868)),
                ),
                const Spacer(),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF4D4138),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ExploreButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ExploreButton({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF7C5330), Color(0xFF8C673A)],
              ),
              borderRadius: BorderRadius.circular(25),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 5,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.menu_book, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  "Explore Historic Site",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(width: 8),
                Icon(Icons.arrow_right_alt, color: Colors.white),
              ],
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "Learn about this location's history",
            style: TextStyle(
              fontSize: 12,
              fontStyle: FontStyle.italic,
              color: Color(0xFF8A7868),
            ),
          ),
        ],
      ),
    );
  }
}

class _BluetoothWarning extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(.95),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFB17845), width: 2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 5,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: const Column(
          children: [
            Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Color(0xFFB17845)),
                SizedBox(width: 8),
                Text(
                  "Bluetooth Required",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF6E5543),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              "Enable Bluetooth to discover nearby historic sites on your walking tour.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF8A7868)),
            ),
          ],
        ),
      ),
    );
  }
}

// WebView screen with Back header
class WebViewPage extends StatefulWidget {
  final Uri url;
  final VoidCallback onBack;
  const WebViewPage({super.key, required this.url, required this.onBack});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller =
        WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..loadRequest(widget.url);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Container(
            color: Colors.white.withOpacity(.8),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: widget.onBack,
                  ),
                  const Text(
                    "Back to Tour",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF7C5330),
                    ),
                  ),
                  const Spacer(),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(child: WebViewWidget(controller: _controller)),
        ],
      ),
    );
  }
}
