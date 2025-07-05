// routes/inventoryTransactions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM inventory_transactions');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { item_id, transaction_type, quantity, performed_by } = req.body;
  const result = await pool.query(
    `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, performed_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [item_id, transaction_type, quantity, performed_by]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
