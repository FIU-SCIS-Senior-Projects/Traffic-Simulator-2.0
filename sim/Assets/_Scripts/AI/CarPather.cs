using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Handles the pathing logic for a CarAI
/// </summary>
public class CarPather : MonoBehaviour
{
    public NodeMap Map;
    public List<Node> Path;
    public Node NextNode;
    public Node CurrentNode;
    public int CurrentPathIndex;
    public bool PathReady = false;
    public bool GoingForward = true;

    private List<Node> potentialNextNodes = new List<Node>();
    private Edge[] availableEdges;

    /// <summary>
    /// Initializes the Path Index
    /// </summary>
    public void Init()
    {
        CurrentPathIndex = 0;
    }

    /// <summary>
    /// Gets an edge that connects to the next node in the path
    /// </summary>
    /// <returns></returns>
    public Edge GetNextEdge()
    {
        availableEdges = NextNode.GetComponentsInChildren<Edge>();
        List<Edge> potentialNextEdges = new List<Edge>();
        int randomEdgeIndex = 0;


        foreach (Edge edge in availableEdges)
        {
            if ((edge.Nodes[0] == NextNode || edge.Nodes[1] == NextNode) && (edge.Nodes[0] == CurrentNode || edge.Nodes[1] == CurrentNode))
            {
                potentialNextEdges.Add(edge);
            }
        }

        availableEdges = CurrentNode.GetComponentsInChildren<Edge>();

        foreach (Edge edge in availableEdges)
        {
            if ((edge.Nodes[0] == NextNode || edge.Nodes[1] == NextNode) && (edge.Nodes[0] == CurrentNode || edge.Nodes[1] == CurrentNode))
            {
                potentialNextEdges.Add(edge);
            }
        }

        randomEdgeIndex = Random.Range(0, potentialNextEdges.Count);
        Edge nextEdge = potentialNextEdges[randomEdgeIndex];

        if (nextEdge.Nodes[0] == NextNode)
        {
            GoingForward = false;
        }
        else
        {
            GoingForward = true;
        }

        return nextEdge;
    }
}
