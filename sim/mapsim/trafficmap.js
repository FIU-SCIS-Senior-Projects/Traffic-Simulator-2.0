// Init Map
var map = L.map('map', {
    maxZoom: 17,
    minZoom: 13,
    maxBounds: [
        //south west
        [25.73, -80.4],
        //north east
        [25.77, -80.37]
        ], 
}).setView([25.752, -80.38], 15);

// Add base Tiles
L.tileLayer('https://api.mapbox.com/styles/v1/mleon111/cizys0tdi005s2ssjrr49y7a9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWxlb24xMTEiLCJhIjoiY2l6eXJuc2ZpMDA4NzJxa2Y3b3BiZjlpNSJ9.yzZAypPBZkyEHk28nNkG2w', 
{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
}).addTo(map);
