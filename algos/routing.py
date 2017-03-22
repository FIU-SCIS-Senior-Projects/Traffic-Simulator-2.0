import numpy as np
import networkx as nx

from math import ceil, log2
from typing import Any, Tuple, List, Dict, FrozenSet, NamedTuple
from array import array


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


class NonLeafNodes(Exception):
    pass

# =============================================================================


# Types / Structs =============================================================

HDS_Element = FrozenSet[FrozenSet]
HDS = List[HDS_Element]
HDT_Node = NamedTuple("HDT_Node", [('set', FrozenSet), ('level', int)])

# =============================================================================


class GraphDiam2h(nx.DiGraph):
    def __init__(self, M) -> None:
        if M is None:
            raise EmptyMatrixProvided

        if M.shape[0] != M.shape[1]:
            raise NonSquareMatrix

        self._mat = GraphUtils.create_pow2_diameter_mat(M)

        super(GraphDiam2h, self).__init__(self._mat)

        self.all_pairs_sp, self.all_sp_len = \
            GraphUtils.all_pairs_dijkstra_shortest_path_and_length(self)

        # Removing any floating point imprecision with round. This has been
        # constructed to be a power of 2, see Lemma 3.1 for more details.
        self.diam = round(self._max_sp())
        self.num_nodes = len(self.nodes())

    def _max_sp(self):
        return max(
            [max(dists) for dists in self.all_sp_len]
        )

    def get_shortest_path(self, s, t: int) -> List[int]:
        return self.all_pairs_sp[(s, t)]

    def get_shortest_path_length(self, s, t: int) -> float:
        return self.all_sp_len[s][t]

    def r_neighborhood(self, s: int, r: float) -> FrozenSet[int]:
        return frozenset(
            [v for v in range(self.num_nodes) if self.all_sp_len[s][v] <= r]
        )


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
    def r_neighborhood(G, v: int, r: float) -> FrozenSet[int]:
        """Get the set of vertices that are within r distance of v.
        """
        try:
            nbhd = nx.single_source_dijkstra_path_length(G, v, cutoff=r)
        except KeyError:
            raise VertexNonExistent

        return frozenset(nbhd.keys())

    @staticmethod
    def create_pow2_diameter_mat(np_mat):
        """Out of an adjacency matrix which denotes some graph G = (V, E, w)
        create an adjacency matrix which denotes some graph G' = (V, E, w_c)
        with diameter equal to some power of 2.

        See Lemma 3.1 for more details.

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

        G_p = nx.DiGraph(np_mat)
        G_p_diam = GraphUtils.graph_diameter(G_p)

        mult_const = ((2 ** ceil(log2(G_p_diam))) / G_p_diam)
        # @TODO: check to see if there's a faster way of doing this
        vec_func = np.vectorize(lambda x:  mult_const * x, otypes=[np.float])
        np_mat = vec_func(np_mat)

        return np_mat

    @staticmethod
    def all_pairs_dijkstra_shortest_path_and_length(
            G) -> Tuple[Dict[Tuple[int, int], List[int]], List[array]]:
        all_pairs = nx.all_pairs_dijkstra_path(G)

        num_nodes = len(G.nodes())

        all_pairs_sp = {}
        all_sp_lens = [array('f', [0.0] * num_nodes) for _ in range(num_nodes)]

        for s in all_pairs:
            for t in all_pairs[s]:
                length = 0.0
                prev = all_pairs[s][t][0]
                for v in all_pairs[s][t][1:]:
                    length += G[prev][v]['weight']
                    prev = v

                all_pairs_sp[(s, t)] = all_pairs[s][t]
                all_sp_lens[s][t] = length

        return all_pairs_sp, all_sp_lens

    @staticmethod
    def dijkstra_routing_scheme(G) -> Dict[Tuple[int, int], List[int]]:
        routing_scheme = {}

        all_pairs_dict = nx.all_pairs_dijkstra_path(G)

        for s in all_pairs_dict:
            for t in all_pairs_dict[s]:
                routing_scheme[(s, t)] = all_pairs_dict[s][t]

        return routing_scheme

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

        h = int(log2(G.diam))
        H = [None] * (h + 1)  # type: List[FrozenSet[FrozenSet]]

        H[h] = frozenset([V])

        vertex_dict = {}
        for v in V:
            vertex_dict[v] = Vertex(None, None, True)

        for i in reversed(range(h)):
            H_i = set()
            r = U * 2**(i-1)
            memoized_nbhds = {}  # type: Dict[Tuple[int, int], List[int]]

            for C in H[i+1]:
                cluster_set = C
                for v in cluster_set:
                    v_ver = vertex_dict[v]
                    v_ver.cluster = set()
                    v_ver.flag = True

                    v_ver.rep = None
                    for j in pi:
                        if (v, i) not in memoized_nbhds:
                            v_nbhd = G.r_neighborhood(v, r)
                            memoized_nbhds[(v, i)] = v_nbhd
                        else:
                            v_nbhd = memoized_nbhds[(v, i)]

                        if j in cluster_set and j in v_nbhd:
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
        previously_seen = set()  # type: Set
        new_path = []  # type: List
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
                G.get_shortest_path(prev_representative, representative)
            )

            prev_representative = representative

        return GraphUtils.compress_path(projection_path)

    @staticmethod
    def check_alpha_padded(G, hds: HDS, alpha: float, v: int) -> bool:
        for i, delta_partition in enumerate(hds):
            v_nbhd = G.r_neighborhood(v, alpha * (2 ** i))
            is_subset = False

            for cluster in delta_partition:
                if v_nbhd <= cluster:
                    is_subset = True
                    break

            if not is_subset:
                return False

        return True

    @staticmethod
    def check_num_pow2(num):
        num_type = type(num)
        if num_type is not int:
            if (isinstance(num_type, float) or
                isinstance(num_type, np.float) or
                isinstance(num_type, np.float32) or
                isinstance(num_type, np.float64)) and not num.is_integer():
                raise TypeError(
                    "{} is not an integer. Type: {}".format(num, type(num))
                )

            num = int(num)

        return num != 0 and num & (num - 1) == 0

    @staticmethod
    def HDT_leaf_to_leaf_path(hdt, s: HDT_Node, t: HDT_Node):
        if s.level != 0 or t.level != 0:
            raise NonLeafNodes(
                "{} and/or {} are not leafs in HDT.".format(s, t)
            )

        s_forward = [s]
        t_backward = [t]

        cur_lvl = 0
        s_parent = s
        t_parent = t
        while s_parent != t_parent:
            s_parent = \
                [v for v in hdt.adj[s_parent] if v.level == (cur_lvl + 1)][0]
            t_parent = \
                [v for v in hdt.adj[t_parent] if v.level == (cur_lvl + 1)][0]

            cur_lvl += 1
            s_forward.append(s_parent)
            t_backward.append(t_parent)

        s_forward.extend(reversed(t_backward[:-1]))
        return s_forward

    @staticmethod
    def top_down_integral_scheme_generation(
            G, const=27) -> Dict[Tuple[int, int], List[int]]:
        if not GraphUtils.check_num_pow2(G.diam):
            raise NonPowerOf2Graph("{}".format(G.diam))

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

                path = GraphUtils.HDT_leaf_to_leaf_path(tree, s_node, t_node)
                S[(s, t)] = GraphUtils.projection(G, path)

        for v in V:
            S[(v, v)] = [v]

        return S

    @staticmethod
    def create_in_out_mat(M, new_weight=np.float64(1)):
        """Every node in the represented graph G is broken up into two nodes.
        One of those two nodes represents an "in" node and the other an "out"
        node. The "in" node retains all incoming edges from the original node,
        with one outgoing edge into the new "out" node. The "out" node retains
        all outgoing edges from the original node. The directed edge from "in"
        to "out" node is given a new weight (random or specified), while all
        original edges retain their original weight.
        """
        if M.shape[0] != M.shape[1]:
            raise NonSquareMatrix

        i, j = M.shape[0], M.shape[1]
        new_i, new_j = i*2, j*2
        new_matrix = np.zeros((new_i, new_j), dtype=np.float64)

        # Copying old matrix M into bottom left of the new matrix
        new_matrix[i:new_i, 0:j] = M

        # Diagonal of top right square corresponds to the edge weight from
        # in to out vertices
        np.fill_diagonal(
            new_matrix[0:new_i, j:new_j],
            new_weight
        )

        return new_matrix


class Routing(object):
    def __init__(
            self,
            M: List[List[float]] = None,
            algos: List[int] = None) -> None:
        self.set_graph(M, algos=algos)

    def get_dijkstra_scheme(self, G):
        num_vertices = len(G.nodes())
        in_out_dijkstra_scheme = \
            GraphUtils.dijkstra_routing_scheme(G)

        # Filterting out all keys which contain nodes that have been generated
        # in the in_out graph generation. Also removing all the new out nodes
        # from the generated paths.
        dijkstra_scheme = {
            key: [int(v) for v in val if v < num_vertices]
            for key, val in in_out_dijkstra_scheme.items()
            if key[0] < num_vertices and key[1] < num_vertices
        }

        return dijkstra_scheme

    def get_top_down_integral_scheme(self, G):
        num_vertices = len(G.nodes())
        in_out_top_down_integral_scheme = \
            GraphUtils.top_down_integral_scheme_generation(self._graph)

        # Filterting out all keys which contain nodes that have been generated
        # in the in_out graph generation. Also removing all the new out nodes
        # from the generated paths.
        top_down_integral_scheme = {
            key: [int(v) for v in val if v < num_vertices]
            for key, val in in_out_top_down_integral_scheme.items()
            if key[0] < num_vertices and key[1] < num_vertices
        }

        return top_down_integral_scheme

    def set_graph(self, M: List[List[float]], algos=None) -> None:
        self._graph = None
        if M is None:
            return

        original_mat = np.matrix(M)
        in_out_mat = GraphUtils.create_in_out_mat(original_mat)
        num_vertices = original_mat.shape[0]

        self._graph = GraphDiam2h(in_out_mat)
        self._routing_schemes = {}

        generate_schemes = {
            0: self.get_dijkstra_scheme,
            1: self.get_top_down_integral_scheme,
        }

        if algos:
            # Generate only the schemes specified
            no_repetition = set(algos)
            for i in no_repetition:
                if i in generate_schemes:
                    func = generate_schemes[i]
                    self._routing_schemes[i] = func(self._graph)
        else:
            # Generate all schemes if none were specified
            for i, func in generate_schemes.items():
                self._routing_schemes[i] = func(self._graph)

    def get_path(self, algo, s, t: int) -> List[int]:
        """Get optimal path from s to t depending on the chosen algorithm.
        """
        if self._graph is None:
            raise GraphNotSet

        path = []  # type: List[int]
        if algo not in self._routing_schemes:
            raise UnknownAlgorithm

        try:
            path = self._routing_schemes[algo][(s, t)]
        except KeyError:  # One of the vertices is not in graph
            raise VertexNonExistent

        return path
