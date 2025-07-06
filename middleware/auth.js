const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authorizeRoles('patient'), async (req, res) => {
  // req.user.role is now available
  // Your admission logic here
});
