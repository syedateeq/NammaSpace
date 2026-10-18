# Room 01 — Capture Dataset

## Room Information

| Field | Value |
|-------|-------|
| **Room ID** | `room_01` |
| **Purpose** | Indoor room reconstruction test dataset |
| **Capture Device** | *To be filled by user* |
| **Room Type** | *To be filled by user* |
| **Approximate Dimensions** | *To be filled by user* |
| **Capture Date** | *To be filled by user* |
| **Capture Method** | Smartphone video / images |
| **Notes** | *To be filled by user* |

## Directory Structure

```
room_01/
├── video/              # Raw video files from smartphone capture
├── images/             # Extracted image frames (optional)
├── metadata/
│   └── capture_metadata.json   # Capture parameters and room info
└── README.md           # This file
```

## Instructions

1. **Before capture**: Read [`docs/CAPTURE_SOP.md`](../../docs/CAPTURE_SOP.md) for the full capture procedure.
2. **After capture**: Place the video file in `video/` and fill out `metadata/capture_metadata.json`.
3. **Optional**: Extract image frames from the video and place them in `images/`.

## Status

- [ ] Video captured
- [ ] Metadata filled
- [ ] Images extracted (optional)
- [ ] Ready for reconstruction
