import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { BASE_PATIENTS, SimulationProvider, useSimulation } from './simulationContext'
import { API_URL } from './api'
import syncuraLogo from './assets/syncura-logo.png'
import usePageVisibility from './motion/usePageVisibility'
import './welcome.css'

const TrainingConfig = lazy(() => import('./components/TrainingConfig'))
const TrainingMonitor = lazy(() => import('./components/TrainingMonitor'))
const TrainingJobsList = lazy(() => import('./components/TrainingJobsList'))
const SimulatedDataFeed = lazy(() => import('./components/SimulatedDataFeed'))
const WelcomePage = lazy(() => import('./components/WelcomePage'))
const ArchitecturePage = lazy(() => import('./components/ArchitecturePage'))
const SensorWaveform = lazy(() => import('./components/SensorWaveform'))

const defaultModelStats = [
  { label: 'AUC-ROC', value: '...', tone: 'good' },
  { label: 'Accuracy', value: '...', tone: 'good' },
  { label: 'Precision', value: '...', tone: 'good' },
  { label: 'Recall', value: '...', tone: 'warn' },
]

function MiniIcon({ name }) {
  const common = {
    className: `mini-icon ${name}`,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }

  switch (name) {
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.7-9.5-9C.6 8.2 2.4 5 6 5c1.9 0 3.1 1 4 2.2C11 6 12.2 5 14 5c3.6 0 5.4 3.2 3.5 7-2.5 4.3-9.5 9-9.5 9Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'droplet':
      return (
        <svg {...common}>
          <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'lungs':
      return (
        <svg {...common}>
          <path d="M12 4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 10c-2.7 0-5.5 2.1-6.6 5.2C4.5 17.6 6 20 8.7 20c1.7 0 2.8-1 3.3-2.4.5 1.4 1.6 2.4 3.3 2.4 2.7 0 4.2-2.4 3.3-4.8C17.5 12.1 14.7 10 12 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'thermo':
      return (
        <svg {...common}>
          <path d="M10 14.8V6.5a2 2 0 1 1 4 0v8.3a4 4 0 1 1-4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 17.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" fill="currentColor" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2.6 20h18.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'sliders':
      return (
        <svg {...common}>
          <path d="M6 21v-7M6 10V3M12 21v-3M12 14V3M18 21v-9M18 8V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 14h4M10 14h4M16 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'baseline':
      return (
        <svg {...common}>
          <path d="M3 16h5l2-6 3 10 2-6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'data':
      return (
        <svg {...common}>
          <path d="M5 5h14v14H5z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'waveform':
      return (
        <svg {...common}>
          <path d="M3 13h3l2-6 4 13 3-10 2 3h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'training':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m7 15 3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'architecture':
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 9v3M6 15v-3h12v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

function SynCuraWord({ className = '' }) {
  return (
    <span className={`syncura-word ${className}`.trim()}>
      <span className="syncura-syn">Syn</span>
      <span className="syncura-cura">Cura</span>
    </span>
  )
}

function Shell({ children, theme, onToggleTheme, statusNote = 'HTTP ingest ready' }) {
  const isPageVisible = usePageVisibility()

  return (
    <div className={`app-shell theme-${theme}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="SynCura clinical intelligence">
          <img src={syncuraLogo} alt="SynCura logo" className="brand-logo" />
          <span>
            <strong><SynCuraWord /></strong>
            <small>Clinical Intelligence</small>
          </span>
        </Link>

        <nav className="nav-stack" aria-label="Primary navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MiniIcon name="dashboard" />
            Dashboard
          </NavLink>
          <NavLink to="/simulated-data" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MiniIcon name="data" />
            Simulated Data
          </NavLink>
          <NavLink to="/waveforms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MiniIcon name="waveform" />
            Waveforms
          </NavLink>
          <NavLink to="/training" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MiniIcon name="training" />
            Training
          </NavLink>
          <NavLink to="/architecture" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MiniIcon name="architecture" />
            Architecture
          </NavLink>
        </nav>

        <button type="button" className="theme-toggle-sidebar" onClick={onToggleTheme} aria-pressed={theme === 'dark'}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        <div className="sidebar-status">
          <span className={`pulse-dot motion-live-pulse ${isPageVisible ? '' : 'motion-paused'}`} aria-hidden="true" />
          <div>
            <strong>Live vitals stream</strong>
            <small>{statusNote}</small>
          </div>
        </div>
      </aside>
      <main className="main-surface motion-route-enter" id="main-content" tabIndex="-1">{children}</main>
    </div>
  )
}

function Sparkline({ points, patientId, bed }) {
  const width = 148
  const height = 44
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const flat = max === min
  const scaleX = width / (points.length - 1)
  const scaleY = (value) => flat ? height / 2 : height - ((value - min) / range) * height
  const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * scaleX} ${scaleY(point)}`).join(' ')
  const label = patientId ? `Risk trend for patient ${patientId}${bed ? ` in ${bed}` : ''}` : 'Risk trend'

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={d} />
    </svg>
  )
}

function ExplainabilityWaveform({ points }) {
  const width = 280
  const height = 86
  const min = Math.min(...points)
  const max = Math.max(...points)
  const scaleX = width / Math.max(1, points.length - 1)
  const scaleY = (value) => height - ((value - min) / (max - min || 1)) * height
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * scaleX} ${scaleY(point)}`).join(' ')

  const explainBand = (value) => {
    if (value >= 80) return { label: 'SpO2 drop pattern', tone: 'spo2', symbol: '●' }
    if (value >= 65) return { label: 'Respiratory strain', tone: 'resp', symbol: '▲' }
    if (value >= 45) return { label: 'Cardiac stress', tone: 'hr', symbol: '■' }
    return { label: 'Thermal/inflammatory drift', tone: 'temp', symbol: '◆' }
  }

  return (
    <div className="explainability-waveform">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Synthetic contribution preview waveform by vital band">
        <path d={path} className="wave-line" />
        {points.map((point, index) => {
          const x = index * scaleX
          const y = scaleY(point)
          const band = explainBand(point)
          return (
            <g key={`${point}-${index}`}>
              <title>{`${band.label}: ${Math.round(point)}`}</title>
              <circle cx={x} cy={y} r="4" className={`wave-dot ${band.tone}`} />
              <text x={x} y={y - 8} textAnchor="middle" fontSize="8" aria-hidden="true" className="wave-symbol">{band.symbol}</text>
            </g>
          )
        })}
      </svg>
      <ul className="wave-legend" aria-label="Vital band key">
        <li className="pill spo2"><span aria-hidden="true">● </span>SpO2-related</li>
        <li className="pill resp"><span aria-hidden="true">▲ </span>Resp-related</li>
        <li className="pill hr"><span aria-hidden="true">■ </span>HR-related</li>
        <li className="pill temp"><span aria-hidden="true">◆ </span>Temp-related</li>
      </ul>
    </div>
  )
}

function RiskDial({ value, patientId }) {
  const normalized = Math.min(100, Math.max(0, value))
  const label = patientId
    ? `Deterioration risk ${value} percent for patient ${patientId}`
    : `Deterioration risk ${value} percent`
  return (
    <div className="risk-dial" role="img" aria-label={label} style={{ '--risk': `${normalized * 3.6}deg` }}>
      <span aria-hidden="true">{value}</span>
    </div>
  )
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function scoreContributions(vitals) {
  const contributions = [
    { name: 'Heart Rate', value: (vitals.HR - 85) * 0.24 },
    { name: 'SpO2 Saturation', value: (92 - vitals.SpO2) * 1.7 },
    { name: 'Respiratory Rate', value: (vitals.Resp - 18) * 0.6 },
    { name: 'Temperature', value: (vitals.Temp - 37) * 4.5 },
  ]
  const total = contributions.reduce((sum, metric) => sum + metric.value, 0)
  return {
    total,
    metrics: contributions.map((metric) => ({
      ...metric,
      points: Number((metric.value * 0.05).toFixed(2)),
    })),
  }
}

function buildAlerts(patients) {
  const alerts = []
  patients.forEach((patient) => {
    if (patient.risk >= 90) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'critical',
        text: `Patient ${patient.patient_id} at ${patient.risk}% risk - immediate bedside review needed.`
      })
      return
    }
    if (patient.vitals.SpO2 <= 88) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'warning',
        text: `Patient ${patient.patient_id} has low SpO2 (${patient.vitals.SpO2}%).`
      })
    }
    if (patient.vitals.Resp >= 30) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'warning',
        text: `Patient ${patient.patient_id} respiratory rate elevated (${patient.vitals.Resp}/min).`
      })
    }
    if (patient.vitals.Temp >= 39) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'info',
        text: `Patient ${patient.patient_id} temperature trend suggests infection (${patient.vitals.Temp} C).`
      })
    }
  })
  return alerts.slice(0, 5)
}

function calculateNews2(patient) {
  let score = 0
  const { HR, Resp, Temp, SpO2 } = patient.vitals
  if (Resp <= 8 || Resp >= 25) score += 3
  else if (Resp >= 21) score += 2
  else if (Resp >= 9 && Resp <= 11) score += 1

  if (SpO2 <= 91) score += 3
  else if (SpO2 <= 93) score += 2
  else if (SpO2 <= 95) score += 1

  if (Temp <= 35) score += 3
  else if (Temp >= 39.1) score += 2
  else if (Temp >= 38.1) score += 1

  if (HR <= 40 || HR >= 131) score += 3
  else if (HR >= 111) score += 2
  else if (HR >= 91 || HR <= 50) score += 1
  return score
}

function hasDeteriorationEvent(patient) {
  return patient.vitals.SpO2 <= 90 || patient.vitals.Resp >= 30 || patient.vitals.Temp >= 39.2 || patient.risk >= 88
}

function classificationStats(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.predicted && row.actual) acc.tp += 1
      else if (row.predicted && !row.actual) acc.fp += 1
      else if (!row.predicted && row.actual) acc.fn += 1
      else acc.tn += 1
      return acc
    },
    { tp: 0, fp: 0, tn: 0, fn: 0 }
  )

  const sensitivity = totals.tp + totals.fn ? totals.tp / (totals.tp + totals.fn) : 0
  const specificity = totals.tn + totals.fp ? totals.tn / (totals.tn + totals.fp) : 0
  const precision = totals.tp + totals.fp ? totals.tp / (totals.tp + totals.fp) : 0

  return {
    ...totals,
    sensitivity: Number((sensitivity * 100).toFixed(1)),
    specificity: Number((specificity * 100).toFixed(1)),
    precision: Number((precision * 100).toFixed(1)),
  }
}

function Dashboard({ theme, onToggleTheme }) {
  const {
    activeScenario,
    activeScenarioLabel,
    scenarioEntries,
    patientQueue,
    lastUpdated,
    isPaused,
    setActiveScenario,
    toggleSimulation,
    resetSimulation,
  } = useSimulation()
  const [selectedPatientId, setSelectedPatientId] = useState(BASE_PATIENTS[0].patient_id)
  const [alertThreshold, setAlertThreshold] = useState(75)
  const [liveModelStats, setLiveModelStats] = useState(defaultModelStats)
  const [metricsError, setMetricsError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setLiveModelStats([
            { label: 'AUC-ROC', value: data.auc != null ? data.auc.toFixed(3) : '...', tone: 'good' },
            { label: 'Accuracy', value: data.accuracy != null ? (data.accuracy * 100).toFixed(1) + '%' : '...', tone: 'good' },
            { label: 'Precision', value: data.precision != null ? (data.precision * 100).toFixed(1) + '%' : '...', tone: 'good' },
            { label: 'Recall', value: data.recall != null ? (data.recall * 100).toFixed(1) + '%' : '...', tone: data.recall < 0.7 ? 'warn' : 'good' },
          ])
        }
      })
      .catch(() => { setMetricsError(true) })
  }, [])

  const sortedQueue = useMemo(
    () => [...patientQueue].sort((a, b) => b.risk - a.risk),
    [patientQueue]
  )
  const criticalCount = patientQueue.filter((patient) => patient.risk >= 75).length
  const alertItems = useMemo(() => buildAlerts(patientQueue), [patientQueue])
  const selectedPatient = patientQueue.find((patient) => patient.patient_id === selectedPatientId) || patientQueue[0]
  const impactMetrics = selectedPatient ? scoreContributions(selectedPatient.vitals).metrics : []
  const currentNews2 = selectedPatient ? calculateNews2(selectedPatient) : 0

  const modelRows = useMemo(
    () =>
      patientQueue.map((patient) => ({
        actual: hasDeteriorationEvent(patient),
        predicted: patient.risk >= alertThreshold,
      })),
    [patientQueue, alertThreshold]
  )
  const news2Rows = useMemo(
    () =>
      patientQueue.map((patient) => ({
        actual: hasDeteriorationEvent(patient),
        predicted: calculateNews2(patient) >= 7,
      })),
    [patientQueue]
  )

  const modelPerf = useMemo(() => classificationStats(modelRows), [modelRows])
  const news2Perf = useMemo(() => classificationStats(news2Rows), [news2Rows])
  const averageLeadTime = useMemo(() => {
    const lead = patientQueue.map((patient) => clamp((100 - patient.risk) / 12, 0.5, 6))
    return (lead.reduce((sum, val) => sum + val, 0) / lead.length).toFixed(1)
  }, [patientQueue])

  useEffect(() => {
    if (!patientQueue.some((patient) => patient.patient_id === selectedPatientId)) {
      setSelectedPatientId(patientQueue[0]?.patient_id)
    }
  }, [patientQueue, selectedPatientId])

  // NOTE: Discord delivery is backend-only (POST /ingest -> webhook).
  // The browser never holds a webhook secret. Alert cooldowns below are
  // display-only; the backend enforces the real per-patient cooldown.

  return (
    <Shell theme={theme} onToggleTheme={onToggleTheme} statusNote={isPaused ? 'Paused — resume to stream' : 'HTTP ingest ready'}>
      <section className="page-header">
        <div>
          <p className="eyebrow">Real-time patient intelligence</p>
          <h1><SynCuraWord /> Dashboard</h1>
        </div>
        <div className="header-actions">
          <Link to="/training/new" className="button secondary">New model run</Link>
          <Link to="/training" className="button primary">View training</Link>
        </div>
      </section>

      <section className="summary-grid" aria-label="Operational summary">
        <article className="summary-tile danger">
          <span className="tile-label"><MiniIcon name="alert" />High acuity</span>
          <strong>{criticalCount}</strong>
          <small>patients need review</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label"><MiniIcon name="baseline" />Patients tracked</span>
          <strong>{patientQueue.length}</strong>
          <small>across ICU beds (simulated)</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label"><MiniIcon name="sliders" />Average lead time</span>
          <strong>{averageLeadTime}h</strong>
          <small>simulated, before deterioration</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label"><MiniIcon name="alert" />False alarms now</span>
          <strong>{modelPerf.fp}</strong>
          <small>at threshold {'>='} {alertThreshold} (simulated)</small>
        </article>
      </section>

      <div className="simulation-banner" role="note" aria-label="Simulation disclaimer">
        <strong>Simulation mode — synthetic data.</strong>
        <span> Patient vitals, risk scores, explanations, NEWS2 comparison and lead times on this
        dashboard are generated locally for demonstration, not live outputs of the trained model.
        Model metrics (AUC 0.844 holdout) come from the offline PhysioNet evaluation.</span>
      </div>

      <section className="scenario-panel" aria-label="Scenario simulation controls">
        <div>
          <h2 className="scenario-heading">Simulation Scenarios</h2>
          <p>
            Now running: {activeScenarioLabel}
            {isPaused ? ' (paused)' : ' (live)'}
          </p>
        </div>
        <div className="scenario-controls">
          <div className="scenario-buttons">
            {scenarioEntries.map(([scenarioKey, scenario]) => (
              <button
                key={scenarioKey}
                type="button"
                className={`scenario-button ${activeScenario === scenarioKey ? 'active' : ''}`}
                onClick={() => setActiveScenario(scenarioKey)}
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <div className="simulation-actions">
            <button
              type="button"
              className="scenario-button action"
              onClick={toggleSimulation}
            >
              {isPaused ? 'Start Simulation' : 'Pause Simulation'}
            </button>
            <button
              type="button"
              className="scenario-button action"
              onClick={resetSimulation}
            >
              Reset to Baseline
            </button>
          </div>
        </div>
      </section>

      <section className="alerts-panel" aria-label="Real-time alerts" aria-live="polite">
        <div className="panel-heading compact">
          <h2 className="heading-with-icon"><MiniIcon name="alert" />Live Alerts</h2>
          <span className="model-badge">{alertItems.length} active</span>
        </div>
        {alertItems.length === 0 ? (
          <p className="alerts-empty">No threshold breaches. Monitoring continues.</p>
        ) : (
          <div className="alerts-list">
            {alertItems.map((alert, idx) => (
              <article key={`${alert.text}-${idx}`} className={`alert-item ${alert.level}`}>
                {alert.text}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="analytics-grid" aria-label="Model analytics and threshold tuning">
        <article className="panel analytics-panel">
          <div className="panel-heading compact">
            <h2 className="heading-with-icon"><MiniIcon name="sliders" />Threshold Tuning</h2>
            <span className="model-badge">Alert {'>='} {alertThreshold}</span>
          </div>
          <label className="slider-label" htmlFor="alert-threshold">
            Risk threshold ({alertThreshold})
          </label>
          <input
            id="alert-threshold"
            type="range"
            min="50"
            max="95"
            step="1"
            value={alertThreshold}
            onChange={(event) => setAlertThreshold(Number(event.target.value))}
          />
          <div className="metric-grid tuning">
            <div className="metric-card good">
              <span>Sensitivity</span>
              <strong>{modelPerf.sensitivity}%</strong>
            </div>
            <div className="metric-card good">
              <span>Specificity</span>
              <strong>{modelPerf.specificity}%</strong>
            </div>
            <div className="metric-card">
              <span>Precision</span>
              <strong>{modelPerf.precision}%</strong>
            </div>
            <div className="metric-card">
              <span>False alarms</span>
              <strong>{modelPerf.fp}</strong>
            </div>
          </div>
        </article>

        <article className="panel analytics-panel">
          <div className="panel-heading compact">
            <h2 className="heading-with-icon"><MiniIcon name="baseline" />NEWS2 Baseline vs Model</h2>
            <span className="model-badge">Lead time {averageLeadTime}h</span>
          </div>
          <div className="compare-grid">
            <div>
              <h3>AI Model</h3>
              <p>Sensitivity {modelPerf.sensitivity}% | Specificity {modelPerf.specificity}%</p>
            </div>
            <div>
                <h3>NEWS2 ({'>='}7)</h3>
              <p>Sensitivity {news2Perf.sensitivity}% | Specificity {news2Perf.specificity}%</p>
            </div>
          </div>
          <small className="timestamp">Selected patient NEWS2 score: {currentNews2}</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="panel patient-panel">
          <div className="panel-heading">
            <div>
              <h2>Ranked Patient Risk</h2>
              <p>Sorted by deterioration probability</p>
            </div>
            <span className="timestamp">Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>

          <div className="patient-list">
            {sortedQueue.map((patient) => (
              <article className="patient-row" key={patient.patient_id}>
                <div className="patient-identity">
                  <span className={`status-pill ${patient.status.toLowerCase()}`}>{patient.status}</span>
                  <strong>{patient.bed}</strong>
                  <small>Patient {patient.patient_id}</small>
                </div>
                <Sparkline points={patient.waveform} patientId={patient.patient_id} bed={patient.bed} />
                <div className="vital-strip" aria-label={`Vitals for patient ${patient.patient_id}`}>
                  <span><span className="vital-label"><MiniIcon name="heart" />HR</span> <b>{patient.vitals.HR}</b></span>
                  <span><span className="vital-label"><MiniIcon name="droplet" />SpO2</span> <b>{patient.vitals.SpO2}</b></span>
                  <span><span className="vital-label"><MiniIcon name="lungs" />RR</span> <b>{patient.vitals.Resp}</b></span>
                  <span><span className="vital-label"><MiniIcon name="thermo" />T</span> <b>{patient.vitals.Temp}</b></span>
                </div>
                <div className="risk-block">
                  <RiskDial value={patient.risk} patientId={patient.patient_id} />
                  <small>{patient.trend} trend</small>
                </div>
                <div className="lead-signal">{patient.lead}</div>
                <button
                  type="button"
                  className={`inspect-button ${selectedPatientId === patient.patient_id ? 'active' : ''}`}
                  onClick={() => setSelectedPatientId(patient.patient_id)}
                >
                  Inspect impact
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel insight-panel">
          <div className="panel-heading compact">
            <h2>Model Snapshot</h2>
            <span className="model-badge">3-model ensemble</span>
          </div>
          {metricsError && (
            <p className="metrics-note" role="note">Offline metrics unavailable — showing placeholders. Start the backend API to load them.</p>
          )}
          <div className="metric-grid">
            {liveModelStats.map((stat) => (
              <div className={`metric-card ${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="divider" />

          <h3>Risk Impact - Patient {selectedPatient?.patient_id} <small className="synthetic-tag">(synthetic preview, not attention/SHAP)</small></h3>
          <ExplainabilityWaveform points={selectedPatient?.waveform || []} />
          <div className="signal-list">
            {impactMetrics.map((metric) => (
              <div className="signal-row" key={metric.name}>
                <div>
                  <span>{metric.name}</span>
                  <small>{metric.points >= 0 ? '+' : ''}{metric.points} risk points</small>
                </div>
                <div className={`bar-track impact ${metric.points >= 0 ? 'up' : 'down'}`}>
                  <span style={{ width: `${Math.min(100, Math.abs(metric.value) * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </Shell>
  )
}

function RoutedPage({ children, theme, onToggleTheme }) {
  return <Shell theme={theme} onToggleTheme={onToggleTheme}>{children}</Shell>
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('syncura-theme')
    return storedTheme === 'dark' ? 'dark' : 'light'
  })
  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  useEffect(() => {
    localStorage.setItem('syncura-theme', theme)
  }, [theme])

  return (
    <SimulationProvider>
      <BrowserRouter>
        <Suspense fallback={<main className="main-surface" aria-label="Loading page"><p>Loading…</p></main>}>
        <Routes>
          <Route path="/" element={<WelcomePage theme={theme} onToggleTheme={toggleTheme} />} />
          <Route
            path="/dashboard"
            element={<Dashboard theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/simulated-data"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><SimulatedDataFeed /></RoutedPage>}
          />
          <Route
            path="/training"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingJobsList /></RoutedPage>}
          />
          <Route
            path="/training/new"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingConfig /></RoutedPage>}
          />
          <Route
            path="/training/:jobId"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingMonitor /></RoutedPage>}
          />
          <Route
            path="/architecture"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><ArchitecturePage /></RoutedPage>}
          />
          <Route
            path="/waveforms"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><SensorWaveform /></RoutedPage>}
          />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </SimulationProvider>
  )
}
