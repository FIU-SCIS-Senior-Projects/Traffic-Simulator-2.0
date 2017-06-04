# Separation of utily functions previously known as the class GraphUtils.
from math import ceil, log2
import networkx as nx
import numpy as np

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

def create_pow2_diameter_mat(np_mat):
  """Out of an adjacency matrix which denotes some graph G = (V, E, w)
  create an adjacency matrix which denotes some graph G' = (V, E, w_c)
  with diameter equal to some power of 2. Also, each edge will have
  weight >= 1.
  See Lemma 3.1 for more details.
  NOTE:
  The given adjacency matrix MUST denote a STRONGLY connected graph.
  """
  # Negative weights delimit a non-existent edge between two nodes, which
  # is equivalent to edge weight of infinity. 0.0 will be used to
  # represent a non-existent edge as this is what networkx seems to
  # expect in order to not have an edge between the two nodes.
  # print("np_mat")
  # print(np_mat)
  # print(np_mat.max())
  # print(np_mat.mean())
  np_mat[np_mat < 0.0] = 0.0

  G_min_edge = np_mat[np_mat > 0.0].min()

  G = nx.DiGraph(np_mat)
  G_diam = graph_diameter(G)

  # No need to do any transformations
  if G_min_edge >= 1.0 and \
     G_diam.is_integer() and \
     GraphUtils.check_num_pow2(int(G_diam)):
    return np_mat

  epsilon = np.float(0.01)
  mult_const = np.float((1 + epsilon) / G_min_edge)
  # @TODO: check to see if there's a faster way of doing this
  vec_func = np.vectorize(lambda x: mult_const * x, otypes=[np.float])
  np_mat = vec_func(np_mat)


  G_p = nx.DiGraph(np_mat)
  # print("G_p")
  # print(G_p)
  G_p_diam = graph_diameter(G_p)

  # print("diam")
  # print(G_p_diam)
  mult_const = ((2 ** ceil(log2(G_p_diam))) / G_p_diam)
  # @TODO: check to see if there's a faster way of doing this
  vec_func = np.vectorize(lambda x:  mult_const * x, otypes=[np.float])
  np_mat = vec_func(np_mat)

  return np_mat

def graph_diameter(G):
  """Compute the diameter of a given graph.
  NOTE:
      Given graph MUST be STRONGLY connected.
  """
  # @TODO: choose the better algorithm depending on the density of
  # the graph
  return nx.floyd_warshall_numpy(G).max()

def check_num_pow2(num):
  num_type = type(num)
  if num_type is not int:
    # if (isinstance(num_type, float) or
    #     isinstance(num_type, np.float) or
    #     isinstance(num_type, np.float32) or
    #     isinstance(num_type, np.float64)) and not num.is_integer():
    raise TypeError(
        "{} is not an integer. Type: {}".format(num, type(num))
    )

    # num = int(num)

  return num != 0 and num & (num - 1) == 0