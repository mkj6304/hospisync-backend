// routes/doctors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM doctors');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { hospital_id, name, specialization, availability, contact, email } = req.body;
  const result = await pool.query(
    `INSERT INTO doctors (hospital_id, name, specialization, availability, contact, email)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [hospital_id, name, specialization, availability, contact, email]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { name, specialization, availability, contact, email } = req.body;
  const result = await pool.query(
    `UPDATE doctors SET name=$1, specialization=$2, availability=$3, contact=$4, email=$5 WHERE doctor_id=$6 RETURNING *`,
    [name, specialization, availability, contact, email, id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM doctors WHERE doctor_id=$1`, [req.params.id]);
  res.json({ message: 'Doctor deleted' });
});

//New addition based on view for enhanced dashboard
// @route   GET /api/doctor/:id/dashboard
// @desc    Get all dashboard data for a specific doctor
// @access  Private (add auth if needed)
router.get('/:id/dashboard', async (req, res) => {
  const doctorId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'SELECT * FROM doctor_dashboard_view WHERE doctor_id = $1',
      [doctorId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Error fetching doctor dashboard view:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});




module.exports = router;
