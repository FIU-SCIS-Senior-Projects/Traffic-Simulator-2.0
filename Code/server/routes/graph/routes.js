const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const PythonShell = require('python-shell');

const geojson = require('../../data/big_geo');

const parseGeoJson = require('./geojson');

let G = null;

router.post('/', (req, res) => {
  let pyshell = new PythonShell('./server/algo/graph/node_wrapper.py');
  let pyResult = null;
  let msg = {
    adjMatrix: req.body.adjMatrix,
    setup: true
  };
  pyshell.send(JSON.stringify(msg));

  pyshell.on('message', (msg) => {
    console.log('Parsing Mesage');
    pyResult = JSON.parse(msg);
    // pyResult.all_pairs_sp = JSON.parse(pyResult.all_pairs_sp);
    // console.log(pyResult);
    // console.log(pyResult.adjMatrix);
    // console.log(pyResult.num_nodes);
    // console.log(pyResult.all_pairs_sp);
    // console.log(pyResult.all_sp_len);
    // console.log(pyResult.all_sp_len_transpose);
    // console.log(pyResult.diam);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }
    // pyResult.all_pairs_sp = JSON.parse(pyResult.all_pairs_sp);
    console.log('finished init');
    // console.log(pyResult);
    // testImport(pyResult, res);


    res.json({ msg: `POST /graph`, data: pyResult });
  });
});

function testImport (result, res) {
  let data = {
    setup: false,
    graph: {
      adjMatrix: result.adjMatrix,
      all_pairs_sp: result.all_pairs_sp,
      all_sp_len: result.all_sp_len,
      all_sp_len_transpose: result.all_sp_len_transpose,
      diam: result.diam,
      num_nodes: result.num_nodes
    }
  };

  let pyshell = new PythonShell('./server/algo/graph/node_wrapper.py');
  let pyResult = null;

  pyshell.send(JSON.stringify(data));

  pyshell.on('message', (msg) => {
    console.log('Parsing Mesage');
    pyResult = JSON.parse(msg);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }
    // pyResult.all_pairs_sp = JSON.parse(pyResult.all_pairs_sp);
    // console.log(pyResult);
    console.log('finished import');
    res.json({ msg: `POST /graph`, data: pyResult });
  });
}


router.post('/import', (req, res) => {
  let pyshell = new PythonShell('./server/algo/graph/node_wrapper.py');
  let pyResult = null;
  let sendMsg = {
    setup: req.body.setup,
    adjMatrix: req.body.adjMatrix,
    all_pairs_sp: req.body.all_pairs_sp,
    all_sp_len: req.body.all_sp_len,
    all_sp_len_transpose: req.body.all_sp_len_transpose,
    diam: req.body.diam,
    num_nodes: req.body.num_nodes
  };

  pyshell.send(JSON.stringify(sendMsg));

  pyshell.on('message', (msg) => {
    console.log('Parsing Mesage');
    pyResult = JSON.parse(msg);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }
    // pyResult.all_pairs_sp = JSON.parse(pyResult.all_pairs_sp);

    console.log('finished');
    res.json({ msg: `POST /graph`, data: pyResult });
  });
});

router.get('/geo', (req, res) => {
  res.json(geojson);
});

router.post('/geo', (req, res) => {
  let adjMatrix = parseGeoJson(req.body.geojson);
  res.json({ adjMatrix: adjMatrix });
});


module.exports = router;
