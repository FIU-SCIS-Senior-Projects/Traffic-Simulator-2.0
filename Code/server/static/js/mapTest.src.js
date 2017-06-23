let googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCCQu2lSuWf7Did9x789vfqz1C0plsWcys'
});

let initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}