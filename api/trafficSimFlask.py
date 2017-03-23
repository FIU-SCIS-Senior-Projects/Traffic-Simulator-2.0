from flask import Flask, request, jsonify, abort
from flask_limiter import Limiter
import routing
import json

app = Flask(__name__)
limiter = Limiter(app)
router = routing.Routing()

def __get_request_key():
    return request.headers['api_key']

@app.route('/initialize_graph', methods=['GET', 'POST'])
@limiter.limit(__get_request_key)
@limiter.limit("1 per minute")
def initialize_graph():
    api_identity = request.headers['api_id']
    api_key = request.headers['api_key']


    if(__isAuthorized(api_identity, api_key) is False):
        abort(401)

    if request.method == 'GET':
        return """This is a POST endpoint that takes in JSON of the format: {"map":[[<float>]]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""

    json_data = request.get_json(force=True)

    router.set_graph(json_data['map'])

    return "The graph was initialized."

@app.route('/init_graph_unity', methods=['GET', 'POST'])
@limiter.limit(__get_request_key)
@limiter.limit("1 per minute")
def init_graph_unity():
    api_identity = request.headers['api_id']
    api_key = request.headers['api_key']

    if(__isAuthorized(api_identity, api_key) is False):
        return ('Api identity or Api key could not be verified.', 401, {})

    if request.method == 'GET':
        return """This is a POST endpoint that takes in JSON of the format: {"map":[{"row":[<float>]}]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""

    json_data = request.get_json(force=True)

    adj_mat = []
    for row in json_data['map']:
        adj_row = []
        for val in row['row']:
            adj_row.append(val)
        adj_mat.append(adj_row)

    router.set_graph(adj_mat)
    success = router._graph is not None
    return "The graph was initialized: {success}.".format(**locals())

@app.route('/get_path', methods=['GET', 'POST'])
def get_path():
    if request.method == 'GET':
        return """This is a POST endpoint that takes in JSON of the format: { "algorithm":<int> \n "source:<int>" \n "target:<int>"} representing which routing algorithm to use via an enumeration, the starting or source node, and the ending or target node."""

    json_data = request.get_json(force=True)

    algo = json_data['algorithm']
    source = json_data['source']
    target = json_data['target']
    path = router.get_path(algo, source, target)
    return jsonify(map=path)

def __isAuthorized(api_id, api_key):

    with open('user_data.json') as data_file:
        user_data = json.load(data_file)

    is_valid = False
    for user in user_data['api_users']:
        if(api_id == user['api_id'] and api_key == user['api_key']):
            is_valid = True
    return is_valid



if __name__ == '__main__':
    app.run(debug=True)
