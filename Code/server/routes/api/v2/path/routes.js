const express = require('express');
const router = express.Router();

const pathAPI = require('./index');
const vertices = require('../../../../data/vertices.js');

router.post('/dijkstra', (req, res) => {
  // Later use graph from session, but for now init a new one. 
  pathAPI.dijkstra(req.session, req.body.source, req.body.destination)
  // pathAPI.dijkstra()
    .then((path) => {
      path = path.map((point) => {
        return { lng: vertices.features[point].geometry.coordinates[0], lat: vertices.features[point].geometry.coordinates[1] };
      });
      return res.json({ path: path });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    })
});

router.post('/oblivious', (req, res) => {

});

module.exports = router;
