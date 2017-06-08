const PythonShell = require('python-shell');

function initGraph (adjMatrix) {
  return new Promise((resolve, reject) => {
    // Path to python script is relative to where node instance is started
    let pyshell = new PythonShell('./server/algo/graph/initGraph.py');
    let pyResult = null;
    // validate 
    let data = {
      adjMatrix: adjMatrix,
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
        return reject(err);
      }
      console.log('Init Graph: Finished');
      return resolve(pyResult);
    });
  });
}

function importGraph (graph) {
  return new Promise((resolve, reject) => {
    // Path to python script is relative to where node instance is started
    let pyshell = new PythonShell('./server/algo/graph/initGraph.py');
    let pyResult = null;
    // validate 
    let sendMsg = {
      setup: false,
      graph: graph
    };

    // Send data to stdin
    pyshell.send(JSON.stringify(sendMsg));

    // Read data from stdout
    pyshell.on('message', (msg) => {
      console.log('Import Graph: Parsing Mesage');
      pyResult = JSON.parse(msg);
    });

    pyshell.end((err) => {
      if (err) {
        console.log(err);
        return reject(err)
      }

      console.log('Import Graph: Finished');
      return resolve(pyResult);
    });
  });
}

exports.initGraph = initGraph;
exports.importGraph = importGraph;
