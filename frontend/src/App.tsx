import { useState } from 'react'
import './App.css'
import Scene from './components/Scene'

const pipelineSteps = [
  { icon: '📱', label: 'Capture' },
  { icon: '🔧', label: 'Reconstruct' },
  { icon: '📦', label: '3D Model' },
  { icon: '🌐', label: 'Web Viewer' },
  { icon: '🚶', label: 'Free Roam' },
]

const techStack = [
  {
    icon: '⚛️',
    variant: 'react',
    title: 'React 18',
    desc: 'Component-driven UI with modern hooks and concurrent features.',
  },
  {
    icon: '🧊',
    variant: 'three',
    title: 'Three.js + R3F',
    desc: 'Industry-standard 3D rendering with React Three Fiber integration.',
  },
  {
    icon: '⚡',
    variant: 'vite',
    title: 'Vite',
    desc: 'Lightning-fast dev server with hot module replacement.',
  },
  {
    icon: '🔷',
    variant: 'ts',
    title: 'TypeScript',
    desc: 'Type-safe codebase with enhanced developer experience.',
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
        <span className="navbar__badge">Phase 4</span>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-dot" />
          Hackathon Project — Active Development
        </div>

        <h1 className="hero__title">
          Explore Indoor Spaces in{' '}
          <span className="hero__title-gradient">3D</span>
        </h1>

        <p className="hero__subtitle">
          Transform smartphone-captured indoor footage into interactive 3D
          models. Walk through real-world spaces from your browser.
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

      {/* Tech Stack */}
      <section className="section">
        <div className="section__header">
          <p className="section__label">Technology</p>
          <h2 className="section__title">Built with Modern Tools</h2>
        </div>
        <div className="cards">
          {techStack.map((tech) => (
            <div className="card" key={tech.title}>
              <div className={`card__icon card__icon--${tech.variant}`}>
                {tech.icon}
              </div>
              <h3 className="card__title">{tech.title}</h3>
              <p className="card__desc">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="status">
        <div className="status__card">
          <div className="status__indicator">
            <div className="status__dot" />
            <span className="status__label">Phase 4 — 3D Viewer Ready</span>
          </div>
          <p className="status__desc">
            The web-based 3D viewer with first-person controls is implemented.
            Place a reconstructed room model to explore it in the browser.
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
