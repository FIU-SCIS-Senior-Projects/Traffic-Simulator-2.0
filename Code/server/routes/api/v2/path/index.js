const PythonShell = require('python-shell');

function dijkstra (session, source, destination, index) {
  return new Promise((resolve, reject) => {
    let pyshell = new PythonShell('./server/algo/graph/dijkstra.py');
    let pyResult = null;
    // let data = {
    //   adjMatrix: adjMatrix,
    //   setup: true,
    //   source: source,
    //   destination: destination
    // };

    let data = {};

    // If there is a graph in the session
    if (session.graph) {
      data.setup = false;
      data.graph = session.graph;
      data.source = source;
      data.destination = destination;
    } else {
      // Handle the exception of no initialized graph in session.
      return reject('Initialized Graph Not Found.');
    }

    pyshell.send(JSON.stringify(data));

    pyshell.on('message', (msg) => {
      console.log('Dijkstra: Parsing Message');
      pyResult = JSON.parse(msg);
    });

    pyshell.end((err) => {
      if (err) {
        return reject(err);
      }

      console.log('Dijkstra: Finished');
      // For some reason only even values matter.
      console.log(pyResult);
      pyResult = pyResult.filter((point, i) => {
        return i % 2 === 0;
      });

      return resolve({path: pyResult, index: index});
    });
  });
}

exports.dijkstra = dijkstra;
