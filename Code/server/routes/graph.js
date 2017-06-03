const express = require('express');
const router = express.Router();
const path = require('path');

const geojson = require('../data/big_geo');

router.post('/', (req, res) => {
  res.json({ msg: 'Post to /graph' });
});

router.get('/geo', (req, res) => {
  res.json(geojson);
});

module.exports = router;
