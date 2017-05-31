// Helper to check if two arrays are equal
function ArraysEqual(arr1, arr2) 
{
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

// use: console.log([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(normalize(5, 15)));
function ArrayNormalize(min, max) {
    var delta = max - min;
    return function (val) {
        return (val - min) / delta;
    };
}