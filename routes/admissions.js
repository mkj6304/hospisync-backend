// routes/admissions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getAdmissionRecommendation } = require('../services/ml');

// POST /api/admissions
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, hospital_id, admission_reason } = req.body;

  // Optional: Validate input
  if (!patient_id || !doctor_id || !hospital_id || !admission_reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 🔍 Fetch hospital metrics
   const metricsResult = await pool.query(`
  SELECT
    hospital_metrics.available_beds::int AS available_beds,
    (hospitals.total_beds::int - hospital_metrics.available_beds::int) AS occupied_beds,
    hospital_metrics.recent_admissions,
    hospital_metrics.rejection_rate,
    hospital_metrics.avg_discharge_time,
    hospital_metrics.avg_length_of_stay,
    hospital_metrics.success_rate
  FROM hospital_metrics
  JOIN hospitals ON hospitals.hospital_id = hospital_metrics.hospital_id
  WHERE hospital_metrics.hospital_id = $1
`, [hospital_id]);


console.log("📊 Raw metrics from DB:", metricsResult.rows[0]);


    if (metricsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital metrics not found' });
    }

   const raw = metricsResult.rows[0];
const hospitalMetrics = {
  available_beds: Number(raw.available_beds),
  occupied_beds: Number(raw.occupied_beds),
  recent_admissions: Number(raw.recent_admissions),
  rejection_rate: Number(raw.rejection_rate),
  avg_discharge_time: Number(raw.avg_discharge_time),
  avg_length_of_stay: Number(raw.avg_length_of_stay),
  success_rate: Number(raw.success_rate),
};


    // 🔮 ML recommendation
    const { recommendation, probability } = await getAdmissionRecommendation(hospitalMetrics);

    if (recommendation !== 1) {
      return res.status(403).json({
        message: `Admission denied by ML model. Confidence: ${(probability * 100).toFixed(2)}%`,
        recommendation
      });
    }

    // ✅ Proceed with actual admission
    const insertQuery = `
      INSERT INTO admissions (
        patient_id, doctor_id, hospital_id, admission_reason,
        admission_date, status, created_at
      )
      VALUES ($1, $2, $3, $4, NOW(), 'Admitted', NOW())
      RETURNING *`;

    const result = await pool.query(insertQuery, [
      patient_id, doctor_id, hospital_id, admission_reason
    ]);

    res.status(201).json({
      message: 'Admission successful',
      data: result.rows[0],
      model_confidence: probability
    });

  } catch (error) {
    console.error('❌ Error during admission:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Discharge patient
router.put('/discharge/:id', async (req, res) => {
  const admission_id = req.params.id;

  try {
    // 1. Fetch admission
    const { rows } = await pool.query(
      `SELECT * FROM admissions WHERE admission_id = $1`,
      [admission_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admission not found' });
    }

    const admission = rows[0];
    if (admission.status === 'Discharged') {
      return res.status(400).json({ error: 'Patient already discharged' });
    }

    const now = new Date();

    // 2. Update admission with discharge info
    await pool.query(
      `UPDATE admissions
       SET status = 'Discharged', discharge_date = $1
       WHERE admission_id = $2`,
      [now, admission_id]
    );

    // 3. Free the bed (if assigned)
    if (admission.bed_id) {
      await pool.query(
        `UPDATE beds
         SET status = 'Available', is_occupied = false
         WHERE bed_id = $1`,
        [admission.bed_id]
      );
    }

    // 4. Update hospital metrics
    const lengthOfStay = (now - new Date(admission.admission_date)) / (1000 * 60 * 60 * 24); // days

    await pool.query(`
      UPDATE hospital_metrics
      SET
        available_beds = available_beds + 1,
        recent_admissions = recent_admissions + 0,
        avg_length_of_stay = (avg_length_of_stay + $1) / 2
      WHERE hospital_id = $2
    `, [lengthOfStay.toFixed(2), admission.hospital_id]);

    res.json({ message: 'Patient discharged successfully', length_of_stay: lengthOfStay.toFixed(2) });

  } catch (err) {
    console.error('❌ Discharge Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
