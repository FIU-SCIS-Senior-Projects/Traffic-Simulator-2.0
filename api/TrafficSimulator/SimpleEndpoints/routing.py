import numpy as np
import networkx as nx

from math import ceil, log2
from typing import List, Set


class GraphNotSet(Exception):
    pass


class UnknownAlgorithm(Exception):
    pass


class VertexNonExistent(Exception):
    pass


class Routing(object):
    def __init__(self, M: List[List[float]] = None) -> None:
        self.set_graph(M)

    def _graph_diameter(self, G):
        # @TODO: choose the better algorithm depending on the density of
        # the graph
        return nx.floyd_warshall_numpy(G).max()

    def set_graph(self, M: List[List[float]]) -> None:
        if M is None:
            self._mat = None
            self._graph = None
            self._is_init = False
            return

        adj_mat = np.matrix(M)

        # ======== Turn graph into graph with diameter 2^h for some h =========

        # Convert all edges with weight 0 to infinity. 0 weight edge delimits
        # that there does not exist an edge between the two vertices in the
        # adjacency matrix.
        adj_mat[adj_mat == 0.0] = np.inf
        G_min_edge = adj_mat.min()

        epsilon = np.float(0.01)
        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(lambda x: ((1+epsilon) / G_min_edge) * x)
        adj_mat = vec_func(adj_mat)

        G_p = nx.MultiDiGraph(adj_mat)
        G_p_diam = self._graph_diameter(G_p)

        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(
            lambda x: ((2 ** ceil(log2(G_p_diam))) / G_p_diam) * x
        )
        adj_mat = vec_func(adj_mat)
        # =====================================================================

        self._mat = adj_mat
        self._graph = nx.MultiDiGraph(adj_mat)
        self._diam = self._graph_diameter(self._graph)
        self._is_init = True

    def r_neighborhood(self, v, r: int) -> Set[int]:
        if self._graph is None:
            raise GraphNotSet

        try:
            nbhd = nx.single_source_dijkstra_path_length(
                self._graph, v, cutoff=r
            )
        except KeyError:
            self._is_init = False
            raise VertexNonExistent

        return set(nbhd.keys())

    def get_path(self, algo, s, t: int) -> List[int]:
        if self._graph is None:
            self._is_init = False
            raise GraphNotSet

        path = []  # type: List[int]
        if algo == 0:
            try:
                path = nx.dijkstra_path(self._graph, s, t)
            except KeyError:  # One of the vertices is not in graph
                raise VertexNonExistent

        else:
            raise UnknownAlgorithm

        return path
