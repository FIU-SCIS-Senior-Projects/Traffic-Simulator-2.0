let map;
let marker;

let adjMatrix = [
  { lat: 25.761363311366857, lng: -80.36850929260254 }, 
  { lat: 25.761556561592343, lng: -80.36044120788574 }, 
  { lat: 25.761633861594447, lng: -80.35241603851318 }, 
  { lat: 25.75413552707459, lng: -80.36816596984863 }, 
  { lat: 25.754290136690642, lng: -80.3600549697876 }, 
  { lat: 25.754406093770605, lng: -80.35181522369385 }, 
  { lat: 25.746714028822527, lng: -80.36773681640625 }, 
  { lat: 25.746907302886346, lng: -80.35971164703369 }, 
  { lat: 25.74717788604743, lng: -80.3516435623169 }, 
];
// let position = grid[0];
console.log(adjMatrix);
function initMap() {
  let fiu = { lat: 25.756, lng: -80.375 };
  map = new google.maps.Map(document.getElementById('map'), {
    center: fiu,
    zoom: 15
  });

  // marker = new google.maps.Marker({
  //     position: position,
  //     map: map,
  //     title: "Your current location!"
  // });
  let sets = [
    {
      path: [2, 5, 4, 7, 6, 3, 0, 1],
      start: 1
    },
    {
      path: [1, 4, 7, 8, 5, 2],
      start: 0
    },
    {
      path: [7, 6, 3, 0, 1],
      start: 8
    }
  ];
  // let path = [2, 5, 4, 7, 6, 3, 0, 1];
  // let start = adjMatrix[1];
  let duration = 1000;
  
  // let car = new Car(map, adjMatrix[1], [2, 5, 4, 7, 6, 3, 0, 1]);
  // setTimeout(car.start.bind(car), 2000, duration);
  let numCars = 5;
  for (var set = 0; set < 3; set++) {
    for (var i = 0; i < numCars; i++) {
      let car = new Car(map, adjMatrix[sets[set].start], sets[set].path);
      setTimeout(car.start.bind(car), 2000 * (i + 1 + set * numCars), duration);
    }
  }

  google.maps.event.addListener(map, 'click', function(me) {
    // var result = { lat: me.latLng.lat(), lng: me.latLng.lng() };
    // transition(result, 1000);
    console.log(`lat: ${me.latLng.lat()}, lng: ${me.latLng.lng()}`);
  });
}


function Car (map, start, path) {
  this.map = map;
  this.delay = 10; // ms
  this.path = path;
  this.position = Object.assign({}, start);

  this.marker = new google.maps.Marker({
      position: start,
      map: null
  });
}

Car.prototype.start = function (duration) {
  this.marker.setMap(this.map);
  for (i = 0; i < this.path.length; i++) {
    // console.log(`adjMatrix index: ${this.path[i]}`);
    // console.log(adjMatrix[this.path[i]]);
    setTimeout(this.move.bind(this), duration * (i + 1), this.path[i], duration, i)
  }
  setTimeout(this.hide.bind(this), duration * (i + 2));
};

Car.prototype.hide = function () {
  this.marker.setMap(null);
};

Car.prototype.move = function (destination, duration, index) {
  let delta = {};
  // console.log(`move: ${index}`);
  // console.log('pos', this.position);
  // console.log('dest', destination, adjMatrix[destination]);

  destination = adjMatrix[destination];
  delta.num = Math.floor(duration / this.delay);
  delta.lat = (destination.lat - this.position.lat) / delta.num;
  delta.lng = (destination.lng - this.position.lng) / delta.num;
  // console.log('delta', delta);
  console.log(index, adjMatrix);
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

