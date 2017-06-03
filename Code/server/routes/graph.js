const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const PythonShell = require('python-shell');

const geojson = require('../data/big_geo');

router.post('/', (req, res) => {
  // let py_initGraph = spawn('python', ['./server/algo/graph/node_wrapper.py']);
  // let dataString = '';

  // py_initGraph.stdout.on('data', (data) => {
  //   dataString += data.toString();
  // });

  // py_initGraph.stdout.on('end', () => {
  //   console.log(`dataString: ${dataString}`);
  //   res.json({ msg: `POST /graph ${dataString}` });
  // });

  // // console.log('adjMatrix', JSON.stringify(req.body.adjMatrix));
  // console.log('stuff')
  // // py_initGraph.stdin.write(JSON.stringify(req.body.adjMatrix));
  // console.log(JSON.stringify(req.body.adjMatrix).length);
  // py_initGraph.stdin.write(JSON.stringify(req.body.adjMatrix));
  // py_initGraph.stdin.end();


  let pyshell = new PythonShell('./server/algo/graph/node_wrapper.py');

  pyshell.send(JSON.stringify(req.body.adjMatrix));

  pyshell.on('message', (msg) => {
    console.log(msg);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }

    console.log('finished');
    res.json({ msg: `POST /graph` });
  });
});

router.get('/geo', (req, res) => {
  res.json(geojson);
});

module.exports = router;
