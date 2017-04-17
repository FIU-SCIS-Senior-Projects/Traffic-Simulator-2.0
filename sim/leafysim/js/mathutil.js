
// Helper to get a random float in a range
function RandomFloatRange(min, max) 
{
	return Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);
}

function RandomIntRange(min, max) 
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

// Helper to get Euclidean Distance between two latlng coords
function EuclideanDistance(coordsA, coordsB)
{
	return Math.sqrt(Math.pow((coordsB[0] - coordsA[0]), 2) + Math.pow((coordsB[1] - coordsA[1]), 2));
}

function Normalize(val, max, min) 
{ 
	return (val - min) / (max - min); 
}