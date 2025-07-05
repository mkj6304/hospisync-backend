// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/register', async (req, res) => {
  const {
    username,
    password,
    role,
    // hospital fields
    name, address, city, state, contact_number, total_beds, available_beds,
    // doctor fields
    hospital_id, specialization, contact, email, availability,
    //patient fields
    patientgender, date_of_birth, patientEmail, patientAddress, patientAge, patientContact
  } = req.body;

  try {
    // 🚫 Check if username already exists
    const existingUser = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user
    const userResult = await pool.query(
      `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING user_id`,
      [username, hashedPassword, role]
    );

    // 🏥 Hospital registration
    if (role === 'hospital') {
      const hospitalResult = await pool.query(
        `INSERT INTO hospitals (name, address, city, state, contact_number, total_beds, available_beds)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING hospital_id`,
        [name, address, city, state, contact_number, total_beds, available_beds]
      );

      const newHospitalId = hospitalResult.rows[0].hospital_id;

      // Create empty metrics for this hospital
      await pool.query(
        `INSERT INTO hospital_metrics (hospital_id, available_beds, recent_admissions, rejection_rate, avg_discharge_time, avg_length_of_stay, success_rate)
         VALUES ($1, $2, 0, 0.0, 0.0, 0.0, 0.0)`,
        [newHospitalId, available_beds]
      );
    }

    // 🩺 Doctor registration
    if (role === 'doctor') {
      console.log("Inserting doctor into database...");

      await pool.query(
        `INSERT INTO doctors (hospital_id, name, specialization, availability, Contact, email)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [hospital_id, username, specialization, availability ?? true, contact, email]
      );
    }

    if (role === 'patient') {
  console.log("Inserting into patients");

  await pool.query(
    `INSERT INTO patients (name, gender, date_of_birth, email, address, age, contact_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [username, patientgender, date_of_birth, patientEmail, patientAddress, patientAge, patientContact]
  );
}


    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('❌ Registration Error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});





// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // ✅ Success (no JWT, just confirmation)
    res.status(200).json({ message: 'Login successful', user: { user_id: user.user_id, username: user.username, role: user.role } });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
