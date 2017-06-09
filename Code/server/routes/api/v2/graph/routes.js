const express = require('express');
const router = express.Router();

const graphAPI = require('./index');

router.post('/', (req, res) => {
  graphAPI.initGraph(req.body.adjMatrix)
    .then((graph) => {
      // put in session
      // Return a success message instead of the graph.
      return res.json({ graph: graph });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    });
});

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
