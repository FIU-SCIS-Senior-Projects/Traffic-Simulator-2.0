let googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCCQu2lSuWf7Did9x789vfqz1C0plsWcys'
});

console.log(googleMapsClient);

// function initMap() {
//   var myLatLng = {lat: -25.363, lng: 131.044};

//   var map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 4,
//     center: myLatLng
//   });

//   var marker = new google.maps.Marker({
//     position: myLatLng,
//     map: map,
//     title: 'Hello World!'
//   });
// }
