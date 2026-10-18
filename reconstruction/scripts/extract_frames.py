#!/usr/bin/env python3
"""
Frame Extraction Script for Namma Space 3D Reconstruction Pipeline.

Extracts representative, high-quality image frames from smartphone indoor capture
videos at a configurable interval, avoiding redundant or motion-blurred frames.
"""

import os
import sys
import json
import argparse
from pathlib import Path

try:
    import cv2
except ImportError:
    print("Error: OpenCV is not installed. Please run: pip install opencv-python")
    sys.exit(1)


def parse_args():
    default_base = Path(__file__).resolve().parent.parent
    default_input = default_base.parent / "sample_data" / "room_01" / "video" / "room_01_capture.mp4"
    default_output = default_base / "frames"
    default_logs = default_base / "logs"

    parser = argparse.ArgumentParser(description="Extract frames from indoor capture video.")
    parser.add_argument(
        "--input", "-i",
        type=str,
        default=str(default_input),
        help=f"Path to input video file (default: {default_input})"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=str(default_output),
        help=f"Output directory for extracted frames (default: {default_output})"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Frame extraction interval in seconds (default: 1.0 second per frame)"
    )
    parser.add_argument(
        "--min-blur-score",
        type=float,
        default=30.0,
        help="Minimum Laplacian variance threshold to reject blurry frames (default: 30.0)"
    )
    parser.add_argument(
        "--log-dir",
        type=str,
        default=str(default_logs),
        help="Directory to save capture_report.json"
    )
    return parser.parse_args()


def extract_frames(video_path: str, output_dir: str, interval_sec: float, min_blur: float, log_dir: str):
    v_path = Path(video_path)
    out_dir = Path(output_dir)
    l_dir = Path(log_dir)

    # Strictly check if real capture video exists
    if not v_path.exists():
        print(f"\n[ERROR] Input video does not exist: {v_path}")
        print("\n--> Real indoor capture is required before running frame extraction.")
        print("--> Please capture a room following 'docs/CAPTURE_SOP.md' and place the video at:")
        print(f"    sample_data/room_01/video/room_01_capture.mp4\n")
        sys.exit(1)

    cap = cv2.VideoCapture(str(v_path))
    if not cap.isOpened():
        print(f"[ERROR] Could not open video file: {v_path}")
        sys.exit(1)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps if fps > 0 else 0.0

    print("=" * 60)
    print(" Namma Space — Capture Video Analysis & Extraction")
    print("=" * 60)
    print(f"Video File        : {v_path.name}")
    print(f"Resolution        : {width} x {height}")
    print(f"FPS               : {fps:.2f}")
    print(f"Duration          : {duration_sec:.2f} seconds ({duration_sec/60:.2f} minutes)")
    print(f"Total Video Frames: {total_frames}")
    print(f"Extraction Interval: Every {interval_sec:.2f} seconds")
    print(f"Target Output Dir : {out_dir}")
    print("=" * 60)

    out_dir.mkdir(parents=True, exist_ok=True)
    l_dir.mkdir(parents=True, exist_ok=True)

    frame_step = max(1, int(round(fps * interval_sec)))
    current_frame_idx = 0
    extracted_count = 0
    skipped_blurry_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if current_frame_idx % frame_step == 0:
            # Blur detection using Laplacian variance
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blur_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            if blur_var < min_blur and min_blur > 0:
                skipped_blurry_count += 1
            else:
                extracted_count += 1
                out_filename = out_dir / f"frame_{extracted_count:04d}.jpg"
                cv2.imwrite(str(out_filename), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

        current_frame_idx += 1

    cap.release()

    print(f"\n[SUCCESS] Extraction complete.")
    print(f"- Frames Extracted : {extracted_count}")
    print(f"- Blurry Skipped   : {skipped_blurry_count}")
    print(f"- Output Directory : {out_dir}")

    # Generate logs/capture_report.json
    report = {
        "video_path": str(v_path),
        "video_filename": v_path.name,
        "resolution": f"{width}x{height}",
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "duration_seconds": round(duration_sec, 2),
        "total_video_frames": total_frames,
        "extraction_interval_seconds": interval_sec,
        "extracted_frames_count": extracted_count,
        "skipped_blurry_frames": skipped_blurry_count,
        "status": "ready_for_reconstruction" if extracted_count > 0 else "no_frames_extracted"
    }

    report_path = l_dir / "capture_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"- Capture Report   : {report_path}")
    print("=" * 60)


if __name__ == "__main__":
    args = parse_args()
    extract_frames(
        video_path=args.input,
        output_dir=args.output,
        interval_sec=args.interval,
        min_blur=args.min_blur_score,
        log_dir=args.log_dir
    )
