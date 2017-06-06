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
    results.append('p { POST /path success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /path failure }');
  });
}

function testGraphPost (data) {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph')
      .send(data)
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
    console.log('POST /graph', res);
    // console.log(res.data.all_pairs_sp);
    // var j = res.data.all_pairs_sp.replace(/{0:/g, "{a:");
    // console.log(j);
    // console.log(JSON.parse(j));

    // testImportJSON({
    //   adjMatrix: res.data.adjMatrix,
    //   all_pairs_sp: res.data.all_pairs_sp,
    //   all_sp_len: res.data.all_sp_len,
    //   all_sp_len_transpose: res.data.all_sp_len_transpose,
    //   diam: res.data.diam,
    //   num_nodes: res.data.num_nodes
    // });
    results.append('p { POST /graph success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /graph failure }');
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

    request.post('http://localhost:8080/graph/geo')
      .send({ geojson: res })
      .end((err, asyncRes) => {
        // console.log(asyncRes);
        console.log(JSON.parse(asyncRes.text));
      });

    // let nodeCount = 0;
    // let nodes = [];
    // let edges = [];
    // let startNode;
    // let endNode;
    // console.log(`# Features: ${res.features.length}`);
    // res.features.forEach((feature) => {
    //   let coords = [];
    //   startNode = null;
    //   endNode = null;
    //   feature.geometry.coordinates.forEach((coord) => {
    //     coords.push([coord[1], coord[0]]);
    //   });

    //   // console.log(`Nodes length ${nodes.length}`);
    //   for (var i = 0; i < nodes.length; i++) {
    //     if (ArraysEqual(nodes[i].latlng, coords[0])) {
    //       startNode = nodes[i];
    //     }
    //     if (ArraysEqual(nodes[i].latlng, coords[coords.length - 1])) {
    //       endNode = nodes[i];
    //     }
    //   }

    //   if (!startNode) {
    //     startNode = { index: nodeCount, latlng: coords[0] };
    //     nodeCount++;
    //     nodes.push(startNode);
    //   }

    //   if (!endNode) {
    //     endNode = { index: nodeCount, latlng: coords[coords.length - 1] };
    //     nodeCount++;
    //     nodes.push(endNode);
    //   }

    //   let edge = {
    //     startNode: startNode,
    //     endNode: endNode,
    //     linePoints: coords,
    //     polyLine: null
    //   };
    //   // console.log('coords', coords);
    //   // let rev = arrayRev(coords);
    //   // console.log('rev', rev);

    //   let reverseEdge = {
    //     startNode: endNode,
    //     endNode: startNode,
    //     linePoints: coords.reverse(),
    //     // linePoints: rev,
    //     polyLine: null
    //   };

    //   edges.push(edge);
    //   edges.push(reverseEdge);

    //   // console.log('Coordinates', coords);
    //   // console.log('edges', edges);
    // });

    // let adjMatrix = initAdjacenyMatrix(nodes, edges);
    // // console.log('Adjacency Matrix', adjMatrix);
    // let reduced = adjMatrix.reduce((acc, v) => {
    //   return acc + v.reduce((acc, e) => {
    //     return acc + e;
    //   }, 0)
    // }, 0)
    // console.log('1st init', reduced);

    // TestAdjacencyMatrixForSingleConnectedNodes(adjMatrix, nodes, edges);

    // adjMatrix = initAdjacenyMatrix(nodes, edges);
    // reduced = adjMatrix.reduce((acc, v) => {
    //   return acc + v.reduce((acc, e) => {
    //     return acc + e;
    //   }, 0)
    // }, 0)
    // console.log('2nd init', reduced);
    // // test matrix for empty rows
    // // test for deadend rows
    // // test for single connected nodes
    // testGraphPost({adjMatrix, adjMatrix});
  

  }).catch((err) => {
    console.log('err', err);
    results.append('p { POST /graph/geo failure }');
  });

}

function testImportJSON (graph) {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph')
      .send({
        setup: false,
        adjMatrix: graph.adjMatrix,
        all_pairs_sp: graph.all_pairs_sp,
        all_sp_len: graph.all_sp_len,
        all_sp_len_transpose: graph.all_sp_len_transpose,
        diam: graph.diam,
        num_nodes: graph.num_nodes
      })
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
    console.log('POST /graph/import', res);
    results.append('p { POST /graph/import success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /graph/import failure }');
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


function TestAdjacencyMatrixForSingleConnectedNodes(adjacencyMatrix, nodes, edges)
{
  console.log("Testing adjacency matrix for single connected nodes...");
  var singleConnectedRows = [];
  for(var i = 0; i < adjacencyMatrix.length; i++)
  {
    var zeroCount = 0;
    for(var j = 0; j < adjacencyMatrix.length; j++)
    {
      if(adjacencyMatrix[i][j] == 0)
      {
        zeroCount++;
      }
    }
    if(zeroCount == adjacencyMatrix.length-1)
    {
      singleConnectedRows.push(i);

      var closestNode = FindClosestNode(nodes[i], nodes);
      var edge = {startNode: nodes[i], endNode: closestNode, linePoints: [nodes[i].latlng, closestNode.latlng], polyLine: null};
      var reverseEdge = {startNode: closestNode, endNode: nodes[i], linePoints: [closestNode.latlng, nodes[i].latlng], polyLine: null};
      edges.push(edge);
      edges.push(reverseEdge);
      
    }
  }
  if(singleConnectedRows.length > 0)
  {
    console.log("Single connected nodes found in adjacency matrix at rows...");
    console.log(singleConnectedRows);
    console.log("Edge List has been modified, updating adjacency matrix...");
    // Since this test can modify the edge list the adjacency matrix needs to be updated
  }
  else
  {
    console.log("No single connected nodes found in adjacency matrix");
  }


}

function FindClosestNode(node, nodes)
{
  //console.log("Finding closest node to node: " + node.index);
  var closest;
  if(node.index < nodes.length-2)
  {
    closest = nodes[node.index + 1];
  }
  else
  {
    closest = nodes[node.index - 1];
  }
  
  var lastDistance = EuclideanDistance(node.latlng, closest.latlng);

  for(var i = node.index; i < nodes.length; i++)
  {
    if(i != node.index)
    {
      var distance = EuclideanDistance(node.latlng, nodes[i].latlng)
      if(distance < lastDistance)
      {
        closest = nodes[i];
        lastDistance = distance;
      }
    }
  }

  for(var i = nodes.length-1; i > 0; i--)
  {
    if(i != node.index)
    {
      var distance = EuclideanDistance(node.latlng, nodes[i].latlng)
      if(distance < lastDistance)
      {
        closest = nodes[i];
        lastDistance = distance;
      }
    }
  }

  //console.log(closest);
  return closest;
}







// Helper to get a random float in a range
// function RandomFloatRange(min, max) 
// {
//   return Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);
// }

// function RandomIntRange(min, max) 
// {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min)) + min;
// }

// Helper to get Euclidean Distance between two latlng coords
function EuclideanDistance(coordsA, coordsB)
{
  return Math.sqrt(Math.pow((coordsB[0] - coordsA[0]), 2) + Math.pow((coordsB[1] - coordsA[1]), 2));
}

// function Normalize(val, max, min) 
// { 
//   return (val - min) / (max - min); 
// }


// Helper to check if two arrays are equal
function ArraysEqual(arr1, arr2) 
{
    if(arr1.length !== arr2.length) {
        return false;
      }

    for(var i = arr1.length; i >= 0; i--) {
        if(arr1[i] !== arr2[i]) {
            return false;
          }
    }

    return true;
}

// helper function to store the reverse of an array without mutating the original and returning the reversed array
// because in javascript Array.reverse() mutates the original before the console can print so its hard to debug
function arrayRev(arr)
{
  var reverseArr = [];

  for(var i = arr.length-1; i >= 0; i--)
  {
    reverseArr.push(arr[i]);
  }

  return reverseArr;
}

// use: console.log([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(normalize(5, 15)));
// function ArrayNormalize(min, max) {
//     var delta = max - min;
//     return function (val) {
//         return (val - min) / delta;
//     };
// }










function init () {
  testPathPost();
  // testGraphPost();
  testGeoJSON();
}

init();