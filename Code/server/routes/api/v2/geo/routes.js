const express = require('express');
const router = express.Router();

const geoAPI = require('./index');
const geojson = require('../../../../data/big_geo.js');

router.get('/', (req, res) => {
  return res.json({ geojson: geojson });
});

router.post('/', (req, res) => {
  let adjMatrix = geoAPI.format(req.body.geojson);
  return res.json({ adjMatrix: adjMatrix });
});

module.exports = router;
