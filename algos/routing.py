import numpy as np
import networkx as nx

from math import ceil, log2
from typing import List, Set, FrozenSet


class NonSquareMatrix(Exception):
    pass


class GraphNotSet(Exception):
    pass


class UnknownAlgorithm(Exception):
    pass


class VertexNonExistent(Exception):
    pass


class Vertex(object):
    __slots__ = ['rep', 'cluster', 'flag']

    def __init__(self, rep, cluster, flag):
        self.rep = rep
        self.cluster = cluster
        self.flag = flag


class Routing(object):
    def __init__(self, M: List[List[float]] = None) -> None:
        self.set_graph(M)

    def _graph_diameter(self, G):
        # @TODO: choose the better algorithm depending on the density of
        # the graph
        return nx.floyd_warshall_numpy(G).max()

    def _convert_power_of_2_diameter(self, np_mat):
        """Convert any adjacency matrix which denotes some graph G = (V, E, w)
        into an adjacency matrix which denotes some graph G' = (V, E, w_c) with
        diameter equal to some power of 2.

        NOTE:
            The given adjacency matrix MUST denote a STRONGLY connected graph.

        """
        # Negative weights delimit a non-existent edge between two nodes, which
        # is equivalent to edge weight of infinity.
        np_mat[np_mat <= 0.0] = np.inf  # @TODO: Should weight 0.0 be allowed?
        G_min_edge = np_mat.min()

        epsilon = np.float(0.01)
        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(lambda x: ((1+epsilon) / G_min_edge) * x)
        np_mat = vec_func(np_mat)

        G_p = nx.MultiDiGraph(np_mat)
        G_p_diam = self._graph_diameter(G_p)

        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(
            lambda x: ((2 ** ceil(log2(G_p_diam))) / G_p_diam) * x
        )
        np_mat = vec_func(np_mat)

        return np_mat

    def set_graph(self, M: List[List[float]]) -> None:
        if M is None:
            self._mat = None
            self._n_vertices = None
            self._graph = None
            self._diam = None
            return

        adj_mat = np.matrix(M)

        if adj_mat.shape[0] != adj_mat.shape[1]:
            raise NonSquareMatrix

        self._mat = self._convert_power_of_2_diameter(adj_mat)
        self._n_vertices = self._mat.shape[0]
        self._graph = nx.MultiDiGraph(self._mat)
        self._diam = self._graph_diameter(self._graph)

    def r_neighborhood(self, v, r: float) -> Set[int]:
        if self._graph is None:
            raise GraphNotSet

        try:
            nbhd = nx.single_source_dijkstra_path_length(
                self._graph, v, cutoff=r
            )
        except KeyError:
            raise VertexNonExistent

        return set(nbhd.keys())

    def _randomized_HDS_gen(self, pi=None, U=None) -> List[Set[FrozenSet[int]]]:
        V = frozenset(np.arange(self._n_vertices))

        if not pi:
            # @TODO: check that this is a uniform permutation
            pi = np.random.permutation(self._n_vertices)
        # print("Random permutation: {}".format(pi))

        if not U:
            U = np.random.uniform(.5, 1)
        # print("Random num: {}".format(U))

        h = int(log2(self._diam))
        H = [None] * (h + 1)  # type: List[Set[FrozenSet[int]]]

        H[h] = set()
        H[h].add(V)

        vertex_dict = {}
        for v in V:
            vertex_dict[v] = Vertex(None, None, True)

        for i in reversed(range(0, h)):
            H[i] = set()

            for C in H[i+1]:
                for v in C:
                    v_ver = vertex_dict[v]
                    v_ver.cluster = set()
                    v_ver.flag = True

                    v_ver.rep = None
                    for j in pi:
                        # @TODO: think about doing memoization for speedup
                        v_neighborhood = self.r_neighborhood(v, U * 2**(i-1))
                        if j in (C & v_neighborhood):
                            v_ver.rep = j
                            break

                    # Something is wrong if this triggers
                    assert(v_ver.rep is not None)

                for v in C:
                    v_ver = vertex_dict[v]
                    for u in C:
                        u_ver = vertex_dict[u]
                        if u_ver.flag and u_ver.rep == v:
                            u_ver.flag = False
                            v_ver.cluster.add(u)

                for v in C:
                    v_ver = vertex_dict[v]
                    if v_ver.cluster:
                        H[i].add(frozenset(v_ver.cluster))

        return H

    def get_path(self, algo, s, t: int) -> List[int]:
        if self._graph is None:
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
