const express = require('express');
const router = express.Router();

const geoRoutes = require('./geo/routes');
const graphRoutes = require('./graph/routes');
const pathRoutes = require('./path/routes');

router.use('/geo', geoRoutes);
router.use('/graph', graphRoutes);
router.use('/path', pathRoutes);

module.exports = router;
