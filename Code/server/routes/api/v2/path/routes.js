const express = require('express');
const router = express.Router();

const pathAPI = require('./index');

router.post('/dijkstra', (req, res) => {
  // Later use graph from session, but for now init a new one. 
  pathAPI.dijkstra(req.body.adjMatrix, req.body.source, req.body.destination)
    .then((path) => {
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
