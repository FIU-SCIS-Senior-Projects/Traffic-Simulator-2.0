const express = require('express');
const router = express.Router();

const graphAPI = require('./index');

router.post('/', (req, res) => {
  graphAPI.init(req.body.adjMatrix)
    .then((graph) => {
      // put in session
      // Return a success message instead of the graph.
      return res.json({ graph: graph });
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
});

module.exports = router;
