import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingJobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/jobs`);
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        setLoading(false);
      }
    };

    fetchJobs();
    
    // Refresh every 3 seconds
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    running: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300'
  };

  if (loading) {
    return (
      <div className="training-page min-h-screen p-8" role="status" aria-live="polite">
        <div className="training-content max-w-6xl mx-auto">
          <div className="training-loading animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="training-page min-h-screen p-8">
      <div className="training-content max-w-6xl mx-auto">
        <div className="training-panel bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Training Jobs</h1>
              <p className="text-gray-600 mt-1">Manage and monitor your ML training jobs</p>
            </div>
            <button
              onClick={() => navigate('/training/new')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              New Training Job
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No training jobs yet</p>
              <button
                onClick={() => navigate('/training/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Training Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => {
                const progress = job.total_epochs > 0 
                  ? Math.round((job.current_epoch / job.total_epochs) * 100)
                  : 0;
                
                return (
                  <div
                    key={job.job_id}
                    onClick={() => navigate(`/training/${job.job_id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/training/${job.job_id}`)
                      if (event.key === ' ') {
                        event.preventDefault()
                        navigate(`/training/${job.job_id}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open training job ${job.job_id.slice(0, 8)}`}
                    className="p-6 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Job {job.job_id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Started: {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border-2 font-semibold capitalize ${statusColors[job.status]}`} role="status">
                        {job.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Epochs</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {job.current_epoch}/{job.total_epochs}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Progress</p>
                        <p className="text-lg font-semibold text-blue-600">{progress}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Config</p>
                        <p className="text-sm text-gray-800">
                          {job.config?.epochs} epochs, {job.config?.batch_size} batch size
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metrics Preview */}
                    {job.metrics && Object.keys(job.metrics).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {job.metrics.train_loss != null && (
                          <div className="bg-orange-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Loss</p>
                            <p className="font-semibold text-orange-600">
                              {job.metrics.train_loss.toFixed(4)}
                            </p>
                          </div>
                        )}
                        {job.metrics.val_accuracy != null && (
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Val Acc</p>
                            <p className="font-semibold text-blue-600">
                              {(job.metrics.val_accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {job.metrics.auc != null && (
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-600">AUC</p>
                            <p className="font-semibold text-green-600">
                              {job.metrics.auc.toFixed(4)}
                            </p>
                          </div>
                        )}
                        {job.metrics.accuracy != null && (
                          <div className="bg-purple-50 p-2 rounded">
                            <p className="text-xs text-gray-600">Acc</p>
                            <p className="font-semibold text-gray-800">
                              {(job.metrics.accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-800">{job.error_message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
