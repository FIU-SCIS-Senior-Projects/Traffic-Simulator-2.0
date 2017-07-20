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

MainCtrl.$inject = ["$scope", "NgMap"];
function MainCtrl($scope, NgMap) {
  var vm = this;

  vm.autoCompleteOptions = {
    minimumChars: 1,
    data: function (term) {
      var match = dataset.filter(function (value) {
        // return term.length <= value.address.length && term.toLowerCase() === value.address.substr(0, term.length).toLowerCase();
        return value.address.toLowerCase().includes(term.toLowerCase());
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
    vm.userInput1 = '';

    NgMap.getMap("googleMap")
      .then(map => { vm.googleMap = map;})
      .catch(err => { console.log('Error: ', err); });
    NgMap.getMap("obliviousMap")
      .then(map => { 
        vm.obliviousMap = map;
        // initiate graph on server
        // Slowest part by far
        // console.log(vm);
        // console.log(vm.submitBtn);
        let submitBtn = document.getElementById('submit-button');
        request.post(`${domain}${apiUrl}graph`)
          .end((err, asyncRes) => {
            console.log(asyncRes);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit';
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
    vm.userInput1 += `${vm.origin}\n${vm.destination}\nDelay ${vm.startingTime ? vm.startingTime : 0}\n`;
  };

  function parseTrips () {
    let input = vm.userInput1.split('\n');
    console.log('inputs', input);
    input = input.filter((data) => {
      return data && data !== '';
    });
    let trips = [];
    for(let i = 0; i < input.length; i+=3) {
      trips.push({
        origin: input[i],
        destination: input[i+1],
        delay: parseInt(input[i+2].substr(6))
      });
    }
    console.log(trips);
    return trips;
  }

  vm.getRoutes = () => {
    // parse input box
    vm.trips = parseTrips();
    let submitBtn = document.getElementById('submit-button');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Processing...';


    let promises = [];
    promises.push(getGoogleNavigation());
    promises.push(getDijkstraPath());

    Promise.all(promises)
      .then((data) => {
        console.log('data', data);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit';
        let googleCars = [];
        let obliviousCars = [];
        let delay = 1000;
        let interval = 1000;
        data[0].forEach((path) => {
          googleCars.push(new Car(vm.googleMap, path.path[0], path.path));
          setTimeout(googleCars[path.index].start.bind(googleCars[path.index]), delay * vm.trips[path.index].delay, interval);
        });
        data[1].forEach((path) => {
          obliviousCars.push(new Car(vm.obliviousMap, path.path[0], path.path));
          setTimeout(obliviousCars[path.index].start.bind(obliviousCars[path.index]), delay * vm.trips[path.index].delay, interval);
        });
        
      })
      .catch((err) => {
        console.log('err', err);
      })
  };

  function getGoogleNavigation() {
    return new Promise((resolve, reject) => {
      let directionsService = new google.maps.DirectionsService();

      let promises = vm.trips.map((trip, i) => {
        var foo = Object.assign({}, trip);
        foo.optimizeWaypoints = true;
        foo.travelMode = 'DRIVING';
        delete foo.delay;

        return new Promise((resolve, reject) => {
          directionsService.route(foo, (response, status) => {
            if (status == google.maps.DirectionsStatus.OK) {
              return resolve({ path: convertPath(response.routes[0].overview_path), index: i });
            } else {
              return reject(status);
            }
          });
        });
      });

      // Resolve after all routes have been received.
      Promise.all(promises)
        .then((paths) => {
          return resolve(paths);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  function convertPath (path) {
    return path.map((point) => {
      return {lat: point.lat(), lng: point.lng()}
    });
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

  // function printTrips() {
  //   vm.userInput1 = "";

  //   vm.trips.forEach(element =>{
  //      vm.userInput1 = vm.userInput1.concat(`${element.origin}\n${element.destination}\ndelay ${element.delay}\n`);
  //   });
  // }

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

  vm.startPathDemo = function () {
   
  };

  function getDijkstraPath () {
    const endpoint = 'path/dijkstra';

    return new Promise((resolve, reject) => {
      let data = {
        source: [],
        destination: []
      };

      vm.trips.forEach((trip) => {
        data.source.push(addressToIndex(trip.origin));
        data.destination.push(addressToIndex(trip.destination));
      });

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
          return resolve(result.paths);
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
