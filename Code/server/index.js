const express = require('express');
const app = express();
const path = require('path');

const graphRoutes = require('./routes/graph');
const pathRoutes = require('./routes/path');
const appPort = 8080;

app.all('*', (req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Route Handlers
app.use('/graph', graphRoutes);
app.use('/path', pathRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/simulation.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/test.html'));
});

app.listen(appPort, () => {
  console.log(`Traffic Simulator listening on port ${appPort}.`);
});
