import pydot
import random

import numpy as np
import networkx as nx

from math import sqrt
from itertools import product

color_set = set([
    'aliceblue', 'antiquewhite', 'aquamarine','azure','beige', 'bisque',
	'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
    'chartreuse', 'chocolate', 'coral','cornflowerblue', 'cornsilk','crimson',
	'cyan','darkgoldenrod', 'darkgreen', 'darkkhaki', 'darkolivegreen',
    'darkorange', 'darkorchid', 'darksalmon', 'darkseagreen','darkslateblue',
    'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet',
    'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
	'floralwhite', 'forestgreen', 'gainsboro', 'ghostwhite', 'gold',
    'goldenrod',
])


def generate_pydot_grid(
        mat, title=None, spread=2, size=(10, 10), use_coord_names=False):
    assert(mat.shape[0] == mat.shape[1])

    dimension_max = int(sqrt(mat.shape[0]))
    nodes = list(product(range(dimension_max), range(dimension_max)))

    pydot_graph = pydot.Dot(
        graph_type='digraph',
        size='{},{}!'.format(*size),
        # ratio='fill',
        # margin='1',
    )

    if title:
        pydot_graph.set_label(title)

    for i, node in enumerate(nodes):
        x, y = (coord * spread for coord in node)

        if use_coord_names:
            name = str(node)
        else:
            name = str(i)

        n = pydot.Node(
            name=name,
            pos='{},{}!'.format(x, y),
            shape='circle',
            fixedsize='true',
        )
        pydot_graph.add_node(n)

    def numpy_matrix_index(mat, i, j):
        return mat[i,j]

    def regular_2d_index(mat, i, j):
        return mat[i][j]

    if isinstance(mat, np.matrix):
        indexer = numpy_matrix_index
    else:
        indexer = regular_2d_index

    for i, n1 in enumerate(nodes):
        # row_index = (n1[0] * dimension_max) + n1[1]
        for j, n2 in enumerate(nodes):
            # column_index = (n2[0] * dimension_max) + n2[1]

            weight = indexer(mat, i, j)

            if use_coord_names:
                n1_name = str(n1)
                n2_name = str(n2)
            else:
                n1_name = str(i)
                n2_name = str(j)

            if weight > 0.0 and weight != np.inf:
                e = pydot.Edge(
                    n1_name,
                    n2_name,
                    headlabel='{:.2f}'.format(weight),
                    labeldistance=3.5,
                    style='bold',
                )

                pydot_graph.add_edge(e)

    return pydot_graph


def node_to_labels(dot, nodes, names_to_coords=False):
    num_nodes = len(dot.get_node_list())
    dimension_max = int(sqrt(num_nodes))

    node_labels = []
    if names_to_coords:
        for n in nodes:
            if isinstance(n, tuple):
                node_labels.append('"{}"'.format(n))
            elif isinstance(n, int) or isinstance(n, np.integer):
                # Lets convert the integer into (x, y) tuple
                node_tuple = (n // dimension_max, n % dimension_max)
                node_labels.append('"{}"'.format(node_tuple))
            elif isinstance(n, np.floating) and n.is_integer():
                i = int(n)
                node_tuple = (i // dimension_max, i % dimension_max)
                node_labels.append('"{}"'.format(node_tuple))
            else:
                raise TypeError(
                    "Nodes are not (x, y) tuples or integers."
                )
    else:
        node_labels = [str(v) for v in nodes]

    return node_labels


def highlight_nodes(
        dot, nodes,
        node_fill_color='gray',
        node_font_color='black',
        names_to_coords=False):
    node_labels = node_to_labels(dot, nodes, names_to_coords=names_to_coords)

    for n in dot.get_node_list():
        if n.get_name() in node_labels:
            n.set_style('filled')
            n.set_fillcolor(node_fill_color)
            n.set_fontcolor(node_font_color)


def highlight_path(
        dot, path,
        node_fill_color='gray',
        node_font_color='black',
        edge_color='black',
        names_to_coords=False):
    highlight_nodes(
        dot,
        path,
        node_fill_color,
        node_font_color,
        names_to_coords,
    )

    path_dict = {}
    path_node_labels = node_to_labels(
        dot, path, names_to_coords=names_to_coords
    )
    for i in range(1, len(path_node_labels)):
        source = path_node_labels[i-1]
        dest = path_node_labels[i]
        path_dict[source] = dest

    for e in dot.get_edge_list():
        source = e.get_source()
        dest = e.get_destination()
        if source in path_dict and path_dict[source] == dest:
            e.set_style('"bold"')
            e.set_color(edge_color)


def draw_pydot(pydot_graph, output_name='png_graph'):
    pydot_graph.write_png(output_name, prog='neato')


def create_dots_for_hds(grid, hds, nodes_only=False):
    dot_graphs = []

    if not nodes_only:
        all_pairs_paths = nx.all_pairs_dijkstra_path(grid)

    mat = nx.to_numpy_matrix(grid)
    for i, delta_partition in enumerate(hds):
        dot = generate_pydot_grid(
            mat,
            title='{}-partition'.format(2**i),
        )

        used_colors = set()
        for cluster in delta_partition:
            if len(cluster) <= 1:
                continue

            possible_colors = color_set - used_colors
            if not possible_colors:
                raise Exception('Ran out of colors')
            else:
                rand_color = random.sample(color_set - used_colors, 1)[0]

            if not nodes_only:
                for v in cluster:
                    for w in cluster - {v}:
                        path = all_pairs_paths[v][w]
                        highlight_path(
                            dot,
                            path,
                            node_fill_color=rand_color,
                            edge_color=rand_color
                        )
            else:
                highlight_nodes(
                    dot,
                    cluster,
                    node_fill_color=rand_color,
                )

        dot_graphs.append(dot)

    return dot_graphs
