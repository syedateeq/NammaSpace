# Dataset Guide — Namma Space

This guide explains how indoor capture data is organized, stored, and passed into the downstream reconstruction pipeline.

---

## 1. Directory Organization

All capture datasets reside inside the `sample_data/` directory, divided into room-specific folders:

```
sample_data/
└── room_01/
    ├── video/
    │   └── room_01_capture.mp4    # Raw continuous smartphone video
    ├── images/
    │   ├── frame_0001.jpg         # Extracted video frames or photo series
    │   ├── frame_0002.jpg
    │   └── ...
    ├── metadata/
    │   └── capture_metadata.json  # Room and capture specification metadata
    └── README.md                  # Room overview and status checklist
```

---

## 2. File Placement & Storage Locations

- **Raw Video Files (`sample_data/<room_id>/video/`)**:
  Place the original uncompressed video taken directly from your smartphone camera here.
  Format: `.mp4` or `.mov`.
- **Extracted Images (`sample_data/<room_id>/images/`)**:
  Place extracted frames (or sequential photos taken during capture) here.
  Format: `.jpg` or `.png`.
- **Metadata (`sample_data/<room_id>/metadata/`)**:
  Save `capture_metadata.json` populated with actual device, dimension, and capture settings.

---

## 3. Naming Conventions

To ensure automated ingestion into the reconstruction scripts, adhere strictly to the following standard:

- **Room Directory**: `room_01`, `room_02`, `room_03`, etc.
- **Primary Video**: `<room_id>_capture.mp4` (e.g. `room_01_capture.mp4`)
- **Extracted Frames**: `frame_%04d.jpg` (e.g. `frame_0001.jpg`, `frame_0002.jpg`)
- **Metadata Specification**: `capture_metadata.json`

---

## 4. Git & Large File Management

> ⚠️ **IMPORTANT: Do NOT commit large media files directly to Git.**

- Raw videos (`.mp4`, `.mov`) and high-resolution image sets quickly bloat git repository history.
- The root `.gitignore` is already configured to prevent committing large binary media and model outputs.
- Keep only `.gitkeep` or placeholder files in Git for empty folders.
- If sharing datasets across team members or storing remotely:
  - Use cloud drives (Google Drive, OneDrive) or Git LFS.
  - Store local copies strictly inside your local `sample_data/<room_id>/` folder.

---

## 5. Ingestion into Reconstruction Pipeline (Part 3 Preview)

In Phase 3, the Python reconstruction tooling will consume this dataset systematically:

1. **Input Stage**:
   - The reconstruction CLI will take `--dataset sample_data/room_01` as an argument.
2. **Preprocessing**:
   - If only video is provided, an extraction script will sample frames at a specified interval (e.g., 2–3 fps) into `images/`.
   - Blur detection filters will discard blurry transition frames.
3. **Reconstruction**:
   - Feature extraction and Structure-from-Motion (SfM) / NeRF / Gaussian Splatting will process `images/`.
4. **Export**:
   - Resulting mesh/point cloud (`.glb` or `.ply`) will be exported to `reconstruction/output/<room_id>/` for consumption by the Three.js web viewer.
