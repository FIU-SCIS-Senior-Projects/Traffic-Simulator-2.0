(function () {
    'use strict';

    angular
        .module("app")
        .controller("MainCtrl", MainCtrl);

    MainCtrl.$inject = ["$scope", "NgMap"];
    function MainCtrl($scope, NgMap) {
        var vm = this;

        vm.onInit = function () {
            vm.isDijsktra = true;
            vm.isOblivious = false;
            vm.trips = [];

            NgMap.getMap("googleMap").then(map => {
                    vm.googleMap = map;
                })
            NgMap.getMap("obliviousMap").then(map => {
                    vm.obliviousMap = map;
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

        function printTrips() {
            var text = "";

            vm.trips.forEach(element =>{
               text = text.concat(`${element["sourceAddress"]}; ${element["destAddress"]}; ${element["startingTime"]}\r\n`);
            });

            $("#userInput").val(text);
        }
    }

})();