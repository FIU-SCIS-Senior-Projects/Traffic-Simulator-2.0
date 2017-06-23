const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const apiRoutes = require('./routes/api/v2');
const graphRoutes = require('./routes/graph/routes');
const pathRoutes = require('./routes/path');
const testRoutes = require('./routes/test');
const appPort = 8080;

app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json({ limit: '20mb'}));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: 'secret', // temporary for now.
  resave: false,
  saveUninitialized: true
}));

app.all('*', (req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Route Handlers
app.use('/graph', graphRoutes);
app.use('/path', pathRoutes);
app.use('/test', testRoutes);

app.use('/api/v2', apiRoutes);

app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'static/html/simulation.html'));
});

app.listen(appPort, () => {
  console.log(`Traffic Simulator listening on port ${appPort}.`);
});
