import numpy as np
import networkx as nx

from typing import List, Set


class GraphNotSet(Exception):
    pass


class UnknownAlgorithm(Exception):
    pass


class VertexNonExistent(Exception):
    pass


class Routing(object):
    def __init__(self, M: List[List[int]] = None) -> None:
        self.set_graph(M)

    def set_graph(self, M: List[List[int]]) -> None:
        if M is None:
            self._mat = None
            self._graph = None
            return

        # @TODO: If necessary, convert graph into graph with diameter power of
        # 2 and force edge weights be greater than one.
        self._mat = np.matrix(M)
        self._graph = nx.MultiDiGraph(self._mat)

    def r_neighborhood(self, v, r: int) -> Set[int]:
        if self._graph is None:
            raise GraphNotSet

        try:
            nbhd = nx.single_source_dijkstra_path_length(
                self._graph, v, cutoff=r
            )
        except KeyError:
            raise VertexNonExistent

        return set(nbhd.keys())

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
