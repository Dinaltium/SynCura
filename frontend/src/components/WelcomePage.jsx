import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import syncuraLogo from '../assets/syncura-logo.png'
import ArchitecturePage from './ArchitecturePage'
import usePageVisibility from '../motion/usePageVisibility'

function SynCuraWord({ className = '' }) {
  return (
    <span className={`syncura-word ${className}`.trim()}>
      <span className="syncura-syn">Syn</span>
      <span className="syncura-cura">Cura</span>
    </span>
  )
}

export default function WelcomePage({ theme, onToggleTheme }) {
  const [bpm, setBpm] = useState(72)
  const [riskTarget, setRiskTarget] = useState(84)
  const [riskPercent, setRiskPercent] = useState(0)
  const isPageVisible = usePageVisibility()

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      setBpm((currentBpm) => {
        const direction = Math.random() > 0.5 ? 1 : -1
        const driftToRestingRange = currentBpm < 72 ? 1 : currentBpm > 80 ? -1 : direction
        const step = Math.random() > 0.86 ? 2 : 1
        return Math.max(68, Math.min(84, currentBpm + driftToRestingRange * step))
      })
    }, 2400)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      setRiskTarget((currentRisk) => {
        const direction = Math.random() > 0.45 ? 1 : -1
        const nextRisk = currentRisk + direction * (Math.random() > 0.5 ? 1 : 2)
        return Math.max(76, Math.min(94, nextRisk))
      })
    }, 4200)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let frameId = 0
    const duration = 1800
    let startTime = 0

    setRiskPercent(0)

    const animateRisk = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setRiskPercent(Math.round(riskTarget * progress))
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animateRisk)
      }
    }

    frameId = window.requestAnimationFrame(animateRisk)
    return () => window.cancelAnimationFrame(frameId)
  }, [riskTarget])

  return (
    <div className={`welcome-container theme-${theme}${isPageVisible ? '' : ' page-hidden'}`}>
      {/* Navigation Bar */}
      <nav className="welcome-nav">
        <div className="welcome-nav-content">
          <Link to="/" className="welcome-logo">
            <img src={syncuraLogo} alt="SynCura logo" className="welcome-logo-icon" />
            <span className="welcome-brand-name"><SynCuraWord /></span>
          </Link>
          <div className="welcome-nav-links">
            <a href="#features" className="welcome-nav-link">Features</a>
            <a href="#tech" className="welcome-nav-link">Tech Stack</a>
            <a href="#about" className="welcome-nav-link">About</a>
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="welcome-hero-content">
          <div className="welcome-hero-text">
            <span className="welcome-badge">
              <span className="badge-dot"></span>
              Software-Only ICU Monitoring
            </span>
            <h1 className="welcome-headline">
              Predictive Clinical
              <br />
              <span className="highlight">Intelligence.</span>
            </h1>
            <p className="welcome-subheadline">
              Bridging the gap between raw medical data and life-saving decisions. <SynCuraWord /> provides an end-to-end framework for ML-powered ICU patient monitoring and outcome prediction.
            </p>
            <div className="welcome-cta-group">
              <Link to="/dashboard" className="welcome-btn welcome-btn-primary">
                Explore Features →
              </Link>
              <a href="#architecture" className="welcome-btn welcome-btn-secondary">
                See Architecture
              </a>
            </div>
          </div>

          {/* Sample Dashboard Preview (synthetic demo, not live inference) */}
          <div className="welcome-preview">
            <div className="preview-header">
              <span className="preview-badge">SAMPLE PREVIEW: SYNTHETIC PATIENT #4012</span>
              <span className="preview-status" aria-hidden="true">●</span>
            </div>

            <div className="preview-content">
              <div className="preview-metrics">
                <div className="metric-card metric-accent">
                  <div className="metric-wave" aria-hidden="true">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                      <polyline
                        points="0,15 10,10 20,8 30,12 40,6 50,15 60,12 70,10 80,14 90,8 100,12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <div className="metric-value bpm-live" aria-live="off">{bpm} BPM</div>
                </div>
              </div>

              <div className="preview-risk">
                <div className="risk-header">RISK ASSESSMENT</div>
                <div className="risk-item">
                  <div className="risk-label risk-percent-live">{riskPercent}% Sepsis</div>
                  <div className="risk-bar">
                    <div className="risk-fill risk-fill-live" style={{ '--risk-scale': riskPercent / 100 }}></div>
                  </div>
                  <div className="risk-time">Simulated preview — not a clinical prediction</div>
                </div>
              </div>
            </div>

            <div className="preview-footer">
              <span className="footer-tag">SYNTHETIC DEMO — NO MODEL INFERENCE</span>
            </div>
          </div>

          {/* Model Accuracy Badge */}
          <div className="accuracy-badge">
            <div className="accuracy-content">
              <svg className="accuracy-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22C6.48 22 2 17.52 2 12s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div className="accuracy-label">Holdout AUC (research prototype)</div>
                <div className="accuracy-value">84.4%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="welcome-features" id="features">
        <h2>What the prototype shows</h2>
        <p className="section-answer">SynCura presents a synthetic ICU patient queue, local risk simulation, vital trends, explainability signals, NEWS2 comparison, and model-training workflows in one browser-based research prototype.</p>
        <div className="feature-list">
          <article className="feature-row">
            <span className="feature-row-label">Workflow</span>
            <div>
              <h3>Queue-first monitoring</h3>
              <p>Review simulated patient state, risk, vitals, trends, and alerts from a ranked operational surface.</p>
            </div>
          </article>
          <article className="feature-row">
            <span className="feature-row-label">Model</span>
            <div>
              <h3>Three-model ensemble</h3>
              <p>Explore the documented attention-based LSTM workflow using 12 features and 90-minute windows.</p>
            </div>
          </article>
          <article className="feature-row">
            <span className="feature-row-label">Evidence</span>
            <div>
              <h3>84.4% holdout AUC</h3>
              <p>Research-prototype holdout result from unseen set-B windows, with the evaluation caveats retained.</p>
            </div>
          </article>
          <article className="feature-row">
            <span className="feature-row-label">Review</span>
            <div>
              <h3>Explainability beside prediction</h3>
              <p>Inspect synthetic risk impact, hand-built SVG trends, and NEWS2 comparison without leaving the workflow.</p>
            </div>
          </article>
        </div>
      </section>

      {/* Embedded Architecture Preview */}
      <section className="welcome-architecture">
        <ArchitecturePage embedded={true} />
      </section>

      {/* CTA Section */}
      <section className="welcome-cta">
        <h2>Open the simulated dashboard</h2>
        <p>Review the synthetic patient queue, scenario controls, and model-facing views in the browser.</p>
        <Link to="/dashboard" className="welcome-btn welcome-btn-primary welcome-btn-large">
          View dashboard
        </Link>
      </section>
    </div>
  )
}
