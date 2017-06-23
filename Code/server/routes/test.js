const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/html/test.html'));
});

router.post('/', (req, res) => {
  console.log(`Adj Matrix Length: ${req.body.adjMatrix.length}`);
  res.json({ msg: 'success' });
});

router.get('/map', (req, res) => {
  return res.render('test');
});

module.exports = router;
