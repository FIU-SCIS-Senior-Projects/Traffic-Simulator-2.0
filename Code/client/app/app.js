import angular from 'angular';
import request from 'superagent';
import dataset from '../../server/data/addresses';
import Car from './car';

require('@uirouter/angularjs');
require('angular-auto-complete')

const domain = 'http://localhost:8080/';
const apiUrl = 'api/v2/'

let app = angular
  .module('app', ['ui.router', require('ngmap'), require('angular-sanitize'), 'autoCompleteModule'])
  .controller("MainCtrl", MainCtrl);

let defaultTrip = {
  origin: "current-location",
  destination: "current-location",
  optimizeWaypoints: true,
  travelMode: 'DRIVING'
};

let graphInitialized = false;

MainCtrl.$inject = ["$scope", "NgMap"];
function MainCtrl($scope, NgMap) {
  var vm = this;

  vm.autoCompleteOptions = {
    minimumChars: 1,
    data: function (term) {
      var match = dataset.filter(function (value) {
        return term.length <= value.address.length && term.toLowerCase() === value.address.substr(0, term.length).toLowerCase();
      });
      return match.map((data) => {
        return data.address;
      });
    }
  }

  vm.onInit = function () {
    vm.isDijsktra = true;
    vm.isOblivious = false;
    vm.trips = [];
    vm.positions = [];

    NgMap.getMap("googleMap")
      .then(map => { vm.googleMap = map;})
      .catch(err => { console.log('Error: ', err); });
    NgMap.getMap("obliviousMap")
      .then(map => { 
        vm.obliviousMap = map;
        // initiate graph on server
        // Slowest part by far
        request.post(`${domain}${apiUrl}graph`)
          .end((err, asyncRes) => {
            console.log(asyncRes);
            graphInitialized = true;
            // getDijkstraPath()
          });
      })
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
      delay: vm.startingTime ? vm.startingTime : 0
    };

    vm.trips.push(trip);
    printTrips();
  };

  vm.getRoutes = () => {

    // var trip = {
    //     origin: vm.origin ? vm.origin : "current-location",
    //     destination: vm.destination ? vm.destination : "current-location",
    //     delay: vm.startingTime ? vm.startingTime : 0
    // };

    // vm.trips.push(trip);
    
    setRoutes(vm.googleMap);
    getDijkstraPath()
      .then((data) => {
        let cars = [];
        let delay = 2000;
        let interval = 1000;
        data.paths.forEach((path) => {
          cars.push(new Car(vm.obliviousMap, path.path[0], path.path));
          setTimeout(cars[path.index].start.bind(cars[path.index]), delay * path.index, interval);
        });
        
      })
      .catch((err) => {
        console.log('err', err);
      })

    // clearValues();
    // printTrips();
  };

  function setRoutes(map) {
    let directionsDisplay = new google.maps.DirectionsRenderer();
    let directionsService = new google.maps.DirectionsService();
    
    directionsDisplay.setMap(map);

    vm.trips.forEach(trip => {
      var foo = Object.assign({}, trip);
      delete foo.delay;
      angular.extend(defaultTrip, foo);

      directionsService.route(defaultTrip, (response, status) => {
        if (status == google.maps.DirectionsStatus.OK) {
          // directionsDisplay.setDirections(response);
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
    vm.userInput2 = "";
  };

  function printTrips() {
    vm.userInput1 = "";

    vm.trips.forEach(element =>{
       vm.userInput1 = vm.userInput1.concat(`${element.origin}\n${element.destination}\n${element.delay !== undefined ? element.delay : new Date().toLocaleTimeString()}\n`);
    });
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

  vm.addTrip2 = function() {
    var lines = vm.userInput2 ? vm.userInput2.split(/\r?\n/g) : [];

    if (lines) {
      for (var index = 0; index < lines.length;) {
        var trip = {
          origin: lines[index] ? lines[index++].trim() : "current-location",
          destination: lines[index] ? lines[index++].trim() : "current-location",
        };

        vm.trips.push(trip);
      }
      clearValues();
    }
  };

  vm.startPathDemo = function () {
    testGraphInit()
      .then((graph) => {
        getDijkstraPath()
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

  function getDijkstraPath () {
    const endpoint = 'path/dijkstra';

    return new Promise((resolve, reject) => {
      let data = {
        source: [],
        destination: []
      };
      console.log('trips', vm.trips);
      vm.trips.forEach((trip) => {
        data.source.push(addressToIndex(trip.origin));
        data.destination.push(addressToIndex(trip.destination));
      });
      // data.source = [15, 20, 50, 200];
      // data.destination = [110, 110, 300, 10];
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

  function addressToIndex (address) {
    let i = 0;
    let found = false;
    while(i < dataset.length && !found) {
      found = dataset[i].address === address;
      i++;
    }

    return found ? i-1 : -1;
  }
}
