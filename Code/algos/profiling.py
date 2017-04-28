import routing
import test
import json

import networkx as nx


test_graph_mat = nx.to_numpy_matrix(test.GridGen.generate_grid(16, 16))

def main():
    with open('m.json', 'r') as _file:
        j = json.load(_file)
    r = routing.Routing(j['map'])
    # r = routing.Routing(test_graph_mat)
    # G = routing.GraphDiam2h(test_graph_mat)
    # scheme = routing.GraphUtils.top_down_integral_scheme_generation(G)


if __name__ == '__main__':
    import cProfile
    cProfile.run('main()', sort='tottime')
