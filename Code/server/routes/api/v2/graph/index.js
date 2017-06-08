const PythonShell = require('python-shell');

function init (adjMatrix) {
  // Path to python script is relative to where node instance is started
  let pyshell = new PythonShell('./server/algo/graph/initGraph.py');
  let pyResult = null;
  let data = {
    adjMatrix: req.body.adjMatrix,
    setup: true
  };

  // Send data to stdin
  pyshell.send(JSON.stringify(data));

  // Read data from stdout
  pyshell.on('message', (msg) => {
    console.log('Init Graph: Parsing Mesage');
    pyResult = JSON.parse(msg);
  });

  pyshell.end((err) => {
    if (err) {
      console.log('error', err);
      res.status(500).send('error');
    }
    console.log('Init Graph: Finished');
    // Store to session.
    res.json({ msg: `POST /graph`, data: pyResult });
  });
}

exports.init = init;
