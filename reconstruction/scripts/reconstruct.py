#!/usr/bin/env python3
"""
3D Reconstruction Pipeline Script for Namma Space.

Processes extracted capture frames using Global Incremental Structure-from-Motion (SfM),
camera pose recovery, multi-view triangulation, Open3D normal estimation,
outlier filtering, and Poisson / point-cloud surface generation to export web-ready
3D room models (.glb / .ply).
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Verify OpenCV and NumPy
try:
    import cv2
    import numpy as np
except ImportError:
    print("[ERROR] OpenCV and NumPy are required. Run: pip install opencv-python numpy")
    sys.exit(1)

# Verify Open3D
try:
    import open3d as o3d
    HAS_OPEN3D = True
except ImportError:
    HAS_OPEN3D = False

# Verify Trimesh
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
        choices=["incremental_sfm", "opencv_sfm", "colmap"],
        default="incremental_sfm",
        help="Reconstruction engine to use (default: incremental_sfm)"
    )
    parser.add_argument(
        "--mesh-type",
        type=str,
        choices=["hybrid", "poisson", "pointcloud"],
        default="hybrid",
        help="Geometry export type: hybrid (mesh + points), poisson (surface only), pointcloud (dense points only)"
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=120,
        help="Maximum frames to process for CPU efficiency (default: 120)"
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


def estimate_camera_intrinsics(width: int, height: int, fov_deg: float = 65.0):
    """Computes camera intrinsic matrix K from image resolution and typical smartphone FoV."""
    fov_rad = np.deg2rad(fov_deg)
    fx = (width / 2.0) / np.tan(fov_rad / 2.0)
    fy = fx
    cx = width / 2.0
    cy = height / 2.0
    K = np.array([
        [fx,  0, cx],
        [ 0, fy, cy],
        [ 0,  0,  1]
    ], dtype=np.float64)
    return K


def match_features(desc1, desc2, matcher, ratio: float = 0.75):
    """Computes robust matches between two descriptor sets using Lowe's ratio test."""
    if desc1 is None or desc2 is None or len(desc1) < 8 or len(desc2) < 8:
        return []
    matches = matcher.knnMatch(desc1, desc2, k=2)
    good = []
    for m_pair in matches:
        if len(m_pair) == 2:
            m, n = m_pair
            if m.distance < ratio * n.distance:
                good.append(m)
    return good


def triangulate_two_views(R1, t1, R2, t2, pts1, pts2, K, max_reproj_err: float = 4.0):
    """
    Triangulates 3D points between two camera poses (world to cam)
    and filters by positive depth and reprojection error.
    """
    if len(pts1) == 0:
        return np.zeros((0, 3)), np.zeros(0, dtype=bool)

    P1 = K @ np.hstack((R1, t1))
    P2 = K @ np.hstack((R2, t2))

    pts4d = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
    # Check for division by zero
    w = pts4d[3]
    valid_w = np.abs(w) > 1e-7
    pts3d = np.zeros((len(pts1), 3), dtype=np.float64)
    pts3d[valid_w] = (pts4d[:3, valid_w] / w[valid_w]).T

    # Depths in both camera frames: x_cam = R @ X + t
    pts_cam1 = (R1 @ pts3d.T + t1).T
    pts_cam2 = (R2 @ pts3d.T + t2).T
    depth_valid = valid_w & (pts_cam1[:, 2] > 0.05) & (pts_cam2[:, 2] > 0.05) & (pts_cam1[:, 2] < 30.0) & (pts_cam2[:, 2] < 30.0)

    # Reprojection error in camera 1
    proj1_hom = (K @ pts_cam1.T).T
    proj1_z = np.maximum(proj1_hom[:, 2:], 1e-5)
    proj1_2d = proj1_hom[:, :2] / proj1_z
    err1 = np.linalg.norm(proj1_2d - pts1, axis=1)

    # Reprojection error in camera 2
    proj2_hom = (K @ pts_cam2.T).T
    proj2_z = np.maximum(proj2_hom[:, 2:], 1e-5)
    proj2_2d = proj2_hom[:, :2] / proj2_z
    err2 = np.linalg.norm(proj2_2d - pts2, axis=1)

    valid_mask = depth_valid & (err1 < max_reproj_err) & (err2 < max_reproj_err)
    return pts3d[valid_mask], valid_mask


def run_incremental_sfm(frame_paths, output_dir: Path, room_id: str, target_format: str, log_dir: Path, mesh_type: str = "hybrid"):
    """
    Executes Global Incremental Structure-from-Motion:
    1. Extracts SIFT features and local color values.
    2. Recovers initial pair baseline and establishes world coordinate frame.
    3. Incrementally solves PnP / pose chaining for sequential and skip-connected views.
    4. Triangulates multi-view tracks into a consistent global 3D coordinate system.
    5. Applies Open3D outlier filtering, normal estimation, and Poisson / point-cloud generation.
    6. Exports clean, centered web-ready GLB asset.
    """
    num_frames = len(frame_paths)
    print(f"\n[INFO] Starting Global Incremental SfM on {num_frames} frames...", flush=True)

    # Initialize SIFT detector
    try:
        detector = cv2.SIFT_create(nfeatures=2500, contrastThreshold=0.03)
        matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
        feature_name = "SIFT"
    except Exception:
        detector = cv2.ORB_create(nfeatures=2500)
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        feature_name = "ORB"

    print(f"[INFO] Using {feature_name} detector for feature extraction.", flush=True)

    # Read first frame to establish image geometry and camera intrinsics K
    first_img = cv2.imread(str(frame_paths[0]))
    h, w = first_img.shape[:2]
    K = estimate_camera_intrinsics(w, h, fov_deg=65.0)

    print(f"[INFO] Frame resolution: {w}x{h}, estimated focal length: fx={K[0,0]:.1f} px, fy={K[1,1]:.1f} px", flush=True)

    # Step 1: Extract features and pixel colors across all frames
    frame_kps = []
    frame_descs = []
    frame_colors = []

    print("[INFO] Extracting features and RGB surface colors across all frames...", flush=True)
    for idx, fpath in enumerate(frame_paths):
        img = cv2.imread(str(fpath))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        kps, descs = detector.detectAndCompute(gray, None)

        if kps is not None and len(kps) > 0:
            pts_2d = np.float32([kp.pt for kp in kps])
            ix = np.clip(np.int32(np.round(pts_2d[:, 0])), 0, w - 1)
            iy = np.clip(np.int32(np.round(pts_2d[:, 1])), 0, h - 1)
            # BGR to RGB
            cols = img[iy, ix][:, ::-1]
        else:
            pts_2d = np.zeros((0, 2), dtype=np.float32)
            cols = np.zeros((0, 3), dtype=np.uint8)

        frame_kps.append(pts_2d)
        frame_descs.append(descs)
        frame_colors.append(cols)

        if idx % 15 == 0 or idx == num_frames - 1:
            print(f"  Extracted frame {idx+1}/{num_frames} ({len(pts_2d)} keypoints)", flush=True)

    # Step 2: Establish initial baseline pair (frame 0 to frame 1 or 2)
    init_pair = None
    best_inliers = 0
    best_E = None
    best_pts0 = None
    best_pts1 = None
    best_good_matches = None

    for candidate_j in range(1, min(6, num_frames)):
        good_m = match_features(frame_descs[0], frame_descs[candidate_j], matcher, ratio=0.75)
        if len(good_m) < 20:
            continue
        p0 = frame_kps[0][[m.queryIdx for m in good_m]]
        pj = frame_kps[candidate_j][[m.trainIdx for m in good_m]]

        E, mask = cv2.findEssentialMat(p0, pj, K, method=cv2.RANSAC, prob=0.999, threshold=1.5)
        if E is not None:
            inlier_count = int(np.sum(mask))
            if inlier_count > best_inliers:
                best_inliers = inlier_count
                init_pair = (0, candidate_j)
                best_E = E
                best_pts0 = p0[mask.ravel() == 1]
                best_pts1 = pj[mask.ravel() == 1]
                best_good_matches = [m for idx_m, m in enumerate(good_m) if mask.ravel()[idx_m] == 1]

    if init_pair is None or best_inliers < 15:
        print("[ERROR] Could not find a suitable initial camera pair with sufficient parallax.", flush=True)
        return False, None

    frame_a, frame_b = init_pair
    _, R_init, t_init, _ = cv2.recoverPose(best_E, best_pts0, best_pts1, K)

    # Global camera poses (world to cam): R (3x3), t (3x1)
    camera_poses = {}
    camera_poses[frame_a] = {
        "R": np.eye(3, dtype=np.float64),
        "t": np.zeros((3, 1), dtype=np.float64)
    }
    camera_poses[frame_b] = {
        "R": R_init.astype(np.float64),
        "t": t_init.astype(np.float64)
    }

    print(f"[SUCCESS] Initialized global world frame with frames ({frame_a}, {frame_b}) ({best_inliers} inliers)", flush=True)

    # Triangulate initial points
    all_3d_points = []
    all_3d_colors = []
    point_track_map = {}  # (frame_idx, kp_idx) -> point_id

    R_a = camera_poses[frame_a]["R"]
    t_a = camera_poses[frame_a]["t"]
    R_b = camera_poses[frame_b]["R"]
    t_b = camera_poses[frame_b]["t"]

    init_3d, mask_valid = triangulate_two_views(R_a, t_a, R_b, t_b, best_pts0, best_pts1, K, max_reproj_err=4.0)
    valid_matches = [m for idx_v, m in enumerate(best_good_matches) if mask_valid[idx_v]]
    init_colors = frame_colors[frame_a][[m.queryIdx for m in valid_matches]]

    for pt, col, m in zip(init_3d, init_colors, valid_matches):
        pt_id = len(all_3d_points)
        all_3d_points.append(pt)
        all_3d_colors.append(col)
        point_track_map[(frame_a, m.queryIdx)] = pt_id
        point_track_map[(frame_b, m.trainIdx)] = pt_id

    print(f"[INFO] Triangulated {len(init_3d)} initial global 3D points.", flush=True)

    # Step 3: Sequential & Windowed Camera Registration (Multi-Pass)
    registered_count = 2
    step_scale = 0.15  # Nominal translation step (~15 cm between frames at ~2.5 fps)

    print("[INFO] Incrementally registering cameras and triangulating multi-view tracks...", flush=True)
    for pass_idx in range(2):
        new_in_pass = 0
        for i in range(num_frames):
            if i in camera_poses:
                continue

            # Look for nearby registered candidate cameras (closest first)
            candidates = sorted([k for k in camera_poses.keys() if 0 < abs(k - i) <= 15], key=lambda k: abs(k - i))
            if not candidates:
                continue

            best_pnp_res = None
            best_rel_res = None
            best_matches_count = 0

            for prev_reg in candidates[:5]:
                good_m = match_features(frame_descs[prev_reg], frame_descs[i], matcher, ratio=0.75)
                if len(good_m) < 8:
                    continue

                # Check for PnP 3D-2D correspondences
                obj_pts = []
                img_pts = []
                for m in good_m:
                    if (prev_reg, m.queryIdx) in point_track_map:
                        pt_id = point_track_map[(prev_reg, m.queryIdx)]
                        obj_pts.append(all_3d_points[pt_id])
                        img_pts.append(frame_kps[i][m.trainIdx])

                if len(obj_pts) >= 10:
                    success, rvec, tvec, inliers = cv2.solvePnPRansac(
                        np.float64(obj_pts), np.float64(img_pts), K, None,
                        reprojectionError=4.0,
                        flags=cv2.SOLVEPNP_ITERATIVE
                    )
                    if success and inliers is not None and len(inliers) >= 8:
                        R_i, _ = cv2.Rodrigues(rvec)
                        best_pnp_res = (R_i.astype(np.float64), tvec.astype(np.float64), prev_reg, good_m)
                        break

                # Check relative pose
                p_prev = frame_kps[prev_reg][[m.queryIdx for m in good_m]]
                p_curr = frame_kps[i][[m.trainIdx for m in good_m]]
                E, mask = cv2.findEssentialMat(p_prev, p_curr, K, method=cv2.RANSAC, prob=0.999, threshold=1.5)
                if E is not None:
                    inlier_cnt = int(np.sum(mask))
                    if inlier_cnt >= 8 and inlier_cnt > best_matches_count:
                        best_matches_count = inlier_cnt
                        inliers = mask.ravel() == 1
                        _, R_rel, t_rel, _ = cv2.recoverPose(E, p_prev[inliers], p_curr[inliers], K)
                        delta_idx = abs(i - prev_reg)
                        R_prev = camera_poses[prev_reg]["R"]
                        t_prev = camera_poses[prev_reg]["t"]
                        R_curr = R_rel @ R_prev
                        t_curr = R_rel @ t_prev + t_rel * (step_scale * delta_idx)
                        best_rel_res = (R_curr.astype(np.float64), t_curr.astype(np.float64), prev_reg, good_m)

            if best_pnp_res is not None:
                R_i, t_i, prev_reg, good_m = best_pnp_res
                camera_poses[i] = {"R": R_i, "t": t_i}
                registered_count += 1
                new_in_pass += 1
            elif best_rel_res is not None:
                R_i, t_i, prev_reg, good_m = best_rel_res
                camera_poses[i] = {"R": R_i, "t": t_i}
                registered_count += 1
                new_in_pass += 1
            else:
                continue

            # Triangulate new 3D points between prev_reg and i
            R_prev = camera_poses[prev_reg]["R"]
            t_prev = camera_poses[prev_reg]["t"]
            R_curr = camera_poses[i]["R"]
            t_curr = camera_poses[i]["t"]

            p_prev_all = frame_kps[prev_reg][[m.queryIdx for m in good_m]]
            p_curr_all = frame_kps[i][[m.trainIdx for m in good_m]]

            new_3d, mask_v = triangulate_two_views(R_prev, t_prev, R_curr, t_curr, p_prev_all, p_curr_all, K, max_reproj_err=4.0)
            v_matches = [m for idx_m, m in enumerate(good_m) if mask_v[idx_m]]
            new_cols = frame_colors[prev_reg][[m.queryIdx for m in v_matches]]

            for pt, col, m in zip(new_3d, new_cols, v_matches):
                pt_id = len(all_3d_points)
                all_3d_points.append(pt)
                all_3d_colors.append(col)
                point_track_map[(prev_reg, m.queryIdx)] = pt_id
                point_track_map[(i, m.trainIdx)] = pt_id

            # Also triangulate skip-connections (with nearby registered frames)
            for skip_reg in candidates[:3]:
                if skip_reg == prev_reg:
                    continue
                skip_matches = match_features(frame_descs[skip_reg], frame_descs[i], matcher, ratio=0.75)
                if len(skip_matches) >= 12:
                    R_skip = camera_poses[skip_reg]["R"]
                    t_skip = camera_poses[skip_reg]["t"]
                    p_s = frame_kps[skip_reg][[m.queryIdx for m in skip_matches]]
                    p_c = frame_kps[i][[m.trainIdx for m in skip_matches]]
                    skip_3d, skip_mask = triangulate_two_views(R_skip, t_skip, R_curr, t_curr, p_s, p_c, K, max_reproj_err=4.0)
                    v_skip_matches = [m for idx_m, m in enumerate(skip_matches) if skip_mask[idx_m]]
                    s_cols = frame_colors[skip_reg][[m.queryIdx for m in v_skip_matches]]

                    for pt, col, m in zip(skip_3d, s_cols, v_skip_matches):
                        pt_id = len(all_3d_points)
                        all_3d_points.append(pt)
                        all_3d_colors.append(col)
                        point_track_map[(skip_reg, m.queryIdx)] = pt_id
                        point_track_map[(i, m.trainIdx)] = pt_id

        print(f"  Pass {pass_idx+1} complete: {registered_count}/{num_frames} cameras registered, {len(all_3d_points)} 3D points.", flush=True)
        if new_in_pass == 0:
            break

    print(f"\n[SUCCESS] Registered {registered_count}/{num_frames} cameras in global coordinate frame.", flush=True)
    print(f"[SUCCESS] Reconstructed {len(all_3d_points)} raw global 3D points.", flush=True)

    if len(all_3d_points) < 50:
        print("[ERROR] Reconstruction failed: Too few 3D points recovered.", flush=True)
        return False, None

    points_np = np.array(all_3d_points, dtype=np.float64)
    colors_np = np.array(all_3d_colors, dtype=np.float64) / 255.0

    # Step 4: Open3D Outlier Filtering & Normal Estimation
    generated_mesh = None
    if HAS_OPEN3D:
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points_np)
        pcd.colors = o3d.utility.Vector3dVector(colors_np)

        # Statistical Outlier Removal (removes isolated sensor noise)
        pcd_filtered, inlier_indices = pcd.remove_statistical_outlier(nb_neighbors=25, std_ratio=1.8)
        # Radius Outlier Removal to eliminate stray reflections
        pcd_filtered, r_indices = pcd_filtered.remove_radius_outlier(nb_points=5, radius=0.30)
        # Voxel Downsampling (1.2 cm voxel grid for high-density room geometry)
        pcd_down = pcd_filtered.voxel_down_sample(voxel_size=0.012)

        # Normal Estimation
        pcd_down.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.18, max_nn=30))

        # Orient normals towards camera trajectory center
        cam_positions = []
        for pose in camera_poses.values():
            C = -pose["R"].T @ pose["t"]
            cam_positions.append(C.ravel())
        if cam_positions:
            center_cam = np.mean(cam_positions, axis=0)
            pcd_down.orient_normals_towards_camera_location(center_cam)

        pts_clean = np.asarray(pcd_down.points)
        cols_clean = np.asarray(pcd_down.colors)
        print(f"[INFO] Cleaned point cloud: {len(pts_clean)} points remaining after outlier filtering.", flush=True)

        # Step 5: Screened Poisson Surface Reconstruction
        if mesh_type in ["poisson", "hybrid"] and len(pts_clean) >= 150:
            try:
                print("[INFO] Computing Screened Poisson Surface Reconstruction...", flush=True)
                poisson_mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                    pcd_down, depth=8, linear_fit=True
                )
                densities_np = np.asarray(densities)
                dens_thresh = np.quantile(densities_np, 0.06)
                vertices_to_remove = densities_np < dens_thresh
                poisson_mesh.remove_vertices_by_mask(vertices_to_remove)

                # Sample vertex colors from nearest point in pcd_down
                if len(poisson_mesh.vertices) > 0:
                    kdtree = o3d.geometry.KDTreeFlann(pcd_down)
                    mesh_colors = []
                    for v in np.asarray(poisson_mesh.vertices):
                        [_, idxs, _] = kdtree.search_knn_vector_3d(v, 1)
                        mesh_colors.append(cols_clean[idxs[0]])
                    poisson_mesh.vertex_colors = o3d.utility.Vector3dVector(np.array(mesh_colors))
                    generated_mesh = poisson_mesh
                    print(f"[SUCCESS] Poisson surface generated: {len(poisson_mesh.vertices)} vertices, {len(poisson_mesh.triangles)} faces.", flush=True)
            except Exception as e:
                print(f"[WARNING] Poisson reconstruction failed: {e}. Proceeding with clean point cloud.", flush=True)
    else:
        pts_clean = points_np
        cols_clean = colors_np
        generated_mesh = None

    # Step 6: Center and normalize scene dimensions for Three.js viewer
    min_bounds = np.min(pts_clean, axis=0)
    max_bounds = np.max(pts_clean, axis=0)
    center_xz = np.array([(min_bounds[0] + max_bounds[0]) / 2.0, min_bounds[1], (min_bounds[2] + max_bounds[2]) / 2.0])

    pts_centered = pts_clean - center_xz
    extents = np.ptp(pts_centered, axis=0)
    max_ext = np.max(extents)

    # Scale naturally to standard indoor room proportions (longest dimension ~5 to 8 meters)
    target_scale = 6.0 / max_ext if (max_ext > 15.0 or max_ext < 1.0) else 1.0
    pts_centered *= target_scale

    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"{room_id}.{target_format}"

    # Step 7: Export Web-Ready Asset (.glb)
    if HAS_TRIMESH:
        cols_uint8 = np.clip(cols_clean * 255.0, 0, 255).astype(np.uint8)
        alpha = np.full((len(cols_uint8), 1), 255, dtype=np.uint8)
        cols_rgba = np.hstack((cols_uint8, alpha))

        trimesh_pcd = trimesh.PointCloud(vertices=pts_centered, colors=cols_rgba)
        export_elements = []

        if generated_mesh is not None and len(generated_mesh.vertices) > 0 and mesh_type in ["poisson", "hybrid"]:
            m_verts = (np.asarray(generated_mesh.vertices) - center_xz) * target_scale
            m_faces = np.asarray(generated_mesh.triangles)
            m_cols = np.clip(np.asarray(generated_mesh.vertex_colors) * 255.0, 0, 255).astype(np.uint8)
            m_alpha = np.full((len(m_cols), 1), 220, dtype=np.uint8)
            m_cols_rgba = np.hstack((m_cols, m_alpha))

            trimesh_mesh = trimesh.Trimesh(vertices=m_verts, faces=m_faces, vertex_colors=m_cols_rgba, process=False)
            export_elements.append(trimesh_mesh)

        if mesh_type in ["pointcloud", "hybrid"] or len(export_elements) == 0:
            export_elements.append(trimesh_pcd)

        if len(export_elements) == 1:
            export_scene = export_elements[0]
        else:
            export_scene = trimesh.Scene(export_elements)

        export_scene.export(str(out_file))
        print(f"[SUCCESS] Exported web-ready 3D asset to: {out_file}", flush=True)
    else:
        ply_file = output_dir / f"{room_id}.ply"
        with open(ply_file, "w") as f:
            f.write("ply\nformat ascii 1.0\n")
            f.write(f"element vertex {len(pts_centered)}\n")
            f.write("property float x\nproperty float y\nproperty float z\n")
            f.write("property uchar red\nproperty uchar green\nproperty uchar blue\n")
            f.write("end_header\n")
            for pt, col in zip(pts_centered, cols_clean):
                c = np.clip(col * 255.0, 0, 255).astype(int)
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f} {c[0]} {c[1]} {c[2]}\n")
        out_file = ply_file
        print(f"[SUCCESS] Exported 3D point cloud to: {out_file}", flush=True)

    file_size_bytes = out_file.stat().st_size
    f_count = len(generated_mesh.triangles) if generated_mesh is not None else 0

    log_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "room_id": room_id,
        "engine": "incremental_sfm",
        "feature_detector": feature_name,
        "total_video_frames": num_frames,
        "registered_cameras": registered_count,
        "raw_3d_points": len(all_3d_points),
        "cleaned_3d_points": len(pts_centered),
        "mesh_faces": f_count,
        "mesh_type": mesh_type,
        "output_model": str(out_file),
        "output_format": target_format,
        "file_size_bytes": file_size_bytes,
        "file_size_kb": round(file_size_bytes / 1024, 2),
        "status": "success"
    }

    with open(log_dir / "reconstruction_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("=" * 60, flush=True)
    print(" 3D Reconstruction Summary", flush=True)
    print("=" * 60, flush=True)
    print(f"- Processed Frames     : {num_frames}", flush=True)
    print(f"- Registered Cameras   : {registered_count}", flush=True)
    print(f"- Reconstructed Points : {len(pts_centered)}", flush=True)
    print(f"- Mesh Faces           : {f_count}", flush=True)
    print(f"- Output Model Path    : {out_file}", flush=True)
    print(f"- Output File Size     : {round(file_size_bytes / 1024, 2)} KB", flush=True)
    print("=" * 60, flush=True)

    return True, str(out_file)


def main():
    args = parse_args()

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
            print(f"[WARNING] Could not parse config.json: {e}", flush=True)

    frames_dir = Path(args.frames_dir)
    output_dir = Path(args.output_dir)
    log_dir = Path(args.log_dir)

    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    frame_files = sorted([
        f for f in frames_dir.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ]) if frames_dir.exists() else []

    if len(frame_files) == 0:
        print(f"\n[ERROR] No capture frames found in: {frames_dir.resolve()}", flush=True)
        print("Run 'python reconstruction/scripts/extract_frames.py' first.", flush=True)
        sys.exit(1)

    if args.max_frames > 0 and len(frame_files) > args.max_frames:
        step = len(frame_files) / float(args.max_frames)
        selected_indices = [int(round(i * step)) for i in range(args.max_frames)]
        frame_files = [frame_files[min(idx, len(frame_files) - 1)] for idx in selected_indices]

    success, out_path = run_incremental_sfm(
        frame_paths=frame_files,
        output_dir=output_dir,
        room_id=room_id,
        target_format=target_format,
        log_dir=log_dir,
        mesh_type=args.mesh_type
    )

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
