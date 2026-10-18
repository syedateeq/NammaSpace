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
| **Part 5** | POI Labeling & Search | **Planned** |
| **Part 6** | Desktop Pathfinding | **Planned** |
| **Part 7** | Final Polish & Submission | **Planned** |

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

### Part 3 — 3D Reconstruction Pipeline (In progress — pending real capture)
- [x] Inspect Python environment, libraries, and hardware capabilities
- [x] Establish `reconstruction/` folder layout (`scripts/`, `input/`, `frames/`, `output/`, `logs/`)
- [x] Create `reconstruction/requirements.txt` with OpenCV, NumPy, SciPy, Pillow, and Trimesh
- [x] Build `scripts/extract_frames.py` with configurable interval, resolution/FPS reporting, and blur filtering
- [x] Build `scripts/reconstruct.py` with feature matching, camera pose recovery, and web-ready GLB export
- [x] Create `reconstruction/config.json` configuration manifest
- [x] Document usage, commands, and troubleshooting in `reconstruction/README.md`
- [ ] User places physical capture video in `sample_data/room_01/video/room_01_capture.mp4`
- [ ] Run end-to-end pipeline to generate `reconstruction/output/room_01.glb`

### Part 4 — Web 3D Viewer & First-Person Roaming (In progress)
- [x] Create `Scene.tsx` — React Three Fiber canvas with lighting, fog, and floor grid
- [x] Create `ModelViewer.tsx` — GLTF/GLB loader with auto-scale, positioning, and graceful missing/error states
- [x] Create `FirstPersonControls.tsx` — Pointer Lock API mouse look + WASD movement
- [x] Create `ViewerHUD.tsx` — Overlay with branding, state messages, and controls legend
- [x] Create `utils/collision.ts` — Movement boundary stub for future collision detection
- [x] Integrate viewer into App.tsx with landing page ↔ viewer navigation
- [x] Handle missing model state ("3D room model not available yet.")
- [ ] Place real `room_01.glb` in `frontend/public/models/` after reconstruction

---

## Future Phases

### Part 5 — POI Labeling & Search
- Add interactive Point-of-Interest markers in the 3D scene
- Implement room/item text search with camera fly-to
- Provide a searchable sidebar/panel

### Part 6 — Desktop Pathfinding
- Implement obstacle-aware navigation mesh
- A*/Dijkstra pathfinding between POIs
- Visual navigation path rendering in the 3D scene

### Part 7 — Final Polish & Submission
- End-to-end demo with real reconstructed room
- Performance optimization and UI polish
- Documentation, demo video, and submission package
