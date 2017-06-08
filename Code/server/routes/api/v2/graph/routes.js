const express = require('express');
const router = express.Router();

const graphAPI = require('./index');

router.post('/', (req, res) => {
  graphAPI.init(req.body.adjMatrix);
});

module.exports = router;
