// routes/patients.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a patient
router.post('/', async (req, res) => {
  const { name, gender, date_of_birth, contact, email, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patients (name, gender, date_of_birth, contact, email, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, gender, date_of_birth, contact, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET patient dashboard view by patient_id
router.get('/:id/dashboard', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM patient_dashboard_view WHERE patient_id = $1',
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching patient dashboard view:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;
