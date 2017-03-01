from pprint import pprint
from routing import *

if __name__ == '__main__':
    M = np.matrix([[0.0, 3.0, 8.0, 6.0, 0.0, 3.0, 4.0, 3.0],
                   [3.0, 0.0, 2.0, 0.0, 4.0, 4.0, 0.0, 4.0],
                   [8.0, 2.0, 0.0, 2.0, 3.0, 0.0, 3.0, 1.0],
                   [6.0, 0.0, 2.0, 0.0, 1.0, 4.0, 2.0, 0.0],
                   [0.0, 4.0, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0],
                   [3.0, 4.0, 0.0, 4.0, 0.0, 0.0, 0.0, 0.0],
                   [4.0, 0.0, 3.0, 2.0, 0.0, 0.0, 0.0, 0.0],
                   [3.0, 4.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0]])

    # M = np.matrix([[0.0, 1.0, 2.0, 0.0],
    #                [5.0, 0.0, 0.0, 3.0],
    #                [2.0, 0.0, 0.0, 4.0],
    #                [0.0, 1.0, 1.0, 0.0]])


    r = Routing(M)
    hds = GraphUtils.randomized_HDS_gen(
        r._graph#, pi=[1, 6, 5, 7, 4, 3, 2, 0], U=0.7241519277445809
    )
    hdt = GraphUtils.HDS_to_HDT(hds)

    # pprint(hdt.nodes())

    # pprint(hdt.nodes())

    #hdt_v1 = hdt.nodes()[18]
    #hdt_v2 = hdt.nodes()[17]
    num_nodes = len(hdt.nodes())
    for i in range(0, num_nodes):
        for j in range(0, num_nodes):
            hdt_v1 = hdt.nodes()[i]
            hdt_v2 = hdt.nodes()[j]

            if hdt_v1.level != 0 or hdt_v2.level != 0:
                continue

            hdt_sp = nx.dijkstra_path(hdt, hdt_v1, hdt_v2)
            projected_path = GraphUtils.projection(r._graph, hdt_sp)

            if len(projected_path) != len(set(projected_path)):
                print(
                    "Repeated nodes in: {}:{} -> {}:{}"
                    .format(i, hdt_v1, j, hdt_v2)
                )
                print(projected_path)

    #pprint(projected_path)
