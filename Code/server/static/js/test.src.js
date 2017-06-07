import request from 'superagent';
import Domo from 'dom-object';

var results = new Domo(document.getElementById('results'));

function testPathPost () {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/path')
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log(res);
    results.append('p { POST /path success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /path failure }');
  });
}

function testGraphPost (data) {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph')
      .send(data)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);

          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log('POST /graph', res);
    // console.log(res.data.all_pairs_sp);
    // var j = res.data.all_pairs_sp.replace(/{0:/g, "{a:");
    // console.log(j);
    // console.log(JSON.parse(j));

    // testImportJSON({
    //   adjMatrix: res.data.adjMatrix,
    //   all_pairs_sp: res.data.all_pairs_sp,
    //   all_sp_len: res.data.all_sp_len,
    //   all_sp_len_transpose: res.data.all_sp_len_transpose,
    //   diam: res.data.diam,
    //   num_nodes: res.data.num_nodes
    // });
    results.append('p { POST /graph success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /graph failure }');
  });
}

function testGeoJSON () {
  console.log('testing geo json');
  let test = new Promise((resolve, reject) => {
    request.get('http://localhost:8080/graph/geo')
      .end((err, res) => {
        if (err) {
          console.log('rejecting');
          reject(err);
        } else {
          console.log('resolving');
          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    results.append('p { POST /graph/geo success }');

    console.log(res);

    request.post('http://localhost:8080/graph/geo')
      .send({ geojson: res })
      .end((err, asyncRes) => {
        // console.log(asyncRes);
        let data = JSON.parse(asyncRes.text);
        let reduced = data.adjMatrix.reduce((acc, v) => {
          return acc + v.reduce((acc, e) => {
            return acc + e;
          }, 0)
        }, 0)
        console.log(reduced);
        data.setup = true;
        data.source = 15;
        data.destination = 110;
        console.log(data);
        // testGraphPost(data);
        testDijkstra(data);
      });

  }).catch((err) => {
    console.log('err', err);
    results.append('p { POST /graph/geo failure }');
  });

}

function testImportJSON (graph) {
  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph')
      .send({
        setup: false,
        adjMatrix: graph.adjMatrix,
        all_pairs_sp: graph.all_pairs_sp,
        all_sp_len: graph.all_sp_len,
        all_sp_len_transpose: graph.all_sp_len_transpose,
        diam: graph.diam,
        num_nodes: graph.num_nodes
      })
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);

          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log('POST /graph/import', res);
    results.append('p { POST /graph/import success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /graph/import failure }');
  });
  
}

function testDijkstra (data) {

  let test = new Promise((resolve, reject) => {
    request.post('http://localhost:8080/graph/dijkstra')
      .send(data)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);

          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log('POST /graph/dijkstra', res);
    results.append('p { POST /graph/dijkstra success }');
  }).catch((err) => {
    console.log(err);
    results.append('p { POST /graph/dijkstra failure }');
  });
}

function init () {
  testPathPost();
  testGeoJSON();
  // testDijkstra();
}

init();