// Lightweight browser polyfills for Node-ish globals used by some deps
// Ensure these run before other imports (main.tsx imports this first).

// global → globalThis
if (typeof (globalThis as any).global === 'undefined') {
  ;(globalThis as any).global = globalThis
}

// Minimal process.env to satisfy libraries that probe it
if (typeof (globalThis as any).process === 'undefined') {
  ;(globalThis as any).process = { env: {} }
}

