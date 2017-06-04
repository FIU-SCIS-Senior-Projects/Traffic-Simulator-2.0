import networkx as nx
import numpy as np
import json
import sys


from util import create_pow2_diameter_mat, create_in_out_mat
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
    pairs_len = len(self.all_pairs_sp)
    new_pairs = {}
    for i in range(pairs_len):
      # if self.all_pairs_sp[i] is not None and len(self.all_pairs_sp[i]) is not 0:
      # temp1 = self.all_pairs_sp.pop(i)
      temp1 = self.all_pairs_sp[i]
      # self.all_pairs_sp[str(i)] = temp1
      new_pairs[str(i)] = {}
      sub_pair_len = len(temp1)
      # print('len sub ' + str(i) + 'is: ' + str(sub_pair_len), file=sys.stderr)
      
      for j in range(sub_pair_len):
        # if self.all_pairs_sp[str(i)][j] is not None and len(self.all_pairs_sp[str(i)][j]) is not 0:
        # temp2 = self.all_pairs_sp[i].pop(j)
        # temp2 = new_pairs[str(i)].pop(j)
        temp2 = self.all_pairs_sp[i][j]
        temp3 = []
        for x in temp2:
          if not isinstance(x, int):
            temp3.append(x.item())
          else:
            temp3.append(x)
        # self.all_pairs_sp[str(i)][str(j)] = temp2
        # self.all_pairs_sp[i][j] = temp2
        new_pairs[str(i)][str(j)] = temp3
        # print('i: ' + str(i) + ' j: ' + str(j), file=sys.stderr)
        # print(new_pairs[str(i)], file=sys.stderr)
        # json.dumps(new_pairs[str(i)])
        # print(new_pairs, file=sys.stderr)
        # print(new_pairs[str(i)][str(j)], file=sys.stderr)
      # json.dumps(new_pairs)
    # print(self.num_nodes, file=sys.stderr)
    # print(len(self.all_pairs_sp), file=sys.stderr)
    # print(len(new_pairs), file=sys.stderr)
    # jsonGraph = json.dumps(new_pairs)
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
    jsonGraph = json.loads(graph)
    self.adjMatrix = jsonGraph.adjMatrix
    self.num_nodes = jsonGraph.num_nodes
    self.all_pairs_sp = jsonGraph.all_pairs_sp
    self.all_sp_len = jsonGraph.all_sp_len
    self.all_sp_len_transpose = jsonGraph.all_sp_len_transpose
    self.diam = jsonGraph.diam





  def _max_sp(self):
    return max([max(dists) for dists in self.all_sp_len])

  def get_shortest_path(self, s, t: int):
    return self.all_pairs_sp[s][t]

  # def get_shortest_path_length(self, s, t: int) -> float:
  #   return self.all_sp_len[(s * self.num_nodes) + t]

  # def r_neighborhood(self, s: int, r: float) -> FrozenSet[int]:
  #   """Return all nodes t in graph which have distance <= r from s -> t."""
  #   s_nbhd = frozenset(
  #     sp.filter_out_above(self.num_nodes, self.all_sp_len[s], r)
  #   )

  #   # Get all nodes with shortest path *to* s less than or equal to r.
  #   s_nbhd_inverse = frozenset(
  #     sp.filter_out_above(
  #       self.num_nodes,
  #       self.all_sp_len_transpose[s],
  #       r
  #     )
  #   )

  #   # Work around for algorithm intended for undirected graphs. When
  #   # generating an HDS, there is the possibility that the randomized
  #   # HDS generator algorithm chooses vertices which are reachable by
  #   # s with path length less than or equal to r, but the chosen vertices
  #   # would not be able to get to s in less than or equal to r path length.
  #   # This is due to the topology of the graph, where there are nodes
  #   # which have edges going to other nodes but not an edge coming back
  #   # from one of those nodes, thus no longer looking like an undirected
  #   # graph (since there's no way back with equal path length).
  #   #
  #   # The r_neighborhood now instead only chooses those vertices which
  #   # s can reach in <= r but *only if* those edges can also reach
  #   # s in <= r path length.
  #   return s_nbhd & s_nbhd_inverse
  #   # return s_nbhd

def all_pairs_dijkstra_shortest_path_and_length(G):

  num_nodes = len(G.nodes())

  # all_pairs = 0
  # all_sp_len = 0
  all_pairs = nx.all_pairs_dijkstra_path(G)
  # all_sp_len = [array('f', [0.0] * num_nodes) for _ in range(num_nodes)]
  all_sp_len = [[0.0] * num_nodes for _ in range(num_nodes)]

  # Takes time
  for s in all_pairs:
    for t in all_pairs[s]:
      length = 0.0
      prev = all_pairs[s][t][0]
      for v in all_pairs[s][t][1:]:
        length += G[prev][v]['weight']
        prev = v

      all_sp_len[s][t] = length

  return all_pairs, all_sp_len







def create_in_out_mat(M, new_weight=np.float64(1)):
        """Every node in the represented graph G is broken up into two nodes.
        One of those two nodes represents an "in" node and the other an "out"
        node. The "in" node retains all incoming edges from the original node,
        with one outgoing edge into the new "out" node. The "out" node retains
        all outgoing edges from the original node.
        The directed edge from "in" to "out" node is given a new weight
        (random or specified), while all original edges retain their original
        weight.
        """
        if M.shape[0] != M.shape[1]:
            raise NonSquareMatrix

        i, j = M.shape[0], M.shape[1]
        double_i, double_j = i*2, j*2
        new_matrix = np.zeros((double_i, double_j), dtype=np.float64)

        # Copying old matrix M into bottom left of the new matrix
        new_matrix[i:double_i, 0:j] = M

        # Diagonal of top right square corresponds to the edge weight from
        # in to out vertices
        np.fill_diagonal(
            new_matrix[0:double_i, j:double_j],
            new_weight
        )

        return new_matrix
