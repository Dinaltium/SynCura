import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function ArchitectureIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }

  const paths = {
    architecture: <><rect x="9" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M12 9v3M6 15v-3h12v3" /></>,
    data: <><path d="M5 5h14v14H5z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    process: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="4" /></>,
    model: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="7" /></>,
    alert: <><path d="M12 3 3 20h18L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
    metric: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
  }

  return <svg {...common} className="architecture-icon" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.architecture}</svg>
}

export default function ArchitecturePage({ embedded = false }) {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div id={embedded ? 'architecture' : undefined} className={`architecture-container ${embedded ? 'embedded' : ''}`}>
      {/* Navigation (hide when embedded) */}
      {!embedded && (
        <nav className="arch-nav">
          <Link to="/" className="arch-back">
            ← Back to Home
          </Link>
        </nav>
      )}

      {/* Hero */}
      <section className="arch-hero">
        <div className="arch-hero-content">
          <div className="arch-hero-badge"><ArchitectureIcon name="architecture" /> SYSTEM ARCHITECTURE</div>
          <h1>End-to-End ML Pipeline</h1>
          <p className="arch-subtitle">
            Research-prototype ICU monitoring demo with simulated vitals and offline-evaluated predictions
          </p>
        </div>
        <div className="arch-hero-stats">
          <div className="stat-item">
            <span className="stat-number">84.4%</span>
            <span className="stat-label">Holdout AUC (research)</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">8,000</span>
            <span className="stat-label">PhysioNet patients</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">CPU</span>
            <span className="stat-label">Real-time inference</span>
          </div>
        </div>
      </section>

      {/* Architecture Overview - Data Flow */}
      <section className="arch-section">
        <div className="section-header">
          <h2><ArchitectureIcon name="data" /> Data Flow Pipeline</h2>
          <p className="section-desc">Real-time ingestion → Preprocessing → Inference → Risk Scoring</p>
        </div>
        <div className="arch-pipeline">
          <div className="pipeline-stage stage-1">
            <div className="stage-icon"><ArchitectureIcon name="data" /></div>
            <h3>Data Ingestion</h3>
            <p>Real-time vitals from bedside monitors via MQTT or HTTP endpoints</p>
            <div className="stage-tech">MQTT • HTTP • WebSocket</div>
          </div>
          
          <div className="pipeline-connector" aria-hidden="true">
            <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
              <path d="M 10 20 Q 50 0, 90 20" stroke="currentColor" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
            </svg>
          </div>

          <div className="pipeline-stage stage-2">
            <div className="stage-icon"><ArchitectureIcon name="process" /></div>
            <h3>Preprocessing</h3>
            <p>Normalization, feature engineering, temporal windowing</p>
            <div className="stage-tech">Feature Engineering • Windowing</div>
          </div>

          <div className="pipeline-connector" aria-hidden="true">
            <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
              <path d="M 10 20 Q 50 0, 90 20" stroke="currentColor" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)" />
            </svg>
          </div>

          <div className="pipeline-stage stage-3">
            <div className="stage-icon"><ArchitectureIcon name="model" /></div>
            <h3>LSTM Inference</h3>
            <p>Deep learning inference for outcome prediction</p>
            <div className="stage-tech">PyTorch • LSTM • GPU Ready</div>
          </div>

          <div className="pipeline-connector" aria-hidden="true">
            <svg viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
              <path d="M 10 20 Q 50 0, 90 20" stroke="currentColor" strokeWidth="2" fill="none" markerEnd="url(#arrowhead3)" />
            </svg>
          </div>

          <div className="pipeline-stage stage-4">
            <div className="stage-icon"><ArchitectureIcon name="alert" /></div>
            <h3>Risk Scoring</h3>
            <p>Probabilistic predictions with clinical alerts & Discord notifications</p>
            <div className="stage-tech">NEWS2 • SHAP • Webhooks</div>
          </div>
        </div>
      </section>

      {/* Technology Stack - Interactive */}
      <section className="arch-section">
        <div className="section-header">
          <h2><ArchitectureIcon name="process" /> Technology Stack</h2>
          <p className="section-desc">Research-prototype stack for demonstration and evaluation</p>
        </div>
        <div className="tech-stack-grid">
          <div className={`tech-card expandable ${expandedSections.backend ? 'expanded' : ''}`}>
            <button type="button" className="tech-card-header" onClick={() => toggleSection('backend')} aria-expanded={Boolean(expandedSections.backend)} aria-controls="architecture-backend-details">
              <div className="tech-icon"><ArchitectureIcon name="process" /></div>
              <div className="tech-title">Backend</div>
              <div className="expand-icon" aria-hidden="true">{expandedSections.backend ? '−' : '+'}</div>
            </button>
            {expandedSections.backend && (
              <div className="tech-card-body" id="architecture-backend-details">
                <div className="tech-item">
                  <span className="tech-name">FastAPI</span>
                  <span className="tech-role">REST endpoints & async I/O</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">PyTorch</span>
                  <span className="tech-role">LSTM inference engine</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">SQLite</span>
                  <span className="tech-role">Patient data persistence</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">MQTT</span>
                  <span className="tech-role">Real-time vital streaming</span>
                </div>
              </div>
            )}
          </div>

          <div className={`tech-card expandable ${expandedSections.frontend ? 'expanded' : ''}`}>
            <button type="button" className="tech-card-header" onClick={() => toggleSection('frontend')} aria-expanded={Boolean(expandedSections.frontend)} aria-controls="architecture-frontend-details">
              <div className="tech-icon"><ArchitectureIcon name="architecture" /></div>
              <div className="tech-title">Frontend</div>
              <div className="expand-icon" aria-hidden="true">{expandedSections.frontend ? '−' : '+'}</div>
            </button>
            {expandedSections.frontend && (
              <div className="tech-card-body" id="architecture-frontend-details">
                <div className="tech-item">
                  <span className="tech-name">React 18</span>
                  <span className="tech-role">UI component framework</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">Vite</span>
                  <span className="tech-role">Next-gen build tooling</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">React Router</span>
                  <span className="tech-role">Client-side navigation</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">Tailwind CSS</span>
                  <span className="tech-role">Responsive styling</span>
                </div>
              </div>
            )}
          </div>

          <div className={`tech-card expandable ${expandedSections.ml ? 'expanded' : ''}`}>
            <button type="button" className="tech-card-header" onClick={() => toggleSection('ml')} aria-expanded={Boolean(expandedSections.ml)} aria-controls="architecture-ml-details">
              <div className="tech-icon"><ArchitectureIcon name="model" /></div>
              <div className="tech-title">ML Pipeline</div>
              <div className="expand-icon" aria-hidden="true">{expandedSections.ml ? '−' : '+'}</div>
            </button>
            {expandedSections.ml && (
              <div className="tech-card-body" id="architecture-ml-details">
                <div className="tech-item">
                  <span className="tech-name">LSTM Networks</span>
                  <span className="tech-role">Time-series outcome prediction</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">PhysioNet</span>
                  <span className="tech-role">8,000-patient PhysioNet 2012 dataset</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">SHAP</span>
                  <span className="tech-role">Model explainability & transparency</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">NEWS2</span>
                  <span className="tech-role">Clinical risk scoring standard</span>
                </div>
              </div>
            )}
          </div>

          <div className={`tech-card expandable ${expandedSections.hardware ? 'expanded' : ''}`}>
            <button type="button" className="tech-card-header" onClick={() => toggleSection('hardware')} aria-expanded={Boolean(expandedSections.hardware)} aria-controls="architecture-hardware-details">
              <div className="tech-icon"><ArchitectureIcon name="data" /></div>
              <div className="tech-title">Hardware</div>
              <div className="expand-icon" aria-hidden="true">{expandedSections.hardware ? '−' : '+'}</div>
            </button>
            {expandedSections.hardware && (
              <div className="tech-card-body" id="architecture-hardware-details">
                <div className="tech-item">
                  <span className="tech-name">ESP32-MAX30105</span>
                  <span className="tech-role">Advanced pulse/SpO2 sensor</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">WiFi/MQTT Protocol</span>
                  <span className="tech-role">Decentralized data collection</span>
                </div>
                <div className="tech-item">
                  <span className="tech-name">Edge Computing</span>
                  <span className="tech-role">On-device inference ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Model Performance */}
      <section className="arch-section">
        <div className="section-header">
          <h2><ArchitectureIcon name="metric" /> Model Performance Metrics</h2>
          <p className="section-desc">Evaluated on PhysioNet 2012 (8,000 patients; val AUC 0.840, holdout AUC 0.844)</p>
        </div>
        <div className="metrics-showcase">
          <div className="metric-box metric-primary">
            <div className="metric-icon"><ArchitectureIcon name="metric" /></div>
            <div className="metric-value">84.4%</div>
            <div className="metric-name">Holdout AUC (95% CI 0.836–0.852)</div>
            <div className="metric-bar"><div style={{'--metric-scale': 0.844}}></div></div>
          </div>
          <div className="metric-box">
            <div className="metric-icon"><ArchitectureIcon name="metric" /></div>
            <div className="metric-value">74.7%</div>
            <div className="metric-name">Holdout Accuracy</div>
            <div className="metric-bar"><div style={{'--metric-scale': 0.747}}></div></div>
          </div>
          <div className="metric-box">
            <div className="metric-icon"><ArchitectureIcon name="metric" /></div>
            <div className="metric-value">34.5%</div>
            <div className="metric-name">Holdout Precision</div>
            <div className="metric-bar"><div style={{'--metric-scale': 0.345}}></div></div>
          </div>
          <div className="metric-box">
            <div className="metric-icon"><ArchitectureIcon name="alert" /></div>
            <div className="metric-value">80.7%</div>
            <div className="metric-name">Holdout Recall</div>
            <div className="metric-bar"><div style={{'--metric-scale': 0.807}}></div></div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="arch-section features-section">
        <div className="section-header">
          <h2><ArchitectureIcon name="architecture" /> Key Features</h2>
          <p className="section-desc">Enterprise-grade monitoring and AI-driven insights</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-number">01</div>
            <div className="feature-icon" aria-hidden="true">🔍</div>
            <h3>Simulated Monitoring</h3>
            <p>Synthetic patient vitals generated locally for demonstration (not live bedside data)</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">02</div>
            <div className="feature-icon"><ArchitectureIcon name="model" /></div>
            <h3>AI-Powered Predictions</h3>
            <p>LSTM ensemble trained on PhysioNet 2012 ICU data (research prototype)</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">03</div>
            <div className="feature-icon" aria-hidden="true">📊</div>
            <h3>Clinical Transparency</h3>
            <p>SHAP-based explainability showing which vitals drive each prediction</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">04</div>
            <div className="feature-icon" aria-hidden="true">⚡</div>
            <h3>Scalable Pipeline</h3>
            <p>Microservices architecture supporting high-throughput multi-patient monitoring</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">05</div>
            <div className="feature-icon" aria-hidden="true">🔐</div>
            <h3>Research-Prototype Security</h3>
            <p>Local demo only: no auth, no encryption, no audit logging — not HIPAA-ready</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">06</div>
            <div className="feature-icon" aria-hidden="true">📱</div>
            <h3>Edge Computing Ready</h3>
            <p>Sensor integration with ESP32 for decentralized patient monitoring</p>
          </div>
        </div>
      </section>


      {/* Deployment & Infrastructure */}
      <section className="arch-section deployment-section">
        <div className="section-header">
          <h2><span aria-hidden="true">🚀 </span>Deployment & Infrastructure</h2>
          <p className="section-desc">Development, staging, and production configurations</p>
        </div>
        <div className="deployment-grid">
          <div className="deployment-card">
            <div className="deployment-icon" aria-hidden="true">💻</div>
            <h3>Development</h3>
            <p>Local development with hot-reload and real-time debugging</p>
            <div className="deployment-code">
              npm run dev + python app.py
            </div>
          </div>
          <div className="deployment-card">
            <div className="deployment-icon"><ArchitectureIcon name="process" /></div>
            <h3>Production Ready</h3>
            <p>Docker containerization, CI/CD pipelines, cloud deployment</p>
            <div className="deployment-code">
              Docker + GitHub Actions
            </div>
          </div>
          <div className="deployment-card">
            <div className="deployment-icon" aria-hidden="true">🌐</div>
            <h3>Cloud Deployment</h3>
            <p>AWS/GCP/Azure ready with Kubernetes orchestration</p>
            <div className="deployment-code">
              K8s + Helm charts
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="arch-cta">
        <div className="cta-content">
          <h2><span aria-hidden="true">🎯 </span>Ready to Explore?</h2>
          <p>Launch the interactive dashboard to see the system in action</p>
          <Link to="/dashboard" className="cta-button">
            Launch Dashboard <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
