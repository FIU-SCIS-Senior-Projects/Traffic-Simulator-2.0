from flask import Flask, request, jsonify
import routing
import json
import traceback

app = Flask(__name__)
router = routing.Routing()


log_file = 'log_file.txt'
def log_messages(messages):
    with open(log_file, 'w') as lfile:
        for m in messages:
            lfile.write(m)
            lfile.write('\n')

        lfile.write('==========================================\n')


@app.route('/initialize_graph', methods=['GET', 'POST'])
def initialize_graph():
    if request.method == 'GET':
        return """This endpoint takes in JSON of the format: {"map":[[<float>]]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""

    json_data = request.get_json(force=True)

    success = True
    try:
        router.set_graph(json_data['map'])
    except Exception as e:
        success = False
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])

    router.set_graph(json_data['map'])
    return "The graph was initialized: {}.".format(success)

@app.route('/init_graph_unity', methods=['GET', 'POST'])
def init_graph_unity():
    if request.method == 'GET':
        return """This endpoint takes in JSON of the format: {"map":[{"row":[<float>]}]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""

    json_data = request.get_json(force=True)

    adj_mat = []
    for row in json_data['map']:
        adj_row = []
        for val in row['row']:
            adj_row.append(val)
        adj_mat.append(adj_row)

    success = True
    try:
        router.set_graph(adj_mat)
    except Exception as e:
        success = False
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])

    router.set_graph(adj_mat)
    return "The graph was initialized: {}.".format(success)

@app.route('/get_path', methods=['GET', 'POST'])
def get_path():
    if request.method == 'GET':
        return """This endpoint takes in JSON of the format: { "algorithm":<int> \n "source:<int>" \n "target:<int>"} representing which routing algorithm to use via an enumeration, the starting or source node, and the ending or target node."""

    json_data = request.get_json(force=True)

    algo = json_data['algorithm']
    source = json_data['source']
    target = json_data['target']

    path = []
    try:
        path = router.get_path(algo, source, target)
    except Exception as e:
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])

    return jsonify(map=path)


if __name__ == '__main__':
    app.run(debug=True)
