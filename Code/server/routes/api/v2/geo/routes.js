const express = require('express');
const router = express.Router();

const geoAPI = require('./index');
const oldGeojson = require('../../../../data/big_geo.js');
const roadsGeojson = require('../../../../data/roads.js');

router.get('/old', (req, res) => {
  return res.json({ geojson: oldGeojson });
});

router.get('/roads', (req, res) => {
  return res.json({ geojson: roadsGeojson });
});

router.post('/', (req, res) => {
  let adjMatrix = geoAPI.format(req.body.geojson);
  return res.json({ adjMatrix: adjMatrix });
});

module.exports = router;
