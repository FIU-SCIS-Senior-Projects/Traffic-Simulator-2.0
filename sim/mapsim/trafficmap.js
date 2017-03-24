

// Data Properties
var geoDataFileName = "fiu_roads.geojson";
var InitGraphURL = "http://localhost:5000/initialize_graph";

// Graph Structure
var nodes = []
var edges = [];
var adjacencyMatrix = [];

// Map Properties (these are defaults, real values will come from the data files)
var map;
var mapLayer;
var centerLat = 25.7294483;
var centerLon = -80.4076104;
var boundsDeltaLon = 0.2;
var boundsDeltaLat = 0.1;
var maxZ = 25;
var minZ = 12;
var startZ = 13;

// Starts the map
InitData(geoDataFileName);
InitDropZone();

// Initialize the File Drop Zone
function InitDropZone()
{
  var dropZone = document.getElementById('dropZone');
  // 1
  window.addEventListener('dragenter', function(e) {
      ShowDropZone();
  });

  // 2
  dropZone.addEventListener('dragenter', AllowDrag);
  dropZone.addEventListener('dragover', AllowDrag);

  // 3
  dropZone.addEventListener('dragleave', function(e) {
      HideDropZone();
  });

  // 4
  dropZone.addEventListener('drop', HandleDrop);
}



// Initializes the geo json data, builds the node graph, and draws the map
function InitData(file)
{
  // Read data and initialize graph structures
  $.getJSON(file, function( data ) {
    var count = 0;
    // iterate through geojson features
    $.each(data.features, function (key, val) {
      var coords = [];
      // iterate through coordinates of the line feature
      $.each(val.geometry.coordinates, function(i,j){
          var point = [j[1], j[0]];
          coords.push(point);
      });

      var startNode;
      var endNode;
      for(var i = 0; i < nodes.length; i++)
      {
        if(ArraysEqual(nodes[i].latlng, coords[0]))
        {
          startNode = nodes[i];
        }
        if(ArraysEqual(nodes[i].latlng, coords[coords.length-1]))
        {
          endNode = nodes[i];
        }
      }

      if(startNode == null)
      {
        startNode = {index: count, latlng: coords[0]};
        count++;
        nodes.push(startNode);
      }
      if(endNode == null)
      {
        endNode = {index: count, latlng: coords[coords.length-1]};
        count++;
        nodes.push(endNode);
      }

      edge = {startNode: startNode, endNode: endNode, linePoints: coords};
      reverseEdge = {startNode: endNode, endNode: startNode, linePoints: ArrayReverse(coords)};
      edges.push(edge);
      edges.push(reverseEdge);

    });
    //console.log(edges);
    InitMap();
    InitAdjacencyMatrix();
    InitGraph();
    DrawNodes();
    DrawPolylines();
    //PrintAdjacencyMatrix(); // for debugging
  });
}


function InitMap()
{
  if(edges[0] != null && edges.length > 0)
  {
    centerLat = edges[0].linePoints[0][0];
    centerLon = edges[0].linePoints[0][1];
  }

  // Set Map Properties
  var center = L.latLng(centerLat, centerLon);
  var northEastBound = L.latLng(centerLat - boundsDeltaLat, centerLon + boundsDeltaLon);
  var southWestBound = L.latLng(centerLat + boundsDeltaLat, centerLon - boundsDeltaLon);

  // Map Layer for MapQuest Plugin
  mapLayer = MQ.mapLayer()

  // Init Map
  map = L.map('map', {
    layers: mapLayer,
    maxZoom: maxZ,
    minZoom: minZ,
    maxBounds: [southWestBound, northEastBound],
  }).setView(center, startZ);

  // Add Traffic data from Map Quest Plugin
  L.control.layers({
    'Map': mapLayer,
    'Satellite': MQ.satelliteLayer(),
    'Hybrid': MQ.hybridLayer(),
    'Dark': MQ.darkLayer(),
    'Light': MQ.lightLayer()
  }, {
    'Traffic Flow': MQ.trafficLayer({layers: ['flow']}),
    'Traffic Incidents': MQ.trafficLayer({layers: ['incidents']})
  }).addTo(map);
}


function InitGraph()
{
  var testMatrix =
  [[0.0, 1.0, 2.0, 0.0],
  [5.0, 0.0, 0.0, 3.0],
  [2.0, 0.0, 0.0, 4.0],
  [0.0, 1.0, 1.0, 0.0]];

  var jsonOBJ = {"map": testMatrix, "algos": [0]};
  var adjacencyMatrixJSON = JSON.stringify(jsonOBJ);

  AddDownloadButton(adjacencyMatrixJSON);



  //console.log("sending init graph request to " + InitGraphURL);

  // // API Call CURENTLY NOT WORKING
  // $.ajax({
  //     url : InitGraphURL,
  //     type: "POST",
  //     data : adjacencyMatrixJSON,
  //     dataType: "json",
  //     headers: {'api_id': 'testuser1', 'api_key': 'a798e3d9-3222-4ce6-908f-a08102ece1a3'},
  //     success: function(data, textStatus, jqXHR)
  //     {
  //         console.log("\nStatus: " + jqXHR.status);
  //     },
  //     error: function (jqXHR, textStatus, errorThrown)
  //     {
  //         console.log("Status: " + jqXHR.status + "\n" + errorThrown);
  //     }
  // });

}

// Adds the button to download the adjacency matrix as a json file
function AddDownloadButton(json)
{
  var downloadButton = L.easyButton('Download', function(btn, map){
    var dl = document.createElement('a');
    dl.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(json));
    dl.setAttribute('download', 'adjacencyMatrix.json');
    dl.click();
  }).addTo(map);
}

// Function to draw the nodes on the map
function DrawNodes()
{
  for(var i = 0; i < edges.length; i++)
  {
    // Draw a circle where the node is
    var circle = L.circle(edges[i].startNode.latlng, {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.1,
      radius: 5
    }).addTo(map);
  }
}

// Function to draw polylines between node neighbors on the map
function DrawPolylines()
{
  for(var i = 0; i < edges.length; i++)
  {
    color = GetWeightedEdgeColor(edges[i]);
    var polyline = new L.Polyline(edges[i].linePoints, {
        color: color,
        weight: 2,
        opacity: 0.5,
        smoothFactor: 1
    });
    polyline.addTo(map);
  }
}

function GetWeightedEdgeColor(edge)
{
  var startIndex = edge.startNode.index;
  var endIndex = edge.endNode.index;
  var weight = adjacencyMatrix[startIndex][endIndex] - 1;
  //console.log(weight);
  if(weight > 0.1)
    return "#FF5733"

  if(weight > 0.9)
    return "#FFF633"

  if(weight > 0.08)
    return "#D1FF33"

  if(weight > 0.07)
    return "#9BFF33"

  return "#33FF43"

}

// Fills matrix with 0's first, then sets a 1 if there is a connection between two indeces
function InitAdjacencyMatrix()
{
  // Fill matrix with 0's first
  for(var i = 0; i < edges.length; i++)
  {
    // the adjacency matrix row
    var row = [];
    for(var j = 0; j < edges.length; j++)
    {
      row.push(0);
    }
    adjacencyMatrix.push(row);
  }

  // Set 1's for connected indeces
  for(var i = 0; i < edges.length; i++)
  {

    var indexA = edges[i].startNode.index;
    var indexB = edges[i].endNode.index;
    var latlngA = edges[i].startNode.latlng;
    var latlngB = edges[i].endNode.latlng;
    adjacencyMatrix[indexA][indexB] = 1 + EuclideanDistance(latlngA, latlngB);
    adjacencyMatrix[indexA][indexB] += RandomInRange(0.05, 0.1);
  }
}

function RandomInRange(min, max) {
  return Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);
}


// Debug function to print out the adj matrix
function PrintAdjacencyMatrix()
{
  console.log(adjacencyMatrix);
}

function EuclideanDistance(coordsA, coordsB)
{
  return Math.sqrt(Math.pow((coordsB[0] - coordsA[0]), 2) + Math.pow((coordsB[1] - coordsA[1]), 2));
}

// Helper to check if two arrays are equal
function ArraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;

    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

// helper function to store the reverse of an array without mutating the original and returning the reversed array
// because in javascript Array.reverse() mutates the original before the console can print so its hard to debug
function ArrayReverse(arr)
{
  reverseArr = [];
  for(var i = arr.length-1; i > -1; i--)
  {
    reverseArr.push(arr[i]);
  }
  return reverseArr;
}

function GenerateAnimatedMarker(path)
{

}


//// For Later when ready to draw animated markers on map
// var line = L.polyline(coords),
// animatedMarker = L.animatedMarker(line.getLatLngs());
// map.addLayer(animatedMarker);
