import networkx as nx
import numpy as np
import json
import sys

from util import *
from array import array

# Custom Exceptions
# class EmptyMatrixProvided(Exception):
#   pass

# class NonSquareMatrix(Exception):
#   pass

class Graph(nx.DiGraph):
  def __init__(self, matrix, needSetup):
    if needSetup:
      if matrix is None:
        raise EmptyMatrixProvided

      self._setupMatrix(matrix)

  # Initializes a Graph's matrix and associated instance vars
  def _setupMatrix(self, matrix):
    np_matrix = np.matrix(matrix)
    adjMatrix = create_in_out_mat(np_matrix)
    if adjMatrix.shape[0] != adjMatrix.shape[1]:
      raise NonSquareMatrix
    self.adjMatrix = create_pow2_diameter_mat(adjMatrix)
    super(Graph, self).__init__(self.adjMatrix)
    self.num_nodes = len(self.nodes())
    # print("Staring Dijkstra")
    self.all_pairs_sp, self.all_sp_len = all_pairs_dijkstra_shortest_path_and_length(self)
    # print("Finished Dijkstra")
    # Contains the length of shortest path from every other node to this
    # node. This is the equivalent of a transpose on the self.all_sp_len
    # "matrix."
    # self.all_sp_len_transpose = [
    #   array('f', [0.0] * self.num_nodes) for _ in range(self.num_nodes)
    # ]
    self.all_sp_len_transpose = [[0.0] * self.num_nodes for _ in range(self.num_nodes)]
    # print("Finish transpose")
    for i in range(self.num_nodes):
      for j in range(self.num_nodes):
        # Get shortest path length from the other node to this node.
        self.all_sp_len_transpose[i][j] = self.all_sp_len[j][i]
    # print("Finish all_sp_len_transpose")
    # print(self.all_sp_len_transpose)

    # Removing any floating point imprecision with round. This has been
    # constructed to be a power of 2, see Lemma 3.1 for more details.
    self.diam = round(self._max_sp())

  # Used to transport the values of the Graph across  
  # multiple platforms and processes.
  # Generates a stringify JSON object 
  def exportJson(self):
    # print(self.all_pairs_sp)
    # pairsKeys = self.all_pairs_sp.keys()
    # print(self.all_pairs_sp, file=sys.stderr)
    # pairs_len = len(self.all_pairs_sp)
    new_pairs = dict_to_json(self.all_pairs_sp)
    jsonGraph = json.dumps({
      # ndarray to list
      "adjMatrix": self.adjMatrix.tolist(),
      "num_nodes": self.num_nodes,
      # dict to string
      "all_pairs_sp": new_pairs,
      "all_sp_len": self.all_sp_len,
      "all_sp_len_transpose": self.all_sp_len_transpose,
      "diam": self.diam
    });

    return jsonGraph

  # Used to transport the values of the Graph across  
  # multiple platforms and processes.
  def importJson(self, graph):
    # jsonGraph = json.loads(graph)
    self.adjMatrix = graph['adjMatrix']
    self.num_nodes = graph['num_nodes']
    self.all_pairs_sp = graph['all_pairs_sp']
    self.all_sp_len = graph['all_sp_len']
    self.all_sp_len_transpose = graph['all_sp_len_transpose']
    self.diam = graph['diam']
    print('{"msg":"Import Complete"}');

  def _max_sp(self):
    return max([max(dists) for dists in self.all_sp_len])

  def get_shortest_path(self, s, t: int):
    return self.all_pairs_sp[s][t]

  # def get_shortest_path_length(self, s, t: int) -> float:
  #   return self.all_sp_len[(s * self.num_nodes) + t]

  def r_neighborhood(self, s: int, r: float) -> FrozenSet[int]:
    """Return all nodes t in graph which have distance <= r from s -> t."""
    s_nbhd = frozenset(
      sp.filter_out_above(self.num_nodes, self.all_sp_len[s], r)
    )

    # Get all nodes with shortest path *to* s less than or equal to r.
    s_nbhd_inverse = frozenset(
      sp.filter_out_above(
        self.num_nodes,
        self.all_sp_len_transpose[s],
        r
      )
    )

    # Work around for algorithm intended for undirected graphs. When
    # generating an HDS, there is the possibility that the randomized
    # HDS generator algorithm chooses vertices which are reachable by
    # s with path length less than or equal to r, but the chosen vertices
    # would not be able to get to s in less than or equal to r path length.
    # This is due to the topology of the graph, where there are nodes
    # which have edges going to other nodes but not an edge coming back
    # from one of those nodes, thus no longer looking like an undirected
    # graph (since there's no way back with equal path length).
    #
    # The r_neighborhood now instead only chooses those vertices which
    # s can reach in <= r but *only if* those edges can also reach
    # s in <= r path length.
    return s_nbhd & s_nbhd_inverse
    # return s_nbhd

  def get_dijkstra_scheme(self, source, destination):
    # Removing all occurences of in_out nodes, as they don't belong in
    # the original graph.

    # in_out_mat = create_in_out_mat(self.adjMatrix)
    # g = GraphDiam2h(in_out_mat)

    # all_pairs = nx.all_pairs_dijkstra_path(self)
    scheme = {}

    for k1, v1 in self.all_pairs_sp.items():
      k1_conv = int(k1)
      scheme[k1_conv] = {}

      for k2, v2 in self.all_pairs_sp[k1].items():
        k2_conv = int(k2)
        scheme[k1_conv][k2_conv] = [int(x) for x in v2]

    # return json.dumps(dict_to_json(filter_out_above(scheme, num_vertices)[source][destination]))
    return json.dumps(filter_out_above(scheme, self.num_nodes)[source][destination])

  def get_top_down_integral_scheme(self, G, equal_or_above):
    # Removing all occurences of in_out nodes, as they don't belong in
    # the original graph.
    return filter_out_above(
      top_down_integral_scheme_generation(G),
      equal_or_above
    )
