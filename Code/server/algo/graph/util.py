# Separation of utily functions previously known as the class GraphUtils.
from math import ceil, log2
from typing import Any, Tuple, List, Dict, FrozenSet, NamedTuple, Set
import networkx as nx
import numpy as np

class NonPowerOf2Graph(Exception):
  pass


# Types / Structs =============================================================

HDS_Element = FrozenSet[FrozenSet]
HDS = List[HDS_Element]
HDT_Node = NamedTuple("HDT_Node", [('set', FrozenSet), ('level', int)])

# =============================================================================

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

def filter_out_above(original_dict, equal_or_above):
  """Remove all keys as well as all nodes that are equal or above to
  equal_or_above.
  """
  filtered_dict = {}
  for k1, v1 in original_dict.items():
    if k1 >= equal_or_above:
      continue

    filtered_dict[k1] = {}
    for k2, v2 in v1.items():
      if k2 >= equal_or_above:
          continue

      filtered_dict[k1][k2] = [node for node in v2 if node < equal_or_above]

  return filtered_dict

def top_down_integral_scheme_generation(G, const=27) -> Dict[int, Dict[int, List[int]]]:
  if not check_num_pow2(G.diam):
    raise NonPowerOf2Graph("{}".format(G.diam))

  V = set(G.nodes())

  num_iterations = const * int(log2(len(V)))
  HDST_list = [None] * num_iterations
  for i in range(num_iterations):
    hds = randomized_HDS_gen(G)
    hdt = HDS_to_HDT(hds)

    HDST_list[i] = (hds, hdt)

  alpha = min((1 / log2(len(V))), 1/8)
  alpha_padded = {}
  for node in V:
    alpha_padded[node] = [False] * num_iterations
    for i, (hds, _) in enumerate(HDST_list):
      alpha_padded[node][i] = check_alpha_padded(G, hds, alpha, node)

  scheme = {}  # type: Dict[int, Dict[int, List[int]]]

  for s in V:
    s_int = int(s)
    scheme[s_int] = {}
    for t in V - {s}:
      t_int = int(t)
      tree = None

      for i in range(num_iterations):
        if alpha_padded[s][i] and alpha_padded[t][i]:
          tree = HDST_list[i][1]
          break

      # if tree is None:
      #     import test
      #     for (hds, _) in HDST_list:
      #         test.Test.verify_valid_hds(G, hds)
      #     print("all good")

      # s and t are not simultaenously alpha-padded in any of the
      # generated HDS's
      assert(tree is not None)

      s_node = HDT_Node(frozenset([s]), 0)
      t_node = HDT_Node(frozenset([t]), 0)

      path = GraphUtils.HDT_leaf_to_leaf_path(tree, s_node, t_node)
      scheme[s_int][t_int] = [int(v) for v in GraphUtils.projection(G, path)]

  for v in V:
    v_int = int(v)
    scheme[v_int][v_int] = [int(v)]

  return scheme

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
    # TODO: is there an issue in the book? Is it actually supposed to
    # be 2**(i-1)?
    r = U * (2**(i))
    memoized_nbhds = {}  # type: Dict[Tuple[int, int], List[int]]

    for cluster in H[i+1]:
      for v in cluster:
        v_ver = vertex_dict[v]

        v_ver.cluster = set()
        v_ver.flag = True
        v_ver.rep = None

        if (v, i) not in memoized_nbhds:
          v_nbhd = G.r_neighborhood(v, r)
          memoized_nbhds[(v, i)] = v_nbhd
        else:
          v_nbhd = memoized_nbhds[(v, i)]

        # Get first vertex in random permutation that is both
        # in cluster and in the r_neighborhood of v. Set this
        # vertex as the representative of v.
        for j in pi:
          if j in cluster and j in v_nbhd:
            v_ver.rep = j
            break

        # Could not find a representative. Something is wrong.
        assert(v_ver.rep is not None)

      for v in cluster:
        v_ver = vertex_dict[v]
        for u in cluster:
          u_ver = vertex_dict[u]
          if u_ver.flag and u_ver.rep == v:
            u_ver.flag = False
            v_ver.cluster.add(u)

      for v in cluster:
        v_ver = vertex_dict[v]
        if v_ver.cluster:
          H_i.add(frozenset(v_ver.cluster))

    H[i] = frozenset(H_i)

  return H

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

def check_alpha_padded(G, hds: HDS, alpha: float, v: int, debug=False) -> bool:
  def _is_subset_of_a_cluster(nbhd, d_partition):
    for cluster in d_partition:
      if nbhd <= cluster: return True
    return False

  for i, delta_partition in enumerate(hds):
    v_nbhd = G.r_neighborhood(v, alpha * (2**i))
    if not _is_subset_of_a_cluster(v_nbhd, delta_partition):
      if debug: print(i)
      return False

  return True

def projection(G, hdt_path: List[HDT_Node]) -> List[int]:
  starting_node = hdt_path[0]  # type: HDT_Node
  prev_representative = np.random.choice(tuple(starting_node.set))

  # Setting this up for easy calls to merge function later
  projection_path = [prev_representative]

  for hdt_node in hdt_path[1:]:
    representative = np.random.choice(tuple(hdt_node.set))

    projection_path = merge(
      projection_path,
      G.get_shortest_path(prev_representative, representative)
    )

    prev_representative = representative

  return compress_path(projection_path)

def merge(path1, path2: List[Any]) -> List[Any]:
  """Merge two paths that have overlapping vertices.
  path1: [v_1, v_2, ... , v_k]
                          ||
  path2:                 [v_k, v_k+1, ...]
  """
  if path1[-1] != path2[0]:
    raise NonOverlappingEndVertices

  return path1[:-1] + path2

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


def dict_to_json(d):
  pairs_len = len(d)
  new_pairs = {}
  for i in range(pairs_len):
    temp1 = d[i]
    new_pairs[str(i)] = {}
    if not isinstance(temp1, int):
      sub_pair_len = len(temp1)
      
      for j in range(sub_pair_len):
        temp2 = d[i][j]
        temp3 = []
        for x in temp2:
          if not isinstance(x, int):
            temp3.append(x.item())
          # elif not isinstance(x, float):
          #   temp3.append(x.item())
          else:
            temp3.append(x)
        new_pairs[str(i)][str(j)] = temp3

  return new_pairs;
