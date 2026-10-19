# Namma Space — Project Plan

## Project Objective

Namma Space is an indoor 3D reconstruction and navigation platform. It allows users to capture indoor spaces using a smartphone, reconstruct the environment as a 3D model, and explore the space interactively through a web-based first-person viewer.

## Round 1 Goal

Deliver a working MVP that demonstrates the end-to-end pipeline:

1. Accept smartphone-captured indoor footage/images
2. Reconstruct the indoor space into a 3D model
3. Display the model in a web-based 3D viewer
4. Enable first-person free roaming within the reconstructed space

## Planned Pipeline

```
Smartphone indoor capture
  → Image/video preprocessing
    → 3D reconstruction (photogrammetry / NeRF / Gaussian Splatting)
      → 3D model export (.glb / .ply)
        → Web 3D viewer (Three.js / React Three Fiber)
          → First-person free roaming
```

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| **Part 1** | Project Setup & Scaffold | **Completed** |
| **Part 2** | Capture SOP & Dataset Preparation | **Completed** |
| **Part 3** | 3D Reconstruction Pipeline | **In progress** — pending real capture |
| **Part 4** | Web 3D Viewer & First-Person Roaming | **In progress** |
| **Part 5** | POI Labeling, Search & Selection | **Completed** (Round 2) |
| **Part 6** | Desktop Pathfinding & 3D Route Display | **Completed** (Round 2) |
| **Part 7** | Final Polish & Submission | **In progress** |

---

## Phases Breakdown

### Part 1 — Project Setup (Completed)
- [x] Repository and clean folder structure
- [x] Frontend scaffold (React + Vite + TypeScript)
- [x] Three.js, React Three Fiber, and Drei dependencies installed
- [x] Initial documentation and README
- [x] Verified frontend runs without errors

### Part 2 — Capture SOP & Dataset Preparation (Completed)
- [x] Establish standardized `sample_data/room_01` structure (`video/`, `images/`, `metadata/`)
- [x] Write practical indoor `CAPTURE_SOP.md` (environment, camera rules, route, quality guidelines)
- [x] Create `capture_metadata.json` template for user data entry
- [x] Provide room documentation and tracking checklist in `sample_data/room_01/README.md`
- [x] Create `DATASET_GUIDE.md` covering storage, naming conventions, and Git hygiene

### Part 3 — 3D Reconstruction Pipeline (Completed)
- [x] Inspect Python environment, libraries, and hardware capabilities
- [x] Establish `reconstruction/` folder layout (`scripts/`, `input/`, `frames/`, `output/`, `logs/`)
- [x] Create `reconstruction/requirements.txt` with OpenCV, NumPy, SciPy, Pillow, and Trimesh
- [x] Build `scripts/extract_frames.py` with configurable interval, resolution/FPS reporting, and blur filtering
- [x] Build `scripts/reconstruct.py` with feature matching, camera pose recovery, and web-ready GLB export
- [x] Create `reconstruction/config.json` configuration manifest
- [x] Document usage, commands, and troubleshooting in `reconstruction/README.md`
- [x] Generated `reconstruction/output/room_01.glb` and placed in `frontend/public/models/room_01.glb`

### Part 4 — Web 3D Viewer & First-Person Roaming (Completed)
- [x] Create `Scene.tsx` — React Three Fiber canvas with lighting, fog, and floor grid
- [x] Create `ModelViewer.tsx` — GLTF/GLB loader with auto-scale, positioning, and graceful missing/error states
- [x] Create `FirstPersonControls.tsx` — Pointer Lock API mouse look + WASD movement
- [x] Create `ViewerHUD.tsx` — Overlay with branding, state messages, and controls legend
- [x] Create `utils/collision.ts` — Movement boundary stub for future collision detection
- [x] Integrate viewer into App.tsx with landing page ↔ viewer navigation

### Part 5 — POI Labeling, Search & Selection (Completed — Round 2)
- [x] POI data model in `frontend/src/types/poi.ts` (`id, name, category, description, position, icon, floor`)
- [x] Sample POI dataset in `frontend/src/data/pois.ts` (9 realistic indoor landmarks tuned inside room bounds)
- [x] 3D markers in `frontend/src/components/POIMarkers.tsx` (glowing spheres, pulsing rings, hover badges, floor beams)
- [x] Sidebar UI in `frontend/src/components/POIPanel.tsx` & `POIPanel.css` (real-time fuzzy search, category filter chips, selection state, detail strip)
- [x] Camera observation transition ("Go To" POI) via cubic ease-out slerp/lerp in `Scene.tsx`

### Part 6 — Desktop Pathfinding & 3D Route Display (Completed — Round 2)
- [x] Navigation module in `frontend/src/navigation/`:
  - `navigationTypes.ts`: types for grid nodes, obstacles, and path results
  - `navigationData.ts`: 2D navigation grid config (0.25m resolution) & obstacle bounds
  - `navigationGraph.ts`: 2D floor grid, obstacle masking, 8-way connectivity with corner-cutting prevention
  - `pathfinding.ts`: A* engine with Min-Heap, Euclidean heuristic, line-of-sight smoothing, and metric distance
- [x] Player position exposure: `PlayerPositionTracker` extracts genuine `camera.position` from `FirstPersonControls`
- [x] 3D Visual Walking Path in `frontend/src/components/NavigationPath.tsx` (glowing cyan spline tube at Y = 0.08m, directional breadcrumbs, departure ring, arrival beacon)
- [x] Navigation UI in `POIPanel.tsx`:
  - `[ 🧭 Navigate ]` button on POI cards and detail strip
  - Active route card showing target name, metric distance, and waypoints count
  - `[ Clear Route ]` button to dismiss route
  - `[ ↻ Recalculate ]` button to update route from the player's updated position
- [x] Design Rationale: Navigation uses a manually configured 2D grid rather than automatic mesh extraction, ensuring reliable indoor navigation given the imperfect reconstruction.

### Part 7 — Final Polish & Submission (In progress)
- [x] Browser automated verification of all POI and pathfinding features
- [x] Full build verification (`npm run build`)
- [ ] Submission artifacts & demo video documentation
