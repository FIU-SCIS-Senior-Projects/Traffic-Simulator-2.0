// Properties/Settings (in future could come from a file or db)
var centerLat = 25.786;
var centerLon = -80.257;
var boundsDeltaLon = 0.2;
var boundsDeltaLat = 0.1;
var maxZ = 14;
var minZ = 12;
var startZ = 13;

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


