# Best Practices for Vite Configuration

Vite is designed to be fast and lean, with sensible defaults that minimize configuration needs. However, when customizing, following best practices ensures maintainability, performance, and security. Below are key recommendations based on official Vite documentation and community standards (as of 2025). These draw from experiences with React, PWAs, and TypeScript projects like the TMED app.

## General Best Practices
- **Keep Configuration Minimal**: Start with defaults and only override what's necessary. Over-configuring can lead to maintenance issues. For example, avoid setting `root` unless in a monorepo.
- **Use TypeScript for Config**: Write `vite.config.ts` for better type safety with `defineConfig`. This catches errors early.
- **Modularize Plugins**: Group related plugins (e.g., PWA setup) into constants or separate files for readability, especially in larger projects.
- **Environment Variables**: Prefix custom vars with `VITE_` (e.g., `VITE_API_URL`). Access via `import.meta.env.VITE_API_URL`. Use `.env` files for dev/prod modes, and avoid committing sensitive data—use secrets managers for production.
- **Path Aliases**: Prefer Vite's `resolve.alias` over external plugins if possible, but `vite-tsconfig-paths` is fine for TS integration. This reduces import clutter.
- **Performance Optimization**:
  - Set `build.target: 'es2022'` for modern browsers to reduce bundle size.
  - Enable `build.sourcemap: true` in dev/debug, but disable in production for smaller bundles.
  - Use `build.rollupOptions` for manual chunking if dealing with large vendors (e.g., split React).
  - Limit polyfills to essentials to avoid bloating the bundle.
- **Security Considerations**:
  - Enable HTTPS in dev with `server.https: true` if testing secure features.
  - For PWAs, ensure manifests use HTTPS icons and validate with tools like Lighthouse.
  - Avoid inline scripts/styles in production; Vite handles CSP via plugins if needed.
- **PWA-Specific Tips** (Relevant to TMED):
  - Use 'injectManifest' for custom service workers to add offline logic.
  - Set reasonable cache limits (e.g., 5MB as in the config) to prevent storage bloat.
  - Test offline mode early; use devOptions for local debugging.
  - Include multiple icon sizes/formats for cross-device compatibility.
- **Testing and Debugging**:
  - Use `vite preview` for production-like testing.
  - Integrate with Vitest for unit tests via the same config.
  - Log config with `vite --debug` during issues.
- **Version Control and Upgrades**: Pin plugin versions in `package.json`. Regularly update Vite/plugins to leverage performance improvements (e.g., SWC for React).
- **Common Pitfalls to Avoid**:
  - Don't mix ESM and CJS in plugins; Vite is ESM-first.
  - For React, use SWC plugin for speed over Babel unless needing custom transforms.
  - In PWAs, handle manual SW registration to avoid conflicts.
  - Test cross-browser; polyfills like node-polyfills should be minimal.

## Example Vite Config with Best Practices Applied

Below is an improved example `vite.config.ts` based on the original TMED config. It incorporates best practices: TypeScript typing, minimal overrides, optimized build settings, environment handling, and enhanced PWA security/performance. Explanations are inline as comments, with code snippets for clarity.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// Modularize PWA config for readability and reusability
const pwaOptions: Partial<VitePWAOptions> = {
  srcDir: 'src',
  filename: 'service-worker.ts',
  strategies: 'injectManifest', // Best for custom SW logic (e.g., advanced caching or push notifications)
  injectRegister: false, // Handle registration manually in app code for control
  registerType: 'prompt', // User-friendly update prompts
  workbox: {
    globPatterns: ['**/*'], // Cache all assets for offline support
    maximumFileSizeToCacheInBytes: 5_000_000, // Prevent caching oversized files
    sourcemap: process.env.NODE_ENV !== 'production', // Sourcemaps only in non-prod for debugging
  },
  includeAssets: ['**/*'],
  includeManifestIcons: true,
  injectManifest: { maximumFileSizeToCacheInBytes: 5_000_000 },
  devOptions: { enabled: true, type: 'module' }, // Enable dev testing
  manifestFilename: 'manifest.webmanifest',
  manifest: {
    id: '/',
    short_name: 'TMED',
    name: 'Tactical Medical Emergency Documentation',
    icons: [
      // Best practice: Provide multiple sizes/formats for better device support
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: 'TMED_Shield.ico', sizes: '64x64', type: 'image/x-icon' },
      { src: 'TMED_Shield.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      // Added: PNG fallbacks for older devices
      { src: 'TMED_Shield-192.png', type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
      { src: 'TMED_Shield-512.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
    ],
    start_url: '.', // Relative for flexibility
    display: 'standalone', // Native-like experience
    theme_color: '#000000',
    background_color: '#ffffff',
    // Added: For better PWA installability and SEO
    description: 'App for tactical medical emergency documentation',
    orientation: 'portrait', // Suits mobile-first apps
    screenshots: [ // Enhances install prompts on Android
      {
        src: 'screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'TMED in action',
      },
      {
        src: 'screenshot-narrow.png',
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'TMED mobile view',
      },
    ],
  },
};

export default defineConfig({
  // Best practice: No 'appType' as it's not standard; Vite infers SPA
  root: './', // Explicit for clarity, but default is fine
  build: {
    outDir: './build', // Custom output dir
    target: 'es2022', // Modern target for smaller bundles (assumes recent browsers)
    sourcemap: process.env.NODE_ENV !== 'production', // Conditional sourcemaps
    // Added: Optimize chunking for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Split large vendors
        },
      },
    },
  },
  plugins: [
    react(), // Fast React support with SWC
    nodePolyfills({ include: ['buffer'] }), // Minimal polyfills only
    VitePWA(pwaOptions), // Modular PWA setup
    tsconfigPaths({ loose: true }), // Alias support
    svgr(), // SVG as React components
  ],
  server: {
    port: 3000,
    // Added: HTTPS for secure dev (generate self-signed cert if needed)
    https: process.env.NODE_ENV === 'development' && process.env.VITE_HTTPS === 'true',
  },
  preview: {
    port: 3000,
  },
  // Added: Resolve aliases directly in Vite (backup to tsconfigPaths)
  resolve: {
    alias: {
      '@': '/src', // Example alias; sync with tsconfig.json
    },
  },
  // Added: Env prefix for custom variables
  envPrefix: 'VITE_',
});
```

### Why This Example Incorporates Best Practices
- **Minimal and Readable**: Only essential overrides; PWA options are extracted for clarity.
- **Performance Tweaks**: Modern build target, conditional sourcemaps, and vendor chunking reduce bundle size and load times.
- **PWA Enhancements**: Added PNG icons, descriptions, orientation, and screenshots for better installability and cross-platform support.
- **Security/Dev Improvements**: Optional HTTPS in dev, manual SW registration.
- **Flexibility**: Uses environment checks (e.g., via `process.env`) for mode-specific behavior.

This config can be dropped into a project with `npm install` for the plugins. Test with `vite` for dev, `vite build` for production, and audit with Lighthouse for PWA compliance. For more, check Vite's official docs.