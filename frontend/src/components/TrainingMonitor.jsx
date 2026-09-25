import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingMonitor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fetch initial job state
    const fetchJob = async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/${jobId}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, apiUrl]);

  // Poll for progress updates every 2 seconds while job is running
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/${jobId}`);
        setJob(response.data);
        
        // Track progress history for visualization (capped to avoid unbounded growth)
        if (response.data.metrics) {
          setProgressHistory(prev => [...prev, response.data.metrics].slice(-200));
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [job, jobId, apiUrl]);

  if (loading) {
    return (
      <div className="training-page min-h-screen p-8 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="training-spinner animate-spin rounded-full h-16 w-16 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading training job...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-page min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="training-panel bg-white rounded-lg shadow-lg p-8">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4" role="alert">
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => navigate('/training')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = job.total_epochs > 0 
    ? Math.round((job.current_epoch / job.total_epochs) * 100)
    : 0;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    running: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="training-page min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="training-panel bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Training Job {jobId.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">Monitor model training progress</p>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 font-semibold capitalize ${statusColors[job.status]}`} role="status">
              {job.status}
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Epochs</p>
              <p className="text-2xl font-bold text-gray-800">{job.current_epoch}/{job.total_epochs}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-blue-600">{progress}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Training Progress</label>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-label="Training progress">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics */}
          {job.metrics && Object.keys(job.metrics).length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.metrics.train_loss != null && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Train Loss</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {job.metrics.train_loss.toFixed(4)}
                    </p>
                  </div>
                )}
                {job.metrics.val_accuracy != null && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Val Accuracy</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(job.metrics.val_accuracy * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {job.metrics.auc != null && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">AUC</p>
                    <p className="text-2xl font-bold text-green-600">
                      {job.metrics.auc.toFixed(4)}
                    </p>
                  </div>
                )}
                {job.metrics.accuracy != null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Accuracy</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {(job.metrics.accuracy * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {job.metrics.precision != null && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Precision</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(job.metrics.precision * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                {job.metrics.recall != null && (
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Recall</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {(job.metrics.recall * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.error_message && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <span className="font-semibold">Error:</span> {job.error_message}
              </p>
            </div>
          )}

          {/* Configuration */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dl className="space-y-2">
                {job.config && Object.entries(job.config).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-600 font-medium">{key}:</dt>
                    <dd className="text-gray-800">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/training')}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Back to Training
            </button>
            {(job.status === 'completed' || job.status === 'failed') && (
              <button
                onClick={() => navigate('/training')}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition"
              >
                View All Jobs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
