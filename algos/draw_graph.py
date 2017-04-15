import pydot


def generate_pydot_grid(G, spread=2, size=(10, 10)):
    pydot_graph = pydot.Dot(
        graph_type='digraph',
        size='{},{}!'.format(*size),
        # ratio='fill',
        # margin='1',
    )

    for node in G.nodes():
        x, y = (coord * spread for coord in node)
        n = pydot.Node(
            name=str(node),
            pos='{},{}!'.format(x, y),
            shape='circle',
            fixedsize='true',
        )
        pydot_graph.add_node(n)

    for n1, n2, w in G.edges(data=True):
        e = pydot.Edge(
            str(n1),
            str(n2),
            headlabel='{:.2f}'.format(w['weight']),
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
    path_node_labels = ['"{}"'.format(n) for n in path]
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
