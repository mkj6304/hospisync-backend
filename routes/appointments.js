// routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM opd_appointments');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { patient_id, doctor_id, hospital_id, appointment_date, appointment_time, status } = req.body;
  const result = await pool.query(
    `INSERT INTO opd_appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [patient_id, doctor_id, hospital_id, appointment_date, appointment_time, status]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { appointment_date, appointment_time, status } = req.body;
  const result = await pool.query(
    `UPDATE opd_appointments SET appointment_date=$1, appointment_time=$2, status=$3 WHERE appointment_id=$4 RETURNING *`,
    [appointment_date, appointment_time, status, id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM opd_appointments WHERE appointment_id=$1`, [req.params.id]);
  res.json({ message: 'Appointment deleted' });
});

//OPD request addition
// POST /api/opd/request
router.post('/request', async (req, res) => {
  const { patient_id, department, city, hospital_id } = req.body;

  try {
    let doctorQuery = `
      SELECT d.doctor_id, d.name, d.hospital_id, h.name as hospital_name
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.hospital_id
      WHERE d.specialization ILIKE $1 AND d.availability = true
    `;
    let values = [`%${department}%`];

    if (hospital_id) {
      doctorQuery += ` AND d.hospital_id = $2`;
      values.push(hospital_id);
    } else if (city) {
      doctorQuery += ` AND h.city ILIKE $2`;
      values.push(`%${city}%`);
    }

    const result = await pool.query(doctorQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No available doctors found for this request' });
    }

    const doctor = result.rows[0];

    // Pick appointment time (next available slot at 10:00 AM tomorrow)
    const today = new Date();
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + 1);
    const appointmentTime = '10:00:00';

    // Create appointment
    const appointment = await pool.query(
      `INSERT INTO opd_appointments
       (patient_id, doctor_id, hospital_id, appointment_date, appointment_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [patient_id, doctor.doctor_id, doctor.hospital_id, appointmentDate, appointmentTime]
    );

    res.status(201).json({
      message: 'Appointment booked successfully',
      doctor: {
        name: doctor.name,
        hospital: doctor.hospital_name
      },
      appointment: appointment.rows[0]
    });

  } catch (err) {
    console.error('❌ OPD Request Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
