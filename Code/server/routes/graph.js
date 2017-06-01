const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ msg: 'Post to /graph' });
});

module.exports = router;
