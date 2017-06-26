let startPoint;
let endPoint;
let pathPolyLine;
let map;
let geojson = {
  "type": "FeatureCollection",
  "features": []
};

const epsilon = 0.001;

function initMap() {
  let fiu = { lat: 25.756, lng: -80.375 };
  map = new google.maps.Map(document.getElementById('map'), {
    center: fiu,
    zoom: 15
  });

  map.data.setStyle({
    strokeColor: '#FF0000',
    strokeWeight: 2
  });

  document.getElementById('add-geojson').addEventListener('click', (event) => {
    // Adds geojson to the map. No checking. Assumes it's valid. 
    geojson = JSON.parse(document.getElementById('input-geojson').value);
    // console.log('adding', geojson);
    map.data.addGeoJson(geojson);
        map.data.setStyle({
      strokeColor: '#FF0000',
      strokeWeight: 2
    });
    // map.data.toGeoJson((data) => {
    //   console.log('added geo to google', data);
    // });
  });

  document.getElementById('set-geojson').addEventListener('click', (event) => {
    startPoint = null;
    endPoint = null;
    pathPolyLine.setPath([]);
    map.data.forEach((feature) => {
      map.data.remove(feature);
    });

    map.data.addGeoJson(geojson);
    map.data.toGeoJson((data) => {
      let updatedGeojson = JSON.stringify(data);
      document.getElementById('output-geojson').value = updatedGeojson;
      let blob = new Blob([updatedGeojson], {type: 'application/json'});
      let url = URL.createObjectURL(blob);
      document.getElementById('save-geojson').href = url;
      // console.log(data);
    });
  });

  google.maps.event.addListener(map, 'click', function(me) {
    if (!startPoint) {
      // First click
      startPoint = { lng: me.latLng.lng(), lat: me.latLng.lat() };
      startPoint = snapVertex(startPoint);
    } else {
      endPoint = { lng: me.latLng.lng(), lat: me.latLng.lat() };
      endPoint = snapVertex(endPoint);

      pathPolyLine = new google.maps.Polyline({
        map: map,
        path: [startPoint, endPoint],
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 1
      });
      var polylineFeature = {
          "type": "Feature",
          "geometry": {
            "type": "LineString",
            "coordinates": []
          },
              "properties": {}
      };


      for (let i = 0; i < pathPolyLine.getPath().getLength(); i++) {
        let pt = pathPolyLine.getPath().getAt(i);
        polylineFeature.geometry.coordinates.push([
          pt.lng(), pt.lat()  
        ]);
      }
      geojson.features.push(polylineFeature);
      startPoint = { lng: me.latLng.lng(), lat: me.latLng.lat() };
      // endPoint = null;
    }
    // var result = { lat: me.latLng.lat(), lng: me.latLng.lng() };
    // transition(result, 1000);
    console.log(`{ lat: ${me.latLng.lat()}, lng: ${me.latLng.lng()} },`);
  });
}


function snapVertex (point) {
  // check to see if this is "near" any other vertex and "snap" to it instead
  let updated = false;
  let i = 0;
  let j = 0;

  while (i < geojson.features.length && !updated) {
    let coords = geojson.features[i].geometry.coordinates;
    j = 0;
    while (j < coords.length && !updated) {
      // 0: lng, 1: lat
      let deltaLng = Math.abs(coords[j][0] - point.lng);
      let deltaLat = Math.abs(coords[j][1] - point.lat);
      if (deltaLng < epsilon && deltaLat < epsilon) {
        // Close enough to be the same vertex
        point = { lng: coords[j][0], lat: coords[j][1] };
        console.log('Snapped vertex');
        updated = true;
      }
      j++;
    }
    i++;
  }

  return point;
}


/* Car Class */
function Car (map, start, path) {
  this.map = map;
  this.delay = 10; // ms
  this.path = path;
  this.position = Object.assign({}, start);

  // Create the marker, but do not place it on the map
  this.marker = new google.maps.Marker({
      position: start,
      map: null
  });
}

Car.prototype.start = function (duration) {
  this.marker.setMap(this.map);
  for (var i = 0; i < this.path.length; i++) {
    setTimeout(this.move.bind(this), duration * (i + 1), this.path[i], duration, i)
  }
  setTimeout(this.hide.bind(this), duration * (i + 2));
};

Car.prototype.hide = function () {
  this.marker.setMap(null);
};

Car.prototype.move = function (destination, duration, index) {
  let delta = {};

  delta.num = Math.floor(duration / this.delay);
  delta.lat = (destination.lat - this.position.lat) / delta.num;
  delta.lng = (destination.lng - this.position.lng) / delta.num;

  this.animate(delta);
};

Car.prototype.animate = function (delta) {
  this.position.lat += delta.lat;
  this.position.lng += delta.lng;
  this.marker.setPosition(this.position);
  
  if (delta.num > 0) {
    delta.num--;
    setTimeout(this.animate.bind(this), this.delay, delta);
  }
};
