import { useState } from 'react'
import './App.css'
import Scene from './components/Scene'

const pipelineSteps = [
  { icon: '📱', label: '1. Capture' },
  { icon: '🔧', label: '2. Reconstruct' },
  { icon: '🧊', label: '3. Digital Twin' },
  { icon: '📍', label: '4. POI Engine' },
  { icon: '🧭', label: '5. A* Navigation' },
]

const features = [
  {
    icon: '🧊',
    variant: 'three',
    title: '3D Digital Twin',
    desc: 'Interactive 3D model loaded directly in-browser with Three.js and React Three Fiber.',
  },
  {
    icon: '📍',
    variant: 'react',
    title: 'POI Spatial Engine',
    desc: 'Categorized landmark labeling, real-time search, filter chips, and smooth observation focus.',
  },
  {
    icon: '🧭',
    variant: 'cyan',
    title: 'A* Indoor Navigation',
    desc: 'Dynamic, obstacle-aware walking path calculation from live player position to any landmark.',
  },
  {
    icon: '🚶',
    variant: 'ts',
    title: 'First-Person Roaming',
    desc: 'Fluid WASD movement and Pointer Lock mouse look for immersive indoor exploration.',
  },
]

type Page = 'landing' | 'viewer'

function App() {
  const [page, setPage] = useState<Page>('landing')

  // ---------- 3D Viewer ----------
  if (page === 'viewer') {
    return (
      <div className="app app--viewer">
        <button
          className="viewer-back-btn"
          onClick={() => setPage('landing')}
        >
          ← Back
        </button>
        <Scene />
      </div>
    )
  }

  // ---------- Landing Page ----------
  return (
    <div className="app">
      {/* Animated background */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__logo">
          <div className="navbar__icon">🚀</div>
          <span className="navbar__title">Namma Space</span>
        </div>
        <span className="navbar__badge">Round 2 — Live Demo</span>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-dot" />
          Intelligent Indoor Spatial Engine
        </div>

        <h1 className="hero__title">
          Namma Space
          <span className="hero__subtitle-block">
            3D Digital Twin + POI + Indoor Navigation
          </span>
        </h1>

        <p className="hero__subtitle">
          Transform physical indoor spaces into interactive 3D digital twins.
          Search landmarks, inspect points of interest, and calculate collision-free
          walking paths in real time.
        </p>

        {/* Launch Viewer Button */}
        <button
          className="hero__cta"
          onClick={() => setPage('viewer')}
        >
          🌐 Launch 3D Viewer
        </button>

        {/* Pipeline visualization */}
        <div className="pipeline">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="pipeline__step">
                <span className="pipeline__step-icon">{step.icon}</span>
                {step.label}
              </div>
              {i < pipelineSteps.length - 1 && (
                <span className="pipeline__arrow">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="section">
        <div className="section__header">
          <p className="section__label">Capabilities</p>
          <h2 className="section__title">Intelligent Spatial Exploration</h2>
        </div>
        <div className="cards">
          {features.map((item) => (
            <div className="card" key={item.title}>
              <div className={`card__icon card__icon--${item.variant}`}>
                {item.icon}
              </div>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status Banner */}
      <section className="status">
        <div className="status__card">
          <div className="status__indicator">
            <div className="status__dot" />
            <span className="status__label">Round 2 Complete — Navigation Ready</span>
          </div>
          <p className="status__desc">
            Reconstructed 3D digital twin, interactive POI labeling, real-time search,
            and obstacle-avoiding A* desktop pathfinding are live and verified.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          Namma Space — Built for{' '}
          <a href="#">Hackathon 2026</a>{' '}
          by Team Jaspay
        </p>
      </footer>
    </div>
  )
}

export default App
