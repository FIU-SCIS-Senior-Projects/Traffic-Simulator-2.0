const express = require('express');
const router = express.Router();

const geoAPI = require('./index');

router.post('/', (req, res) => {
  let adjMatrix = geoAPI.format(req.body.geojson);
  res.json({ adjMatrix: adjMatrix });
});

module.exports = router;
