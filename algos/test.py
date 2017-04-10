import routing
import random

import networkx as nx


class GridGen:
    @staticmethod
    def generate_grid(m, n):
        G = nx.grid_2d_graph(m, n)
        grid = nx.DiGraph()

        for e1, e2 in G.edges():
            weight = round(random.uniform(1, 2), 2)
            grid.add_edge(e1, e2, weight=weight)
            grid.add_edge(e2, e1, weight=weight)

        return grid


class Test:
    @staticmethod
    def verify_valid_hds(G, hds):
        # Step 1: verify that each cluster in a partition is a subset
        # of some cluster in the next partition of the hds
        for i, partition in enumerate(hds[:-1]):
            next_partition = hds[i+1]

            for cluster in partition:
                is_subset = False
                for cluster_p in next_partition:
                    if cluster <= cluster_p:
                        is_subset = True

                assert(is_subset)

        # Step 2: verify that each node in each cluster has simple path length
        # between each other node in the cluster less than or equal to 2^i
        # where i is the level
        for i, partition in enumerate(hds):
            for cluster in partition:
                for node in cluster:
                    nbhd = G.r_neighborhood(node, 2**i)

                    # Every node in the cluster should be reachable from this
                    # node
                    assert(cluster <= nbhd)

    @staticmethod
    def verify_bidirectional_edges(G):
        """Check that for every nodes outgoing edge there is an incoming
        edge from the same node."""
        for v1, v2 in G.edges():
            if (v2, v1) not in G.edges():
                print((v2, v1), "not in edge list")
            # assert((v2, v1) in G.edges())


def main():
    grid = GridGen.generate_grid(2, 2)
    # mat = nx.to_numpy_matrix(grid)
    mat = routing.GraphUtils.create_in_out_mat(nx.to_numpy_matrix(grid))
    G = routing.GraphDiam2h(mat)

    hds = routing.GraphUtils.randomized_HDS_gen(G)
    Test.verify_valid_hds(G, hds)


if __name__ == '__main__':
    main()
