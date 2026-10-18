#!/usr/bin/env python3
"""
3D Reconstruction Pipeline Script for Namma Space.

Processes extracted capture frames to reconstruct indoor 3D geometry
and export web-ready 3D models (.glb / .ply).
"""

import os
import sys
import json
import argparse
import shutil
from pathlib import Path

# Check required libraries
try:
    import cv2
    import numpy as np
except ImportError:
    print("[ERROR] OpenCV and NumPy are required. Run: pip install opencv-python numpy")
    sys.exit(1)

try:
    import trimesh
    HAS_TRIMESH = True
except ImportError:
    HAS_TRIMESH = False


def parse_args():
    default_base = Path(__file__).resolve().parent.parent
    default_frames = default_base / "frames"
    default_output = default_base / "output"
    default_logs = default_base / "logs"
    default_config = default_base / "config.json"

    parser = argparse.ArgumentParser(description="Reconstruct 3D model from capture image frames.")
    parser.add_argument(
        "--frames-dir", "-f",
        type=str,
        default=str(default_frames),
        help=f"Directory containing extracted image frames (default: {default_frames})"
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default=str(default_output),
        help=f"Directory to export reconstructed 3D model (default: {default_output})"
    )
    parser.add_argument(
        "--room-id",
        type=str,
        default="room_01",
        help="Room identifier (default: room_01)"
    )
    parser.add_argument(
        "--format",
        type=str,
        choices=["glb", "ply", "obj"],
        default="glb",
        help="Target 3D output format (default: glb)"
    )
    parser.add_argument(
        "--engine",
        type=str,
        choices=["opencv_sfm", "colmap"],
        default="opencv_sfm",
        help="Reconstruction engine to use (default: opencv_sfm)"
    )
    parser.add_argument(
        "--config",
        type=str,
        default=str(default_config),
        help=f"Path to reconstruction config.json (default: {default_config})"
    )
    parser.add_argument(
        "--log-dir",
        type=str,
        default=str(default_logs),
        help=f"Directory to save reconstruction logs (default: {default_logs})"
    )
    return parser.parse_args()


def check_prerequisites(engine: str):
    """Verifies environment readiness and reports any missing tools."""
    print("=" * 60)
    print(" Namma Space — 3D Reconstruction Environment Check")
    print("=" * 60)
    print(f"Python Version    : {sys.version.split()[0]}")
    print(f"OpenCV Version    : {cv2.__version__}")
    print(f"NumPy Version     : {np.__version__}")
    print(f"Trimesh Installed : {'Yes (' + trimesh.__version__ + ')' if HAS_TRIMESH else 'No'}")
    print(f"Selected Engine   : {engine}")

    if not HAS_TRIMESH:
        print("\n[WARNING] 'trimesh' is not installed.")
        print("          Direct .glb export requires trimesh.")
        print("          Install command: pip install trimesh\n")

    if engine == "colmap":
        colmap_path = shutil.which("colmap")
        if not colmap_path:
            print("\n[ERROR] COLMAP executable not found in system PATH.")
            print("Why required      : COLMAP provides industrial-grade SfM and Multi-View Stereo.")
            print("Installation guide: Download from https://colmap.github.io/install.html")
            print("Windows command   : winget install -e --id colmap.colmap (or unpack portable ZIP)")
            print("Expected input    : Directory of image frames (e.g. reconstruction/frames/)")
            print("Expected output   : Dense point cloud (fused.ply) or meshed model (meshed.ply)\n")
            return False
        else:
            print(f"COLMAP Path       : {colmap_path}")

    print("=" * 60)
    return True


def run_opencv_sfm(frame_paths, output_dir: Path, room_id: str, target_format: str, log_dir: Path):
    """
    Reconstructs 3D point cloud & mesh from sequential image frames
    using feature matching (ORB/SIFT), camera pose recovery, and triangulation.
    """
    print(f"\n[INFO] Initializing feature-based Structure-from-Motion on {len(frame_paths)} frames...")

    # SIFT feature detector (with fallback to ORB)
    try:
        detector = cv2.SIFT_create(nfeatures=2000)
        matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
        feature_type = "SIFT"
    except Exception:
        detector = cv2.ORB_create(nfeatures=2000)
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        feature_type = "ORB"

    print(f"[INFO] Using {feature_type} detector for keypoint extraction.")

    # Read first image to estimate default camera intrinsics
    first_img = cv2.imread(str(frame_paths[0]))
    h, w = first_img.shape[:2]
    # Approximate focal length from image diagonal (common smartphone FOV ~65 deg)
    focal_length = np.sqrt(w**2 + h**2)
    K = np.array([
        [focal_length, 0, w / 2.0],
        [0, focal_length, h / 2.0],
        [0, 0, 1]
    ], dtype=np.float64)

    all_points_3d = []
    all_colors = []

    # Sequential pairwise matching
    for i in range(len(frame_paths) - 1):
        img1 = cv2.imread(str(frame_paths[i]))
        img2 = cv2.imread(str(frame_paths[i + 1]))

        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        kp1, des1 = detector.detectAndCompute(gray1, None)
        kp2, des2 = detector.detectAndCompute(gray2, None)

        if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
            continue

        # Ratio test (Lowe's ratio)
        matches = matcher.knnMatch(des1, des2, k=2)
        good_matches = []
        for m_pair in matches:
            if len(m_pair) == 2:
                m, n = m_pair
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        if len(good_matches) < 15:
            continue

        pts1 = np.float32([kp1[m.queryIdx].pt for m in good_matches])
        pts2 = np.float32([kp2[m.trainIdx].pt for m in good_matches])

        # Essential Matrix and Pose Recovery
        E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
        if E is None:
            continue

        inliers = mask.ravel() == 1
        pts1_in = pts1[inliers]
        pts2_in = pts2[inliers]

        if len(pts1_in) < 10:
            continue

        _, R, t, _ = cv2.recoverPose(E, pts1_in, pts2_in, K)

        # Projection matrices
        P0 = np.dot(K, np.hstack((np.eye(3), np.zeros((3, 1)))))
        P1 = np.dot(K, np.hstack((R, t)))

        # Triangulation
        pts4d = cv2.triangulatePoints(P0, P1, pts1_in.T, pts2_in.T)
        pts3d = (pts4d[:3] / pts4d[3]).T

        # Filter points (cheirality check and distance threshold)
        valid_mask = (pts3d[:, 2] > 0.1) & (pts3d[:, 2] < 20.0) & (np.abs(pts3d[:, 0]) < 10.0) & (np.abs(pts3d[:, 1]) < 10.0)
        valid_pts = pts3d[valid_mask]

        if len(valid_pts) > 0:
            # Extract corresponding RGB colors from img1
            valid_2d = np.int32(pts1_in[valid_mask])
            colors = img1[np.clip(valid_2d[:, 1], 0, h - 1), np.clip(valid_2d[:, 0], 0, w - 1)]
            # Convert BGR to RGB
            colors = colors[:, ::-1]

            all_points_3d.append(valid_pts)
            all_colors.append(colors)

    if not all_points_3d:
        print("[ERROR] Reconstruction failed: Insufficient matched 3D points recovered across frames.")
        return False, None

    points_3d = np.vstack(all_points_3d)
    point_colors = np.vstack(all_colors)

    print(f"\n[SUCCESS] Triangulated {len(points_3d)} 3D surface points from captured scene.")

    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"{room_id}.{target_format}"

    if HAS_TRIMESH:
        # Create PointCloud / Mesh via Trimesh
        pcd = trimesh.PointCloud(vertices=points_3d, colors=point_colors)
        
        # Build convex hull or Delaunay mesh approximation for geometry
        try:
            mesh = trimesh.convex.convex_hull(pcd)
            # Center and scale to human viewing dimensions
            mesh.apply_translation(-mesh.centroid)
            export_obj = mesh
        except Exception:
            export_obj = pcd

        export_obj.export(str(out_file))
        print(f"[SUCCESS] Exported 3D model to: {out_file}")
    else:
        # Fallback to standard ASCII PLY
        ply_file = output_dir / f"{room_id}.ply"
        with open(ply_file, "w") as f:
            f.write("ply\nformat ascii 1.0\n")
            f.write(f"element vertex {len(points_3d)}\n")
            f.write("property float x\nproperty float y\nproperty float z\n")
            f.write("property uchar red\nproperty uchar green\nproperty uchar blue\n")
            f.write("end_header\n")
            for pt, col in zip(points_3d, point_colors):
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f} {col[0]} {col[1]} {col[2]}\n")
        out_file = ply_file
        print(f"[SUCCESS] Exported 3D point cloud to: {out_file}")
        print("Note: Install trimesh ('pip install trimesh') to convert directly to .glb.")

    # Write reconstruction report
    log_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "room_id": room_id,
        "engine": "opencv_sfm",
        "feature_detector": feature_type,
        "frames_processed": len(frame_paths),
        "total_3d_points": len(points_3d),
        "output_model": str(out_file),
        "output_format": target_format,
        "status": "success"
    }
    with open(log_dir / "reconstruction_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return True, str(out_file)


def main():
    args = parse_args()

    # Load configuration if provided
    config_path = Path(args.config)
    room_id = args.room_id
    target_format = args.format
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                room_id = cfg.get("room_id", room_id)
                target_format = cfg.get("target_format", target_format)
        except Exception as e:
            print(f"[WARNING] Could not parse config.json: {e}")

    frames_dir = Path(args.frames_dir)
    output_dir = Path(args.output_dir)
    log_dir = Path(args.log_dir)

    # Validate frames directory
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    frame_files = sorted([
        f for f in frames_dir.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ]) if frames_dir.exists() else []

    # STRICT CHECK: If no frames exist, do not generate fake 3D models or pretend reconstruction succeeded
    if len(frame_files) == 0:
        print("\n" + "=" * 60)
        print(" NAMMA SPACE — 3D RECONSTRUCTION PIPELINE")
        print("=" * 60)
        print(f"[ERROR] No capture frames found in: {frames_dir.resolve()}")
        print("\n--> Real indoor capture frames are required before reconstruction.")
        print("--> Step 1: Follow 'docs/CAPTURE_SOP.md' to record your room.")
        print("--> Step 2: Place the video at 'sample_data/room_01/video/room_01_capture.mp4'")
        print("--> Step 3: Run 'python reconstruction/scripts/extract_frames.py'")
        print("--> Step 4: Re-run this reconstruction script.\n")
        print("No fake models or placeholder geometry will be generated.")
        print("=" * 60 + "\n")
        sys.exit(1)

    if not check_prerequisites(args.engine):
        sys.exit(1)

    if args.engine == "opencv_sfm":
        success, out_path = run_opencv_sfm(
            frame_paths=frame_files,
            output_dir=output_dir,
            room_id=room_id,
            target_format=target_format,
            log_dir=log_dir
        )
        if not success:
            sys.exit(1)
    else:
        print(f"[ERROR] Unsupported engine: {args.engine}")
        sys.exit(1)


if __name__ == "__main__":
    main()
