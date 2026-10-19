# 🚀 Namma Space

**Indoor 3D Reconstruction & Navigation Platform**

Namma Space transforms smartphone-captured indoor footage into interactive 3D models, enabling web-based first-person exploration of real-world spaces.

---

## 📌 Current Status

> **Phase 1 — Project Setup**
>
> The project foundation is in place. The frontend dev server runs successfully. 3D reconstruction and viewer features are planned for upcoming phases.

---

## 🛠 Technology Stack

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| Frontend           | React 18, Vite, TypeScript          |
| 3D Rendering       | Three.js, React Three Fiber (R3F)   |
| 3D Utilities       | Drei (R3F helpers)                  |
| Reconstruction     | *(planned)* — Python-based pipeline |
| Deployment         | *(planned)*                         |

---

## 📂 Project Structure

```
NammaSpace/
├── frontend/          # React + Vite application
├── reconstruction/    # 3D reconstruction pipeline (future)
├── sample_data/
│   └── room_01/       # Sample capture data (future)
├── docs/
│   ├── PROJECT_PLAN.md
│   └── CAPTURE_SOP.md
├── scripts/           # Utility scripts (future)
├── .gitignore
└── README.md
```

---

## ⚡ Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm

### Install & Run

```bash
# Clone the repository
git clone <repo-url>
cd NammaSpace

# Install frontend dependencies
cd frontend
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** (default Vite port).

---

## 🧭 Roadmap

| Phase | Description                                 | Status      |
| ----- | ------------------------------------------- | ----------- |
| 1     | Project setup & frontend scaffold           | ✅ Complete |
| 2     | 3D viewer integration & sample model loader | ✅ Complete |
| 3     | Reconstruction pipeline                     | ✅ Complete |
| 4     | First-person free roaming                   | ✅ Complete |
| 5     | Round 2: POI labeling, search & selection   | ✅ Complete |
| 6     | Round 2: Desktop A* navigation & pathfinding| ✅ Complete |

---

## 🧭 Round 2 — Indoor Navigation & Pathfinding Architecture

### Overview
Namma Space Round 2 introduces an interactive Point of Interest (POI) system and client-side desktop pathfinding:
- **POI System**: 3D markers with category-colored glowing rings, floating animations, hover tooltips, real-time search, category filters, and camera observation ("Go To").
- **A\* Pathfinding ("Navigate")**: Calculates optimal, collision-free walking paths from the user's real-time camera position to any indoor landmark.

### Why a Manually Configured Navigation Grid?
The navigation system uses a 2D floor navigation grid (`frontend/src/navigation/navigationData.ts`) at **0.25m resolution** with manually configured obstacle footprints (perimeter walls, bed, wardrobe, study desk, chair, dresser, and bookshelf).

> [!NOTE]
> **Design Decision**: The current navigation grid is **manually configured** and **not automatically extracted** from the reconstructed 3D mesh. Smartphone photogrammetry reconstructions in indoor spaces often exhibit surface irregularities, non-manifold geometry, or holes that make automated NavMesh generation unreliable without manual cleanup. By decoupling the navigation topology from the raw reconstructed mesh, Namma Space provides reliable, collision-free indoor pathfinding.

### Pathfinding Engine Highlights
- **Algorithm**: A* search using an optimized binary Min-Heap priority queue.
- **8-Directional Movement**: Distinct costs for cardinal moves ($1.0 \times \text{resolution}$) and diagonal moves ($\sqrt{2} \times \text{resolution} \approx 1.414$).
- **Strict Corner-Cutting Prevention**: Diagonal movement through adjacent blocked obstacle edges is disallowed.
- **Dynamic Approach Pointing**: If a POI sits inside furniture or mounted on a wall, concentric spiral search locates the nearest accessible walkable floor cell.
- **Line-of-Sight Smoothing**: String-pulling post-processing connects visible waypoints across open space to produce natural walking paths.
- **Real-Time Player Origin**: Reads the genuine player/camera position via `PlayerPositionTracker` from `FirstPersonControls`.
- **3D Visualization**: Renders an animated glowing cyan spline floating at $Y = 0.08\text{m}$ above the floor with directional breadcrumb pulses, departure rings, and arrival beacons.


---

## 📝 License

This project was built for hackathon purposes.

---

*Built with ☕ by Team Jaspay*
