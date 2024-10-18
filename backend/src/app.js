const express = require('express');
const cors = require('cors');
const syncRoutes = require('./routes/syncRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', syncRoutes);

module.exports = app;