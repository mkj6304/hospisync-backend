// routes/inventoryItems.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM inventory_items');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { hospital_id, name, type, quantity, expiry_date, unit } = req.body;
  const result = await pool.query(
    `INSERT INTO inventory_items (hospital_id, name, type, quantity, expiry_date, unit)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [hospital_id, name, type, quantity, expiry_date, unit]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { quantity, expiry_date } = req.body;
  const result = await pool.query(
    `UPDATE inventory_items SET quantity=$1, expiry_date=$2 WHERE item_id=$3 RETURNING *`,
    [quantity, expiry_date, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM inventory_items WHERE item_id=$1`, [req.params.id]);
  res.json({ message: 'Inventory item deleted' });
});

module.exports = router;
