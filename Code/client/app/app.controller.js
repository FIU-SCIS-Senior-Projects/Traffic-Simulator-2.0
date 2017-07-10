
(function () {
    'use strict';
    let domain = 'http://localhost:8080/';
    let apiUrl = 'api/v2/';

    angular
        .module("app")
        .controller("MainCtrl", MainCtrl);

    let defaultTrip = {
        origin: "current-location",
        destination: "current-location",
        optimizeWaypoints: true,
        travelMode: 'DRIVING'
    };

    MainCtrl.$inject = ["$scope", "NgMap"];
    function MainCtrl($scope, NgMap) {
        var vm = this;

        vm.onInit = function () {
            vm.isDijsktra = true;
            vm.isOblivious = false;
            vm.trips = [];
            vm.positions = [];

            NgMap.getMap("googleMap")
                .then(map => { vm.googleMap = map;})
                .catch(err => { console.log('Error: ', err); });
            NgMap.getMap("obliviousMap")
                .then(map => { vm.obliviousMap = map; })
                .catch(err => { console.log('Error: ', err); });
        };

        vm.selectAlgorithm = function (algorithm) {
            switch (algorithm) {
                case 'dijkstra':
                    vm.isDijsktra = true;
                    vm.isOblivious = false;
                    break;
                case 'oblivious':
                    vm.isDijsktra = false;
                    vm.isOblivious = true;
                    break;
                default:
                    break;
            }
        };

        vm.addTrip = () => {

            var trip = {
                origin: vm.origin ? vm.origin : "current-location",
                destination: vm.destination ? vm.destination : "current-location",
            };

            vm.trips.push(trip);
            
            setRoutes(vm.googleMap);

            clearValues();
            printTrips();
        };

        function setRoutes(map) {

            let directionsDisplay = new google.maps.DirectionsRenderer();
            let directionsService = new google.maps.DirectionsService();
            
            directionsDisplay.setMap(map);

            vm.trips.forEach(trip => {

                angular.extend(defaultTrip, trip);

                directionsService.route(defaultTrip, (response, status) => {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        setCarsOnRoute(map, response.routes);
                    }
                });
            });
        }

        function setCarsOnRoute(map, routes, numCars = 5) {
            
            routes.forEach(element => {
                var startingPoint = { 
                    lat: element.legs[0].start_location.lat(), 
                    lng: element.legs[0].start_location.lng() 
                };
                
                for (var i = 0; i < numCars; i++) {
                    let car = new Car(map, startingPoint, getRoutePath(element.overview_path));
                    setTimeout(car.start.bind(car), 2000 * (i + 1), 1000);
                }
                
            });
        }

        function getRoutePath(array){
            var newArray = [];

            array.forEach(element => {
                newArray.push({lat: element.lat(), lng: element.lng()});
            });

            return newArray;
        }

        vm.originChanged = function() {
            var place = this.getPlace();
            addPosition(place, 0);
            vm.googleMap.setCenter(place.geometry.location);
        };

        vm.destChanged = function() {
            var place = this.getPlace();
            addPosition(place, 1);
            vm.googleMap.setCenter(place.geometry.location);
        };

        vm.reset = () => {
            clearValues();
            vm.trips = [];
            vm.userInput1 = "";
        }

        function printTrips() {
            vm.userInput1 = "";

            vm.trips.forEach(element =>{
               vm.userInput1 = vm.userInput1.concat(`${element.origin}\r\n${element.destination}\r\n${element.startingTime ? 
                   element.startingTime : new Date().toLocaleTimeString()}\r\n`);
            })

        }

        function clearValues() {
            vm.origin = "";
            vm.destination = "";
            vm.startingTime = null;
            vm.positions = angular.copy([]);
        }

        function addPosition(place, index) {
            var pos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                title: place.formatted_address.includes(place.name) ? place.formatted_address : `${place.name}\r\n${place.formatted_address}`   
            };

            vm.positions[index] = pos;
        }

        // function for second input
        // vm.addTrip2 = function() {
        //     var lines = vm.userInput2 ? vm.userInput2.split(/\r?\n/g) : [];
        //
        //     if (lines) {
        //         for (var index = 0; index < lines.length;) {
        //             var trip = {
        //                 origin: lines[index] ? lines[index++].trim() : "current-location",
        //                 destination: lines[index] ? lines[index++].trim() : "current-location",
        //             };
        //
        //             vm.trips.push(trip);
        //         }
        //         clearValues();
        //     }
        // };

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

        vm.startPathDemo = function () {
          testGraphInit()
            .then((graph) => {
              testDijkstra()
                .then((path) => {
                  let cars = [];
                  let numCars = 10;
                  let delay = 2000;
                  let interval = 1000;

                  for (let i = 0; i < numCars; i++) {
                    cars.push(new Car(vm.obliviousMap, path.path[0], path.path));
                    setTimeout(cars[i].start.bind(cars[i]), delay * i, interval);
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch((err) => {
              console.log(err);
            });
        };
    }
    
    function testDijkstra () {
      const endpoint = 'path/dijkstra';

      return new Promise((resolve, reject) => {
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
})();