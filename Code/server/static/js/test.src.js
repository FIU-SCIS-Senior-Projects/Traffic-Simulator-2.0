import request from 'superagent';
import Domo from 'dom-object';

var results = new Domo(document.getElementById('results'));

function testPathPost () {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/path')
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log(res);
    results.append('p { POST /graph success }');
  }).catch((err) => {
    results.append('p { POST /graph failure }');
  });
}

function testGraphPost () {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph')
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log(res);
    results.append('p { POST /path success }');
  }).catch((err) => {
    results.append('p { POST /path failure }');
  });
}

function testGeoJSON () {
  console.log('testing geo json');
  let test = new Promise((resolve, reject) => {
    request.get('http://localhost:8080/graph/geo')
      .end((err, res) => {
        // console.log('err', err);
        // console.log('res', res);
        if (err) {
          console.log('rejecting');
          reject(err);
        } else {
          console.log('resolving');
          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });




  test.then((res) => {
    results.append('p { POST /graph/geo success }');
    console.log(res);

    let nodeCount = 0;
    let nodes = [];
    let edges = [];
    let startNode;
    let endNode;
    res.features.forEach((feature) => {
      let coords = [];
      startNode = null;
      endNode = null;
      feature.geometry.coordinates.forEach((coord) => {
        coords.push([coord[1], coord[0]]);
      });

      // console.log(`Nodes length ${nodes.length}`);
      for (var i = 0; i < nodes.length; i++) {
        if (arrayEqual(nodes[i].latlng, coords[0])) {
          startNode = nodes[i];
        }
        if (arrayEqual(nodes[i].latlng, coords[coords.length - 1])) {
          endNode = nodes[i];
        }
      }

      if (!startNode) {
        startNode = { index: nodeCount, latlng: coords[0] };
        nodeCount++;
        nodes.push(startNode);
      }

      if (!endNode) {
        endNode = { index: nodeCount, latlng: coords[coords.length - 1] };
        nodeCount++;
        nodes.push(endNode);
      }

      let edge = {
        startNode: startNode,
        endNode: endNode,
        linePoints: coords,
        polyLine: null
      };

      let reverseEdge = {
        startNode: endNode,
        endNode: startNode,
        linePoints: coords.reverse(),
        polyLine: null
      };

      edges.push(edge);
      edges.push(reverseEdge);

      // console.log('Coordinates', coords);
      // console.log('edges', edges);
    });

    let adjMatrix = initAdjacenyMatrix(nodes, edges);
    console.log('Adjacency Matrix', adjMatrix);
    // test matrix for empty rows
    // test for deadend rows
    // test for single connected nodes

    request.post('http://localhost:8080/test')
      .set('Content-Type', 'application/json')
      .send({ adjMatrix: adjMatrix })
      .end((err, res) => {
        console.log(res);
      });

  }).catch((err) => {
    results.append('p { POST /graph/geo failure }');
  });

}

function initAdjacenyMatrix (nodes, edges) {
  console.log('nodes', nodes);
  console.log('edges', edges);
  let adjacencyMatrix = [];

  for (var i = 0; i < nodes.length; i++) {
    var row = [];
    for (var j = 0; j < nodes.length; j++) {
      row.push(0);
    }
    adjacencyMatrix.push(row);
  }

  for (var i = 0; i < edges.length; i++) {
    let indexA = edges[i].startNode.index;
    let indexB = edges[i].endNode.index;
    let latlngA = edges[i].startNode.latlng;
    let latlngB = edges[i].endNode.latlng;
    let weight = 1 + EuclideanDistance(latlngA, latlngB);
    adjacencyMatrix[indexA][indexB] = weight;
  }

  return adjacencyMatrix;
}

function EuclideanDistance(a, b)
{
  return Math.sqrt(Math.pow((b[0] - a[0]), 2) + Math.pow((b[1] - a[1]), 2));
}

function arrayEqual (arr1, arr2) {
  if (arr1 instanceof Array &&
      arr2 instanceof Array &&
      arr1.length === arr2.length &&
      arr1.every(function (e, i) {
        return e === arr2[i];
      }))
  {
        return true;
  }

  return false;
}

function init () {
  testPathPost();
  testGraphPost();
  testGeoJSON();
}

init();