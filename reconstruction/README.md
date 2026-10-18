# 3D Reconstruction Pipeline — Namma Space

This module processes smartphone-captured indoor room video, extracts keyframes, performs multi-view Structure-from-Motion (SfM) geometry reconstruction, and exports web-ready 3D models (`.glb` / `.ply`) for the Three.js web viewer.

---

## 🔄 Pipeline Overview

```
Smartphone Indoor Video (room_01_capture.mp4)
  │
  ▼
[1] Frame Extraction (extract_frames.py)
  │   - Samples frames at configurable time intervals (e.g. 1 fps)
  │   - Applies Laplacian variance blur filtering
  │   - Generates sequential frames (frame_0001.jpg, ...)
  ▼
[2] Feature Extraction & Matching (reconstruct.py)
  │   - Detects salient features across consecutive frames (SIFT / ORB)
  │   - Computes robust matches using Lowe's ratio test
  ▼
[3] Camera Pose & Epipolar Geometry Estimation
  │   - Estimates Essential Matrix via RANSAC
  │   - Recovers relative rotation (R) and translation (t)
  ▼
[4] 3D Triangulation & Outlier Filtering
  │   - Triangulates matched points into 3D world space
  │   - Extracts corresponding RGB surface colors
  ▼
[5] Mesh Generation & Web-Ready Export
  │   - Constructs 3D geometry via Trimesh
  │   - Exports standard web-ready asset: reconstruction/output/room_01.glb
```

---

## 🛠 Prerequisites & Installation

### 1. Python Environment
Requires **Python 3.10+**.

Install required libraries:

```bash
cd NammaSpace/reconstruction
pip install -r requirements.txt
```

Core dependencies:
- `opencv-python`: Video capture decoding, frame extraction, SIFT/ORB feature matching, essential matrix calculation.
- `numpy`: Numerical linear algebra and coordinate transformations.
- `trimesh`: 3D geometry manipulation, point cloud generation, and `.glb` / `.ply` export.
- `Pillow`, `scipy`: Image utilities and scientific routines.

---

## 🚀 Usage Guide

### Step 1: Capture and Place Real Video
Follow [`docs/CAPTURE_SOP.md`](../docs/CAPTURE_SOP.md) to record your room continuously, then save it to:

```
sample_data/room_01/video/room_01_capture.mp4
```

### Step 2: Extract Frames
Run the frame extraction script:

```bash
python scripts/extract_frames.py --input ../sample_data/room_01/video/room_01_capture.mp4 --interval 1.0
```

This will:
- Read video resolution, FPS, duration, and frame count.
- Filter out blurry frames.
- Output extracted frames to `reconstruction/frames/frame_XXXX.jpg`.
- Save an analysis report to `reconstruction/logs/capture_report.json`.

### Step 3: Run 3D Reconstruction
Run the reconstruction pipeline:

```bash
python scripts/reconstruct.py --frames-dir ./frames --output-dir ./output --format glb
```

### Step 4: Locate the Output Model
The reconstructed model will be generated at:

```
reconstruction/output/room_01.glb
```

*(If converted to point cloud format, `reconstruction/output/room_01.ply` is generated).*

---

## ⚙️ Configuration (`config.json`)

Settings can be customized inside `reconstruction/config.json`:

```json
{
  "room_id": "room_01",
  "input_video": "../sample_data/room_01/video/room_01_capture.mp4",
  "frame_directory": "./frames",
  "output_directory": "./output",
  "target_format": "glb"
}
```

---

## ⚠️ Troubleshooting & Common Issues

| Problem | Cause | Solution |
|---|---|---|
| **`No capture frames found`** | Extraction has not run or no real capture exists | Record room per `docs/CAPTURE_SOP.md` and run `extract_frames.py`. |
| **`Insufficient matched 3D points`** | Too fast movement or camera turned too rapidly | Maintain 60–70% overlap between views; walk slower (~0.5 m/s). |
| **Blurry frames rejected** | Quick head/phone motion during capture | Keep phone steady with two hands; lower walk speed. |
| **Reconstruction failure at white walls** | Textureless, featureless uniform surfaces | Capture wall sections that include paintings, switches, door frames, or furniture. |
| **Reflective surfaces / mirrors distorting** | Reflections break epipolar geometry assumptions | Capture mirrors and large glass at oblique angles, not head-on. |
| **`trimesh` not found** | Dependency missing | Run `pip install trimesh`. |
| **High CPU usage / slow execution** | Large number of frames or 4K video resolution | Increase extraction interval (e.g. `--interval 2.0`) to process fewer frames. |
