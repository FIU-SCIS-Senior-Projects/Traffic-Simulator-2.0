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
            vm.positions = [];

            NgMap.getMap("googleMap").then(map => { vm.googleMap = map;});
            NgMap.getMap("obliviousMap").then(map => { vm.obliviousMap = map; });
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
                startingTime: vm.startingTime ? new Date(vm.startingTime).toLocaleTimeString() : new Date().toLocaleTimeString() 
            };
            
            vm.trips.push(trip);

            clearValues();
            printTrips();
        };

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
               vm.userInput1 = vm.userInput1.concat(`${element["origin"]}\r\n${element["destination"]}\r\n${element["startingTime"]}\r\n`);
            });

            // vm.userInput1 = angular.copy(text);
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
                title: place.formatted_address.includes(place.name) ? place.formatted_address : `${place["name"]}\r\n${place["formatted_address"]}`   
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
                        startingTime: lines[index] ? lines[index++].trim() : new Date().toLocaleTimeString()
                    };

                    vm.trips.push(trip);
                }
                clearValues();
                printTrips();
            }
        };

        vm.addLinesToInput2 = function(){
            vm.reset();
            vm.userInput2 = `current-location
            Dolphin Mall, Miami-Dade County, FL, United States
            2:00:57 AM
            Miami International Airport, Miami, FL, United States
            Best Buy, Northwest 17th Street, Miami, FL, United States
            12:15:00 PM
            current-location
            Dolphin Mall, Miami-Dade County, FL, United States
            2:00:57 AM
            Miami International Airport, Miami, FL, United States
            Best Buy, Northwest 17th Street, Miami, FL, United States
            12:15:00 PM
            FIU, Miami, FL, United States
            Real Cafe, Southwest 8th Street, Miami, FL, United States
            2:03:36 AM
            `;
        };

    }
})();