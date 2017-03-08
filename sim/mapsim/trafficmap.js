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

    // make a node object based on the lines first coordinate 
    // and the associates set of coordinates that make up its edge
    var node = {index: count, latlng: coords[0], edge: coords};
    nodes.push(node);
    count++;
     
  });

  // Just using this for visualization right now to help understand
  DrawNodes();
});

// Function to draw the nodes on the map
function DrawNodes()
{
  for(var i = 0; i < nodes.length; i++)
  {
    console.log(nodes[i]);

    var circle = L.circle(nodes[i].latlng, {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 5
    }).addTo(map);
  }
}

// Function to check if two nodes are neighbors (not using this yet)
function IsNeighbor(nodeA, nodeB)
{
  return arraysEqual(nodeA.edge[edge.length-1], nodeB.edge[0]);
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


//// For Later when ready to draw animated markers on map
// var line = L.polyline(coords),
// animatedMarker = L.animatedMarker(line.getLatLngs());
// map.addLayer(animatedMarker);











