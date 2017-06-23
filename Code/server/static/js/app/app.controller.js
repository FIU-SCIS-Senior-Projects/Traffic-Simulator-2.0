(function () {
    'use strict';

    angular
        .module("app")
        .controller("MainCtrl", MainCtrl);

    MainCtrl.$inject = ["$scope", "NgMap"];
    function MainCtrl($scope, NgMap) {
        var vm = this;
        const vertices = {
            72: {
              117: { lat: 25.700705862862723, lng: -80.38221001625061 }, // 72 and 117
              107: { lat: 25.701092560247425, lng: -80.36617040634155 }, // 72 and 107
              102: { lat: 25.70133424547502, lng: -80.35815596580505 }, // 72 and 102
              97: { lat: 25.701638768163157, lng: -80.35014152526855 }, // 72 and 97
              92: { lat: 25.70198679313858, lng: -80.34214317798615 }, // 72 and 92
              87: { lat: 25.702325149778112, lng: -80.33416628837585 }, // 72 and 87
            },
            56: {
              117: { lat: 25.714858168713896, lng: -80.38261234760284 }, // 56 and 117
              112: { lat: 25.715157823660345, lng: -80.37494659423828 }, // 56 and 112
              107: { lat: 25.71542847909229, lng: -80.36690533161163 }, // 56 and 107
              102: { lat: 25.71578612996864, lng: -80.3589016199112 }, // 56 and 102
              97: { lat: 25.716129280474455, lng: -80.35089254379272 }, // 56  and 97
              92: { lat: 25.71634193662917, lng: -80.3429263830185 }, // 56 and 92
              87: { lat: 25.71672375013484, lng: -80.3349494934082 }, // 56 and 87
            },
            48: {
              117: { lat: 25.72289059346016, lng: -80.38289666175842 }, // 48 and 117
              112: { lat: 25.723025912455956, lng: -80.37532210350037 }, // 47 and 112
              107: { lat: 25.722702113173753, lng: -80.36729156970978 }, // 48 and 107
              102: { lat: 25.723054909363604, lng: -80.35928249359131 }, // 48 and 102
              97: { lat: 25.723349710856606, lng: -80.35127341747284 }, // 48 and 97
              92: { lat: 25.724557906062127, lng: -80.34434258937836 }, // 48 and 92
              87: { lat: 25.724050465570826, lng: -80.3353089094162 }, // 48 and 87
            },
            40: {
              117: { lat: 25.732043609897783, lng: -80.38329362869263 }, // 40 and 117
              112: { lat: 25.732193415816226, lng: -80.37572979927063 }, // 40 and 112
              107: { lat: 25.73231905934415, lng: -80.36778509616852 }, // 40 and 107
              102: { lat: 25.73249302708671, lng: -80.35975992679596 }, // 40 and 102
              97: { lat: 25.73269598913126, lng: -80.3517347574234 }, // 40 and 97
              92: { lat: 25.732927945329294, lng: -80.34373104572296 }, // 40 and 92
              87: { lat: 25.733087414952895, lng: -80.33583998680115 }, // 40 and 87
            },
            24: {
              117: { lat: 25.746356470975563, lng: -80.38389444351196 }, // 24 and 117
              112: { lat: 25.74653041817067, lng: -80.37596583366394 }, // 26 and 112
              107: { lat: 25.74670919696691, lng: -80.36771535873413 }, // 24 and 107
              102: { lat: 25.746974948734394, lng: -80.35969018936157 }, // 26 and  102
              97: { lat: 25.747216540734435, lng: -80.35166501998901 }, // 26 and 97
              92: { lat: 25.747429141288062, lng: -80.3436827659607 }, // 26 and 92
              87: { lat: 25.747656236913734, lng: -80.3356683254242 }, // 24 and 87
            },
            8: {
              107: { lat: 25.761295673713622, lng: -80.36842346191406 }, // 8 and 107
              102: { lat: 25.761479261539883, lng: -80.36040902137756 }, // 8 and 102
              97: { lat: 25.76162903034578, lng: -80.352383852005 }, // 8 and 97
              92: { lat: 25.761788461447694, lng: -80.34416019916534 }, // 8 and 92
              87: { lat: 25.761933398627274, lng: -80.33619403839111 }, // 8 and 87
            }
          };
        vm.onInit = function () {
            vm.isDijsktra = true;
            vm.isOblivious = false;
            vm.trips = [];

            NgMap.getMap("googleMap").then(map => {
                    vm.googleMap = map;
                })
                .catch((err) => {
                    console.log('google map error', err);
                });
            NgMap.getMap("obliviousMap").then(map => {
                    vm.obliviousMap = map;

                })
                .catch((err) => {
                    console.log('oblivious map error', err);
                });
        }

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
        }

        vm.addTrip = function () {
            
            var trip = {
                sourceAddress: vm.sourceAddress ? vm.sourceAddress : "current",
                destAddress: vm.destAddress ? vm.destAddress : "current",
                startingTime: vm.startingTime ? new Date(vm.startingTime).toLocaleTimeString() : new Date().toLocaleTimeString() 
            }
            
            vm.trips.push(trip);

            printTrips();

        }

        vm.placeChanged = function () {
            var place = this.getPlace();
            vm.googleMap.setCenter(place.geometry.location);
        }

        vm.reset = function () {
            vm.trips = [];
            $("#userInput").val('');
        }

        vm.startPathDemo = function () {
            let sets = [
                    {
                        start: vertices[72][117],
                        path: [
                            vertices[56][117], 
                            vertices[48][117], 
                            vertices[40][117], 
                            vertices[40][107], 
                            vertices[24][107], 
                            vertices[24][102], 
                            vertices[24][97], 
                            vertices[8][97], 
                            vertices[8][92], 
                            vertices[8][87]
                        ]
                    },
                    {
                        start: vertices[72][117],
                        path: [
                            vertices[72][107], 
                            vertices[72][102], 
                            vertices[72][97], 
                            vertices[56][97], 
                            vertices[48][97], 
                            vertices[40][97], 
                            vertices[40][92], 
                            vertices[24][92], 
                            vertices[24][87], 
                            vertices[8][87]
                        ]
                    },
                    {
                        start: vertices[72][117],
                        path: [
                            vertices[72][107], 
                            vertices[72][102], 
                            vertices[72][97], 
                            vertices[72][92], 
                            vertices[72][87], 
                            vertices[56][87], 
                            vertices[48][87], 
                            vertices[40][87], 
                            vertices[24][87], 
                            vertices[8][87]
                        ]
                    },
                    {
                        start: vertices[72][117],
                        path: [
                            vertices[72][107], 
                            vertices[56][107], 
                            vertices[56][102], 
                            vertices[48][102], 
                            vertices[48][97], 
                            vertices[48][92], 
                            vertices[40][92], 
                            vertices[24][92], 
                            vertices[24][87], 
                            vertices[8][87]
                        ]
                    },
                    {
                        start: vertices[72][117],
                        path: [
                            vertices[56][117], 
                            vertices[40][117], 
                            vertices[40][102], 
                            vertices[24][102], 
                            vertices[24][97], 
                            vertices[24][92], 
                            vertices[8][92], 
                            vertices[8][87]
                        ]
                    },
                ];

              let duration = 1000;
              let numCars = 20;
              
                for (var i = 0; i < numCars; i++) {
                    let set = Math.floor(Math.random() * sets.length);
                    let car = new Car(vm.obliviousMap, sets[set].start, sets[set].path);
                    setTimeout(car.start.bind(car), 2000 * (i + 1), duration);
                }
        }

        function printTrips() {
            var text = "";

            vm.trips.forEach(element =>{
               text = text.concat(`${element["sourceAddress"]}; ${element["destAddress"]}; ${element["startingTime"]}\r\n`);
            });

            $("#userInput").val(text);
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
    }

})();