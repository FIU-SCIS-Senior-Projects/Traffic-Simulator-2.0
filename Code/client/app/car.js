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
    setTimeout(this.move.bind(this), duration * (i + 1), this.path[i], duration, i);
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

module.exports = Car;
