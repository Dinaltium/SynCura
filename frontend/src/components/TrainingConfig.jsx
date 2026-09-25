import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    physionet_path: '',
    outcomes_path: '',
    epochs: 5,
    batch_size: 32,
    learning_rate: 0.001,
    max_patients: 100,
    vital_features: ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2',
                     'GCS', 'BUN', 'Creatinine', 'WBC', 'Platelets', 'Glucose']
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      vital_features: prev.vital_features.includes(feature)
        ? prev.vital_features.filter(f => f !== feature)
        : [...prev.vital_features, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/training/start`, formData);
      const jobId = response.data.job_id;
      
      // Redirect to monitoring page
      navigate(`/training/${jobId}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start training');
      setLoading(false);
    }
  };

  const availableFeatures = ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2', 'EtCO2'];

  return (
    <div className="training-page min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="training-panel bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ML Model Training</h1>
          <p className="text-gray-600 mb-8">Configure and start a new training job</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Paths */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Data Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="tc-physionet-path" className="block text-sm font-medium text-gray-700 mb-2">
                    PhysioNet Data Path
                  </label>
                  <input
                    id="tc-physionet-path"
                    type="text"
                    name="physionet_path"
                    value={formData.physionet_path}
                    onChange={handleInputChange}
                    placeholder="/path/to/physionet/data"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Path to PhysioNet 2012 ICU dataset directory</p>
                </div>

                <div>
                  <label htmlFor="tc-outcomes-path" className="block text-sm font-medium text-gray-700 mb-2">
                    Outcomes File Path
                  </label>
                  <input
                    id="tc-outcomes-path"
                    type="text"
                    name="outcomes_path"
                    value={formData.outcomes_path}
                    onChange={handleInputChange}
                    placeholder="/path/to/Outcomes-a.txt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Path to Outcomes-a.txt file</p>
                </div>
              </div>
            </div>

            {/* Training Hyperparameters */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Training Hyperparameters</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tc-epochs" className="block text-sm font-medium text-gray-700 mb-2">
                    Epochs
                  </label>
                  <input
                    id="tc-epochs"
                    type="number"
                    name="epochs"
                    value={formData.epochs}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tc-batch-size" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    id="tc-batch-size"
                    type="number"
                    name="batch_size"
                    value={formData.batch_size}
                    onChange={handleInputChange}
                    min="1"
                    max="256"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tc-learning-rate" className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Rate
                  </label>
                  <input
                    id="tc-learning-rate"
                    type="number"
                    name="learning_rate"
                    value={formData.learning_rate}
                    onChange={handleInputChange}
                    min="0.00001"
                    max="0.1"
                    step="0.0001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tc-max-patients" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Patients
                  </label>
                  <input
                    id="tc-max-patients"
                    type="number"
                    name="max_patients"
                    value={formData.max_patients}
                    onChange={handleInputChange}
                    min="10"
                    max="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Feature Selection */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Vital Features</h2>
              <p className="text-sm text-gray-600 mb-3">Select vital signs to include in training</p>
              
              <div className="grid grid-cols-2 gap-3">
                {availableFeatures.map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.vital_features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                {loading ? 'Starting Training...' : 'Start Training'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
