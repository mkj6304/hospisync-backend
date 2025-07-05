// routes/beds.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM beds');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { hospital_id, bed_type, status, room_number } = req.body;
  const result = await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, status, room_number)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [hospital_id, bed_type, status, room_number]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { bed_type, status, room_number } = req.body;
  const result = await pool.query(
    `UPDATE beds SET bed_type=$1, status=$2, room_number=$3 WHERE bed_id=$4 RETURNING *`,
    [bed_type, status, room_number, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM beds WHERE bed_id=$1`, [req.params.id]);
  res.json({ message: 'Bed deleted' });
});

module.exports = router;
