import pydot
import numpy as np

from math import sqrt
from itertools import product


def generate_pydot_grid(mat, spread=2, size=(10, 10)):
    assert(mat.shape[0] == mat.shape[1])

    dimension_max = int(sqrt(mat.shape[0]))
    nodes = list(product(range(dimension_max), range(dimension_max)))

    pydot_graph = pydot.Dot(
        graph_type='digraph',
        size='{},{}!'.format(*size),
        # ratio='fill',
        # margin='1',
    )

    for node in nodes:
        x, y = (coord * spread for coord in node)
        n = pydot.Node(
            name=str(node),
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

    for n1 in nodes:
        row_index = (n1[0] * dimension_max) + n1[1]
        for n2 in nodes:
            column_index = (n2[0] * dimension_max) + n2[1]

            weight = indexer(mat, row_index, column_index)
            if weight > 0.0 and weight != np.inf:
                e = pydot.Edge(
                    str(n1),
                    str(n2),
                    headlabel='{:.2f}'.format(weight),
                    labeldistance=3.5,
                )

                pydot_graph.add_edge(e)

    return pydot_graph


def highlight_path(
        dot, path,
        node_fill_color='gray',
        node_font_color='black',
        edge_color='black'):
    path_dict = {}
    path_node_labels = []

    num_nodes = len(dot.get_node_list())
    dimension_max = int(sqrt(num_nodes))

    for n in path:
        if isinstance(n, tuple):
            path_node_labels.append('"{}"'.format(n))
        elif isinstance(n, int) or isinstance(n, np.integer):
            # Lets convert the integer into (x, y) tuple
            node_tuple = (n // dimension_max, n % dimension_max)
            path_node_labels.append('"{}"'.format(node_tuple))
        elif isinstance(n, np.floating) and n.is_integer():
            i = int(n)
            node_tuple = (i // dimension_max, i % dimension_max)
            path_node_labels.append('"{}"'.format(node_tuple))
        else:
            raise TypeError(
                "Nodes are not (x, y) tuples or integers."
            )

    for i in range(1, len(path_node_labels)):
        source = path_node_labels[i-1]
        dest = path_node_labels[i]
        path_dict[source] = dest

    for n in dot.get_node_list():
        if n.get_name() in path_node_labels:
            n.set_style('filled')
            n.set_fillcolor(node_fill_color)
            n.set_fontcolor(node_font_color)

    for e in dot.get_edge_list():
        source = e.get_source()
        dest = e.get_destination()
        if source in path_dict and path_dict[source] == dest:
            e.set_style('"bold,dashed"')
            e.set_color(edge_color)


def draw_pydot(pydot_graph):
    pydot_graph.write_png('png_graph', prog='neato')
    # pydot_graph.write_pdf('pdf_graph', prog='neato')
