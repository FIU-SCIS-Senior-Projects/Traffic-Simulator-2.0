import request from 'superagent';

let domain = 'http://localhost:8080/';
let apiUrl = 'api/v2/';

function testGraphImport (graph) {
  const endpoint = 'graph/import';

  return new Promise((resolve, reject) => {
    console.log(`[POST]: ${apiUrl}${endpoint} - Request`);
    console.log(graph);
    request.post(`${domain}${apiUrl}${endpoint}`)
      .send(graph)
      .end((err, asyncRes) => {
        if (err) {
          return reject(err);
        }
        const result = JSON.parse(asyncRes.text);
        console.log(`[POST]: ${apiUrl}${endpoint} - Response`);
        console.log(result);
        console.log(`[POST]: ${apiUrl}${endpoint} - End Response`);
        return resolve(result.graph);
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
  testGraphInit()
    .then((graph) => {
      testGraphImport(graph);
    })
    .catch((err) => {
      console.log(err);
    });
}

init();
