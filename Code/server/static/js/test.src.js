import request from 'superagent';

let domain = 'http://localhost:8080/';
let apiUrl = 'api/v2/';

function testGeoJsonFormat () {
  const endpoint = 'geo';

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
        });
    })
    .catch((err) => {
      console.log('Error in testGeoJsonFormat', err);
    });
}

// Temp endpoint to get geojson data for testing.
function getGeoJson () {
  const endpoint = 'geo';

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
  testGeoJsonFormat();
}

init();
