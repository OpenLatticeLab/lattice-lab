# Lattice Lab

Single‑page app for visualizing crystal structures and metadata.

- React 18 + TypeScript + Vite + Material UI
- Renders 3D scenes from JSON using `@materialsproject/mp-react-components`
- Two input modes: Prompt or CIF upload (≤10MB)
- Loading and error handling with MUI components

## Quick Start

Prerequisites:
- Node.js 18+ and npm

Install dependencies:
- `npm install`

Start dev server:
- `npm run dev`
- Opens on an available port (e.g., `http://localhost:5175`)

Build for production:
- `npm run build`

Preview the production build:
- `npm run preview` (serves `dist` at `http://localhost:4173`)

## Configuration

- `VITE_API_URL` (default: `http://localhost:8000`)
  - Configure in an `.env` file or environment for the Vite dev server/build.
  - Local: set in `.env.local` (already added)
  - Production: set in `.env.production` (edit with your API URL)
  - After changing env files, restart dev server.

## API Contracts

Types used by the UI:

```
export type SceneResponse = {
  scene: any;
  formula: string;
  lattice: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    volume: number;
  };
  n_sites: number;
  source: 'upload' | 'prompt';
};
```

Endpoints:
- Upload: `POST {VITE_API_URL}/api/scene`
  - multipart/form-data with field `file` (CIF, ≤10MB)
  - Response: `SceneResponse` with `source: "upload"`

- Prompt: `POST {VITE_API_URL}/api/prompt-structure`
  - JSON body: `{ "prompt": string }`
  - `501` or `404` indicates not implemented; UI shows: `Prompt generation not available yet`
  - Response: `SceneResponse` with `source: "prompt"`

## Features

- App bar and page title: `Lattice Lab`
- Left panel: Toggle between Prompt and Upload
  - Prompt: Multiline `TextField` with placeholder `Describe the crystal you want…`, `Generate` button
  - Upload: Drag & drop or select `.cif` (≤10MB), `Upload & Render` button
- Right panel:
  - Fixed-height viewer (~560px) that consumes Scene JSON directly via `CrystalToolkitScene`
  - Metadata card showing: Formula, Number of sites, Lattice parameters (a, b, c, α, β, γ, volume), Source
- Validation: Only `.cif` accepted; files over 10MB are blocked with an error `Alert`
- Loading: `LinearProgress` shown during API calls
- Errors: Surface API or validation issues via `Alert`

## Project Structure

- `src/App.tsx`: Layout, UI logic, and state management
- `src/api.ts`: API helpers (`uploadCif`, `generateFromPrompt`), defaulting `VITE_API_URL`
- `src/types.ts`: `SceneResponse` type definition
- `src/types/mp-react-components.d.ts`: Minimal type declaration for the scene viewer component
- `src/main.tsx`, `index.html`, `vite.config.ts`: App bootstrap and tooling

## Notes

- The 3D viewer expects the `scene` field to be a Crystal Toolkit Scene JSON object. If your backend differs, adapt the mapping before passing to `CrystalToolkitScene`.
- If prompt generation is not implemented, the UI will show a friendly message and not fail the app.
- To test backend connectivity, set `VITE_API_URL` and verify both endpoints return the expected JSON.
