// TO DO: 
//  1. Figure out how to clear all poly lines and circles from map before updating data
//  1. Re-init map on file drop

// Data Properties
var defaultGeoDataFileName = "medium_map.geojson";
var initGraphURL = "http://localhost:5000/initialize_graph_dev";
var getPathURL = "http://localhost:5000/get_path_dev";
var initGraphStatus;
var currentData;

// Sim Properties
var simStop = true;
var simNumActiveVehicles = 0;
var displayPolyLines = false;
var routingAlgoCode = 1;
var algosToInit = [0,1];
var routingStartIndeces = 0;
var routingEndIndeces = 0;
var vehicleSpawnRate = 3000;
var vehicleSpawnCount = 10;
var vehicleMoveDistance = 500;
var vehicleMoveInterval = 500;
var updateGraphRate = 30000;


// Sim Routines
var initGraphRoutine;
var getPathRoutine;
var checkInitGraphRoutine;

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

	var nodeCount = 0;

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
			startNode = {index: nodeCount, latlng: coords[0]};
			nodeCount++;
			nodes.push(startNode);
		}

		if(endNode == null)
		{
			endNode = {index: nodeCount, latlng: coords[coords.length-1]};
			nodeCount++;
			nodes.push(endNode);
		}

		edge = {startNode: startNode, endNode: endNode, linePoints: coords, polyLine: null};
		reverseEdge = {startNode: endNode, endNode: startNode, linePoints: ArrayReverse(coords), polyLine: null};
		edges.push(edge);
		edges.push(reverseEdge);
	});

	InitMap();
	InitAdjacencyMatrix();
	TestAdjacencyMatrixForEmptyRows();
	TestAdjacencyMatrixForDeadEndRows();
	TestAdjacencyMatrixForSingleConnectedNodes();
	InitAdjacencyMatrix();
	InitGraphData();
	AddDrawGeoDataButton();
	PrintAdjacencyMatrix();
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
		layers: MQ.darkLayer(),
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
	// var testMatrix =
	// [[0.0, 1.0, 2.0, 0.0],
	// [5.0, 0.0, 0.0, 3.0],
	// [2.0, 0.0, 0.0, 4.0],
	// [0.0, 1.0, 1.0, 0.0]];

	var adjacencyMatrixJSON = GetMatrixJson();

	AddDownloadButton(adjacencyMatrixJSON);
	AddInitGraphButton(adjacencyMatrixJSON);
}

function GetMatrixJson()
{
	var jsonOBJ = {"map": adjacencyMatrix, "algos": algosToInit};
	var adjacencyMatrixJSON = JSON.stringify(jsonOBJ);
	return adjacencyMatrixJSON;
}

// Requests Init graph in the API
function InitGraph(jsonData)
{
	console.log("Requesting API Init Graph...");
	initGraphStatus = 0;
	// API Call CURENTLY NOT WORKING
	$.ajax({
	    url : initGraphURL,
	    type: "POST",
	    data : jsonData,
	    dataType: "json",
	    //headers: {'api_id': 'testuser1', 'api_key': 'a798e3d9-3222-4ce6-908f-a08102ece1a3'},
	    success: function(data, textStatus, jqXHR)
	    {
	    	initGraphStatus = jqXHR.status;
	        console.log("\nStatus: " + jqXHR.status);
	    },
	    error: function (jqXHR, textStatus, errorThrown)
	    {
	    	initGraphStatus = jqXHR.status;
	        console.log("Status: " + jqXHR.status + "\n" + errorThrown);
	    }
	});
}


// Requests paths from the API
function GetPath(jsonData, callback)
{
	console.log("Requesting API get path...");
	// API Call CURENTLY NOT WORKING
	$.ajax({
	    url : getPathURL,
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

// Adds a button to Init the Graph in the API
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
					stopCoroutine(getPathRoutine);
					control.state('idle');
			    }
			}, 
		]
	}).addTo(map);
}

// Adds a toggle button to show/hide the geojson
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
			    	displayPolyLines = true;
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
					displayPolyLines = false;
					control.state('show');
				},
			},
		]
	}).addTo(map);
}


// Checks the status of the Init Graph call from the API (Added this since it can take a long time)
function CheckInitGraphStatus(control)
{
	checkInitGraphRoutine = setInterval(function() 
	{
		var graceCount = 0;
		if (initGraphStatus == 200) 
		{
			console.log("Init Graph Successful");
			control.state('playing');
			// Start Sim Routines
			getPathRoutine = coroutine(SimulatePaths);
			setInterval(getPathRoutine, vehicleSpawnRate);
			var coolDownAdjacencyMatrixRoutine = coroutine(CoolDownAdjacencyMatrix);
			setInterval(coolDownAdjacencyMatrixRoutine, 2000);
			var updatePolyLinesRoutine = coroutine(UpdatePolyLines);
			setInterval(updatePolyLinesRoutine, 3000);
			var updateGraphRoutine = coroutine(UpdateGraph);
			// can't update the graph during the simulation currently beause the init graph algo is too slow to handle it
			//setInterval(updateGraphRoutine, updateGraphRate);
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

// Uses the paths returned from the API to simulate traffic
function* UpdateGraph()
{
	while(!simStop)
	{
		var adjacencyMatrixJSON = GetMatrixJson();
		InitGraph(adjacencyMatrixJSON);
		yield;
	}
}

// Uses the paths returned from the API to simulate traffic
function* SimulatePaths()
{
	while(!simStop)
	{
		for(var i = 0; i < vehicleSpawnCount; i++)
		{
			routingStartIndeces = RandomIntRange(0,5);
			routingEndIndeces = RandomIntRange(adjacencyMatrix.length-6,adjacencyMatrix.length-1);
			var jsonObj = {"algorithm": routingAlgoCode, "source": routingStartIndeces, "target": routingEndIndeces};
			var getPathJson = JSON.stringify(jsonObj);
			GetPath(getPathJson, SpawnVehicle);
		}
		yield;
	}
}

// Extracts the path from the data and spawns a simualted vehicle
function SpawnVehicle(data)
{
	var path = data['map'];
	UpdateAdjacencyMatrix(path);
	SimulateVehicle(path);
}


// Simulates a vehicle on the map given a path
function SimulateVehicle(path)
{
	var pathPoints = GetPathPoints(path);
	var line = L.polyline(pathPoints);

	var carIcon = L.icon.mapkey(
	{
		icon: '', 
		background: '#000000', 
		size:4, 
		boxShadow: false,
		additionalCSS: "box-shadow: 0px 0px 5px #ff0033;",
	});

    var animatedMarker = L.animatedMarker(line.getLatLngs(), 
    {
		distance: vehicleMoveDistance,  // meters
		interval: vehicleMoveInterval, // milliseconds
		icon: carIcon,
		onEnd: function(path)
		{
			map.removeLayer(animatedMarker);
		}
	});

	map.addLayer(animatedMarker);

	// StyleVehiclesRoutine = coroutine(StyleVehicles, animatedMarker);
	// setInterval(StyleVehiclesRoutine, 100);

}

// Increases the weight of any edge located in the matrix that is being used in a path
function UpdateAdjacencyMatrix(path)
{
	for(var i = 0; i < path.length-1; i++)
	{
		var startIndex = path[i];
		var endIndex = path[i+1];
		adjacencyMatrix[startIndex][endIndex] += Normalize(adjacencyMatrix[startIndex][endIndex], 0, 2);
		if(adjacencyMatrix[startIndex][endIndex] > 2)
		{
			adjacencyMatrix[startIndex][endIndex] = 2;
		}
		//console.log(adjacencyMatrix[startIndex][endIndex]);
	}
	//console.log(adjacencyMatrix[0][1]);
}

function* UpdatePolyLines()
{
	while(!simStop)
	{
		if(displayPolyLines)
		{
			ErasePolyLines();
			DrawPolylines();
		}
		yield;
	}

}

function* CoolDownAdjacencyMatrix()
{
	while(!simStop)
	{
		for(var i = 0; i < adjacencyMatrix.length; i++)
		{
			for(var j = 0; j < adjacencyMatrix.length; j++)
			{
				
				if(!(adjacencyMatrix[i][j] - 0.1 < 1.0))
				{
					adjacencyMatrix[i][j] -= 0.1;
				}
			}
		}
		yield;
	}
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

// Removes the nodes/circles from the maplayer
function EraseNodes()
{
	for(var i = 0; i < circles.length; i++)
	{
		map.removeLayer(circles[i]);
	}
}

// Animates the nodes being drawn on the map (not being used currently)
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
		           + "<dt><b>Adjacency Indeces:</b></dt>"
		           + "<dd>[" +  + edges[i].startNode.index.toString() + "->" +  edges[i].endNode.index.toString() + "]</dd>"
   		           + "<dt><b>Adjacency Weight:</b></dt>"
		           + "<dd>" + adjacencyMatrix[edges[i].startNode.index][edges[i].endNode.index] + "</dd>"

		var color = GetWeightColor(adjacencyMatrix[edges[i].startNode.index][edges[i].endNode.index]);

		var polyline = new L.Polyline(edges[i].linePoints, 
		{
		    color: color,
		    weight: 2,
		    opacity: 0.9,
		    smoothFactor: 1
		});
		polyline.on("mouseover", function(e)
		{
		   var layer = e.target;

		    layer.setStyle({
			    weight: 3,
			    opacity: 1,
		    });
		});
		polyline.on("mouseout", function(e)
		{
		   	var layer = e.target;

		    layer.setStyle({
			    weight: 2,
			    opacity: 0.9,
			    smoothFactor: 1
		    });
		});
		polyline.addTo(map).bindPopup(popUpInfo);
		polyLines.push(polyline);
		edges[i].polyLine = polyline;
	}
			
}

// Removes the polylines from the map layer
function ErasePolyLines()
{
	for(var i = 0; i < polyLines.length; i++)
	{
		map.removeLayer(polyLines[i]);
	}
}

// Function to animate the drawing of the polylines on the maplayer (not in use currently)
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
		//console.log(edges[i]);
	}
}

// Tests whether there are any all zero rows in the adjacency matrix
function TestAdjacencyMatrixForEmptyRows()
{
	console.log("Testing adjacency matrix for unconnected nodes...");
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
	if(unconnectedRows.length > 0)
	{
		console.log("Unconnected nodes found in adjacency matrix at rows...");
		console.log(unconnectedRows);
	}
	else
	{
		console.log("No unconnected nodes found in adjacency matrix");
	}
}

// Tests whether there are any all zero rows in the adjacency matrix
function TestAdjacencyMatrixForDeadEndRows()
{
	console.log("Testing adjacency matrix for dead end nodes...");
	var deadEndNodes = [];
	for(var i = 0; i < adjacencyMatrix.length; i++)
	{
		var connectedIndeces = [];
		for(var j = 0; j < adjacencyMatrix.length; j++)
		{
			if(adjacencyMatrix[i][j] > 0)
			{
				if(adjacencyMatrix[j][i] == 0)
				{
					console.log(j + "->" + i + "is a dead end node");
				}
			}
		}
	}
}

function TestAdjacencyMatrixForSingleConnectedNodes()
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

			var closestNode = FindClosestNode(nodes[i]);
			edge = {startNode: nodes[i], endNode: closestNode, linePoints: [nodes[i].latlng, closestNode.latlng], polyLine: null};
			reverseEdge = {startNode: closestNode, endNode: nodes[i], linePoints: [closestNode.latlng, nodes[i].latlng], polyLine: null};
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

// Returns a color corresponding to an edge weight (not currently being used)
function GetWeightColor(weight)
{
	// worst
	if(weight > 1.9)
	{
		return "#ff1d00"
	}
	// bad
	else if(weight > 1.8)
	{
		return "#ff9d00"
	}
	// ok
	else if(weight > 1.7)
	{
		return "#fff600"
	}
	// good
	else if(weight > 1.6)
	{
		return "#c7ff00"
	}

	// best
	return "#00ff2e"
}

// Finds the closest node to another node (needs to be optimized)
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

// Returns the first edge found that connects two nodes
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

// // Sets the color of a vehicle based on the weight of the edge its on (not currently in use)
// function* StyleVehicles(vehicle)
// {
// 	while(!simStop)
// 	{
// 		var point = [vehicle.getLatLng().lat, vehicle.getLatLng().lng];
// 		var edge = GetClosestEdgeToPoint(point);
// 		if(!edge.vehicles.includes(vehicle))
// 		{
// 			edge.vehicles.push(vehicles);
// 		}
// 		var color = GetWeightedEdgeColor(edge);
// 		vehicle._icon.firstChild.style.backgroundColor = color;
// 		yield;
// 	}	
// }

// Finds the closest edge given a point on the map (not currently working properly)
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

// Concats all the individual edge points into one path
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

