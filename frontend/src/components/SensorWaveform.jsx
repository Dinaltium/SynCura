import React, { useMemo, useState } from 'react'
import { useSimulation } from '../simulationContext'

export default function SensorWaveform() {
  const { patientQueue } = useSimulation()
  const [selectedSensors, setSelectedSensors] = useState({
    HR: true,
    SpO2: true,
    Resp: true,
    Temp: true,
  })

  const sensorConfigs = {
    HR: {
      label: 'Heart Rate',
      unit: 'bpm',
      color: 'var(--color-sensor-hr, #bf3f2f)',
      min: 40,
      max: 140,
    },
    SpO2: {
      label: 'SpO2',
      unit: '%',
      color: 'var(--color-sensor-spo2, #117D8C)',
      min: 70,
      max: 100,
    },
    Resp: {
      label: 'Respiration',
      unit: 'bpm',
      color: 'var(--color-sensor-resp, #9d521d)',
      min: 8,
      max: 40,
    },
    Temp: {
      label: 'Temperature',
      unit: '°C',
      color: 'var(--color-sensor-temp, #7c3a1d)',
      min: 35,
      max: 40,
    },
  }

  const sensorOrder = ['HR', 'SpO2', 'Resp', 'Temp']

  const waveformRows = useMemo(() => {
    return patientQueue.map((patient) => {
      const series = {
        HR: patient.waveform.map((point, index) => point + Math.sin(index / 2) * 5),
        SpO2: patient.waveform.map((point, index) => 88 + (point - 50) * 0.18 - Math.cos(index / 3) * 1.1),
        Resp: patient.waveform.map((point, index) => 14 + (point - 50) * 0.1 + Math.sin(index / 4) * 0.8),
        Temp: patient.waveform.map((point, index) => 36.2 + (point - 50) * 0.03 + Math.cos(index / 5) * 0.03),
      }

      return { patient, series }
    })
  }, [patientQueue])

  const buildPath = (data, width, height, padding = 10) => {
    if (!data.length) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const usableWidth = width - padding * 2
    const usableHeight = height - padding * 2
    const scaleX = usableWidth / Math.max(1, data.length - 1)

    return data
      .map((value, index) => {
        const x = padding + index * scaleX
        const normalized = (value - min) / range
        const y = padding + usableHeight - normalized * usableHeight
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const toggleSensor = (sensor) => {
    setSelectedSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor],
    }))
  }

  return (
    <div className="sensor-waveform-page">
      {/* Header */}
      <div className="waveform-header">
        <div>
          <h1>Sensor Waveforms</h1>
          <p className="waveform-subtitle">Simulated vital-sign trends for demonstration (synthetic data, not live monitoring)</p>
        </div>
        <div className="sensor-toggles">
          {Object.keys(selectedSensors).map(sensor => (
            <button
              key={sensor}
              type="button"
              className={`sensor-toggle ${selectedSensors[sensor] ? 'active' : ''}`}
              onClick={() => toggleSensor(sensor)}
              aria-pressed={selectedSensors[sensor]}
            >
              {sensor}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Grid */}
      <div className="waveform-grid">
        {waveformRows.map(({ patient, series }) => (
          <div key={patient.patient_id} className="patient-waveform-card">
            <div className="card-header">
              <div className="patient-info">
                <strong>{patient.bed}</strong>
                <span className={`status-badge ${patient.status.toLowerCase()}`}>
                  {patient.status}
                </span>
              </div>
              <div className="risk-score">
                <span className="risk-value">{patient.risk}</span>
                <span className="risk-label">Risk</span>
              </div>
            </div>

            <div className="card-vitals">
              <span className="vital-item">HR: {patient.vitals.HR} bpm</span>
              <span className="vital-item">SpO2: {patient.vitals.SpO2}%</span>
              <span className="vital-item">RR: {patient.vitals.Resp}</span>
              <span className="vital-item">Temp: {patient.vitals.Temp}°C</span>
            </div>

            <div className="charts-container">
              {sensorOrder.filter(sensor => selectedSensors[sensor]).map((sensor) => {
                const config = sensorConfigs[sensor]
                const waveformData = series[sensor]
                const path = buildPath(waveformData, 420, 170)

                return (
                  <div key={`${patient.patient_id}-${sensor}`} className="chart-wrapper waveform-card">
                    <div className="waveform-card-header">
                      <div>
                        <strong>{config.label}</strong>
                        <p>Current value: {patient.vitals[sensor]}</p>
                      </div>
                      <span className="waveform-chip" style={{ color: config.color }}>
                        {config.unit}
                      </span>
                    </div>
                    <svg viewBox="0 0 420 170" className="waveform-svg" role="img" aria-label={`${config.label} waveform for ${patient.bed}; current value ${patient.vitals[sensor]} ${config.unit}`}>
                      <path
                        d={path}
                        className="waveform-line"
                        stroke={config.color}
                        pathLength="1"
                      />
                    </svg>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
