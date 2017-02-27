import numpy as np
import networkx as nx

from math import ceil, log2
from typing import Any, Tuple, List, Dict, FrozenSet, NamedTuple


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


class NonPowerOf2Graph(Exception):
    pass


class EmptyMatrixProvided(Exception):
    pass

# =============================================================================


# Types / Structs =============================================================

HDS_Element = FrozenSet[FrozenSet]
HDS = List[HDS_Element]
HDT_Node = NamedTuple("HDT_Node", [('set', FrozenSet), ('level', int)])

# =============================================================================


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
    def r_neighborhood(G, v: float, r: float) -> FrozenSet[int]:
        """Get the set of vertices that are within r distance of v.
        """
        try:
            nbhd = nx.single_source_dijkstra_path_length(G, v, cutoff=r)
        except KeyError:
            raise VertexNonExistent

        return frozenset(nbhd.keys())

    @staticmethod
    def randomized_HDS_gen(G, pi=None, U=None) -> HDS:
        """Generate a HDS based on given or randomly generated paramters.
        Using Algorithm 3.1 (Fakcharoenphol's Algorithm).
        """

        class Vertex(object):
            # Trying to reduce object size by using __slots__
            __slots__ = ['rep', 'cluster', 'flag']

            def __init__(self, rep, cluster, flag):
                self.rep = rep
                self.cluster = cluster
                self.flag = flag

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
        H = [None] * (h + 1)  # type: List[FrozenSet[FrozenSet]]

        H[h] = frozenset([V])

        vertex_dict = {}
        for v in V:
            vertex_dict[v] = Vertex(None, None, True)

        for i in reversed(range(h)):
            H_i = set()

            for C in H[i+1]:
                cluster_set = C
                for v in cluster_set:
                    v_ver = vertex_dict[v]
                    v_ver.cluster = set()
                    v_ver.flag = True

                    v_ver.rep = None
                    for j in pi:
                        # @TODO: think about doing memoization for speedup
                        v_neighborhood = \
                            GraphUtils.r_neighborhood(G, v, U * 2**(i-1))

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
                        H_i.add(frozenset(v_ver.cluster))

            H[i] = frozenset(H_i)

        return H

    @staticmethod
    def HDS_to_HDT(hds: HDS):
        G = nx.Graph()

        for i in reversed(range(len(hds) - 1)):
            for C in hds[i]:
                node = HDT_Node(C, i)
                G.add_node(node)

                added_parent = False
                for Cp in hds[i+1]:
                    parent_node = HDT_Node(Cp, i+1)
                    if C <= Cp:
                        G.add_edge(node, parent_node)
                        added_parent = True
                        break

                assert(added_parent is True)

        return G

    @staticmethod
    def compress_path(path: List[Any]) -> List[Any]:
        """Remove any cycles from a given path.
        """
        previously_seen = set()
        new_path = []
        for v in reversed(path):
            if v in previously_seen:
                popped = new_path.pop()
                while popped != v:
                    previously_seen.remove(popped)
                    popped = new_path.pop()
                new_path.append(popped)
            else:
                previously_seen.add(v)
                new_path.append(v)

        return list(reversed(new_path))

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
        prev_representative = np.random.choice(tuple(starting_node.set))

        # Setting this up for easy calls to merge function later
        projection_path = [prev_representative]

        for hdt_node in hdt_path[1:]:
            representative = np.random.choice(tuple(hdt_node.set))

            projection_path = GraphUtils.merge(
                projection_path,
                nx.dijkstra_path(G, prev_representative, representative)
            )

            prev_representative = representative

        return GraphUtils.compress_path(projection_path)

    @staticmethod
    def check_alpha_padded(G, hds: HDS, alpha: float, v: int) -> bool:
        for i, delta_partition in enumerate(hds):
            v_neighborhood = GraphUtils.r_neighborhood(G, v, alpha * (2 ** i))
            is_subset = False

            for cluster in delta_partition:
                if v_neighborhood <= cluster:
                    is_subset = True
                    break

            if not is_subset:
                return False

        return True

    @staticmethod
    def integral_scheme_generation(
            G, const=27) -> Dict[Tuple[int, int], List[int]]:
        if GraphUtils.graph_diameter(G) % 2 != 0:
            raise NonPowerOf2Graph

        V = set(G.nodes())
        num_iterations = const * int(log2(len(G.nodes())))

        HDST_list = [None] * num_iterations
        for i in range(num_iterations):
            hds = GraphUtils.randomized_HDS_gen(G)
            hdt = GraphUtils.HDS_to_HDT(hds)

            HDST_list[i] = (hds, hdt)

        S = {}  # type: Dict[Tuple[int, int], List[int]]
        alpha = min((1 / log2(len(V))), 1/8)

        for s in V:
            for t in V - {s}:
                tree = None

                for i in range(num_iterations):
                    hds, hdt = HDST_list[i]

                    s_alpha_padded = \
                        GraphUtils.check_alpha_padded(G, hds, alpha, s)
                    t_alpha_padded = \
                        GraphUtils.check_alpha_padded(G, hds, alpha, t)

                    if s_alpha_padded and t_alpha_padded:
                        tree = hdt
                        break

                # s and/or t are not alpha-padded in any of the generated HDS's
                assert(tree is not None)

                s_node = HDT_Node(frozenset([s]), 0)
                t_node = HDT_Node(frozenset([t]), 0)

                path = nx.dijkstra_path(tree, s_node, t_node)
                S[(s, t)] = GraphUtils.projection(G, path)

        return S


class GraphDiam2h(nx.MultiDiGraph):
    def __init__(self, M: List[List[float]]) -> None:
        if M is None:
            raise EmptyMatrixProvided

        adj_mat = np.matrix(M)

        if adj_mat.shape[0] != adj_mat.shape[1]:
            raise NonSquareMatrix

        self._mat = self._convert_power_of_2_diameter(adj_mat)

        super(GraphDiam2h, self).__init__(self._mat)

        self._diam = GraphUtils.graph_diameter(self)

    def _convert_power_of_2_diameter(self, np_mat):
        """Convert any adjacency matrix which denotes some graph G = (V, E, w)
        into an adjacency matrix which denotes some graph G' = (V, E, w_c) with
        diameter equal to some power of 2.

        NOTE:
            The given adjacency matrix MUST denote a STRONGLY connected graph.

        """
        # Negative weights delimit a non-existent edge between two nodes, which
        # is equivalent to edge weight of infinity. 0.0 will be used to
        # represent a non-existent edge as this is what networkx seems to
        # expect in order to not have an edge between the two nodes.
        np_mat[np_mat < 0.0] = 0.0
        G_min_edge = np_mat[np_mat > 0.0].min()

        epsilon = np.float(0.01)
        mult_const = np.float((1 + epsilon) / G_min_edge)
        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(lambda x: mult_const * x, otypes=[np.float])
        np_mat = vec_func(np_mat)

        G_p = nx.MultiDiGraph(np_mat)
        G_p_diam = GraphUtils.graph_diameter(G_p)

        mult_const = ((2 ** ceil(log2(G_p_diam))) / G_p_diam)
        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(lambda x:  mult_const * x, otypes=[np.float])
        np_mat = vec_func(np_mat)

        return np_mat


class Routing(object):
    def __init__(self, M: List[List[float]] = None) -> None:
        self.set_graph(M)

    def set_graph(self, M: List[List[float]]) -> None:
        """Generate the necessary objects that the algorithms will work on.
        """
        if M is None:
            return

        self._graph = GraphDiam2h(M)
        self._top_down_integral_scheme = \
            GraphUtils.integral_scheme_generation(self._graph)

    def get_path(self, algo, s, t: int) -> List[int]:
        """Get optimal path from s to t depending on the chosen algorithm.
        """
        if self._graph is None:
            raise GraphNotSet

        if s == t:
            return [s]

        path = []  # type: List[int]
        if algo == 0:
            try:
                path = nx.dijkstra_path(self._graph, s, t)
                # @TODO: why is networkx spitting out numpy int64's as the
                # nodes?
                path = [int(x) for x in path]
            except KeyError:  # One of the vertices is not in graph
                raise VertexNonExistent
        elif algo == 1:
            path = self._top_down_integral_scheme[(s, t)]

        else:
            raise UnknownAlgorithm

        return path
