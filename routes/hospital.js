const express = require('express');
const router = express.Router();
const pool = require('../db'); // your DB pool

// GET /api/hospital/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM hospital_dashboard_view WHERE hospital_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hospital dashboard view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
