// services/ml.js
const axios = require('axios');

const ML_API_URL = 'http://localhost:5000/predict';

async function getAdmissionRecommendation(hospitalMetrics) {
  try {
    const response = await axios.post(ML_API_URL, hospitalMetrics);
    return response.data; // { recommendation: 1, probability: 0.87 }
  } catch (error) {
    console.error('❌ Error calling ML API:', error.message);
    return { recommendation: 0, probability: 0 };
  }
}

module.exports = { getAdmissionRecommendation };
