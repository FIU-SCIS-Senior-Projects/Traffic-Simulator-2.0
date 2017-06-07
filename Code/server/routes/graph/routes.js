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
    console.log('Parsing Mesage', msg.length);
    console.log(msg.substring(0, 100));
    console.log(msg.substring(msg.length - 100, msg.length - 1));
    pyResult = JSON.parse(msg);
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

router.post('/dijkstra', (req, res) => {
  // let adjMatrix = parseGeoJson(req.body.geojson);
  let data = {
    adjMatrix: req.body.adjMatrix,
    setup: req.body.setup,
    source: req.body.source,
    destination: req.body.destination
  };

  let pyshell = new PythonShell('./server/algo/graph/dijkstra.py');
  let pyResult = null;

  pyshell.send(JSON.stringify(data));

  pyshell.on('message', (msg) => {
    console.log('Parsing Dijkstra Message', msg.length);
    console.log(msg.substring(0, 100));
    console.log(msg.substring(msg.length - 100, msg.length - 1));
    pyResult = JSON.parse(msg);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }
    // pyResult.all_pairs_sp = JSON.parse(pyResult.all_pairs_sp);
    // console.log(pyResult);
    console.log('finished dijkstra');
    pyResult = pyResult.filter((point, i) => {
      return i % 2 === 0;
    });
    res.json({ msg: `POST /graph/dijkstra`, data: pyResult });
  });

});


module.exports = router;
