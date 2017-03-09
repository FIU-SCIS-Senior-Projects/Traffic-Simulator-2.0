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
var nodes = [];
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
    var nodeA = {index: count, latlng: coords[0], edge: coords, type: "startNode"};
    var nodeB = {index: ++count, latlng: coords[coords.length-1], edge: reverseCoords, type: "endNode"};
    nodes.push(nodeA);
    nodes.push(nodeB);
    count++;
    // console.log(nodeA);
    // console.log(nodeB);
     
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
  for(var i = 0; i < nodes.length; i++)
  {
    var circle = L.circle(nodes[i].latlng, {
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
  for(var i = 0; i < nodes.length; i++)
  {
    for(var j = 0; j < nodes.length; j++)
    {
      if(IsNeighbor(nodes[i], nodes[j]))
      {
        var polyline = new L.Polyline(nodes[i].edge, {
            color: 'blue',
            weight: 3,
            opacity: 0.1,
            smoothFactor: 1
        });
        polyline.addTo(map);
      }       
    }
  }
}

// Function to draw polylines between node neighbors on the map
function InitAdjacencyMatrix()
{
  for(var i = 0; i < nodes.length; i++)
  {
    // the adjacency matrix row
    var row = [];
    for(var j = 0; j < nodes.length; j++)
    {
      if(i != j)
      {
        if(IsNeighbor(nodes[i], nodes[j]))
        {
          row.push(1);
        }
        else
        {
          row.push(0);
        } 
      }
      else
      {
        row.push(0);
      }   
    }
    adjacencyMatrix.push(row);
  }
}

// Debug function to print out the adj matrix
function PrintAdjacencyMatrix()
{
  console.log(adjacencyMatrix);
}

// Function to check if two nodes are neighbors (not using this yet)
function IsNeighbor(nodeA, nodeB)
{
  return  arraysEqual(nodeA.edge[nodeA.edge.length-1], nodeB.edge[0]) 
          ||
          arraysEqual(nodeA.latlng, nodeB.latlng);
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











