import numpy as np
import networkx as nx

from math import ceil, log2
from typing import Any, List, Set, FrozenSet, NamedTuple


# Custom Exceptions ===========================================================

class NonSquareMatrix(Exception):
    pass


class GraphNotSet(Exception):
    pass


class UnknownAlgorithm(Exception):
    pass


class VertexNonExistent(Exception):
    pass


class NonOverlappingEndVertices(Exception):
    pass

# =============================================================================


# Types / Structs =============================================================

RepSet = NamedTuple("RepSet", [('set', FrozenSet), ('rep', int)])
HDS_Element = FrozenSet[RepSet]
HDS = List[HDS_Element]
HDT_Node = NamedTuple("HDT_Node", [('repset', RepSet), ('level', int)])

# =============================================================================


class Vertex(object):
    # Trying to reduce object size by using __slots__
    __slots__ = ['rep', 'cluster', 'flag']

    def __init__(self, rep, cluster, flag):
        self.rep = rep
        self.cluster = cluster
        self.flag = flag


class GraphUtils:
    @staticmethod
    def graph_diameter(G):
        """Compute the diameter of a given graph.

        NOTE:
            Given graph MUST be STRONGLY connected.
        """
        # @TODO: choose the better algorithm depending on the density of
        # the graph
        return nx.floyd_warshall_numpy(G).max()

    @staticmethod
    def randomized_HDS_gen(G, pi=None, U=None) -> HDS:
        """Generate a HDS based on given or randomly generated paramters.
        Using Algorithm 3.1 (Fakcharoenphol's Algorithm).
        """
        num_vertices = len(G.nodes())
        V = frozenset(np.arange(num_vertices))

        if not pi:
            # @TODO: check that this is a uniform permutation
            pi = np.random.permutation(num_vertices)
        # print("Random permutation: {}".format(pi))

        if not U:
            U = np.random.uniform(.5, 1)
        # print("Random num: {}".format(U))

        h = int(log2(G._diam))
        H = [None] * (h + 1)  # type: HDS

        # @TODO: does root of tree have a representative?
        H[h] = frozenset([RepSet(V, None)])

        vertex_dict = {}
        for v in V:
            vertex_dict[v] = Vertex(None, None, True)

        for i in reversed(range(0, h)):
            H_i = set()

            for C in H[i+1]:
                cluster_set = C.set
                for v in cluster_set:
                    v_ver = vertex_dict[v]
                    v_ver.cluster = set()
                    v_ver.flag = True

                    v_ver.rep = None
                    for j in pi:
                        # @TODO: think about doing memoization for speedup
                        v_neighborhood = G.r_neighborhood(v, U * 2**(i-1))
                        if j in (cluster_set & v_neighborhood):
                            v_ver.rep = j
                            break

                    # Something is wrong if this triggers
                    assert(v_ver.rep is not None)

                for v in cluster_set:
                    v_ver = vertex_dict[v]
                    for u in cluster_set:
                        u_ver = vertex_dict[u]
                        if u_ver.flag and u_ver.rep == v:
                            u_ver.flag = False
                            v_ver.cluster.add(u)

                for v in cluster_set:
                    v_ver = vertex_dict[v]
                    if v_ver.cluster:
                        H_i.add(RepSet(frozenset(v_ver.cluster), v_ver.rep))

            H[i] = frozenset(H_i)

        return H

    @staticmethod
    def hds_to_hdt(hds: HDS):
        G = nx.Graph()

        for i in reversed(range(0, len(hds) - 1)):
            for C in hds[i]:
                node = HDT_Node(C, i)
                G.add_node(node)

                added_parent = False
                for Cp in hds[i+1]:
                    parent_node = HDT_Node(Cp, i+1)
                    if C.set <= Cp.set:
                        G.add_edge(node, parent_node)
                        added_parent = True
                        break

                assert(added_parent is True)

        return G

    @staticmethod
    def merge(path1, path2: List[Any]) -> List[Any]:
        """Merge two paths that have overlapping vertices.

        path1: [v_1, v_2, ... , v_k]
                                ||
        path2:                 [v_k, v_k+1, ...]
        """
        if path1[-1] != path2[0]:
            raise NonOverlappingEndVertices

        return path1[:-1] + path2

    @staticmethod
    def projection(G, hdt_path: List[HDT_Node]) -> List[int]:
        starting_node = hdt_path[0]  # type: HDT_Node

        # Setting this up for easy calls to merge function later
        projection_path = [starting_node.repset.rep]

        traversed_root = False

        prev_repset = None
        for hdt_node in hdt_path:
            repset = hdt_node.repset

            if not prev_repset:
                prev_repset = repset
                continue

            # @TODO: does root of tree have a representative?
            if not repset.rep:
                # Only the root node should have a non-true representative.
                # If this triggers, then more than one node has non-true
                # representative.
                assert(traversed_root is False)

                traversed_root = True
                continue

            projection_path = GraphUtils.merge(
                projection_path,
                nx.dijkstra_path(G, prev_repset.rep, repset.rep)
            )

            prev_repset = repset

        return projection_path


class GraphDiam2h(nx.MultiDiGraph):
    def __init__(self, M: List[List[float]]) -> None:
        if M is None:
            raise Exception("Empty matrix provided")

        adj_mat = np.matrix(M)

        if adj_mat.shape[0] != adj_mat.shape[1]:
            raise NonSquareMatrix

        self._mat = self._convert_power_of_2_diameter(adj_mat)
        # self._n_vertices = self._mat.shape[0]

        super(GraphDiam2h, self).__init__(self._mat)

        # self._graph = nx.MultiDiGraph(self._mat)
        self._diam = GraphUtils.graph_diameter(self)

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
        G_p_diam = GraphUtils.graph_diameter(G_p)

        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(
            lambda x: ((2 ** ceil(log2(G_p_diam))) / G_p_diam) * x
        )
        np_mat = vec_func(np_mat)

        return np_mat

    def r_neighborhood(self, v, r: float) -> Set[int]:
        """Get the set of vertices that are within r distance of v.
        """
        try:
            nbhd = nx.single_source_dijkstra_path_length(
                self, v, cutoff=r
            )
        except KeyError:
            raise VertexNonExistent

        return set(nbhd.keys())


class Routing(object):
    def __init__(self, M: List[List[float]] = None) -> None:
        self.set_graph(M)

    def set_graph(self, M: List[List[float]]) -> None:
        """Set the adjacency matrix that the routing algorithms will work on.
        """
        if M is None:
            return

        self._graph = GraphDiam2h(M)

    def get_path(self, algo, s, t: int) -> List[int]:
        """Get optimal path from s to t depending on the chosen algorithm.
        """
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
