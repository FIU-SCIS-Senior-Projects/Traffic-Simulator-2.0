const express = require('express');
const router = express.Router();

const graphAPI = require('./index');

router.post('/', (req, res) => {
  graphAPI.initGraph(req.body.adjMatrix)
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
