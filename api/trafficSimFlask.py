from flask import Flask, request, jsonify, abort, make_response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS, cross_origin
import routing
import json
import traceback

app = Flask(__name__)
CORS(app)
limiter = Limiter(app, key_func = get_remote_address)
router = routing.Routing()


log_file = 'log_file.txt'
def log_messages(messages):
    with open(log_file, 'w') as lfile:
        for m in messages:
            lfile.write(m)
            lfile.write('\n')

        lfile.write('==========================================\n')


def __get_request_key():
    if __check_preflight() is True:
        return get_remote_address()

    try:
        return request.headers['api_key']
    except Exception as e:
        abort(__response("api_key header not found. Please provide this header to access api.", 400))

@app.route('/initialize_graph', methods=['POST'])
@limiter.limit(__get_request_key)
@limiter.limit("1000000000000000 per second")
def initialize_graph():
    # if __check_preflight() is True:
    #     return __response("Preflight request. Not processed.", 200)

    try:
        api_identity = request.headers['api_id']
        api_key = request.headers['api_key']
    except Exception as e:
        return __response("api_id header and/or api_key header not found. Please provide these headers to access this endpoint.", 401)

    if(__isAuthorized(api_identity, api_key) is False):
        return __response("api_id and/or api_key were found to be invalid. Access has been denied.", 401)

    json_data = request.get_json(force=True)
    success = True

    try:
        router.set_graph(json_data['map'], algos=json_data.get('algos', None))
    except Exception as e:
        success = False
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])
        return __response("Error occurred while initializing the graph.", 500)

    return jsonify(success=str(success))


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

    success = True
    try:
        router.set_graph(adj_mat, algos=json_data.get('algos', None))
    except Exception as e:
        success = False
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])

    return "The graph was initialized: {}.".format(success)


@app.route('/get_path', methods=['GET', 'POST'])
def get_path():
    if request.method == 'GET':
        return """This is a POST endpoint that takes in JSON of the format: { "algorithm":<int> \n "source:<int>" \n "target:<int>"} representing which routing algorithm to use via an enumeration, the starting or source node, and the ending or target node."""

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

def __isAuthorized(api_id, api_key):

    with open('user_data.json') as data_file:
        user_data = json.load(data_file)

    is_valid = False
    for user in user_data['api_users']:
        if(api_id == user['api_id'] and api_key == user['api_key']):
            is_valid = True
    return is_valid

def __response(body, status_code):
    return make_response(body, status_code, {"Access-Control-Allow-Origin": "*"})

def __check_preflight():
    try:
        if request.headers['Access-Control-Request-Headers'] is not None:
            return True
    except Exception as e:
        return False


if __name__ == '__main__':
    app.run(debug=True)
