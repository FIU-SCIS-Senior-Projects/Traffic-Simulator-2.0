
const geojson = require('../../data/big_geo');

function parseGeoJson (geojson) {
  let nodeCount = 0;
  let nodes = [];
  let edges = [];
  let startNode;
  let endNode;

  geojson.features.forEach((feature) => {
    let coords = [];
    startNode = null;
    endNode = null;
    feature.geometry.coordinates.forEach((coord) => {
      coords.push([coord[1], coord[0]]);
    });

    for (var i = 0; i < nodes.length; i++) {
      if (ArraysEqual(nodes[i].latlng, coords[0])) {
        startNode = nodes[i];
      }
      if (ArraysEqual(nodes[i].latlng, coords[coords.length - 1])) {
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
  });

  // Not sure why the v1.0 team initialized twice and changed the
  // nodes and edges. Perhaps something to debug at some point.
  let adjMatrix = initAdjacenyMatrix(nodes, edges);
  TestAdjacencyMatrixForSingleConnectedNodes(adjMatrix, nodes, edges);
  adjMatrix = initAdjacenyMatrix(nodes, edges);

  return adjMatrix;
}


function initAdjacenyMatrix (nodes, edges) {
  // console.log('nodes', nodes);
  // console.log('edges', edges);
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
    // console.log(singleConnectedRows);
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

// Helper to get Euclidean Distance between two latlng coords
function EuclideanDistance(coordsA, coordsB)
{
  return Math.sqrt(Math.pow((coordsB[0] - coordsA[0]), 2) + Math.pow((coordsB[1] - coordsA[1]), 2));
}

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

module.exports = parseGeoJson;
