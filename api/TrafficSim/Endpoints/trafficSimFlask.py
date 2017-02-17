from flask import Flask, request, jsonify
import routing
import json

app = Flask(__name__)
router = routing.Routing()

@app.route('/initialize_graph', methods=['GET', 'POST'])
def initialize_graph():
    if request.method == 'GET':
        return """This endpoint takes in JSON of the format: {"map":[[<float>]]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""

    json_data = request.get_json(force=True)

    router.set_graph(json_data['map'])
    success = router._is_init
    return "The graph was initialized: {success}.".format(**locals())


@app.route('/get_path', methods=['GET', 'POST'])
def get_path():
    if request.method == 'GET':
        return """This endpoint takes in JSON of the format: { "algorithm":<int> \n "source:<int>" \n "target:<int>"} representing which routing algorithm to use via an enumeration, the starting or source node, and the ending or target node."""

    json_data = request.get_json(force=True)

    algo = json_data['algorithm']
    source = json_data['source']
    target = json_data['target']
    path = router.get_path(algo, source, target)
    return jsonify(map=str(path))


if __name__ == '__main__':
    app.run(debug=True)
