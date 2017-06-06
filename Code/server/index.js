const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const graphRoutes = require('./routes/graph/routes');
const pathRoutes = require('./routes/path');
const testRoutes = require('./routes/test');
const appPort = 8080;

app.use(express.static(path.join(__dirname, 'static')));

app.use(bodyParser.json({ limit: '10mb'}));

app.all('*', (req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Route Handlers
app.use('/graph', graphRoutes);
app.use('/path', pathRoutes);
app.use('/test', testRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/html/simulation.html'));
});

app.listen(appPort, () => {
  console.log(`Traffic Simulator listening on port ${appPort}.`);
});
