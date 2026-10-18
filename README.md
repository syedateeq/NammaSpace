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
| 2     | 3D viewer integration & sample model loader | 🔜 Next    |
| 3     | Reconstruction pipeline                     | ⬜ Planned  |
| 4     | First-person free roaming                   | ⬜ Planned  |
| 5     | POI system, navigation & AR                 | ⬜ Planned  |

---

## 📝 License

This project was built for hackathon purposes.

---

*Built with ☕ by Team Jaspay*
