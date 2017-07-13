(function () {
    'use strict';
    let domain = 'http://localhost:8080/';
    let apiUrl = 'api/v2/';

    var app = angular
        .module("app", ['ui.router', 'ngMap', 'ngSanitize', 'autoCompleteModule'])
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
               vm.userInput1 = vm.userInput1.concat(`${element.origin}, ${element.destination}, ${element.delay !== undefined ? element.delay : new Date().toLocaleTimeString()}\n`);
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
    var dataset = [
  {
    "lng": -80.36840200424194,
    "lat": 25.761305336237882,
    "address": "801 FL-985, Miami, FL 33174, USA",
    "index": 0
  },
  {
    "lng": -80.36041975021362,
    "lat": 25.761479261539883,
    "address": "SW 102nd Ave, Miami, FL 33174, USA",
    "index": 1
  },
  {
    "lng": -80.36003351211548,
    "lat": 25.754348115244774,
    "address": "10198 Dr Antonio Jorge Way, Miami, FL 33165, USA",
    "index": 2
  },
  {
    "lng": -80.3681230545044,
    "lat": 25.754251484305495,
    "address": "SW 16th St, Miami, FL 33165, USA",
    "index": 3
  },
  {
    "lng": -80.36773681640625,
    "lat": 25.74675268366044,
    "address": "10740 Coral Way, Miami, FL 33165, USA",
    "index": 4
  },
  {
    "lng": -80.35971164703369,
    "lat": 25.746984612423827,
    "address": "2432 SW 102nd Ave, Miami, FL 33165, USA",
    "index": 5
  },
  {
    "lng": -80.36003351211548,
    "lat": 25.754309462878506,
    "address": "1601 SW 102nd Ave, Miami, FL 33165, USA",
    "index": 6
  },
  {
    "lng": -80.3518795967102,
    "lat": 25.754483398427674,
    "address": "1550-1598 SW 97th Ave, Miami, FL 33165, USA",
    "index": 7
  },
  {
    "lng": -80.3516435623169,
    "lat": 25.74717788604743,
    "address": "2397-2399 SW 97th Ave, Miami, FL 33165, USA",
    "index": 8
  },
  {
    "lng": -80.35239458084106,
    "lat": 25.761633861594447,
    "address": "855 SW 97th Ave, Miami, FL 33174, USA",
    "index": 9
  },
  {
    "lng": -80.34417629241943,
    "lat": 25.761788461447694,
    "address": "806-818 SW 92nd Ave, Miami, FL 33174, USA",
    "index": 10
  },
  {
    "lng": -80.343918800354,
    "lat": 25.754695985975147,
    "address": "9120-9198 SW 16th St, Miami, FL 33165, USA",
    "index": 11
  },
  {
    "lng": -80.3436827659607,
    "lat": 25.747448468592257,
    "address": "2517 SW 92nd Ave, Miami, FL 33165, USA",
    "index": 12
  },
  {
    "lng": -80.33619403839111,
    "lat": 25.761962386041958,
    "address": "931 SW 87th Ave, Miami, FL 33174, USA",
    "index": 13
  },
  {
    "lng": -80.33593654632568,
    "lat": 25.754947225313362,
    "address": "8755 SW 16th St, Miami, FL 33165, USA",
    "index": 14
  },
  {
    "lng": -80.33565759658813,
    "lat": 25.747661068730835,
    "address": "8701 SW 24th St, Miami, FL 33165, USA",
    "index": 15
  },
  {
    "lng": -80.32797574996948,
    "lat": 25.76221361000606,
    "address": "920A SW 82nd Ave, Miami, FL 33144, USA",
    "index": 16
  },
  {
    "lng": -80.32784700393677,
    "lat": 25.755140485981094,
    "address": "8201 Jose Luis Rodriguez Jr St, Miami, FL 33155, USA",
    "index": 17
  },
  {
    "lng": -80.32767534255981,
    "lat": 25.747892995720846,
    "address": "2398 SW 82nd Ave, Miami, FL 33155, USA",
    "index": 18
  },
  {
    "lng": -80.32746076583862,
    "lat": 25.733280711179553,
    "address": "3925 SW 82nd Ave, Miami, FL 33155, USA",
    "index": 19
  },
  {
    "lng": -80.33582925796509,
    "lat": 25.7331067445897,
    "address": "3808 SW 87th Ave, Miami, FL 33165, USA",
    "index": 20
  },
  {
    "lng": -80.34372568130493,
    "lat": 25.732913448080176,
    "address": "4001 SW 92nd Ave, Olympia Heights, FL 33165, USA",
    "index": 21
  },
  {
    "lng": -80.35170793533325,
    "lat": 25.732700821556676,
    "address": "SW 97th Ave, Olympia Heights, FL 33165, USA",
    "index": 22
  },
  {
    "lng": -80.35973310470581,
    "lat": 25.732468864915475,
    "address": "3998 SW 102nd Ave, Olympia Heights, FL 33165, USA",
    "index": 23
  },
  {
    "lng": -80.36773681640625,
    "lat": 25.732275567368735,
    "address": "3918 SW 107th Ave, Miami, FL 33165, USA",
    "index": 24
  },
  {
    "lng": -80.36769390106201,
    "lat": 25.7466173916727,
    "address": "2590 SW 107th Ave, Miami, FL 33165, USA",
    "index": 25
  },
  {
    "lng": -80.37595510482788,
    "lat": 25.746559409345082,
    "address": "2404 SW 112th Ave, Miami, FL 33165, USA",
    "index": 26
  },
  {
    "lng": -80.37571907043457,
    "lat": 25.732159588689846,
    "address": "3967-3975 SW 112th Ave, Miami, FL 33165, USA",
    "index": 27
  },
  {
    "lng": -80.38325071334839,
    "lat": 25.732043609897783,
    "address": "11610 SW 117th Ave, Miami, FL 33175, USA",
    "index": 28
  },
  {
    "lng": -80.38391590118408,
    "lat": 25.74634680723504,
    "address": "2531 SW 117th Ave, Miami, FL 33175, USA",
    "index": 29
  },
  {
    "lng": -80.38297176361084,
    "lat": 25.722900259107824,
    "address": "11625 SW 47th Terrace, Miami, FL 33165, USA",
    "index": 30
  },
  {
    "lng": -80.38249969482422,
    "lat": 25.71481950350453,
    "address": "11561-11699 SW 56th St, Miami, FL 33173, USA",
    "index": 31
  },
  {
    "lng": -80.38224220275879,
    "lat": 25.700705862862723,
    "address": "7200 SW 117th Ave, Miami, FL 33183, USA",
    "index": 32
  },
  {
    "lng": -80.38228511810303,
    "lat": 25.689993846063707,
    "address": "8232 Mills Dr, Kendall, FL 33183, USA",
    "index": 33
  },
  {
    "lng": -80.38464546203613,
    "lat": 25.686474525580433,
    "address": "11701-11751 SW 88th St, Miami, FL 33186, USA",
    "index": 34
  },
  {
    "lng": -80.365891456604,
    "lat": 25.686938617749757,
    "address": "8610 SW 107th Ave, Miami, FL 33173, USA",
    "index": 35
  },
  {
    "lng": -80.36619186401367,
    "lat": 25.701053890565486,
    "address": "7305 SW 107th Ave, Miami, FL 33173, USA",
    "index": 36
  },
  {
    "lng": -80.36692142486572,
    "lat": 25.715476810354627,
    "address": "5599 SW 107th Ave, Miami, FL 33165, USA",
    "index": 37
  },
  {
    "lng": -80.36726474761963,
    "lat": 25.72270694600532,
    "address": "10692-10798 SW 48th St, Miami, FL 33165, USA",
    "index": 38
  },
  {
    "lng": -80.37533283233643,
    "lat": 25.72297758426084,
    "address": "11200 SW 47th Terrace, Miami, FL 33165, USA",
    "index": 39
  },
  {
    "lng": -80.37494659423828,
    "lat": 25.715128824827545,
    "address": "5578-5598 SW 112th Ave, Miami, FL 33165, USA",
    "index": 40
  },
  {
    "lng": -80.37528991699219,
    "lat": 25.72293892169064,
    "address": "4741-4769 SW 112th Ave, Miami, FL 33165, USA",
    "index": 41
  },
  {
    "lng": -80.35928249359131,
    "lat": 25.723054909363604,
    "address": "10200-10214 SW 48th St, Miami, FL 33165, USA",
    "index": 42
  },
  {
    "lng": -80.35889625549316,
    "lat": 25.71582479486385,
    "address": "5601 SW 102nd Ave, Miami, FL 33165, USA",
    "index": 43
  },
  {
    "lng": -80.35921812057495,
    "lat": 25.723112903157652,
    "address": "10121-10199 SW 48th St, Olympia Heights, FL 33165, USA",
    "index": 44
  },
  {
    "lng": -80.35125732421875,
    "lat": 25.723364209271843,
    "address": "9700 SW 48th St, Olympia Heights, FL 33165, USA",
    "index": 45
  },
  {
    "lng": -80.358145236969,
    "lat": 25.7013052432736,
    "address": "7201 SW 102nd Ave, Miami, FL 33173, USA",
    "index": 46
  },
  {
    "lng": -80.35891771316528,
    "lat": 25.71578612996864,
    "address": "5598 SW 102nd Ave, Miami, FL 33173, USA",
    "index": 47
  },
  {
    "lng": -80.35093545913696,
    "lat": 25.716076116376378,
    "address": "9670-9858 SW 56th St, Miami, FL 33173, USA",
    "index": 48
  },
  {
    "lng": -80.35132169723511,
    "lat": 25.7232482219005,
    "address": "4800-4830 SW 97th Ave, Olympia Heights, FL 33165, USA",
    "index": 49
  },
  {
    "lng": -80.34434795379639,
    "lat": 25.72458206984104,
    "address": "4744-4798 SW 92nd Ave, Olympia Heights, FL 33165, USA",
    "index": 50
  },
  {
    "lng": -80.35012006759644,
    "lat": 25.701595264969672,
    "address": "7201 SW 97th Ave, Miami, FL 33173, USA",
    "index": 51
  },
  {
    "lng": -80.35082817077637,
    "lat": 25.71601811915137,
    "address": "5601-5681 SW 97th Ave, Miami, FL 33165, USA",
    "index": 52
  },
  {
    "lng": -80.3429102897644,
    "lat": 25.716327437357982,
    "address": "5601 SW 92nd Ave, Olympia Heights, FL 33165, USA",
    "index": 53
  },
  {
    "lng": -80.34215927124023,
    "lat": 25.701981959465336,
    "address": "7130 SW 92nd Ave, Miami, FL 33173, USA",
    "index": 54
  },
  {
    "lng": -80.3349494934082,
    "lat": 25.716714083985256,
    "address": "8700 SW 56th St, Miami, FL 33155, USA",
    "index": 55
  },
  {
    "lng": -80.33533573150635,
    "lat": 25.724060131124247,
    "address": "8700 SW 48th St, Olympia Heights, FL 33165, USA",
    "index": 56
  },
  {
    "lng": -80.3843879699707,
    "lat": 25.75649330184917,
    "address": "SW 117th Ave, Miami, FL 33174, USA",
    "index": 57
  },
  {
    "lng": -80.37812232971191,
    "lat": 25.761092760522754,
    "address": "1711 Tamiami Trail, Miami, FL 33174, USA",
    "index": 58
  },
  {
    "lng": -80.3927993774414,
    "lat": 25.760976809972263,
    "address": "803 SW 122nd Ave, Miami, FL 33184, USA",
    "index": 59
  },
  {
    "lng": -80.40073871612549,
    "lat": 25.760976809972263,
    "address": "SW 127th Ave, Miami, FL 33184, USA",
    "index": 60
  },
  {
    "lng": -80.40975093841553,
    "lat": 25.760976809972263,
    "address": "763-799 SW 132nd Ave, Miami, FL 33184, USA",
    "index": 61
  },
  {
    "lng": -80.41696071624756,
    "lat": 25.76089950954236,
    "address": "13710 SW 8th St, Miami, FL 33184, USA",
    "index": 62
  },
  {
    "lng": -80.44090747833252,
    "lat": 25.760938159763608,
    "address": "SW 152nd Ave, Florida, USA",
    "index": 63
  },
  {
    "lng": -80.4402208328247,
    "lat": 25.742771169290382,
    "address": "15154-15198 SW 26th St, Miami, FL 33185, USA",
    "index": 64
  },
  {
    "lng": -80.44820308685303,
    "lat": 25.742461919872046,
    "address": "SW 157th Ave, Miami, FL 33185, USA",
    "index": 65
  },
  {
    "lng": -80.44768810272217,
    "lat": 25.72808093319733,
    "address": "SW 157th Ave, Miami, FL 33185, USA",
    "index": 66
  },
  {
    "lng": -80.45571327209473,
    "lat": 25.72773298454545,
    "address": "SW 162 Ave, Miami, FL 33185, USA",
    "index": 67
  },
  {
    "lng": -80.45515537261963,
    "lat": 25.71315688761512,
    "address": "SW 162nd Ave, Miami, FL 33193, USA",
    "index": 68
  },
  {
    "lng": -80.46305179595947,
    "lat": 25.712847561165354,
    "address": "SW 56th St, Miami, FL 33193, USA",
    "index": 69
  },
  {
    "lng": -80.46283721923828,
    "lat": 25.705539489885645,
    "address": "SW 167th Ave, Miami, FL 33193, USA",
    "index": 70
  },
  {
    "lng": -80.46262264251709,
    "lat": 25.698346981615792,
    "address": "SW 167th Ave, Miami, FL 33193, USA",
    "index": 71
  },
  {
    "lng": -80.46197891235352,
    "lat": 25.68388331107315,
    "address": "16650 SW 88th St, Miami, FL 33196, USA",
    "index": 72
  },
  {
    "lng": -80.45403957366943,
    "lat": 25.684154037613542,
    "address": "SW 162nd Ave, Miami, FL 33193, USA",
    "index": 73
  },
  {
    "lng": -80.44599294662476,
    "lat": 25.684366750892234,
    "address": "15700 SW 88th St, Miami, FL 33196, USA",
    "index": 74
  },
  {
    "lng": -80.44112205505371,
    "lat": 25.68454078874687,
    "address": "8775 SW 152nd Ave, Miami, FL 33193, USA",
    "index": 75
  },
  {
    "lng": -80.43708801269531,
    "lat": 25.684656813842054,
    "address": "15005 SW 88th St, Miami, FL 33196, USA",
    "index": 76
  },
  {
    "lng": -80.430006980896,
    "lat": 25.684966213543433,
    "address": "14700 N Kendall Dr, Miami, FL 33196, USA",
    "index": 77
  },
  {
    "lng": -80.42490005493164,
    "lat": 25.685043563343225,
    "address": "8738 SW 142nd Ave, Miami, FL 33186, USA",
    "index": 78
  },
  {
    "lng": -80.41661739349365,
    "lat": 25.685430311588842,
    "address": "13701 N Kendall Dr, Miami, FL 33186, USA",
    "index": 79
  },
  {
    "lng": -80.40069580078125,
    "lat": 25.685778383936388,
    "address": "12700 SW 88th St, Miami, FL 33186, USA",
    "index": 80
  },
  {
    "lng": -80.39389371871948,
    "lat": 25.686049106170255,
    "address": "SW 122nd Ave, Miami, FL 33183, USA",
    "index": 81
  },
  {
    "lng": -80.41726112365723,
    "lat": 25.772532657999804,
    "address": "251-359 NW 137th Ave, Miami, FL 33182, USA",
    "index": 82
  },
  {
    "lng": -80.41721820831299,
    "lat": 25.78246437733121,
    "address": "NW 137th Ave, Miami, FL 33182, USA",
    "index": 83
  },
  {
    "lng": -80.40880680084229,
    "lat": 25.78242573412021,
    "address": "NW 12th St, Miami, FL 33182, USA",
    "index": 84
  },
  {
    "lng": -80.4008674621582,
    "lat": 25.782387090896638,
    "address": "NW 12th St, Miami, FL 33182, USA",
    "index": 85
  },
  {
    "lng": -80.40116786956787,
    "lat": 25.79672286265451,
    "address": "12650 NW 25th St, Miami, FL 33182, USA",
    "index": 86
  },
  {
    "lng": -80.38520336151123,
    "lat": 25.796800139745855,
    "address": "2101 NW 117th Ave, Miami, FL 33172, USA",
    "index": 87
  },
  {
    "lng": -80.38558959960938,
    "lat": 25.811636407753397,
    "address": "11592 NW 43rd Terrace, Miami, FL 33178, USA",
    "index": 88
  },
  {
    "lng": -80.38601875305176,
    "lat": 25.82620041556207,
    "address": "11555 NW 58th St, Doral, FL 33178, USA",
    "index": 89
  },
  {
    "lng": -80.38189888000488,
    "lat": 25.82623904450055,
    "address": "1366 NW 114th Ave, Doral, FL 33178, USA",
    "index": 90
  },
  {
    "lng": -80.38241386413574,
    "lat": 25.84068538346521,
    "address": "NW 74th St, Doral, FL 33178, USA",
    "index": 91
  },
  {
    "lng": -80.37026882171631,
    "lat": 25.84072400767596,
    "address": "7900 NW 107th Ave, Miami, FL 33178, USA",
    "index": 92
  },
  {
    "lng": -80.35430431365967,
    "lat": 25.84068538346521,
    "address": "8598 NW 74th St, Miami, FL 33166, USA",
    "index": 93
  },
  {
    "lng": -80.33825397491455,
    "lat": 25.84076263187411,
    "address": "198 NW 87th Ave, Miami, FL 33166, USA",
    "index": 94
  },
  {
    "lng": -80.33782482147217,
    "lat": 25.826277673426404,
    "address": "148 NW 87th Ave, Miami, FL 33178, USA",
    "index": 95
  },
  {
    "lng": -80.32580852508545,
    "lat": 25.82623904450055,
    "address": "7900 NW 58th St, Miami, FL 33166, USA",
    "index": 96
  },
  {
    "lng": -80.32529354095459,
    "lat": 25.80931836332646,
    "address": "3872-3898 NW 79th Ave, Doral, FL 33166, USA",
    "index": 97
  },
  {
    "lng": -80.32495021820068,
    "lat": 25.79703197071759,
    "address": "2533 NW 79th Ave, Doral, FL 33122, USA",
    "index": 98
  },
  {
    "lng": -80.33700942993164,
    "lat": 25.79687741678682,
    "address": "8700 NW 25th St, Doral, FL 33122, USA",
    "index": 99
  },
  {
    "lng": -80.33670902252197,
    "lat": 25.783430453514477,
    "address": "1181-1199 NW 87th Ave, Doral, FL 33172, USA",
    "index": 100
  },
  {
    "lng": -80.3364086151123,
    "lat": 25.76955684482858,
    "address": "8700 W Flagler St, Fontainebleau, FL, USA",
    "index": 101
  },
  {
    "lng": -80.4545545578003,
    "lat": 25.698617675280335,
    "address": "SW 162nd Ave, Miami, FL 33193, USA",
    "index": 102
  },
  {
    "lng": -80.44652938842773,
    "lat": 25.69888836832944,
    "address": "7250 SW 157th Ave, Miami, FL 33106, USA",
    "index": 103
  },
  {
    "lng": -80.43863296508789,
    "lat": 25.699236401345352,
    "address": "15201 Sunset Dr, Miami, FL 33193, USA",
    "index": 104
  },
  {
    "lng": -80.43060779571533,
    "lat": 25.699468422790765,
    "address": "SW 147th Ave, Miami, FL 33193, USA",
    "index": 105
  },
  {
    "lng": -80.42253971099854,
    "lat": 25.69977778401458,
    "address": "14187 SW 72nd St, Miami, FL 33183, USA",
    "index": 106
  },
  {
    "lng": -80.41451454162598,
    "lat": 25.70000980440489,
    "address": "Sunset Dr, Miami, FL 33183, USA",
    "index": 107
  },
  {
    "lng": -80.39855003356934,
    "lat": 25.70051251369932,
    "address": "12703 SW 72nd St, Miami, FL 33183, USA",
    "index": 108
  },
  {
    "lng": -80.44713020324707,
    "lat": 25.713427547598965,
    "address": "15710 SW 157th Ave, Miami, FL 33193, USA",
    "index": 109
  },
  {
    "lng": -80.43914794921875,
    "lat": 25.71369820696711,
    "address": "SW 152nd Ave, Miami, FL 33185, USA",
    "index": 110
  },
  {
    "lng": -80.43116569519043,
    "lat": 25.713968865719576,
    "address": "13741 SW 147th Ave, Miami, FL 33185, USA",
    "index": 111
  },
  {
    "lng": -80.42309761047363,
    "lat": 25.71427818925415,
    "address": "SW 56th St, Miami, FL 33175, USA",
    "index": 112
  },
  {
    "lng": -80.41511535644531,
    "lat": 25.714510181377314,
    "address": "13728 SW 56th St, Miami, FL 33175, USA",
    "index": 113
  },
  {
    "lng": -80.40713310241699,
    "lat": 25.714780838282614,
    "address": "SW 132nd Ave, Miami, FL 33175, USA",
    "index": 114
  },
  {
    "lng": -80.39902210235596,
    "lat": 25.71489683391067,
    "address": "12612-12698 SW 56th St, Miami, FL 33183, USA",
    "index": 115
  },
  {
    "lng": -80.39103984832764,
    "lat": 25.71524482011633,
    "address": "5400 SW 122nd Ave, Miami, FL 33175, USA",
    "index": 116
  },
  {
    "lng": -80.43970584869385,
    "lat": 25.728351559222652,
    "address": "4033 SW 152nd Ave, Miami, FL 33185, USA",
    "index": 117
  },
  {
    "lng": -80.43172359466553,
    "lat": 25.728622184631988,
    "address": "30041 SW 147th Ave, Miami, FL 33185, USA",
    "index": 118
  },
  {
    "lng": -80.42365550994873,
    "lat": 25.728854148778307,
    "address": "14211 SW 42nd St, Miami, FL 33175, USA",
    "index": 119
  },

  {
    "lng": -80.41571617126465,
    "lat": 25.729163433602757,
    "address": "SW 137th Ave, Miami, FL 33175, USA",
    "index": 120
  },
  {
    "lng": -80.40764808654785,
    "lat": 25.729395396693132,
    "address": "4311 SW 132nd Ave, Miami, FL 33175, USA",
    "index": 121
  },
  {
    "lng": -80.3996229171753,
    "lat": 25.72962735933095,
    "address": "SW 127th Ave, Miami, FL 33175, USA",
    "index": 122
  },
  {
    "lng": -80.3915548324585,
    "lat": 25.72985932151622,
    "address": "4201 SW 122nd Ave, Miami, FL 33175, USA",
    "index": 123
  },
  {
    "lng": -80.43228149414062,
    "lat": 25.742964449768156,
    "address": "14698 SW 26th St, Miami, FL 33185, USA",
    "index": 124
  },
  {
    "lng": -80.41627407073975,
    "lat": 25.743544289315054,
    "address": "13701 Coral Way, Miami, FL 33145, USA",
    "index": 125
  },
  {
    "lng": -80.40799140930176,
    "lat": 25.743776224341516,
    "address": "2721 SW 132nd Ave, Miami, FL 33175, USA",
    "index": 126
  },
  {
    "lng": -80.40013790130615,
    "lat": 25.743969503184406,
    "address": "12700 Coral Way, Miami, FL 33175, USA",
    "index": 127
  },
  {
    "lng": -80.3921127319336,
    "lat": 25.744278748679083,
    "address": "12200 Coral Way, Miami, FL 33175, USA",
    "index": 128
  },
  {
    "lng": -80.41623115539551,
    "lat": 25.744162781712912,
    "address": "2521-2565 SW 137th Ave, Miami, FL 33175, USA",
    "index": 129
  },
  {
    "lng": -80.41571617126465,
    "lat": 25.72978200083807,
    "address": "4112-4198 SW 137th Ave, Miami, FL 33175, USA",
    "index": 130
  },
  {
    "lng": -80.41545867919922,
    "lat": 25.721779038739477,
    "address": "FL-825, Miami, FL 33175, USA",
    "index": 131
  },
  {
    "lng": -80.41511535644531,
    "lat": 25.714780838282614,
    "address": "5558-5598 SW 137th Ave, Miami, FL 33175, USA",
    "index": 132
  },
  {
    "lng": -80.41455745697021,
    "lat": 25.700241824343024,
    "address": "7093-7199 SW 137th Ave, Miami, FL 33183, USA",
    "index": 133
  },
  {
    "lng": -80.4470443725586,
    "lat": 25.71369820696711,
    "address": "15710 SW 157th Ave, Miami, FL 33193, USA",
    "index": 134
  },
  {
    "lng": -80.44687271118164,
    "lat": 25.706158179974516,
    "address": "15700 SW 64th St, Miami, FL 33193, USA",
    "index": 135
  },
  {
    "lng": -80.44657230377197,
    "lat": 25.699159060763083,
    "address": "7250 SW 157th Ave, Miami, FL 33106, USA",
    "index": 136
  },
  {
    "lng": -80.44631481170654,
    "lat": 25.69231422026824,
    "address": "SW 157th Ave, Miami, FL 33193, USA",
    "index": 137
  },
  {
    "lng": -80.4548978805542,
    "lat": 25.705810167195246,
    "address": "SW 64th St, Miami, FL 33193, USA",
    "index": 138
  },
  {
    "lng": -80.4545545578003,
    "lat": 25.69881102752107,
    "address": "7400-7514 SW 162nd Ave, Miami, FL 33193, USA",
    "index": 139
  },
  {
    "lng": -80.45425415039062,
    "lat": 25.69134740317697,
    "address": "SW 80th St, Miami, FL 33193, USA",
    "index": 140
  },
  {
    "lng": -80.43906211853027,
    "lat": 25.692391565296465,
    "address": "15201 SW 80th St, Miami, FL 33193, USA",
    "index": 141
  },
  {
    "lng": -80.4303503036499,
    "lat": 25.69223687518976,
    "address": "7836-7998 SW 147th Ave, Miami, FL 33193, USA",
    "index": 142
  },
  {
    "lng": -80.43906211853027,
    "lat": 25.69258492764729,
    "address": "7931 SW 152nd Ave, Miami, FL 33193, USA",
    "index": 143
  },
  {
    "lng": -80.39867877960205,
    "lat": 25.695214624448745,
    "address": "7671-7897 SW 127th Ave, Miami, FL 33183, USA",
    "index": 144
  },
  {
    "lng": -80.40219783782959,
    "lat": 25.69107669298494,
    "address": "8000-8634 SW 127th Ave, Miami, FL 33183, USA",
    "index": 145
  },
  {
    "lng": -80.39902210235596,
    "lat": 25.71458751198452,
    "address": "5601-5695 SW 127th Ave, Miami, FL 33183, USA",
    "index": 146
  },
  {
    "lng": -80.39936542510986,
    "lat": 25.722281656073793,
    "address": "4680-4698 SW 127th Ave, Miami, FL 33175, USA",
    "index": 147
  },
  {
    "lng": -80.39966583251953,
    "lat": 25.729356736209507,
    "address": "4200-4228 SW 127th Ave, Miami, FL 33175, USA",
    "index": 148
  },
  {
    "lng": -80.40018081665039,
    "lat": 25.74369891271634,
    "address": "2600-2634 SW 127th Ave, Miami, FL 33175, USA",
    "index": 149
  },
  {
    "lng": -80.40043830871582,
    "lat": 25.751275212873917,
    "address": "SW 127th Ave, Miami, FL 33175, USA",
    "index": 150
  },
  {
    "lng": -80.41035175323486,
    "lat": 25.751081945916553,
    "address": "1700-1798 SW 132nd Ave, Miami, FL 33175, USA",
    "index": 151
  },
  {
    "lng": -80.40756225585938,
    "lat": 25.72993664214407,
    "address": "4101-4167 SW 132nd Ave E, Miami, FL 33175, USA",
    "index": 152
  },
  {
    "lng": -80.40743350982666,
    "lat": 25.7219723533502,
    "address": "13200 SW 47th St, Miami, FL 33175, USA",
    "index": 153
  },
  {
    "lng": -80.39151191711426,
    "lat": 25.730091283248907,
    "address": "4105-4199 SW 122nd Ave, Miami, FL 33175, USA",
    "index": 154
  },
  {
    "lng": -80.39125442504883,
    "lat": 25.722513632588605,
    "address": "12095-12199 SW 47th St, Miami, FL 33175, USA",
    "index": 155
  },
  {
    "lng": -80.3990650177002,
    "lat": 25.722281656073793,
    "address": "12669-12699 SW 47th St, Miami, FL 33175, USA",
    "index": 156
  },
  {
    "lng": -80.40709018707275,
    "lat": 25.721895027543596,
    "address": "13181 SW 47th St, Miami, FL 33175, USA",
    "index": 157
  },
  {
    "lng": -80.41507244110107,
    "lat": 25.72174037577962,
    "address": "13628-13698 SW 47th St, Miami, FL 33175, USA",
    "index": 158
  },
  {
    "lng": -80.42352676391602,
    "lat": 25.724060131124247,
    "address": "SW 142nd Ave, Miami, FL 33175, USA",
    "index": 159
  },
  {
    "lng": -80.43142318725586,
    "lat": 25.721237756157876,
    "address": "14695 SW 47th St, Miami, FL 33175, USA",
    "index": 160
  },
  {
    "lng": -80.42356967926025,
    "lat": 25.72433076630038,
    "address": "4668-4698 SW 142nd Ave, Miami, FL 33175, USA",
    "index": 161
  },
  {
    "lng": -80.44318199157715,
    "lat": 25.706158179974516,
    "address": "SW 64th St, Miami, FL 33193, USA",
    "index": 162
  },
  {
    "lng": -80.4010820388794,
    "lat": 25.772996414370645,
    "address": "520 NW 127th Ave, Miami, FL 33182, USA",
    "index": 163
  },
  {
    "lng": -80.39005279541016,
    "lat": 25.77342152278509,
    "address": "11950-11980 NW 6th St, Miami, FL 33182, USA",
    "index": 164
  },
  {
    "lng": -80.38717746734619,
    "lat": 25.76998196556437,
    "address": "200-210 NW 118th Ave, Miami, FL 33182, USA",
    "index": 165
  },
  {
    "lng": -80.38687705993652,
    "lat": 25.768126882087294,
    "address": "1-199 NW 118th Ave, Miami, FL 33182, USA",
    "index": 166
  },
  {
    "lng": -80.3690242767334,
    "lat": 25.768474712447883,
    "address": "752 FL-985, Miami, FL 33174, USA",
    "index": 167
  },
  {
    "lng": -80.35305976867676,
    "lat": 25.768977132280213,
    "address": "9704 SW 97th Ave, Miami, FL 33174, USA",
    "index": 168
  },
  {
    "lng": -80.34439086914062,
    "lat": 25.769324960149024,
    "address": "9198 W Flagler St, Miami, FL 33172, USA",
    "index": 169
  },
  {
    "lng": -80.3389835357666,
    "lat": 25.769518197413444,
    "address": "8797-8887 W Flagler St, Miami, FL 33172, USA",
    "index": 170
  },
  {
    "lng": -80.36863803863525,
    "lat": 25.78408738082453,
    "address": "10588-10698 NW 12th St, Miami, FL 33172, USA",
    "index": 171
  },
  {
    "lng": -80.36953926086426,
    "lat": 25.775585687464524,
    "address": "10630 Fontainebleau Blvd, Miami, FL 33172, USA",
    "index": 172
  },
  {
    "lng": -80.35370349884033,
    "lat": 25.775701623744123,
    "address": "9674 Fontainebleau Blvd, Miami, FL 33172, USA",
    "index": 173
  },
  {
    "lng": -80.35284519195557,
    "lat": 25.783430453514477,
    "address": "9700-9738 NW 12th St, Doral, FL 33172, USA",
    "index": 174
  },
  {
    "lng": -80.36906719207764,
    "lat": 25.796838778272633,
    "address": "10700 NW 25th St, Miami, FL 33172, USA",
    "index": 175
  },
  {
    "lng": -80.35301685333252,
    "lat": 25.79687741678682,
    "address": "2531 NW 97th Ave, Doral, FL 33172, USA",
    "index": 176
  },
  {
    "lng": -80.38155555725098,
    "lat": 25.811559140336584,
    "address": "4005 NW 114th Ave, Doral, FL 33178, USA",
    "index": 177
  },
  {
    "lng": -80.3695821762085,
    "lat": 25.81167504144289,
    "address": "4179 NW 107th Ave, Doral, FL 33178, USA",
    "index": 178
  },
  {
    "lng": -80.36159992218018,
    "lat": 25.811636407753397,
    "address": "NW 102nd Ave, Doral, FL 33178, USA",
    "index": 179
  },
  {
    "lng": -80.35348892211914,
    "lat": 25.811636407753397,
    "address": "NW 97th Ave, Doral, FL 33178, USA",
    "index": 180
  },
  {
    "lng": -80.33743858337402,
    "lat": 25.81001378141704,
    "address": "8245 NW 36th St, Doral, FL 33166, USA",
    "index": 181
  },
  {
    "lng": -80.37001132965088,
    "lat": 25.826277673426404,
    "address": "5750 NW 107th Ave, Doral, FL 33178, USA",
    "index": 182
  },
  {
    "lng": -80.3618574142456,
    "lat": 25.826123157647306,
    "address": "5911 NW 102nd Ave, Doral, FL 33178, USA",
    "index": 183
  },
  {
    "lng": -80.35391807556152,
    "lat": 25.826161786611,
    "address": "5800 NW 97th Ave, Doral, FL 33178, USA",
    "index": 184
  },
  {
    "lng": -80.37001132965088,
    "lat": 25.826470817866692,
    "address": "5750 NW 107th Ave, Doral, FL 33178, USA",
    "index": 185
  },
  {
    "lng": -80.36953926086426,
    "lat": 25.8117523087841,
    "address": "4402-4414 NW 107th Ave, Doral, FL 33178, USA",
    "index": 186
  },
  {
    "lng": -80.36923885345459,
    "lat": 25.804373050296743,
    "address": "3285 NW 107th Ave, Doral, FL 33172, USA",
    "index": 187
  },
  {
    "lng": -80.36906719207764,
    "lat": 25.79703197071759,
    "address": "2501-2507 NW 107th Ave, Doral, FL 33172, USA",
    "index": 188
  },
  {
    "lng": -80.3594970703125,
    "lat": 25.818590268870043,
    "address": "5000 NW 102nd Ave, Doral, FL 33178, USA",
    "index": 189
  },
  {
    "lng": -80.35331726074219,
    "lat": 25.81179094243581,
    "address": "4101-4151 NW 97th Ave, Doral, FL 33178, USA",
    "index": 190
  },
  {
    "lng": -80.35331726074219,
    "lat": 25.804373050296743,
    "address": "3349 NW 97th Ave, Doral, FL 33172, USA",
    "index": 191
  },
  {
    "lng": -80.33730983734131,
    "lat": 25.805300312211862,
    "address": "3170-3204 NW 87th Ave, Doral, FL 33172, USA",
    "index": 192
  },
  {
    "lng": -80.35293102264404,
    "lat": 25.80429577814294,
    "address": "9601 NW 33rd St, Doral, FL 33178, USA",
    "index": 193
  },
  {
    "lng": -80.46545505523682,
    "lat": 25.676457428987607,
    "address": "9570 SW 167th Ave, Miami, FL 33196, USA",
    "index": 194
  },
  {
    "lng": -80.46571254730225,
    "lat": 25.669263164448207,
    "address": "16364 SW 104th St, Miami, FL 33196, USA",
    "index": 195
  },
  {
    "lng": -80.4574728012085,
    "lat": 25.66949524427527,
    "address": "SW 162nd Ave, Miami, FL 33196, USA",
    "index": 196
  },
  {
    "lng": -80.45704364776611,
    "lat": 25.663847840229195,
    "address": "SW 112th St, Miami, FL 33196, USA",
    "index": 197
  },
  {
    "lng": -80.4503059387207,
    "lat": 25.664118612281538,
    "address": "15751 SW 112th St, Miami, FL 33196, USA",
    "index": 198
  },
  {
    "lng": -80.44880390167236,
    "lat": 25.654795963548747,
    "address": "SW 157th Ave, Miami, FL 33186, USA",
    "index": 199
  },
  {
    "lng": -80.4482889175415,
    "lat": 25.646904023419474,
    "address": "14040 SW 157th Ave, Miami, FL 33186, USA",
    "index": 200
  },
  {
    "lng": -80.45189380645752,
    "lat": 25.643383430793335,
    "address": "SW 162nd Ave, Miami, FL 33186, USA",
    "index": 201
  },
  {
    "lng": -80.45180797576904,
    "lat": 25.639901423853132,
    "address": "SW 162nd Ave, Miami, FL 33186, USA",
    "index": 202
  },
  {
    "lng": -80.4477310180664,
    "lat": 25.63997880288866,
    "address": "13600-13680 SW 157th Ave, Miami, FL 33196, USA",
    "index": 203
  },
  {
    "lng": -80.44713020324707,
    "lat": 25.625275885666014,
    "address": "SW 157th Ave, Miami, FL 33196, USA",
    "index": 204
  },
  {
    "lng": -80.44670104980469,
    "lat": 25.617923748266165,
    "address": "15998 SW 157th Ave, Miami, FL 33187, USA",
    "index": 205
  },
  {
    "lng": -80.44640064239502,
    "lat": 25.61060985749011,
    "address": "16801-17069 SW 157th Ave, Miami, FL 33187, USA",
    "index": 206
  },
  {
    "lng": -80.44605731964111,
    "lat": 25.595438879566224,
    "address": "18126-18398 SW 157th Ave, Miami, FL 33187, USA",
    "index": 207
  },
  {
    "lng": -80.42974948883057,
    "lat": 25.595942029589455,
    "address": "14700-14732 SW 184th St, Miami, FL 33187, USA",
    "index": 208
  },
  {
    "lng": -80.41344165802002,
    "lat": 25.596561288250896,
    "address": "13600 SW 184th St, Miami, FL 33177, USA",
    "index": 209
  },
  {
    "lng": -80.39713382720947,
    "lat": 25.597103136949528,
    "address": "12610 SW 184th St, Miami, FL 33177, USA",
    "index": 210
  },
  {
    "lng": -80.38906574249268,
    "lat": 25.597335357068896,
    "address": "12200-12210 SW 184th St, Miami, FL 33177, USA",
    "index": 211
  },
  {
    "lng": -80.38095474243164,
    "lat": 25.597606279971643,
    "address": "11700 SW 184th St, Miami, FL 33157, USA",
    "index": 212
  },
  {
    "lng": -80.45742988586426,
    "lat": 25.67676684998043,
    "address": "16238 SW 96th St, Miami, FL 33196, USA",
    "index": 213
  },
  {
    "lng": -80.44936180114746,
    "lat": 25.676998915197835,
    "address": "15955 SW 96th St, Miami, FL 33196, USA",
    "index": 214
  },
  {
    "lng": -80.44936180114746,
    "lat": 25.669727323650545,
    "address": "10263-10399 SW 157th Ave, Miami, FL 33196, USA",
    "index": 215
  },
  {
    "lng": -80.44107913970947,
    "lat": 25.677347012176664,
    "address": "15255 SW 96th St, Miami, FL 33196, USA",
    "index": 216
  },
  {
    "lng": -80.43554306030273,
    "lat": 25.678159234506396,
    "address": "9290 Hammocks Blvd, Miami, FL 33196, USA",
    "index": 217
  },
  {
    "lng": -80.44103622436523,
    "lat": 25.675722550909992,
    "address": "9690 Hammocks Blvd, Miami, FL 33196, USA",
    "index": 218
  },
  {
    "lng": -80.43279647827148,
    "lat": 25.677501721618647,
    "address": "SW 96th St, Miami, FL 33196, USA",
    "index": 219
  },
  {
    "lng": -80.44386863708496,
    "lat": 25.67452352958177,
    "address": "SW 98th Terrace, Miami, FL 33196, USA",
    "index": 220
  },
  {
    "lng": -80.44382572174072,
    "lat": 25.669843363168756,
    "address": "10300 Hammocks Blvd, Miami, FL 33196, USA",
    "index": 221
  },
  {
    "lng": -80.4402208328247,
    "lat": 25.662958156299528,
    "address": "Hammocks Blvd, Miami, FL 33196, USA",
    "index": 222
  },
  {
    "lng": -80.4320240020752,
    "lat": 25.655453601662288,
    "address": "14675 SW 120th St, Miami, FL 33186, USA",
    "index": 223
  },
  {
    "lng": -80.43215274810791,
    "lat": 25.65920593800539,
    "address": "11567-11599 SW 147th Ave, Miami, FL 33196, USA",
    "index": 224
  },
  {
    "lng": -80.43232440948486,
    "lat": 25.662880792165865,
    "address": "10900-11398 SW 147th Ave, Miami, FL 33196, USA",
    "index": 225
  },
  {
    "lng": -80.43266773223877,
    "lat": 25.670191481045688,
    "address": "SW 147th Ave, Miami, FL 33196, USA",
    "index": 226
  },
  {
    "lng": -80.42391300201416,
    "lat": 25.65587913027442,
    "address": "11526 SW 142nd Ave, Miami, FL 33186, USA",
    "index": 227
  },
  {
    "lng": -80.41580200195312,
    "lat": 25.656265973150013,
    "address": "SW 120th St, Miami, FL 33186, USA",
    "index": 228
  },
  {
    "lng": -80.41614532470703,
    "lat": 25.663538385702182,
    "address": "9229 SW 112th St, Miami, FL 33186, USA",
    "index": 229
  },
  {
    "lng": -80.41635990142822,
    "lat": 25.670771675248197,
    "address": "Killian Pkwy, Miami, FL 33186, USA",
    "index": 230
  },
  {
    "lng": -80.42442798614502,
    "lat": 25.670500918305116,
    "address": "10398 SW 142nd Ave, Miami, FL 33186, USA",
    "index": 231
  },
  {
    "lng": -80.42412757873535,
    "lat": 25.66319024839939,
    "address": "14200 SW 112th St, Miami, FL 33186, USA",
    "index": 232
  },
  {
    "lng": -80.42410612106323,
    "lat": 25.66332563524903,
    "address": "11121-11199 SW 142nd Ave, Miami, FL 33186, USA",
    "index": 233
  },
  {
    "lng": -80.4204797744751,
    "lat": 25.67808188023731,
    "address": "SW 142nd Ave, Miami, FL 33186, USA",
    "index": 234
  },
  {
    "lng": -80.420823097229,
    "lat": 25.67804320308394,
    "address": "14211 SW 96th Terrace, Miami, FL 33186, USA",
    "index": 235
  },
  {
    "lng": -80.41666030883789,
    "lat": 25.677695108138682,
    "address": "9598 SW 137th Ave, Miami, FL 33186, USA",
    "index": 236
  },
  {
    "lng": -80.41670322418213,
    "lat": 25.677927171548486,
    "address": "9598 SW 137th Ave, Miami, FL 33186, USA",
    "index": 237
  },
  {
    "lng": -80.41224002838135,
    "lat": 25.6709650726882,
    "address": "SW 134th Ave, Miami, FL 33186, USA",
    "index": 238
  },
  {
    "lng": -80.40018081665039,
    "lat": 25.671274507939525,
    "address": "Killian Pkwy, Miami, FL 33186, USA",
    "index": 239
  },

  {
    "lng": -80.39992332458496,
    "lat": 25.66404124890075,
    "address": "10900 SW 127th Ave, Miami, FL 33186, USA",
    "index": 240
  },
  {
    "lng": -80.39970874786377,
    "lat": 25.65684623511116,
    "address": "SW 127th Ave, Miami, FL 33186, USA",
    "index": 241
  },
  {
    "lng": -80.40760517120361,
    "lat": 25.656459394117366,
    "address": "13144-13150 SW 120th St, Miami, FL 33186, USA",
    "index": 242
  },
  {
    "lng": -80.40743350982666,
    "lat": 25.662880792165865,
    "address": "11301 SW 132nd Ave, Miami, FL 33186, USA",
    "index": 243
  },
  {
    "lng": -80.40739059448242,
    "lat": 25.6626100173028,
    "address": "11201-11271 SW 132nd Ave, Miami, FL 33186, USA",
    "index": 244
  },
  {
    "lng": -80.41567325592041,
    "lat": 25.648335443469513,
    "address": "12492-12798 SW 137th Ave, Miami, FL 33186, USA",
    "index": 245
  },
  {
    "lng": -80.39910793304443,
    "lat": 25.64879968412257,
    "address": "SW 127th Ave, Miami, FL 33186, USA",
    "index": 246
  },
  {
    "lng": -80.4147720336914,
    "lat": 25.64110079326719,
    "address": "SW 136th St, Miami, FL 33186, USA",
    "index": 247
  },
  {
    "lng": -80.398850440979,
    "lat": 25.64129423881827,
    "address": "12710 SW 127th Ave, Miami, FL 33186, USA",
    "index": 248
  },
  {
    "lng": -80.43077945709229,
    "lat": 25.625624133582107,
    "address": "SW 152nd St, Miami, FL 33187, USA",
    "index": 249
  },
  {
    "lng": -80.41447162628174,
    "lat": 25.62624323848159,
    "address": "13700 SW 152nd St, Miami, FL 33177, USA",
    "index": 250
  },
  {
    "lng": -80.43039321899414,
    "lat": 25.618272017614135,
    "address": "16020 SW 147th Ave, Miami, FL 33187, USA",
    "index": 251
  },
  {
    "lng": -80.41455745697021,
    "lat": 25.61896855326474,
    "address": "13761 SW 160th St, Miami, FL 33177, USA",
    "index": 252
  },
  {
    "lng": -80.4303503036499,
    "lat": 25.618581589515678,
    "address": "15949-15999 SW 147th Ave, Miami, FL 33187, USA",
    "index": 253
  },
  {
    "lng": -80.43009281158447,
    "lat": 25.61107424481473,
    "address": "14701 SW 168th St, Miami, FL 33187, USA",
    "index": 254
  },
  {
    "lng": -80.38177013397217,
    "lat": 25.61242869753935,
    "address": "11700 SW 168th St, Miami, FL 33177, USA",
    "index": 255
  },
  {
    "lng": -80.38241386413574,
    "lat": 25.627171889814054,
    "address": "11700-11738 SW 152nd St, Miami, FL 33177, USA",
    "index": 256
  },
  {
    "lng": -80.39031028747559,
    "lat": 25.627055808792353,
    "address": "12201-12317 SW 152nd St, Miami, FL 33186, USA",
    "index": 257
  },
  {
    "lng": -80.39494514465332,
    "lat": 25.626823646410504,
    "address": "SW 127th Ave, Miami, FL 33177, USA",
    "index": 258
  },
  {
    "lng": -80.39224147796631,
    "lat": 25.67162262163718,
    "address": "10421 SW 122nd Ave, Miami, FL 33186, USA",
    "index": 259
  },
  {
    "lng": -80.38413047790527,
    "lat": 25.671893376032514,
    "address": "10301 SW 117th Ave, Miami, FL 33186, USA",
    "index": 260
  },
  {
    "lng": -80.39327144622803,
    "lat": 25.66183637144903,
    "address": "12201 SW 112th St, Miami, FL 33186, USA",
    "index": 261
  },
  {
    "lng": -80.3918981552124,
    "lat": 25.65676886701277,
    "address": "11900-11998 SW 122nd Ave, Miami, FL 33186, USA",
    "index": 262
  },
  {
    "lng": -80.39112567901611,
    "lat": 25.649225236467903,
    "address": "12801-12899 SW 122nd Ave, Miami, FL 33186, USA",
    "index": 263
  },
  {
    "lng": -80.38387298583984,
    "lat": 25.664312020513925,
    "address": "Carl R Ebinger Jr Ave, Miami, FL 33186, USA",
    "index": 264
  },
  {
    "lng": -80.38361549377441,
    "lat": 25.657426494249556,
    "address": "SW 120th St, Miami, FL 33186, USA",
    "index": 265
  },
  {
    "lng": -80.3831434249878,
    "lat": 25.648064635587787,
    "address": "SW 128th St, Miami, FL 33186, USA",
    "index": 266
  },
  {
    "lng": -80.38271427154541,
    "lat": 25.634484766728765,
    "address": "14235 SW 117th Ave, Miami, FL 33186, USA",
    "index": 267
  },
  {
    "lng": -80.37898063659668,
    "lat": 25.597683686402537,
    "address": "11500 SW 184th St, Miami, FL 33157, USA",
    "index": 268
  },
  {
    "lng": -80.37271499633789,
    "lat": 25.597993311625213,
    "address": "11201 SW 184th St, Miami, FL 33157, USA",
    "index": 269
  },
  {
    "lng": -80.36447525024414,
    "lat": 25.598302936046263,
    "address": "18351-18399 SW 107th Ave, Miami, FL 33157, USA",
    "index": 270
  },
  {
    "lng": -80.35421848297119,
    "lat": 25.59861255966574,
    "address": "9885 SW 184th St, Palmetto Bay, FL 33157, USA",
    "index": 271
  },
  {
    "lng": -80.34821033477783,
    "lat": 25.598806074020843,
    "address": "9725 SW 184th St, Palmetto Bay, FL 33157, USA",
    "index": 272
  },
  {
    "lng": -80.3395414352417,
    "lat": 25.59903829083363,
    "address": "9201-9249 SW 184th St, Cutler Bay, FL 33157, USA",
    "index": 273
  },
  {
    "lng": -80.33215999603271,
    "lat": 25.599154399070937,
    "address": "8700-8724 SW 184th St, Cutler Bay, FL 33157, USA",
    "index": 274
  },
  {
    "lng": -80.32851219177246,
    "lat": 25.59927050719552,
    "address": "8407-8409 SW 184th St, Cutler Bay, FL 33157, USA",
    "index": 275
  },
  {
    "lng": -80.31632423400879,
    "lat": 25.5995414257145,
    "address": "7701 SW 184th St, Cutler Bay, FL 33157, USA",
    "index": 276
  },
  {
    "lng": -80.31048774719238,
    "lat": 25.615098859381234,
    "address": "16782-16798 Old Cutler Rd, Palmetto Bay, FL 33157, USA",
    "index": 277
  },
  {
    "lng": -80.31121730804443,
    "lat": 25.629725643748483,
    "address": "15190 Old Cutler Rd, Palmetto Bay, FL 33158, USA",
    "index": 278
  },
  {
    "lng": -80.30113220214844,
    "lat": 25.629996493235605,
    "address": "6755 SW 152nd St, Palmetto Bay, FL 33157, USA",
    "index": 279
  },
  {
    "lng": -80.30138969421387,
    "lat": 25.637502648873767,
    "address": "14356-14398 SW 67th Ave, Palmetto Bay, FL 33158, USA",
    "index": 280
  },
  {
    "lng": -80.30169010162354,
    "lat": 25.644814893071292,
    "address": "6725 Old Cutler Rd, Pinecrest, FL 33156, USA",
    "index": 281
  },
  {
    "lng": -80.28937339782715,
    "lat": 25.647561705034096,
    "address": "5900-5950 SW 124th St, Pinecrest, FL 33156, USA",
    "index": 282
  },
  {
    "lng": -80.28388023376465,
    "lat": 25.660018283937173,
    "address": "5700-5794 SW 120th St, Coral Gables, FL 33156, USA",
    "index": 283
  },
  {
    "lng": -80.28409481048584,
    "lat": 25.663731794875655,
    "address": "11511 Red Rd, Pinecrest, FL 33156, USA",
    "index": 284
  },
  {
    "lng": -80.27976036071777,
    "lat": 25.66613004256424,
    "address": "11401 Old Cutler Rd, Miami, FL 33156, USA",
    "index": 285
  },
  {
    "lng": -80.26988983154297,
    "lat": 25.690109865847596,
    "address": "8800 Old Cutler Rd, Coral Gables, FL 33156, USA",
    "index": 286
  },
  {
    "lng": -80.26572704315186,
    "lat": 25.69772825092862,
    "address": "601-699 SW 80th St, Coral Gables, FL 33143, USA",
    "index": 287
  },
  {
    "lng": -80.26087760925293,
    "lat": 25.705423485135956,
    "address": "401 SW 72nd St, Coral Gables, FL 33143, USA",
    "index": 288
  },
  {
    "lng": -80.37374496459961,
    "lat": 25.61289307779723,
    "address": "16240-16298 SW 112th Ave, Miami, FL 33157, USA",
    "index": 289
  },
  {
    "lng": -80.36559104919434,
    "lat": 25.613202663633395,
    "address": "10700-10714 SW 168th St, Miami, FL 33157, USA",
    "index": 290
  },
  {
    "lng": -80.35735130310059,
    "lat": 25.613550946740524,
    "address": "10201 SW 168th St, Miami, FL 33157, USA",
    "index": 291
  },
  {
    "lng": -80.34692287445068,
    "lat": 25.613976624715345,
    "address": "9501-9599 SW 168th St, Palmetto Bay, FL 33157, USA",
    "index": 292
  },
  {
    "lng": -80.34091472625732,
    "lat": 25.61420881206256,
    "address": "16750-16798 SW 92nd Ave, Palmetto Bay, FL 33157, USA",
    "index": 293
  },
  {
    "lng": -80.33280372619629,
    "lat": 25.614440998958674,
    "address": "87th Ave, Palmetto Bay, FL 33157, USA",
    "index": 294
  },
  {
    "lng": -80.32464981079102,
    "lat": 25.614634487694154,
    "address": "16740-16798 SW 82nd Ave, Palmetto Bay, FL 33157, USA",
    "index": 295
  },
  {
    "lng": -80.37456035614014,
    "lat": 25.627752293230348,
    "address": "11201 SW 152nd St, Miami, FL 33157, USA",
    "index": 296
  },
  {
    "lng": -80.35812377929688,
    "lat": 25.628487466842078,
    "address": "15150-15198 SW 102nd Ave, Miami, FL 33157, USA",
    "index": 297
  },
  {
    "lng": -80.34112930297852,
    "lat": 25.62891309160154,
    "address": "9201 Coral Reef Dr, Miami, FL 33157, USA",
    "index": 298
  },
  {
    "lng": -80.33366203308105,
    "lat": 25.629183942931448,
    "address": "15120 SW 87th Ave, Palmetto Bay, FL 33176, USA",
    "index": 299
  },
  {
    "lng": -80.32555103302002,
    "lat": 25.629377407791015,
    "address": "8201 SW 152nd St, Palmetto Bay, FL 33157, USA",
    "index": 300
  },
  {
    "lng": -80.31735420227051,
    "lat": 25.629532179453015,
    "address": "7701-7737 SW 152nd St, Palmetto Bay, FL 33157, USA",
    "index": 301
  },
  {
    "lng": -80.37417411804199,
    "lat": 25.62028422063733,
    "address": "11201 SW 160th St, Miami, FL 33157, USA",
    "index": 302
  },
  {
    "lng": -80.37863731384277,
    "lat": 25.634446075436784,
    "address": "11673-11699 Olivia L Edwards Blvd, Miami, FL 33176, USA",
    "index": 303
  },
  {
    "lng": -80.37481784820557,
    "lat": 25.631002500238306,
    "address": "14772-14798 Olivia L Edwards Blvd, Miami, FL 33176, USA",
    "index": 304
  },
  {
    "lng": -80.36593437194824,
    "lat": 25.620632483105002,
    "address": "10701 SW 160th St, Miami, FL 33157, USA",
    "index": 305
  },
  {
    "lng": -80.35756587982178,
    "lat": 25.620942048890715,
    "address": "10142-10198 SW 160th St, Miami, FL 33157, USA",
    "index": 306
  },
  {
    "lng": -80.34572124481201,
    "lat": 25.619200730912635,
    "address": "16401 S Dixie Hwy, Miami, FL 33157, USA",
    "index": 307
  },
  {
    "lng": -80.34121513366699,
    "lat": 25.6178850516093,
    "address": "9201-9299 SW 164th St, Palmetto Bay, FL 33157, USA",
    "index": 308
  },
  {
    "lng": -80.36597728729248,
    "lat": 25.620477699911373,
    "address": "16000-16020 SW 107th Ave, Miami, FL 33157, USA",
    "index": 309
  },
  {
    "lng": -80.35881042480469,
    "lat": 25.62643670810459,
    "address": "10149-10201 Fairway Heights Blvd, Miami, FL 33157, USA",
    "index": 310
  },
  {
    "lng": -80.37528991699219,
    "lat": 25.649728160010245,
    "address": "11281-11299 SW 128th St, Miami, FL 33176, USA",
    "index": 311
  },
  {
    "lng": -80.36726474761963,
    "lat": 25.65011502283112,
    "address": "10700-10830 SW 128th St, Miami, FL 33176, USA",
    "index": 312
  },
  {
    "lng": -80.35881042480469,
    "lat": 25.65054057048536,
    "address": "12758-12798 SW 102nd Ave, Miami, FL 33176, USA",
    "index": 313
  },
  {
    "lng": -80.37498950958252,
    "lat": 25.642416216832274,
    "address": "11198-11200 SW 136th St, Miami, FL 33176, USA",
    "index": 314
  },
  {
    "lng": -80.36696434020996,
    "lat": 25.642803103357263,
    "address": "10700 SW 136th St, Miami, FL 33176, USA",
    "index": 315
  },
  {
    "lng": -80.35863876342773,
    "lat": 25.643151300157495,
    "address": "10201 SW 136th St, Miami, FL 33176, USA",
    "index": 316
  },
  {
    "lng": -80.35044193267822,
    "lat": 25.643344742385377,
    "address": "13600-13798 SW 97th Ave, Miami, FL 33176, USA",
    "index": 317
  },
  {
    "lng": -80.34284591674805,
    "lat": 25.646439775391496,
    "address": "SW 92nd Ave, Miami, FL 33176, USA",
    "index": 318
  },
  {
    "lng": -80.33426284790039,
    "lat": 25.643925067187876,
    "address": "13621 S Dixie Hwy, Palmetto Bay, FL 33176, USA",
    "index": 319
  },
  {
    "lng": -80.3259801864624,
    "lat": 25.644041131809775,
    "address": "13601-13625 SW 82nd Ave, Palmetto Bay, FL 33158, USA",
    "index": 320
  },
  {
    "lng": -80.31782627105713,
    "lat": 25.64435063691636,
    "address": "13564-13598 Palmetto Rd, Pinecrest, FL 33156, USA",
    "index": 321
  },
  {
    "lng": -80.30980110168457,
    "lat": 25.644544077200393,
    "address": "7199 SW 136th St, Pinecrest, FL 33156, USA",
    "index": 322
  },
  {
    "lng": -80.35014152526855,
    "lat": 25.636071098904992,
    "address": "9701-9715 SW 144th St, Miami, FL 33176, USA",
    "index": 323
  },
  {
    "lng": -80.342116355896,
    "lat": 25.63630324330925,
    "address": "14376-14398 SW 92nd Ave, Miami, FL 33176, USA",
    "index": 324
  },
  {
    "lng": -80.33782482147217,
    "lat": 25.636264552606562,
    "address": "14400-14544 FL-5, Miami, FL 33176, USA",
    "index": 325
  },
  {
    "lng": -80.3340482711792,
    "lat": 25.63630324330925,
    "address": "14400-14498 SW 87th Ave, Palmetto Bay, FL 33176, USA",
    "index": 326
  },
  {
    "lng": -80.32576560974121,
    "lat": 25.636651459069302,
    "address": "8200 SW 144th St, Palmetto Bay, FL 33158, USA",
    "index": 327
  },
  {
    "lng": -80.3175687789917,
    "lat": 25.636883602345094,
    "address": "7700 SW 144th St, Palmetto Bay, FL 33158, USA",
    "index": 328
  },
  {
    "lng": -80.30844926834106,
    "lat": 25.637202798612282,
    "address": "7057 SW 144th St, Palmetto Bay, FL 33158, USA",
    "index": 329
  },
  {
    "lng": -80.3175687789917,
    "lat": 25.637154435596354,
    "address": "14358-14398 Palmetto Rd, Palmetto Bay, FL 33158, USA",
    "index": 330
  },
  {
    "lng": -80.3256368637085,
    "lat": 25.636264552606562,
    "address": "14401-14423 SW 82nd Ave, Palmetto Bay, FL 33158, USA",
    "index": 331
  },
  {
    "lng": -80.33773899078369,
    "lat": 25.63603240812707,
    "address": "14437 S Dixie Hwy, Miami, FL 33176, USA",
    "index": 332
  },
  {
    "lng": -80.34203052520752,
    "lat": 25.63618717116353,
    "address": "14401-14415 SW 92nd Ave, Miami, FL 33176, USA",
    "index": 333
  },
  {
    "lng": -80.36765098571777,
    "lat": 25.664969606157502,
    "address": "10701-10755 SW 112th St, Miami, FL 33176, USA",
    "index": 334
  },
  {
    "lng": -80.35941123962402,
    "lat": 25.665279056970263,
    "address": "10201-10241 SW 112th St, Miami, FL 33176, USA",
    "index": 335
  },
  {
    "lng": -80.35619258880615,
    "lat": 25.6654724633204,
    "address": "SW 99th Ave, Miami, FL 33176, USA",
    "index": 336
  },
  {
    "lng": -80.35125732421875,
    "lat": 25.665588506979873,
    "address": "9700 SW 112th St, Miami, FL 33176, USA",
    "index": 337
  },
  {
    "lng": -80.33499240875244,
    "lat": 25.66609136153265,
    "address": "8701 SW 112th St, Miami, FL 33176, USA",
    "index": 338
  },
  {
    "lng": -80.32374858856201,
    "lat": 25.666478171283963,
    "address": "11114-11198 US-1, Kendall, FL 33156, USA",
    "index": 339
  },
  {
    "lng": -80.31864166259766,
    "lat": 25.666594213964665,
    "address": "7701-7803 SW 112th St, Pinecrest, FL 33156, USA",
    "index": 340
  },
  {
    "lng": -80.31053066253662,
    "lat": 25.666787618181484,
    "address": "7200-7224 SW 112th St, Pinecrest, FL 33156, USA",
    "index": 341
  },
  {
    "lng": -80.30246257781982,
    "lat": 25.667058383558025,
    "address": "6701-6717 SW 112th St, Pinecrest, FL 33156, USA",
    "index": 342
  },
  {
    "lng": -80.28422355651855,
    "lat": 25.66833484062196,
    "address": "5855 SW 111th St, Miami, FL 33156, USA",
    "index": 343
  },
  {
    "lng": -80.35057067871094,
    "lat": 25.650695314710603,
    "address": "12801-12999 SW 97th Ave, Miami, FL 33176, USA",
    "index": 344
  },
  {
    "lng": -80.34138679504395,
    "lat": 25.65100480255899,
    "address": "9081-9151 SW 128th St, Miami, FL 33176, USA",
    "index": 345
  },
  {
    "lng": -80.33456325531006,
    "lat": 25.651314289604606,
    "address": "8701 SW 128th St, Miami, FL 33176, USA",
    "index": 346
  },
  {
    "lng": -80.33078670501709,
    "lat": 25.65139166124056,
    "address": "8397-8399 SW 128th St, Kendall, FL 33156, USA",
    "index": 347
  },
  {
    "lng": -80.32628059387207,
    "lat": 25.65158509011098,
    "address": "12784-12798 SW 82nd Ave, Pinecrest, FL 33156, USA",
    "index": 348
  },
  {
    "lng": -80.3181266784668,
    "lat": 25.651778518667776,
    "address": "7701-7723 SW 128th St, Pinecrest, FL 33156, USA",
    "index": 349
  },
  {
    "lng": -80.3346061706543,
    "lat": 25.654989386899658,
    "address": "8701 SW 124th St, Miami, FL 33176, USA",
    "index": 350
  },
  {
    "lng": -80.32902717590332,
    "lat": 25.655182809936967,
    "address": "12398 FL-5, Kendall, FL 33156, USA",
    "index": 351
  },
  {
    "lng": -80.3270959854126,
    "lat": 25.65893515479856,
    "address": "8275 SW 120th St, Miami, FL 33156, USA",
    "index": 352
  },
  {
    "lng": -80.36777973175049,
    "lat": 25.672280166959005,
    "address": "10700 Killian Pkwy, Miami, FL 33176, USA",
    "index": 353
  },
  {
    "lng": -80.36529064178467,
    "lat": 25.671893376032514,
    "address": "1973 SW 104th St, Miami, FL 33176, USA",
    "index": 354
  },
  {
    "lng": -80.36181449890137,
    "lat": 25.66999808235069,
    "address": "10200 Killian Pkwy, Miami, FL 33176, USA",
    "index": 355
  },
  {
    "lng": -80.35112857818604,
    "lat": 25.687480056328734,
    "address": "Don Shula Expy, Miami, FL 33173, USA",
    "index": 356
  },
  {
    "lng": -80.3514289855957,
    "lat": 25.67297638746384,
    "address": "9701-9731 SW 104th St, Miami, FL 33176, USA",
    "index": 357
  },
  {
    "lng": -80.34975528717041,
    "lat": 25.687518730418773,
    "address": "8800-8854 SW 97th Ave, Miami, FL 33176, USA",
    "index": 358
  },
  {
    "lng": -80.33520698547363,
    "lat": 25.67351788948949,
    "address": "10310-10448 SW 87th Ave, Miami, FL 33176, USA",
    "index": 359
  },

  {
    "lng": -80.32035827636719,
    "lat": 25.673943353640936,
    "address": "7801-7815 SW 104th St, Kendall, FL 33156, USA",
    "index": 360
  },
  {
    "lng": -80.31889915466309,
    "lat": 25.67390467514448,
    "address": "7703-7721 SW 104th St, Pinecrest, FL 33156, USA",
    "index": 361
  },
  {
    "lng": -80.31083106994629,
    "lat": 25.674098067501294,
    "address": "7200 SW 104th St, Pinecrest, FL 33156, USA",
    "index": 362
  },
  {
    "lng": -80.30267715454102,
    "lat": 25.674368816273685,
    "address": "10380 Ludlam Rd, Pinecrest, FL 33156, USA",
    "index": 363
  },
  {
    "lng": -80.28443813323975,
    "lat": 25.674794277387655,
    "address": "5830 SW 104th St, Miami, FL 33156, USA",
    "index": 364
  },
  {
    "lng": -80.33361911773682,
    "lat": 25.688098840262615,
    "address": "8600 SW 87th Ave, Miami, FL 33156, USA",
    "index": 365
  },
  {
    "lng": -80.31709671020508,
    "lat": 25.688485578588967,
    "address": "7568-7580 SW 88th St, Kendall, FL 33156, USA",
    "index": 366
  },
  {
    "lng": -80.30847072601318,
    "lat": 25.688872315659644,
    "address": "7145-7149 SW 88th St, Miami, FL 33143, USA",
    "index": 367
  },
  {
    "lng": -80.30319213867188,
    "lat": 25.688988336535992,
    "address": "8800-8852 SW 67th Ave, Pinecrest, FL 33156, USA",
    "index": 368
  },
  {
    "lng": -80.28488874435425,
    "lat": 25.688466241702482,
    "address": "5701-5717 SW 88th St, Pinecrest, FL 33156, USA",
    "index": 369
  },
  {
    "lng": -80.31121730804443,
    "lat": 25.686435851151373,
    "address": "9071 S Dixie Hwy, Pinecrest, FL 33156, USA",
    "index": 370
  },
  {
    "lng": -80.32636642456055,
    "lat": 25.65522149450678,
    "address": "8220-8242 SW 124th St, Pinecrest, FL 33156, USA",
    "index": 371
  },
  {
    "lng": -80.32919883728027,
    "lat": 25.655182809936967,
    "address": "S Miami-Dade Busway, Kendall, FL 33156, USA",
    "index": 372
  },
  {
    "lng": -80.3265380859375,
    "lat": 25.655182809936967,
    "address": "8220-8242 SW 124th St, Pinecrest, FL 33156, USA",
    "index": 373
  },
  {
    "lng": -80.31821250915527,
    "lat": 25.655492286144298,
    "address": "12401-12425 Palmetto Rd, Pinecrest, FL 33156, USA",
    "index": 374
  },
  {
    "lng": -80.31018733978271,
    "lat": 25.655685708366185,
    "address": "7200-7220 SW 124th St, Pinecrest, FL 33156, USA",
    "index": 375
  },
  {
    "lng": -80.30203342437744,
    "lat": 25.655763077167123,
    "address": "6701 SW 124th St, Pinecrest, FL 33156, USA",
    "index": 376
  },
  {
    "lng": -80.31808376312256,
    "lat": 25.65204931812047,
    "address": "12700-12798 Palmetto Rd, Pinecrest, FL 33156, USA",
    "index": 377
  },
  {
    "lng": -80.31838417053223,
    "lat": 25.65920593800539,
    "address": "12000-12020 Palmetto Rd, Pinecrest, FL 33156, USA",
    "index": 378
  },
  {
    "lng": -80.31027317047119,
    "lat": 25.65943803740762,
    "address": "7200-7220 SW 120th St, Pinecrest, FL 33156, USA",
    "index": 379
  },
  {
    "lng": -80.30216217041016,
    "lat": 25.65970881947271,
    "address": "6701 SW 120th St, Pinecrest, FL 33156, USA",
    "index": 380
  },
  {
    "lng": -80.33421993255615,
    "lat": 25.702329983437405,
    "address": "7198 SW 87th Ave, Miami, FL 33173, USA",
    "index": 381
  },
  {
    "lng": -80.3175687789917,
    "lat": 25.703026028329134,
    "address": "Palmetto Expy, Miami, FL 33143, USA",
    "index": 382
  },
  {
    "lng": -80.30962944030762,
    "lat": 25.70333538030794,
    "address": "7190 SW 72nd Ave, Miami, FL 33143, USA",
    "index": 383
  },
  {
    "lng": -80.30147552490234,
    "lat": 25.70372206915087,
    "address": "6700-6718 SW 72nd St, South Miami, FL 33143, USA",
    "index": 384
  },
  {
    "lng": -80.29340744018555,
    "lat": 25.70410875673761,
    "address": "7000 SW 62nd Ave, South Miami, FL 33143, USA",
    "index": 385
  },
  {
    "lng": -80.28544664382935,
    "lat": 25.704476108781424,
    "address": "7154-7198 SW 57th Ave, Coral Gables, FL 33143, USA",
    "index": 386
  },
  {
    "lng": -80.33396244049072,
    "lat": 25.6956013396687,
    "address": "Snapper Creek Expy, Miami, FL 33173, USA",
    "index": 387
  },
  {
    "lng": -80.31821250915527,
    "lat": 25.67784981712877,
    "address": "9896-10198 FL-5, Kendall, FL 33156, USA",
    "index": 388
  },
  {
    "lng": -80.28486728668213,
    "lat": 25.689607112634537,
    "address": "8798 SW 57th Ave, Pinecrest, FL 33156, USA",
    "index": 389
  },
  {
    "lng": -80.28514623641968,
    "lat": 25.69699350406148,
    "address": "8000-8018 SW 57th Ave, South Miami, FL 33143, USA",
    "index": 390
  },
  {
    "lng": -80.30937194824219,
    "lat": 25.69606539627484,
    "address": "7200-7206 SW 80th St, Miami, FL 33143, USA",
    "index": 391
  },
  {
    "lng": -80.30319213867188,
    "lat": 25.69304899600838,
    "address": "8303 S Dixie Hwy, Miami, FL 33143, USA",
    "index": 392
  },
  {
    "lng": -80.30113220214844,
    "lat": 25.694557205692536,
    "address": "8211 S Dixie Hwy, Miami, FL 33143, USA",
    "index": 393
  },
  {
    "lng": -80.29325723648071,
    "lat": 25.7013052432736,
    "address": "6138 US-1, South Miami, FL 33143, USA",
    "index": 394
  },
  {
    "lng": -80.30113220214844,
    "lat": 25.696452108731762,
    "address": "7946-7998 SW 67th Ave, South Miami, FL 33143, USA",
    "index": 395
  },
  {
    "lng": -80.29314994812012,
    "lat": 25.696722806704333,
    "address": "6200 SW 80th St, South Miami, FL 33143, USA",
    "index": 396
  },
  {
    "lng": -80.28523206710815,
    "lat": 25.696974168556366,
    "address": "5700-5702 SW 80th St, South Miami, FL 33143, USA",
    "index": 397
  },
  {
    "lng": -80.29319286346436,
    "lat": 25.70078320244014,
    "address": "7533 SW 62nd Ave, South Miami, FL 33143, USA",
    "index": 398
  },
  {
    "lng": -80.32679557800293,
    "lat": 25.717332715975058,
    "address": "8201-8205 SW 56th St, Miami, FL 33155, USA",
    "index": 399
  },
  {
    "lng": -80.31838417053223,
    "lat": 25.717719359335014,
    "address": "7552-7632 SW 56th St, Miami, FL 33143, USA",
    "index": 400
  },
  {
    "lng": -80.31048774719238,
    "lat": 25.71802867311816,
    "address": "5598 SW 72nd Ave, Miami, FL 33155, USA",
    "index": 401
  },
  {
    "lng": -80.30229091644287,
    "lat": 25.718376650162853,
    "address": "6699 SW 56th St, Miami, FL 33155, USA",
    "index": 402
  },
  {
    "lng": -80.29409408569336,
    "lat": 25.71856997030336,
    "address": "5601-5649 SW 62nd Ave, South Miami, FL 33143, USA",
    "index": 403
  },
  {
    "lng": -80.28602600097656,
    "lat": 25.718956609641875,
    "address": "5725 Miller Dr, Miami, FL 33155, USA",
    "index": 404
  },
  {
    "lng": -80.31005859375,
    "lat": 25.710682253500668,
    "address": "7203 Hardee Dr, Miami, FL 33143, USA",
    "index": 405
  },
  {
    "lng": -80.30190467834473,
    "lat": 25.710914252635177,
    "address": "6401-6477 SW 67th Ave, South Miami, FL 33143, USA",
    "index": 406
  },
  {
    "lng": -80.29375076293945,
    "lat": 25.711262250488815,
    "address": "6400 SW 62nd Ave, South Miami, FL 33143, USA",
    "index": 407
  },
  {
    "lng": -80.2857255935669,
    "lat": 25.711648913576983,
    "address": "6400 Red Rd, Coral Gables, FL 33143, USA",
    "index": 408
  },
  {
    "lng": -80.30190467834473,
    "lat": 25.710682253500668,
    "address": "6401-6477 SW 67th Ave, South Miami, FL 33143, USA",
    "index": 409
  },
  {
    "lng": -80.29370784759521,
    "lat": 25.711455582189956,
    "address": "6351-6399 SW 62nd Ave, South Miami, FL 33143, USA",
    "index": 410
  },
  {
    "lng": -80.28546810150146,
    "lat": 25.70735688286962,
    "address": "6601 SW 57th Ave, Miami, FL 33146, USA",
    "index": 411
  },
  {
    "lng": -80.28563976287842,
    "lat": 25.71133958320697,
    "address": "6429 SW 57th Ave, Coral Gables, FL 33146, USA",
    "index": 412
  },
  {
    "lng": -80.28589725494385,
    "lat": 25.718724626189562,
    "address": "5601-5669 SW 57th Ave, Coral Gables, FL 33143, USA",
    "index": 413
  },
  {
    "lng": -80.28619766235352,
    "lat": 25.726495825537075,
    "address": "5700 SW 48th St, Miami, FL 33155, USA",
    "index": 414
  },
  {
    "lng": -80.28649806976318,
    "lat": 25.733995904485244,
    "address": "3901-3999 SW 57th Ave, Miami, FL 33155, USA",
    "index": 415
  },
  {
    "lng": -80.28731346130371,
    "lat": 25.748453484077334,
    "address": "2398 SW 57th Ave, Coral Gables, FL 33134, USA",
    "index": 416
  },
  {
    "lng": -80.28757095336914,
    "lat": 25.75626139165198,
    "address": "1605 SW 57th Ave, Miami, FL 33155, USA",
    "index": 417
  },
  {
    "lng": -80.28787136077881,
    "lat": 25.763566345290133,
    "address": "800-890 SW 57th Ave, West Miami, FL 33144, USA",
    "index": 418
  },
  {
    "lng": -80.28817176818848,
    "lat": 25.770754908455373,
    "address": "5700 FL-968, Miami, FL 33144, USA",
    "index": 419
  },
  {
    "lng": -80.28838634490967,
    "lat": 25.777943036216094,
    "address": "700 NW 57th Ave, Miami, FL 33126, USA",
    "index": 420
  },
  {
    "lng": -80.28855800628662,
    "lat": 25.784048738142317,
    "address": "1260 NW 57th Ave, Miami, FL 33126, USA",
    "index": 421
  },
  {
    "lng": -80.31851291656494,
    "lat": 25.723634846031665,
    "address": "Don Shula Expy, Miami, FL 33155, USA",
    "index": 422
  },
  {
    "lng": -80.31855583190918,
    "lat": 25.732952107407225,
    "address": "Palmetto Expy, Miami, FL 33155, USA",
    "index": 423
  },
  {
    "lng": -80.31997203826904,
    "lat": 25.748105595063908,
    "address": "7644-7678 Coral Way, Miami, FL 33155, USA",
    "index": 424
  },
  {
    "lng": -80.32074451446533,
    "lat": 25.76236820910437,
    "address": "15 SW 8th St, Miami, FL 33144, USA",
    "index": 425
  },
  {
    "lng": -80.3204870223999,
    "lat": 25.76982737638209,
    "address": "7700-7740 W Flagler St, Miami, FL 33144, USA",
    "index": 426
  },
  {
    "lng": -80.32078742980957,
    "lat": 25.78068677659552,
    "address": "Dolphin Expy & FL-826 & FL-836, Florida 33126, USA",
    "index": 427
  },
  {
    "lng": -80.31091690063477,
    "lat": 25.733145403853904,
    "address": "SW 72nd Ave, Miami, FL 33155, USA",
    "index": 428
  },
  {
    "lng": -80.30293464660645,
    "lat": 25.733377359174998,
    "address": "6700 SW 40th St, Miami, FL 33155, USA",
    "index": 429
  },
  {
    "lng": -80.2946949005127,
    "lat": 25.733647973144258,
    "address": "6200 SW 40th St, Miami, FL 33155, USA",
    "index": 430
  },
  {
    "lng": -80.30259132385254,
    "lat": 25.725877241206028,
    "address": "4800 SW 67th Ave, Miami, FL 33155, USA",
    "index": 431
  },
  {
    "lng": -80.29443740844727,
    "lat": 25.726147872246827,
    "address": "4808 SW 62nd Ave, Miami, FL 33155, USA",
    "index": 432
  },
  {
    "lng": -80.29435157775879,
    "lat": 25.726418502671695,
    "address": "4701-4791 SW 62nd Ave, Miami, FL 33155, USA",
    "index": 433
  },
  {
    "lng": -80.31168937683105,
    "lat": 25.748028286255916,
    "address": "7178-7198 Coral Way, Miami, FL 33155, USA",
    "index": 434
  },
  {
    "lng": -80.30357837677002,
    "lat": 25.747989631833025,
    "address": "6700 Coral Way, Miami, FL 33155, USA",
    "index": 435
  },
  {
    "lng": -80.32117366790771,
    "lat": 25.76229090958037,
    "address": "15 SW 8th St, Miami, FL 33144, USA",
    "index": 436
  },
  {
    "lng": -80.30387878417969,
    "lat": 25.763063902555363,
    "address": "801-817 SW 67th Ave, West Miami, FL 33144, USA",
    "index": 437
  },
  {
    "lng": -80.30370712280273,
    "lat": 25.755797569898935,
    "address": "6700-6710 SW 16th St, Miami, FL 33155, USA",
    "index": 438
  },
  {
    "lng": -80.32087326049805,
    "lat": 25.76971143436324,
    "address": "W Flagler St & US-41 & SW 8th St, Miami, FL 33144, USA",
    "index": 439
  },
  {
    "lng": -80.31224727630615,
    "lat": 25.770175201759074,
    "address": "55 NW 72nd Ave, Miami, FL 33126, USA",
    "index": 440
  },
  {
    "lng": -80.30417919158936,
    "lat": 25.77048437901615,
    "address": "6690-6698 W Flagler St, Miami, FL 33144, USA",
    "index": 441
  },
  {
    "lng": -80.31782627105713,
    "lat": 25.782696236332793,
    "address": "NW 72nd Ave, Miami, FL 33126, USA",
    "index": 442
  },
  {
    "lng": -80.32134532928467,
    "lat": 25.796993332253788,
    "address": "7650 NW 25th St, Miami, FL 33122, USA",
    "index": 443
  },
  {
    "lng": -80.31284809112549,
    "lat": 25.79714788603344,
    "address": "2491 Milam Dairy Rd, Miami, FL 33122, USA",
    "index": 444
  },
  {
    "lng": -80.31246185302734,
    "lat": 25.776590464790846,
    "address": "7230-7276 NW 7th St, Miami, FL 33126, USA",
    "index": 445
  },
  {
    "lng": -80.31374931335449,
    "lat": 25.826161786611,
    "address": "7270 NW 58th St, Miami, FL 33166, USA",
    "index": 446
  },
  {
    "lng": -80.31332015991211,
    "lat": 25.809356997771932,
    "address": "53 NW 72nd Ave, Miami, FL 33122, USA",
    "index": 447
  },
  {
    "lng": -80.32143115997314,
    "lat": 25.80924109439777,
    "address": "7800-7806 NW 36th St, Doral, FL 33178, USA",
    "index": 448
  },
  {
    "lng": -80.3276538848877,
    "lat": 25.84068538346521,
    "address": "8028-8060 NW 74th St, Medley, FL 33166, USA",
    "index": 449
  },
  {
    "lng": -80.32211780548096,
    "lat": 25.84072400767596,
    "address": "Palmetto Expy, Medley, FL 33166, USA",
    "index": 450
  },
  {
    "lng": -80.31417846679688,
    "lat": 25.839835647638363,
    "address": "7230 NW 72nd Ave, Miami, FL 33166, USA",
    "index": 451
  },
  {
    "lng": -80.32155990600586,
    "lat": 25.82600727068063,
    "address": "Palmetto Expy, Miami, FL 33166, USA",
    "index": 452
  }
];
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