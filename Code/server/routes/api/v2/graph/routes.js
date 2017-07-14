const express = require('express');
const router = express.Router();

const graphAPI = require('./index');
const geoAPI = require('../geo');
const mapGeoJson = require('../../../../data/roads.js');

router.post('/', (req, res) => {
  
  // This is the correct call when the client sends the 
  // GeoJson of the map. But we are using a static 
  // GeoJson, so we will directly import it.
  // graphAPI.initGraph(req.body.adjMatrix)

  graphAPI.initGraph(geoAPI.format(mapGeoJson))
    .then((graph) => {
      req.session.graph = graph;
      return res.json({ text: 'Graph Initialized' });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    });
});

/* Possibly unused route */
router.post('/import', (req, res) => {
  graphAPI.importGraph(req.body.graph)
    .then((msg) => {
      return res.json(msg);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    });
});

module.exports = router;
