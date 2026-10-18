# Indoor Capture — Standard Operating Procedure

This document defines the standard procedure for capturing an indoor room using a smartphone, producing data suitable for 3D reconstruction.

---

## A. Environment Preparation

Before recording, prepare the room:

1. **Remove unnecessary moving objects** — pick up loose items on the floor, close laptop lids, remove anything that might shift during capture.
2. **Keep lighting reasonably consistent** — turn on all fixed room lights, avoid relying on a single harsh light source. Close curtains if sunlight is creating strong moving shadows.
3. **Keep important furniture and obstacles visible** — chairs, tables, shelves, and other permanent fixtures should remain in place. These provide geometric features the reconstruction algorithm needs.
4. **Avoid people moving through the scene** — no one should walk through the room during capture. Moving subjects cause reconstruction artifacts.
5. **Close doors to a fixed position** — doors should either be fully open or fully closed, not mid-swing.

> **Tip**: Spend 2–3 minutes tidying the room before you start recording. It significantly improves reconstruction quality.

---

## B. Camera Requirements

| Setting | Recommendation |
|---------|---------------|
| **Device** | Any modern smartphone (2020 or newer recommended) |
| **Resolution** | Highest practical resolution — 1080p minimum, 4K preferred |
| **Frame rate** | 30 fps is sufficient; 60 fps is acceptable |
| **Orientation** | **Landscape (horizontal)** — keep consistent throughout |
| **Zoom** | **Do not zoom** — use the default wide-angle lens |
| **Flash** | **Off** — flash creates inconsistent lighting between frames |
| **Stabilization** | Enable built-in video stabilization if available |
| **Focus** | Auto-focus is fine; avoid manual focus changes mid-recording |
| **Exposure** | Lock exposure if your camera app supports it, to avoid brightness flickering |

### Camera Handling
- Hold the phone at approximately **chest height** (~1.2 m from the floor).
- Keep both hands on the phone for stability.
- Walk smoothly — pretend you are carrying a glass of water.
- **Do not rotate the phone** between portrait and landscape during capture.

---

## C. Capture Path

Follow this route for a single continuous video capture:

```
     ┌──────────────────────────────┐
     │                              │
     │   6. Window ──── 5. Corner   │
     │       │                │     │
     │       │                │     │
     │   4. Wall          4. Wall   │
     │       │                │     │
     │       │                │     │
     │   5. Corner ──── 5. Corner   │
     │                              │
     │          7. Furniture        │
     │                              │
     └────────── 1. Door ───────────┘
               START / END
```

### Step-by-step

| Step | Action | Duration |
|------|--------|----------|
| **1** | Stand at the room entrance. Start recording. Film the entrance/door for 3–5 seconds. | 5 sec |
| **2** | Slowly turn to face into the room. Pause briefly to capture the overview. | 3 sec |
| **3** | Begin walking **clockwise** (or counter-clockwise — be consistent) along the room perimeter. Move at a **slow, steady walking pace**. | — |
| **4** | Face each wall as you pass it. Keep the wall surface visible for at least 3–5 seconds. | 5 sec/wall |
| **5** | At each **corner**, pause briefly and pan the camera slightly to capture where the two walls meet. | 3 sec/corner |
| **6** | When passing **doors and windows**, pause to capture the frame and surrounding wall clearly. | 3–5 sec each |
| **7** | After completing the perimeter, walk toward the **center** of the room. Slowly turn 360° to capture major furniture and obstacles from a central viewpoint. | 10–15 sec |
| **8** | Walk back toward the starting position (entrance). | — |
| **9** | Stop recording once you are near the entrance. | — |

### Estimated total recording time: **1–3 minutes** for a typical room.

---

## D. Capture Quality Rules

These rules maximize the chance of successful 3D reconstruction:

### ✅ Do
- **Move slowly** — 0.5 m/s or slower. Normal slow walking pace.
- **Keep surfaces visible** — every wall, floor edge, and obstacle should appear in multiple frames.
- **Maintain overlap** — consecutive views should share at least **60–70%** of the scene. This gives the algorithm matching points.
- **Cover the entire room** — don't skip corners, alcoves, or behind furniture.
- **Keep the camera pointed at surfaces** — avoid pointing at blank ceilings or featureless areas for long periods.
- **Use natural walking paths** — smooth, predictable motion helps reconstruction.

### ❌ Don't
- **Don't move fast** — rapid motion causes motion blur and frame misalignment.
- **Don't rotate suddenly** — sharp turns lose tracking. Turn slowly.
- **Don't shake the camera** — keep your arms and body steady.
- **Don't capture very dark areas** without additional lighting — dark regions produce noisy, unusable frames.
- **Don't film mirrors or highly reflective surfaces head-on** — reflections confuse feature matching. Capture them at an angle if possible.
- **Don't stop and restart recording** — one continuous video is preferred.

### Quality Checklist (post-capture)

- [ ] Video is one continuous recording (no cuts)
- [ ] No significant motion blur visible
- [ ] All four walls are captured
- [ ] All corners are captured
- [ ] Doors and windows are captured
- [ ] Major furniture is visible from at least two angles
- [ ] Lighting is consistent throughout
- [ ] No people appear in the footage
- [ ] Video is in landscape orientation throughout

---

## E. Recommended First Dataset

The first test dataset should be placed in:

```
sample_data/room_01/
```

### What to include

| Directory | Contents |
|-----------|----------|
| `video/` | **One continuous video** of the room capture (e.g., `room_01_capture.mp4`) |
| `images/` | **Optional** — extracted image frames from the video (e.g., one frame every 1–2 seconds) |
| `metadata/` | `capture_metadata.json` — fill in room dimensions, device info, and capture settings |

### Naming convention

- Video: `room_01_capture.mp4` (or `.mov`)
- Images: `frame_0001.jpg`, `frame_0002.jpg`, ... (sequential numbering)
- Metadata: `capture_metadata.json` (already provided as a template)

### After capture

1. Transfer the video from your phone to `sample_data/room_01/video/`.
2. Open `sample_data/room_01/metadata/capture_metadata.json` and fill in the fields.
3. Update the checklist in `sample_data/room_01/README.md`.
4. Optionally extract frames into `sample_data/room_01/images/` (a script for this will be provided in Part 3).

---

## Appendix: Troubleshooting

| Problem | Solution |
|---------|----------|
| Video is too dark | Add more room lighting; open curtains; use a desk lamp |
| Motion blur in frames | Slow down your walking speed |
| Reconstruction fails at a corner | Re-capture that corner with slower movement and more overlap |
| Video file is too large to commit | See `docs/DATASET_GUIDE.md` for Git LFS guidance |
| Phone overheats during capture | Lower resolution to 1080p; take a short break before recording |
