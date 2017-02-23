using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CarPather : MonoBehaviour
{
    public NodeMap Map;

    public List<Node> Path;
    public Node[] AvailableNodes;
    public Edge[] AvailableEdges;
    public Node NextNode;
    public Node CurrentNode;
    public int CurrentPathIndex;

    public List<Node> potentialNextNodes = new List<Node>();


    public bool PathReady = false;
    public bool GoingForward = true;


    /// <summary>
    /// Test method to get a random path
    /// Later we will get a path from an algorithm
    /// </summary>
    protected void GetRandomPath(int size)
    {
        int randomNodeIndex = Random.Range(0, Map.NodeList.Count - 1);
        int currentPathIndex = 0;
        int tryGetUniquePathCount = 0;

        // Start with a random first node
        Path.Add(Map.NodeList[randomNodeIndex]);
        Node lastNode = Path[CurrentPathIndex];

        while (Path.Count < size)
        {

            potentialNextNodes.Clear();

            // pick a random next node based on the available connections from the start node
            AvailableNodes = Path[currentPathIndex].Neighbors.ToArray();

            foreach (Node node in AvailableNodes)
            {
                // Add the destination node of this edge to our potential next nodes
                // (See the Edge class if confused about the destination node)
                potentialNextNodes.Add(node);
            }

            // incrememnt out index to the next node after we have found all the potential nodes from the current index



            // tries 10 times to get a different next node than the last node 
            // (this is to make sure we dont get stuck in an infinite loop if the only next node we can go to is the previous node i.e. a dead end)
            tryGetUniquePathCount = 0;
            do
            {
                randomNodeIndex = Random.Range(0, potentialNextNodes.Count);
                tryGetUniquePathCount++;

            } while ((potentialNextNodes[randomNodeIndex] == lastNode) && tryGetUniquePathCount < 10);

            //Debug.Log("Potential Next Node: " + potentialNextNodes[randomNodeIndex]);
            //Debug.Log("Last Node: " + lastNode.gameObject.name);

            lastNode = Path[currentPathIndex];

            currentPathIndex++;


            // Add a random node from our potential nodes to our path
            Path.Add(potentialNextNodes[randomNodeIndex]);
        }
        PathReady = true;
    }

    /// <summary>
    /// Gets a random edge that connects to the next node in the path
    /// </summary>
    /// <returns></returns>
    public Edge GetNextEdge()
    {
        AvailableEdges = NextNode.GetComponentsInChildren<Edge>();
        List<Edge> potentialNextEdges = new List<Edge>();
        int randomEdgeIndex = 0;


        foreach (Edge edge in AvailableEdges)
        {
            if ((edge.Nodes[0] == NextNode || edge.Nodes[1] == NextNode) && (edge.Nodes[0] == CurrentNode || edge.Nodes[1] == CurrentNode))
            {
                potentialNextEdges.Add(edge);
            }
        }

        AvailableEdges = CurrentNode.GetComponentsInChildren<Edge>();

        foreach (Edge edge in AvailableEdges)
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
