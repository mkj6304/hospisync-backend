// app.js
const express = require('express');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
const doctorRoutes = require('./routes/doctors');
const hospitalDashboardRoutes = require('./routes/hospital');
const patientRoutes = require('./routes/patients');

const cors = require('cors');

app.use(cors({
  origin: 'https://hospisync-frontend.vercel.app/', // 👈 Replace this
  credentials: true,
}));


// Middleware
app.use(express.json());

// Import authentication middleware
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

// Open authentication routes (no token needed)
app.use('/api/auth', require('./routes/auth'));

//ML model code
const mlRoutes = require('./services/ml');
//app.use('/api/ml', mlRoutes);


// Sample secure route
app.get('/api/secure', authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, your role is ${req.user.role}` });
});


app.use('/api/patient', patientRoutes);

app.use('/api/hospital', hospitalDashboardRoutes);
// Protected resource routes
app.use('/api/doctor', doctorRoutes);
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/admissions', require('./routes/admissions'));
app.use('/api/inventory/items', require('./routes/inventoryItems'));
app.use('/api/inventory/transactions', require('./routes/inventoryTransactions'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HospiSync server running on port ${PORT}`));


