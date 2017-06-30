import request from 'superagent';

let domain = 'http://localhost:8080/';
let apiUrl = 'api/v2/';

function testDijkstra () {
  const endpoint = 'path/dijkstra';

  return new Promise((resolve, reject) => {
    // testGeoJsonFormat()
      // .then((adjMatrix) => {
        // let data = adjMatrix;
        let data = {};
        data.source = 15;
        data.destination = 110;
        console.log(`[POST]: ${apiUrl}${endpoint} - Request`);
        request.post(`${domain}${apiUrl}${endpoint}`)
          .send(data)
          .end((err, asyncRes) => {
            if (err) {
              return reject(err);
            }
            const result = JSON.parse(asyncRes.text);
            console.log(`[POST]: ${apiUrl}${endpoint} - Response`);
            console.log(result);
            console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
            return resolve(result);
          });
      // })
      // .catch((err) => {
      //   return reject(err);
      // });
  });
}

function testGraphImport (graph) {
  const endpoint = 'graph/import';

  return new Promise((resolve, reject) => {
    console.log(`[POST]: ${apiUrl}${endpoint} - Request`);
    console.log(graph);
    request.post(`${domain}${apiUrl}${endpoint}`)
      .send(graph)
      .end((err, asyncRes) => {
        if (err) {
          return reject(err);
        }
        const result = JSON.parse(asyncRes.text);
        console.log(`[POST]: ${apiUrl}${endpoint} - Response`);
        console.log(result);
        console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
        return resolve(result.graph);
      });
  });
}

function testGraphInit () {
  const endpoint = 'graph';

  return new Promise((resolve, reject) => {
    testGeoJsonFormat()
      .then((adjMatrix) => {
        console.log(`[POST]: ${apiUrl}${endpoint} - Request`);
        request.post(`${domain}${apiUrl}${endpoint}`)
          .send(adjMatrix)
          .end((err, asyncRes) => {
            if (err) {
              return reject(err);
            }
            const result = JSON.parse(asyncRes.text);
            console.log(`[POST]: ${apiUrl}${endpoint} - Response`);
            console.log(result);
            console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
            return resolve(result);
          });
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

function testGeoJsonFormat () {
  const endpoint = 'geo';

  return new Promise((resolve, reject) => {
    getGeoJson()
      .then((geojson) => {
        console.log(`[POST]: ${apiUrl}${endpoint} - Request`);
        request.post(`${domain}${apiUrl}${endpoint}`)
          .send(geojson)
          .end((err, asyncRes) => {
            if (err) {
              return reject(err);
            }
            const result = JSON.parse(asyncRes.text);
            console.log(`[POST]: ${apiUrl}${endpoint} - Response`);
            console.log(result);
            console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
            return resolve(result);
          });
      })
      .catch((err) => {
        console.log('Error in testGeoJsonFormat', err);
      });
  });
}

// Temp endpoint to get geojson data for testing.
function getGeoJson () {
  const endpoint = 'geo/roads';

  return new Promise((resolve, reject) => {
    console.log(`[GET]: ${apiUrl}${endpoint} - Request`);
    request.get(`${domain}${apiUrl}${endpoint}`)
      .end((err, asyncRes) => {
        if (err) {
          return reject(err);
        }
        const result = JSON.parse(asyncRes.text);
        console.log(`[GET]: ${apiUrl}${endpoint} - Response`);
        console.log(result);
        console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
        return resolve(result);
      });
  });
}

function init () {
  /*
  testGraphInit()
    .then((graph) => {
      testGraphImport(graph)
        .then(() => {
          testDijkstra()
            .then((path) => {
              // Results from v1
              const expect = [15, 16, 22, 69, 71, 78, 80, 109, 108, 116, 110];
              console.log('Expects:');
              console.log(expect);
              console.log('Received:');
              console.log(path.path);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        })
    })
    .catch((err) => {
      console.log(err);
    });
    */

  testGraphInit()
    .then((graph) => {
      testDijkstra()
        .then((path) => {
          let cars = [];
          let numCars = 10;
          let delay = 2000;
          let interval = 1000;

          for (let i = 0; i < numCars; i++) {
            cars.push(new Car(map, path.path[0], path.path));
            setTimeout(cars[i].start.bind(cars[i]), delay * i, interval);
          }
          // let car = new Car(map, path.path[0], path.path);
          // car.start(1000);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
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

init();


