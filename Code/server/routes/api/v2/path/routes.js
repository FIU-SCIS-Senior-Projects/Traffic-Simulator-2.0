const express = require('express');
const router = express.Router();

const pathAPI = require('./index');
const vertices = require('../../../../data/vertices.js');

router.post('/dijkstra', (req, res) => {
  let sources = req.body.source;
  let destinations = req.body.destination;
  if (!(sources instanceof Array)) {
    console.log('updating source');
    sources = [sources];
  } 

  if (!(destinations instanceof Array)) {
    console.log('updating dest');
    destinations = [destinations];
  }

  if (sources.length !== destinations.length) {
    return res.status(400).send({ msg: 'Invalide Source or Destination' });
  }
  console.log('sources', sources);
  console.log('dest', destinations);
  let promises = sources.map((source, i) => {
    return pathAPI.dijkstra(req.session, source, destinations[i], i);
  });

  Promise.all(promises)
    .then((paths) => {
      paths = paths.map((data) => {
        let pathData = data.path.map((point) => {
          return { 
            lng: vertices.features[point].geometry.coordinates[0], 
            lat: vertices.features[point].geometry.coordinates[1]
          };
        });

        return { path: pathData, index: data.index };
      });
      return res.json({ paths: paths });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send(err);
    })
});

router.post('/oblivious', (req, res) => {

});

module.exports = router;
