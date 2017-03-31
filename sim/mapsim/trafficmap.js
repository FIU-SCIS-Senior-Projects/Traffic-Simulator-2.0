// TO DO: 
//  1. Figure out how to clear all poly lines and circles from map before updating data
//  1. Re-init map on file drop

// Data Properties
var defaultGeoDataFileName = "fiu_roads.geojson";
var InitGraphURL = "http://localhost:5000/initialize_graph_dev";
var GetPathURL = "http://localhost:5000/get_path_dev";
var InitGraphStatus;
var currentData;

// Sim Properties
var simStop = true;
var GetPathRoutine;
var InitGraphRoutine;
var checkInitGraphRoutine;
var vehicleMarkers = [];

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
var startZ = minZ;
var polyLines = [];
var circles = [];

// Starts the map
InitData(defaultGeoDataFileName);
InitDropZone();

// Initialize the File Drop Zone
function InitDropZone()
{
	var dropZone = document.getElementById('dropZone');
	// 1
	window.addEventListener('dragenter', function(e) 
	{
		ShowDropZone();
	});

	// 2
	dropZone.addEventListener('dragenter', AllowDrag);
	dropZone.addEventListener('dragover', AllowDrag);

	// 3
	dropZone.addEventListener('dragleave', function(e) 
	{
		HideDropZone();
	});

	// 4
	dropZone.addEventListener('drop', function(e)
	{
		HandleDrop(e, UpdateData)
	});
}

// Initializes the geo json data, builds the node graph, and draws the map
function InitData(file)
{
	nodes = []
	edges = [];
	adjacencyMatrix = [];
	// Read data and initialize graph structures
	$.getJSON(file, function( data ) 
	{
		UpdateData(data);
	});
}

// Updates the data when a new geojson file is dragged and dropped onto the map
function UpdateData(data)
{
	currentData = data;
	if(this.map != null)
	{
		// Need to do this since we are going to re-initialize the map now
		this.map.remove();
	}

	nodes = []
	edges = [];
	adjacencyMatrix = [];

	var count = 0;

	// iterate through geojson features
	$.each(data.features, function (key, val) 
	{
		var coords = [];

		// iterate through coordinates of the line feature
		$.each(val.geometry.coordinates, function(i,j)
		{
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

		edge = {startNode: startNode, endNode: endNode, linePoints: coords, vehicles: []};
		reverseEdge = {startNode: endNode, endNode: startNode, linePoints: ArrayReverse(coords), vehicles: []};
		edges.push(edge);
		edges.push(reverseEdge);
	});
	//console.log(edges);
	InitMap();
	InitAdjacencyMatrix();
	TestAdjacencyMatrixForEmptyRows();
	TestAdjacencyMatrixForDeadEndRows();
	TestAdjacencyMatrixForSingleConnectedNodes();
	AddDrawGeoDataButton();
	PrintAdjacencyMatrix();
	//var polylineAnim = coroutine(AnimatePolylines);
	//setInterval(polylineAnim, 3);
	//DrawPolylines();
	//DrawNodes();
	//setInterval(polylineAnim2, 5);
}

// Initializes the leaflet map
function InitMap()
{
	if(edges[0] != null && edges.length > 0)
	{
		centerLat = edges[edges.length/2].linePoints[0][0];
		centerLon = edges[edges.length/2].linePoints[0][1];
	}

	// Set Map Properties
	var center = L.latLng(centerLat, centerLon);
	var northEastBound = L.latLng(centerLat - boundsDeltaLat, centerLon + boundsDeltaLon);
	var southWestBound = L.latLng(centerLat + boundsDeltaLat, centerLon - boundsDeltaLon);

	// Map Layer for MapQuest Plugin
	mapLayer = MQ.mapLayer()

	// Init Map
	map = new L.map('map', 
	{
		layers: mapLayer,
		maxZoom: maxZ,
		minZoom: minZ,
		maxBounds: [southWestBound, northEastBound],
	}).setView(center, startZ);

	// Add Traffic data from Map Quest Plugin
	L.control.layers(
	{
		'Map': mapLayer,
		'Satellite': MQ.satelliteLayer(),
		'Hybrid': MQ.hybridLayer(),
		'Dark': MQ.darkLayer(),
		'Light': MQ.lightLayer()
	}, 
	{
		'Traffic Flow': MQ.trafficLayer({layers: ['flow']}),
		'Traffic Incidents': MQ.trafficLayer({layers: ['incidents']})
	}).addTo(map);
}



// Initializes the graph structure and makes an API call to init the graph in the server side
function InitGraphData()
{
	var testMatrix =
	[[0.0, 1.0, 2.0, 0.0],
	[5.0, 0.0, 0.0, 3.0],
	[2.0, 0.0, 0.0, 4.0],
	[0.0, 1.0, 1.0, 0.0]];

	var jsonOBJ = {"map": adjacencyMatrix, "algos": [0]};
	var adjacencyMatrixJSON = JSON.stringify(jsonOBJ);

	AddDownloadButton(adjacencyMatrixJSON);
	AddInitGraphButton(adjacencyMatrixJSON);
}

function InitGraph(jsonData)
{
	console.log("Requesting API Init Graph...");
	InitGraphStatus = 0;
	// API Call CURENTLY NOT WORKING
	$.ajax({
	    url : InitGraphURL,
	    type: "POST",
	    data : jsonData,
	    dataType: "json",
	    //headers: {'api_id': 'testuser1', 'api_key': 'a798e3d9-3222-4ce6-908f-a08102ece1a3'},
	    success: function(data, textStatus, jqXHR)
	    {
	    	InitGraphStatus = jqXHR.status;
	        console.log("\nStatus: " + jqXHR.status);
	    },
	    error: function (jqXHR, textStatus, errorThrown)
	    {
	    	InitGraphStatus = jqXHR.status;
	        console.log("Status: " + jqXHR.status + "\n" + errorThrown);
	    }
	});
}



function GetPath(jsonData, callback)
{
	// API Call CURENTLY NOT WORKING
	$.ajax({
	    url : GetPathURL,
	    type: "POST",
	    data : jsonData,
	    dataType: "json",
	    //headers: {'api_id': 'testuser1', 'api_key': 'a798e3d9-3222-4ce6-908f-a08102ece1a3'},
	    success: function(data, textStatus, jqXHR)
	    {
	    	callback(data);
	        console.log("\nStatus: " + jqXHR.status);
	    },
	    error: function (jqXHR, textStatus, errorThrown)
	    {
	        console.log("Status: " + jqXHR.status + "\n" + errorThrown);
	    }
	});
}

// Adds the button to download the adjacency matrix as a json file
function AddDownloadButton(json)
{
	var downloadButton = L.easyButton(
	{
		states:[
			{
				icon: 'fa fa-download fa-2x',
				onClick: function()
				{ 
					var dl = document.createElement('a');
					dl.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(json));
					dl.setAttribute('download', 'adjacencyMatrix.json');
					dl.click();
				}
			}
		]
	}).addTo(map);
}

function AddInitGraphButton(json)
{
	var InitGraphButton = L.easyButton(
	{
		states: 
		[
			{
			    stateName: 'idle',
			    icon: 'fa fa-road fa-2x',
			    title: 'InitGraph',
			    onClick: function(control) 
			    {
			    	simStop = false;
					InitGraph(json);
					CheckInitGraphStatus(control);
					control.state('waiting-for-api');
			    }
			}, 
			{
				stateName: 'waiting-for-api',
				icon: 'fa fa-spinner fa-pulse fa-2x',
				title: 'WaitingForAPI',
				onClick: function(control) 
				{
					// do nothing, were waiting for API to respond
				},
			},
			{
			    stateName: 'playing',
			    icon: 'fa fa-stop fa-2x',
			    title: 'InitGraph',
			    onClick: function(control) 
			    {
					simStop = true;
					stopCoroutine(GetPathRoutine);
					control.state('idle');
			    }
			}, 
		]
	}).addTo(map);
}

function AddDrawGeoDataButton()
{
	var DrawGeoDataButton = L.easyButton(
	{
		states: 
		[
			{
			    stateName: 'show',
			    icon: 'fa fa-eye fa-2x',
			    title: 'DrawData',
			    onClick: function(control) 
			    {
			    	DrawPolylines();
			    	DrawNodes();
					control.state('hide');
			    }
			}, 
			{
				stateName: 'hide',
				icon: 'fa fa-eye-slash fa-2x',
				title: 'WaitingForAPI',
				onClick: function(control) 
				{
					ErasePolyLines();
					EraseNodes();
					control.state('show');
				},
			},
		]
	}).addTo(map);
}



function CheckInitGraphStatus(control)
{
	checkInitGraphRoutine = setInterval(function() 
	{
		var graceCount = 0;
		if (InitGraphStatus == 200) 
		{
			console.log("Init Graph Successful");
			control.state('playing');
			GetPathRoutine = coroutine(SimulatePaths);
			setInterval(GetPathRoutine, 3000);
			stopCoroutine(checkInitGraphRoutine);
		}
		else if(graceCount > 5)
		{
			alert("Init Graph Failure, check API settings");
			control.state('idle');
			stopCoroutine(checkInitGraphRoutine);
		}
		graceCount++;
	}, 1000); // check every 100ms
}

function* SimulatePaths()
{
	while(!simStop)
	{
		for(var i = 0; i < 20; i++)
		{
			var randStartIndex = RandomIntRange(0,30);
			var randEndIndex = RandomIntRange(adjacencyMatrix.length-30,adjacencyMatrix.length-1);
			var jsonObj = {"algorithm": 0, "source": randStartIndex, "target": randEndIndex};
			var getPathJson = JSON.stringify(jsonObj);
			GetPath(getPathJson, SpawnVehicle);
		}
		yield;
	}

}

function SpawnVehicle(data)
{
	SimulateVehicle(data['map']);
}

// Function to draw the nodes on the map
function DrawNodes()
{
	circles = [];
	for(var i = 0; i < edges.length; i++)
	{
		var popUpInfo = "<dl><dt><b>Node:</b></dt>"
		           + "<dd>" + edges[i].startNode.index.toString() + "</dd>"
		           + "<dt><b>LatLong:</b></dt>"
		           + "<dd>[" + edges[i].startNode.latlng.toString() + "]</dd>";

		// Draw a circle where the node is
		var circleMarker = L.circleMarker(edges[i].startNode.latlng, 
		{
			color: 'black',
			weight: 0.5,
			opacity: 0.9, 
			fillColor: 'white',
			fillOpacity: 0.3,
			radius: 3
		}).addTo(map).bindPopup(popUpInfo);
		circleMarker.on("mouseover", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
				color: 'black',
				weight: 0.8,
				opacity: 1, 
				fillColor: 'yellow',
				fillOpacity: 0.7,
				radius: 5
		    });
		});
		circleMarker.on("mouseout", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
				color: 'black',
				weight: 0.5,
				opacity: 0.9, 
				fillColor: 'white',
				fillOpacity: 0.3,
				radius: 3
		    });
		});
		circles.push(circleMarker);
	}
}

function EraseNodes()
{
	for(var i = 0; i < circles.length; i++)
	{
		map.removeLayer(circles[i]);
	}
}

function* AnimateNodes()
{
	for(var i = 0; i < edges.length; i++)
	{
		var popUpInfo = "<dl><dt><b>Node:</b></dt>"
		           + "<dd>" + edges[i].startNode.index.toString() + "</dd>"
		           + "<dt><b>LatLong:</b></dt>"
		           + "<dd>[" + edges[i].startNode.latlng.toString() + "]</dd>";

		// Draw a circle where the node is
		var circleMarker = L.circleMarker(edges[i].startNode.latlng, 
		{
			color: 'black',
			weight: 0.5,
			opacity: 0.9, 
			fillColor: 'white',
			fillOpacity: 0.3,
			radius: 5
		}).addTo(map).bindPopup(popUpInfo);
		circleMarker.on("mouseover", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
				color: 'blue',
				weight: 0.8,
				opacity: 1, 
				fillColor: 'blue',
				fillOpacity: 0.7,
				radius: 7
		    });
		});
		circleMarker.on("mouseout", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
				color: 'black',
				weight: 0.5,
				opacity: 0.9, 
				fillColor: 'white',
				fillOpacity: 0.3,
				radius: 5
		    });
		});
		yield;
	}
}

// Function to draw polylines between node neighbors on the map
function DrawPolylines()
{
	polyLines = [];
	for(var i = 0; i < edges.length; i++)
	{


		var popUpInfo = "<dl><dt><b>Edge:</b></dt>"
		           + "<dd>" + i + "</dd>"
		           + "<dt><b>LatLong:</b></dt>"
		           + "<dd>[" +  + edges[i].startNode.index.toString() + "->" +  edges[i].endNode.index.toString() + "]</dd>"
		           + "<dl><dt><b>Weight:</b></dt>"
		           + "<dd>" + edges[i].weight + "</dd>"

		//var color = GetWeightedEdgeColor(edges[i]);

		var polyline = new L.Polyline(edges[i].linePoints, 
		{
		    color: '#003fff',
		    weight: 2,
		    opacity: 0.9,
		    smoothFactor: 1
		});
		polyline.on("mouseover", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
			    color: 'yellow',
			    weight: 3,
			    opacity: 1
		    });
		});
		polyline.on("mouseout", function(e)
		{
		   	var layer = e.target;

		    layer.setStyle({
			    color: '#003fff',
			    weight: 2,
			    opacity: 0.9,
			    smoothFactor: 1
		    });
		});
		polyline.addTo(map).bindPopup(popUpInfo);
		polyLines.push(polyline);
	}
}

function ErasePolyLines()
{
	for(var i = 0; i < polyLines.length; i++)
	{
		map.removeLayer(polyLines[i]);
	}
}

// Function to draw polylines between node neighbors on the map
function* AnimatePolylines()
{
	for(var i = 0; i < edges.length; i++)
	{

		var popUpInfo = "<dl><dt><b>Edge:</b></dt>"
		           + "<dd>" + i + "</dd>"
		           + "<dt><b>Nodes:</b></dt>"
		           + "<dd>[" +  + edges[i].startNode.index.toString() + "->" +  edges[i].endNode.index.toString() + "]</dd>";

		for(var j = 0; j < edges[i].linePoints.length + 1; j++)
		{

			var points2Anim = edges[i].linePoints.slice(0,j);

			color = GetWeightedEdgeColor(edges[i]);
			var polyline = new L.Polyline(points2Anim, 
			{
			    color: color,
			    weight: 2,
			    opacity: 0.9,
			    smoothFactor: 1
			});
			polyline.addTo(map).bindPopup(popUpInfo);
			polyline.on("mouseover", function(e)
			{
			   var layer = e.target;

			    layer.setStyle({
				    color: 'blue',
				    weight: 3,
				    opacity: 1
			    });
			});
			polyline.on("mouseout", function(e)
			{
			   var layer = e.target;

			    layer.setStyle({
				    color: color,
				    weight: 2,
				    opacity: 0.9,
				    smoothFactor: 1
			    });
			});
			yield;
		}
	}
	var nodeAnim = coroutine(AnimateNodes);
	setInterval(nodeAnim, 5);
}

// Fills matrix with 0's first, then sets a 1 if there is a connection between two indeces
function InitAdjacencyMatrix()
{
	adjacencyMatrix = [];
	// Fill matrix with 0's first
	for(var i = 0; i < nodes.length; i++)
	{
		// the adjacency matrix row
		var row = [];
		for(var j = 0; j < nodes.length; j++)
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
		var weight = 1 + EuclideanDistance(latlngA, latlngB);
		adjacencyMatrix[indexA][indexB] = weight;
		edges[i].weight = weight;
		//console.log(edges[i]);
	}
}

// Tests whether there are any all zero rows in the adjacency matrix
function TestAdjacencyMatrixForEmptyRows()
{
	//console.log("Testing adjacency matrix for unconnected nodes...");
	for(var i = 0; i < adjacencyMatrix.length; i++)
	{
		var unconnectedRows = [];
		var zeroCount = 0;
		for(var j = 0; j < adjacencyMatrix.length; j++)
		{
			if(adjacencyMatrix[i][j] == 0)
			{
				zeroCount++;
			}
		}
		if(zeroCount == adjacencyMatrix.length)
		{
			unconnectedRows.push(adjacencyMatrix[i]);
		}
	}
	// if(unconnectedRows.length > 0)
	// {
	// 	console.log("Unconnected nodes found in adjacency matrix at rows...");
	// 	console.log(unconnectedRows);
	// }
	// else
	// {
	// 	console.log("No unconnected nodes found in adjacency matrix");
	// }
}

// Tests whether there are any all zero rows in the adjacency matrix
function TestAdjacencyMatrixForDeadEndRows()
{
	//console.log("Testing adjacency matrix for dead end nodes...");
	var deadEndNodes = [];
	for(var i = 0; i < adjacencyMatrix.length; i++)
	{
		var connectedIndeces = [];
		for(var j = 0; j < adjacencyMatrix.length; j++)
		{
			if(adjacencyMatrix[i][j] > 0)
			{
				connectedIndeces.push(j);
			}
		}
		//console.log(i + ": " + connectedIndeces);
		for(var k = 0; k < connectedIndeces.length; k++)
		{
			if(adjacencyMatrix[connectedIndeces[k]][i] == 0)
			{
				deadEndNodes.push(k);
			}
		}
	}
	// if(deadEndNodes.length > 0)
	// {
	// 	console.log("Dead end nodes found in adjacency matrix at rows...");
	// 	console.log(deadEndNodes);
	// }
	// else
	// {
	// 	console.log("No dead end nodes found in adjacency matrix");
	// }	
}

function TestAdjacencyMatrixForSingleConnectedNodes()
{
	//console.log("Testing adjacency matrix for single connected nodes...");
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

			var closestNode = FindClosestNode(nodes[i]);
			edge = {startNode: nodes[i], endNode: closestNode, linePoints: [nodes[i].latlng, closestNode.latlng]};
			edges.push(edge);
			
		}
	}
	// if(singleConnectedRows.length > 0)
	// {
	// 	console.log("Single connected nodes found in adjacency matrix at rows...");
	// 	console.log(singleConnectedRows);
	// 	console.log("Updating Adjacency Matrix...");

	// }
	// else
	// {
	// 	console.log("No single connected nodes found in adjacency matrix");
	// }
	InitAdjacencyMatrix();
	InitGraphData();
	//PrintAdjacencyMatrix();
}

// Returns a color corresponding to an edge weight
function GetWeightedEdgeColor(edge)
{
	var startIndex = edge.startNode.index;
	var endIndex = edge.endNode.index;
	var weight = (adjacencyMatrix[startIndex][endIndex] - 1) * 100;


	// worst
	if(weight > 9)
	{
		return "#f44b42"
	}
	// bad
	else if(weight > 7)
	{
		return "#f49b41"
	}
	// ok
	else if(weight > 5)
	{
		return "#ecf475"
	}
	// good
	else if(weight > 3)
	{
		return "#a6e855"
	}

	// best
	return "#00ff04"
}

function FindClosestNode(node)
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

function GetEdge(startNode, endNode)
{
	for(var i = 0; i < edges.length; i++)
	{
		if(edges[i].startNode == nodes[startNode] && edges[i].endNode == nodes[endNode])
		{
			return edges[i];
		}
	}
}

function SimulateVehicle(path)
{
	var pathPoints = GetPathPoints(path);

	var line = L.polyline(pathPoints);

	var carIcon = L.icon.mapkey({icon: '', background: '#ff2100', size:5, boxShadow: false});



    var animatedMarker = L.animatedMarker(line.getLatLngs(), 
    {
		distance: 750,  // meters
		interval: 100, // milliseconds
		icon: carIcon,
		onEnd: function()
		{
			//vehicleMarkers.remove(animatedMarker);
			map.removeLayer(animatedMarker);
		}
	});

	map.addLayer(animatedMarker);

	//vehicleMarkers.push(animatedMarker);

	// StyleVehiclesRoutine = coroutine(StyleVehicles, animatedMarker);
	// setInterval(StyleVehiclesRoutine, 100);

}



function* StyleVehicles(vehicle)
{
	while(!simStop)
	{
		var point = [vehicle.getLatLng().lat, vehicle.getLatLng().lng];
		var edge = GetClosestEdgeToPoint(point);
		if(!edge.vehicles.includes(vehicle))
		{
			edge.vehicles.push(vehicles);
		}
		var color = GetWeightedEdgeColor(edge);
		vehicle._icon.firstChild.style.backgroundColor = color;
		yield;
	}	
}

function* CountVehicles()
{
	while(!simStop)
	{
		for(var i = 0; i < edges.length; i++)
		{
			var vehicleCount = edges[i].vehicles.length;
			var startIndex = edges[i].startNode.index;
			var endIndex = edges[i].endNode.index;
			adjacencyMatrix[startIndex][endIndex] += vehicleCount/100;
			PrintAdjacencyMatrix();
		}
		yield;
	}
}

function GetClosestEdgeToPoint(point)
{
	for(var i = 0; i < edges.length; i++)
	{
		//console.log(point);
		for(var j = 0; j < edges[i].linePoints.length; j++)
		{
			//console.log(edges[i].linePoints[j] + ", " + point);
			if(ArraysEqual(edges[i].linePoints[j], point))
			{
				//console.log(edges[i].linePoints[j] + ", " + point);
				return edges[i];
			}
			
		}
	}
}

function GetPathPoints(path)
{
	var pathPoints = [];
	for(var i = 0; i < path.length-1; i++)
	{
		//console.log(path[i] + "->" + path[i+1]);
		var edge = GetEdge(path[i], path[i+1]);
		//console.log(edge.linePoints);
		pathPoints = pathPoints.concat(edge.linePoints);
		
	}
	return pathPoints;
}


// Debug function to print out the adj matrix
function PrintAdjacencyMatrix()
{
	console.log("Printing adjacency matrix generated from geojson data...");
	console.log(adjacencyMatrix);
}

