import hug
import routing
import json

router = routing.Routing()

@hug.post('/initialize_graph')
def initialize_graph(body):
    """This endpoint takes in JSON of the format: {"map":[[<float>]]} representing a 2d array of floating point numbers which represent the adjacency matrix of weights between street nodes."""
    #encoded_string = json.dumps(body)
    #data = json.loads(encoded_string)
    router.set_graph(body['map'])
    success = router._is_init
    return "The graph was initialized: {success}.".format(**locals())

@hug.post('/get_path')
def get_path(body):
    """This endpoint takes in JSON of the format: { "algorithm":<int> \n "source:<int>" \n "target:<int>"} representing which routing algorithm to use via an enumeration, the starting or source node, and the ending or target node."""
    algo = body['algorithm']
    source = body['source']
    target = body['target']
    path = router.get_path(algo, source, target)
    return json.loads(str(path))
