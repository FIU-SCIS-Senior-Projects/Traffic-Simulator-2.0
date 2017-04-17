from flask import Flask, request, jsonify, abort, make_response
from flask_cors import CORS, cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sys
import os
sys.path.append(os.path.abspath('../algos'))
import routing
import json
import traceback

#Instantiate Flask app
app = Flask(__name__)
#Setting up app to use CORS
CORS(app)
#Setting up App to use Limiter for limiting usage. Key Function maps IP address if none is provided
limiter = Limiter(app, key_func = get_remote_address)

#Creating Routing object.
router = routing.Routing()

#Logging method
log_file = 'log_file.txt'
def log_messages(messages):
    with open(log_file, 'w') as lfile:
        for m in messages:
            lfile.write(m)
            lfile.write('\n')

        lfile.write('==========================================\n')

#Function that maps the API callers key to the database to check usage and Limit based on customer type.
def __get_request_key():
    if __check_preflight() is True:
        return get_remote_address()

    try:
        return request.headers['api_key']
    except Exception as e:
        abort(__response("api_key header not found. Please provide this header to access api.", 400))

#Endpoint to initiate graph, taking in raw JSON of "map":[[<float>]] and "algos":<int>
@app.route('/initialize_graph', methods=['POST'])
@limiter.limit(__get_request_key)
@limiter.limit("20 per minute")
def initialize_graph():
    # if __check_preflight() is True:
    #     return __response("Preflight request. Not processed.", 200)

    __authorize()

    json_data = request.get_json(force=True)
    success = True

    try:
        router.set_graph(json_data['map'], algos=json_data.get('algos', None))
    except Exception as e:
        success = False
        tb = traceback.format_exc()
        print(tb)
        log_messages([tb, json.dumps(json_data)])
        return __response(jsonify(reason_500="Error occurred while initializing the graph."), 500)

    return jsonify()

#Functionally the same as initiate_graph endpoint, but fewer limitations and no authorization check.
@app.route('/initialize_graph_dev', methods=['POST'])
# @limiter.limit("1000 per second")
def initialize_graph_dev():
    # if __check_preflight() is True:
    #     return __response("Preflight request. Not processed.", 200)

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

    return jsonify()

#Initialize graph endpoint for Unity engine formatted json of form
#"map":["Row":<float>], "algos":<int>
@app.route('/init_graph_unity', methods=['POST'])
# @limiter.limit(__get_request_key)
@limiter.limit("1000 per second")
def init_graph_unity():
    __authorize()

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

#Endpoint to get a path taking in JSON in the form of:
#"algorithm:<int>, "source":<int>, "target":<int>
@app.route('/get_path', methods=['POST'])
@limiter.limit(__get_request_key)
# @limiter.limit("100 per second")
def get_path():
    __authorize()

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

#Same as get path, but no authorization headers required and nearly unreachable limit.
@app.route('/get_path_dev', methods=['POST'])
# @limiter.limit("100000 per second")
def get_path_dev():

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

#Function to authorize a user requiring 2 http request headers:
#'api_id' and 'api_key' which are UUIDs that were generaed by Python's UUID4() function.
def __authorize():
    try:
        api_identity = request.headers['api_id']
        api_key = request.headers['api_key']

        if(__isAuthorized(api_identity, api_key) is False):
            return __response(jsonify(reason_401="api_id and/or api_key were found to be invalid. Access has been denied."), 401)

    except KeyError as e:
        return __response(jsonify(reason_401="api_id header and/or api_key header not found. Please provide these headers to access this endpoint."), 401)

#Checks to see if the passed in headers are found in the database.
def __isAuthorized(api_id, api_key):

    with open('user_data.json') as data_file:
        user_data = json.load(data_file)

    is_valid = False
    for user in user_data['api_users']:
        if(api_id == user['api_id'] and api_key == user['api_key']):
            is_valid = True
    return is_valid

#Function to make an html response with a given body and status code. Will include extra header to allow CORS to function for javascript web app.
def __response(body, status_code):
    return make_response(body, status_code, {"Access-Control-Allow-Origin": "*"})

#Function to determine if the current call is part of a CORS preflight request. This request should be ignored.
def __check_preflight():
    try:
        if request.headers['Access-Control-Request-Headers'] is not None:
            return True
    except Exception as e:
        return False

#Start Script.
if __name__ == '__main__':
    app.run()
