// TO DO:
//    - Create points array from polyline start and end coords
//    - Use points array to create an adjacency matrix of edge weights

// Properties/Settings (in future could come from a file or db)
var centerLat = 25.7294483;
var centerLon = -80.4076104;
var boundsDeltaLon = 0.2;
var boundsDeltaLat = 0.1;
var maxZ = 25;
var minZ = 12;
var startZ = 13;
var geoDataFileName = "fiu_roads.geojson"

// Node Graph
var edges = [];
var adjacencyMatrix = [];

// Set Map Properties
var center = L.latLng(centerLat, centerLon);
var northEastBound = L.latLng(centerLat - boundsDeltaLat, centerLon + boundsDeltaLon);
var southWestBound = L.latLng(centerLat + boundsDeltaLat, centerLon - boundsDeltaLon);

// Map Layer for MapQuest Plugin
var mapLayer = MQ.mapLayer()

// Init Map
var map = L.map('map', {
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

//Get json object for major highways
$.getJSON(geoDataFileName, function( data ) {
  var count = 0;
  // iterate through geojson features 
  $.each(data.features, function (key, val) {
    var coords = [];
    // iterate through coordinates of the line feature
    $.each(val.geometry.coordinates, function(i,j){
        var point = [j[1], j[0]];
        coords.push(point);
    });
    reverseCoords = ArrayReverse(coords);
    // make a node object based on the lines first coordinate 
    // and the associates set of coordinates that make up its edge
    var nodeA = {index: count, latlng: coords[0], edge: coords, type: "A"};
    var nodeB = {index: ++count, latlng: reverseCoords[0], edge: reverseCoords, type: "B"};

    var edgeA = {startNode: nodeA, endNode: nodeB, points: coords};
    var edgeB = {startNode: nodeB, endNode: nodeA, points: reverseCoords};

    edges.push(edgeA);
    edges.push(edgeB);
    // count++;
    //console.log(edgeA);
    //console.log(edgeB);
     
  });
  // Just using this for visualization right now to help understand
  DrawNodes();
  DrawPolylines();
  InitAdjacencyMatrix();
  PrintAdjacencyMatrix(); // for debugging
});

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
    var polyline = new L.Polyline(edges[i].points, {
        color: 'blue',
        weight: 2,
        opacity: 0.5,
        smoothFactor: 1
    });
    polyline.addTo(map);      
  }
}

// Fills matrix with 0's first, then sets a 1 if there is a connection between two indeces
function InitAdjacencyMatrix()
{
  // Fill matrix with 0's first
  for(var i = 0; i < edges.length/2; i++)
  {
    // the adjacency matrix row
    var row = [];
    for(var j = 0; j < edges.length/2; j++)
    {
      row.push(0);  
    }
    adjacencyMatrix.push(row);
  }

  // Set 1's for connected indeces
  for(var i = 0; i < edges.length-1; i++)
  {
    var indexA = edges[i].startNode.index;
    var indexB = edges[i].endNode.index;
    adjacencyMatrix[indexA][indexB] = 1;
  }
}


// Debug function to print out the adj matrix
function PrintAdjacencyMatrix()
{
  console.log(adjacencyMatrix);
}

// Helper to check if two arrays are equal
function arraysEqual(arr1, arr2) {
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


//// For Later when ready to draw animated markers on map
// var line = L.polyline(coords),
// animatedMarker = L.animatedMarker(line.getLatLngs());
// map.addLayer(animatedMarker);











