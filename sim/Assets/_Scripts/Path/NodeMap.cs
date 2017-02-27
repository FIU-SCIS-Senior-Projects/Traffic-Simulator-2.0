using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System;
using Unitilities.Tuples;
using UnityEditor;

/// <summary>
/// Class used to build Graphs out of Nodes and Edges
/// </summary>
[Serializable]
public class NodeMap : MonoBehaviour
{
    public bool DebugMode;

    [SerializeField]
    public GameObject NodePrefab;

    [SerializeField]
    public GameObject EdgePrefab;

    [SerializeField]
    public List<Node> NodeList;

    [SerializeField]
    public List<GameObject> NodeObjList;

    [SerializeField]
    public List<Edge> EdgeList;

    [SerializeField]
    public List<GameObject> EdgeObjList;

    public float[,] AdjMatrix;

    /// <summary>
    /// Inits the Node Map, only called once
    /// </summary>
    public void Init()
    {
        NodeList = new List<Node>();
        EdgeList = new List<Edge>();
        NodeObjList = new List<GameObject>();
        UpdateAllNodes(true);
    }

    /// <summary>
    /// Add a new node to the Node Map.
    /// Parent the new node to the Node Map.
    /// Add the new node to the Node List.
    /// Update the Adjacency Matrix.
    /// </summary>
    /// <param name="spawnPoint"></param>
    /// <returns>the newly added node</returns>
    public Node AddNode(Vector3 spawnPoint)
    {
        GameObject nodeObj = Instantiate(NodePrefab, spawnPoint, Quaternion.identity);
        Undo.RegisterCreatedObjectUndo(nodeObj, "Created node");
        nodeObj.transform.parent = transform;
        Node newNode = nodeObj.AddComponent<Node>();
        newNode.Init();
        UpdateAllNodes(false);

        return newNode;
    }

    /// <summary>
    /// Add a new node to the Node Map.
    /// Parent the new node to the Node Map.
    /// Add the new node to the Node List.
    /// Update the Adjacency Matrix.
    /// </summary>
    /// <param name="spawnPoint"></param>
    /// <returns>the newly added node</returns>
    public Node[] AddNodeRow(int w, Vector3 spawnPoint, float offsetMultiplier)
    {
        Node[] newNodes = new Node[w];

        for(int i = 0; i < w; i++)
        {
            Node node = AddNode(spawnPoint + new Vector3(i * offsetMultiplier, 0, 0));
            if (i > 0)
            {
                AddNeighbor(NodeList[NodeList.Count - 1], NodeList[NodeList.Count - 2]);
            }

            newNodes[i] = node;
        }

        return newNodes;
    }

    public List<Node> AddNodeGrid(int w, int h, Vector3 spawnPoint, float offsetMultiplier)
    {
        List<Node> newNodes = new List<Node>();
        for(int i = 0; i < h; i++)
        {
            Node[] rowNodes = AddNodeRow(w, new Vector3(0, i * offsetMultiplier, 0), offsetMultiplier);

            foreach(Node n in rowNodes)
            {
                newNodes.Add(n);
            }

            if(i > 0)
            {
                int index = NodeList.IndexOf(rowNodes[0]);
                Debug.Log(index);
                for (int j = index; j < index + w; j++)
                {
                    AddNeighbor(NodeList[j], NodeList[j - w]);
                }
            }
        }
        return newNodes;
    }

    /// <summary>
    /// Adds a neighbor to a node
    /// Instantiates two new edge object to connect the nodes and parents it to the node, not the neighbor
    /// For now makes two, but later can add a parameter for one-way connections
    /// </summary>
    /// <param name="node"></param>
    /// <param name="neighbor"></param>
    public void AddNeighbor(Node node, Node neighbor)
    {

        if (!node.Neighbors.Contains(neighbor))
        {
            node.Neighbors.Add(neighbor);
            GameObject edgeObj1 = Instantiate(EdgePrefab, node.gameObject.transform.position, Quaternion.identity);

            edgeObj1.transform.parent = node.gameObject.transform;

            Edge newEdge1 = edgeObj1.AddComponent<Edge>();

            newEdge1.Init();



            newEdge1.Nodes.Add(node);
            newEdge1.Nodes.Add(neighbor);
        }
        if (!neighbor.Neighbors.Contains(node))
        {
            neighbor.Neighbors.Add(node);
        }

        UpdateAllNodes(false);

        List<Node> connectedNodes = new List<Node>();
        connectedNodes.Add(node);
        connectedNodes.Add(neighbor);
        UpdateEdges(connectedNodes, true);

    }

    public void RemoveEdges(Node node, Node neighbor)
    {
        var edgesToRemove = new List<Edge>();

        foreach (Edge edge in EdgeList)
        {
            if ((edge.Nodes[0] == node && edge.Nodes[1] == neighbor) || (edge.Nodes[0] == neighbor && edge.Nodes[1] == node))
            {
                edgesToRemove.Add(edge);
            }
        }

        foreach(Edge e in edgesToRemove)
        {
            DestroyImmediate(e.gameObject);
            EdgeList.Remove(e);
        }
    }

    public void RemoveAllNeighbors(Node node)
    {
        var nodeNeighborsToRemove = new List<Node>();

        foreach (Node n in node.Neighbors)
        {
            RemoveEdges(node, n);
            nodeNeighborsToRemove.Add(n);
            n.Neighbors.Remove(n);
        }

        foreach(Node n in nodeNeighborsToRemove)
        {
            node.Neighbors.Remove(n);
        }
    }

    public void RemoveNeighbors(Node node, List<Node> neighborsToRemove)
    {
        var nodeNeighborsToRemove = new List<Node>();

        foreach (Node n in neighborsToRemove)
        {
            RemoveEdges(node, n);
            nodeNeighborsToRemove.Add(n);
            n.Neighbors.Remove(n);
        }

        foreach (Node n in nodeNeighborsToRemove)
        {
            node.Neighbors.Remove(n);
        }
    }

    public void NearestNeighborsConnectNodes(List<Node> nodes)
    {


        // TO DO: Add layermask code

        for (int i = 0; i < nodes.Count; i++)
        {
            float radius = 25f;
            RaycastHit[] hits;


            Node[] potentialNeighbors = new Node[2];

            hits = new RaycastHit[0];
            hits = Physics.SphereCastAll(nodes[i].transform.position, radius, Vector2.up);



            string debugString = "Node: " + nodes[i].name + " hit ";

            foreach(RaycastHit hit in hits)
            {
                if (hit.transform != null)
                {

                    Node n = hit.transform.gameObject.GetComponent<Node>();
                    if (n != null)
                    {
                        debugString += n.name + ", ";
                        if (n != nodes[i])
                        {
                            
                            if (nodes.Contains(n))
                            {

                                if (potentialNeighbors[0] == null)
                                {
                                    potentialNeighbors[0] = n;
                                }
                                else if (potentialNeighbors[1] == null)
                                {
                                    potentialNeighbors[1] = n;
                                }
                                else
                                {
                                    float distanceToNewNode = Vector3.Distance(nodes[i].transform.position, n.transform.position);
                                    float distanceToOldNode = Vector3.Distance(nodes[i].transform.position, potentialNeighbors[1].transform.position);

                                    if (distanceToNewNode < distanceToOldNode)
                                    {
                                        potentialNeighbors[1] = n;
                                    }
                                }



                                if(potentialNeighbors[0] != null && potentialNeighbors[1] != null)
                                {
                                    float distanceToNode1 = Vector3.Distance(nodes[i].transform.position, potentialNeighbors[0].transform.position);
                                    float distanceToNode2 = Vector3.Distance(nodes[i].transform.position, potentialNeighbors[1].transform.position);

                                    if (distanceToNode2 < distanceToNode1)
                                    {
                                        Node tmp = potentialNeighbors[0];
                                        potentialNeighbors[0] = potentialNeighbors[1];
                                        potentialNeighbors[1] = tmp;
                                    }
                                }

                                

                            }
                        }
                    }
                }
            }

            if(potentialNeighbors[0] != null)
            {
                AddNeighbor(nodes[i], potentialNeighbors[0]);
            }

            if(potentialNeighbors[1] != null)
            {
                AddNeighbor(nodes[i], potentialNeighbors[1]);
            }


            Debug.Log(debugString);


        }
    }


    /// <summary>
    /// Rediculously slow function to attempt to fully connect a set of nodes
    /// TO DO: Think of a better way to do this
    /// </summary>
    /// <param name="nodes"></param>
    public void GenerateIntersectionNodes(List<Edge> edges)
    {

        var directions = new List<Vector3>();
        var directionStartNodes = new List<Node>();

        foreach (Edge e in edges)
        {
            Vector3 dir1 = (e.Nodes[1].transform.position - e.Nodes[0].transform.position).normalized;
            Vector3 dir2 = (e.Nodes[0].transform.position - e.Nodes[1].transform.position).normalized;
            directions.Add(dir1);
            directions.Add(dir2);
            directionStartNodes.Add(e.Nodes[0]);
            directionStartNodes.Add(e.Nodes[1]);

            List<Node> neighborsToRemove = new List<Node>();
            neighborsToRemove.Add(e.Nodes[1]);
            RemoveNeighbors(e.Nodes[0], neighborsToRemove);
            neighborsToRemove.Clear();
            neighborsToRemove.Add(e.Nodes[0]);
            RemoveNeighbors(e.Nodes[1], neighborsToRemove);
            neighborsToRemove.Clear();
        }



        for (int i = 0; i < directionStartNodes.Count; i++)
        {
            for (int j = 0; j < directionStartNodes.Count; j++)
            {
                if (i > j)
                {
                    Vector3 closestPoint1 = new Vector3(0, 0, 0);
                    Vector3 closestPoint2 = new Vector3(0, 0, 0);
                    Vector3 nodeHitPosition1 = directionStartNodes[i].transform.position;
                    Vector3 nodeHitPosition2 = directionStartNodes[j].transform.position;

                    RaycastHit hit;
                    // TO DO: Add Layermask
                    Ray ray1 = new Ray(directionStartNodes[i].transform.position, directions[i]);
                    Ray ray2 = new Ray(directionStartNodes[j].transform.position, directions[j]);


                    if (Physics.Raycast(ray1, out hit))
                    {
                        Node n = hit.transform.gameObject.GetComponent<Node>();
                        if (n != null)
                        {
                            nodeHitPosition1 = n.transform.position;
                        }
                    }

                    if (Physics.Raycast(ray2, out hit))
                    {
                        Node n = hit.transform.gameObject.GetComponent<Node>();
                        if (n != null)
                        {
                            nodeHitPosition2 = n.transform.position;
                        }
                    }

                    //Debug.Log("Checking for intersections between " + directionStartNodes[i].name + " and " + directionStartNodes[j].name);
                    if (Math3D.ClosestPointsOnTwoLines(out closestPoint1, out closestPoint2, directionStartNodes[i].transform.position, directions[i], directionStartNodes[j].transform.position, directions[j]))
                    {
                        Debug.Log("Intersect found!");

                        float distance2Intersect1 = Vector3.Distance(directionStartNodes[i].transform.position, closestPoint1);
                        float distance2Node1 = Vector3.Distance(directionStartNodes[i].transform.position, nodeHitPosition1);

                        if (distance2Intersect1 < distance2Node1)
                        {
                            if (!Physics.CheckSphere(closestPoint1, 0.5f))
                            {
                                Debug.Log("No node found at intersect point, adding a node");
                                AddNode(closestPoint1);
                            }
                        }
                    }
                }
            }
        }

        for (int i = 0; i < directionStartNodes.Count; i++)
        {

            RaycastHit hit;
            // TO DO: Add Layermask
            Vector3 dir = directions[i];
            Ray ray = new Ray(directionStartNodes[i].transform.position, dir);

            if (Physics.Raycast(ray, out hit))
            {
                Node n = hit.transform.gameObject.GetComponent<Node>();
                if (n != null)
                {
                    Debug.Log(n.name);
                    AddNeighbor(directionStartNodes[i], n);
                }
            }
                
            
        }

   

    }

    /// <summary>
    /// Updates the Node Map, called when needed
    /// Calls UpdateAdjMatrix()
    /// Calls UpdateEdges()
    /// </summary>
    public void UpdateAllNodes(bool resetEdges)
    {
        NodeList.Clear();
        NodeObjList.Clear();
        Node[] Nodes = GetComponentsInChildren<Node>();
        if (Nodes != null)
        {
            foreach (Node n in Nodes)
            {
                NodeList.Add(n);
                NodeObjList.Add(n.gameObject);
                n.gameObject.name = "Node" + NodeObjList.Count;
            }
        }
        UpdateAllEdges(resetEdges);
    }

    /// <summary>
    /// Updates all edges by setting their control points to the location of thair Nodes
    /// Calls CleanUpEdges()
    /// </summary>
    /// <param name="node"></param>
    public void UpdateEdges(List<Node> nodes, bool resetEdges)
    {
        CleanUpEdges();

        Edge[] edges;
        List<Edge> edgeList = new List<Edge>();

        foreach(Node n in nodes)
        {
            edges = n.GetComponentsInChildren<Edge>();
            foreach(Edge e in edges)
            {
                edgeList.Add(e);
            }
        }
        

        foreach (Edge e in edgeList)
        {

            Vector3 controlPointDirection;


            e.SetControlPoint(0, Vector3.zero);


            e.SetControlPoint(3, (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition));

            if (resetEdges)
            {
                controlPointDirection = (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition).normalized;

                e.SetControlPoint(1, controlPointDirection);
                controlPointDirection = (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition).normalized;


                e.SetControlPoint(2, (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition) - controlPointDirection);
            }


        }
        
    }

    

    /// <summary>
    /// Updates all edges by setting their control points to the location of thair Nodes
    /// Calls CleanUpEdges()
    /// </summary>
    /// <param name="node"></param>
    public void UpdateAllEdges(bool resetEdges)
    {
        CleanUpEdges();

        EdgeList.Clear();
        EdgeObjList.Clear();


        foreach (GameObject obj in NodeObjList)
        {
            Edge[] Edges = obj.GetComponentsInChildren<Edge>();

            foreach (Edge e in Edges)
            {
                EdgeList.Add(e);
                EdgeObjList.Add(e.gameObject);
            }
        }

        foreach (GameObject edgeObj in EdgeObjList)
        {
            edgeObj.transform.localPosition = Vector3.zero;
        }


        foreach (Edge e in EdgeList)
        {
            Vector3 controlPointDirection;
            

            e.SetControlPoint(0, Vector3.zero);


            e.SetControlPoint(3, (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition));

            if(resetEdges)
            {
                controlPointDirection = (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition).normalized;

                e.SetControlPoint(1, controlPointDirection);
                controlPointDirection = (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition).normalized;


                e.SetControlPoint(2, (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition) - controlPointDirection);
            }


        }
    }

    /// <summary>
    /// Cleans Edges before updating to make sure there is are no null values
    /// </summary>
    public void CleanUpEdges()
    {
        EdgeList.Clear();
        EdgeObjList.Clear();

        List<GameObject> nodeObjRemoveList = new List<GameObject>();
        List<GameObject> edgeObjRemoveList = new List<GameObject>();
        List<Edge> edgeRemoveList = new List<Edge>();

        foreach (GameObject obj in NodeObjList)
        {
            if(obj == null)
            {
                nodeObjRemoveList.Add(obj);
            }
            else
            {
                Edge[] Edges = obj.GetComponentsInChildren<Edge>();

                if (Edges != null)
                {
                    foreach (Edge e in Edges)
                    {
                        EdgeList.Add(e);
                        EdgeObjList.Add(e.gameObject);
                    }
                }
            }
        }

        foreach (GameObject r in nodeObjRemoveList)
        {
            NodeObjList.Remove(r);
        }

        foreach (Edge e in EdgeList)
        {
            if (e == null)
            {
                edgeRemoveList.Add(e);
                edgeObjRemoveList.Add(e.gameObject);
            }
            else
            {
                if (e.Nodes[0] == null || e.Nodes[1] == null)
                {
                    edgeRemoveList.Add(e);
                    edgeObjRemoveList.Add(e.gameObject);
                }
                else
                {
                    e.gameObject.name = "Edge" + e.Nodes[0].gameObject.name + "->" + e.Nodes[1].gameObject.name;
                }
            }
        }

        foreach (Edge r in edgeRemoveList)
        {
            EdgeList.Remove(r);
        }

        foreach (GameObject gr in edgeObjRemoveList)
        {
            EdgeObjList.Remove(gr);
            DestroyImmediate(gr);
        }
    }

    /// <summary>
    /// Removes the node from the Node List
    /// Removes itself from its Neighboring Nodes Neighbors if it has any
    /// Calls UpdateNodes()
    /// </summary>
    /// <param name="node"></param>
    /// <returns>boolean if removed successful or not</returns>
    public bool RemoveNode(Node node)
    {
        int indexToRemove = NodeList.IndexOf(node);
        int indexToDestroy = NodeObjList.IndexOf(node.gameObject);

        // Update the 
        for (int i = 0; i < node.Neighbors.Count; i++)
        {
            if (!node.Neighbors[i].Neighbors.Remove(node))
            {
                Debug.Log("Something went wrong when removing node + " + indexToRemove + " from its neighbors");
            }
        }

        bool result = NodeList.Remove(node);

        if (result)
        {
            // Make sure to destroy the children first or you will get references to destroyed objects in the editor
            var tempList = node.transform.Cast<Transform>().ToList();
            foreach (var child in tempList)
            {
                DestroyImmediate(child.gameObject);
            }

            DestroyImmediate(NodeObjList[indexToDestroy]);
        }
        UpdateAllNodes(false);
        return result;
    }

    /// <summary>
    /// Update the weight values stored in the adj matrix
    /// Always inits a new 2d array and populates it with the calculated edge values between each node
    /// Calls PrintMatrixFormatted()
    /// </summary>
    public void UpdateAdjMatrix()
    {
        AdjMatrix = new float[NodeList.Count, NodeList.Count];

        for (int i = 0; i < AdjMatrix.GetLength(0); i++)
            for (int j = 0; j < AdjMatrix.GetLength(1); j++)
            {
                if(NodeList[i].Neighbors.Contains(NodeList[j]))
                {
                    AdjMatrix[i, j] = CalcDistanceWeight(NodeList[i].transform.position, NodeList[j].transform.position);
                }
                else
                {
                    AdjMatrix[i, j] = -1;
                }
                
            }
                

        //Debug.Log("Matrix has been updated");
        //PrintMatrixFormatted();
    }

    /// <summary>
    /// Prints the matrix in a readable format
    /// This is for debugging, later willa dd DrawMatrix() for a designer interface
    /// </summary>
    public void PrintMatrixFormatted()
    {
        if (DebugMode == false)
            return;

        if (AdjMatrix == null)
        {
            Debug.Log("Adjacency matrix is empty.  Try adding some nodes.");
            return;
        }

        Debug.Log("Printing Adjacency Matrix");
        string printRow = "";
        string printMatrix = "";
        for (int i = 0; i < AdjMatrix.GetLength(0); i++)
        {
            for (int j = 0; j < AdjMatrix.GetLength(1); j++)
            {
                printRow += " " + AdjMatrix[i, j] + "  ";
            }
            printMatrix += printRow + "\n";
            printRow = "";
        }
        Debug.Log("Printing Adjacency Matrix...\n" + printMatrix);
    }

    /// <summary>
    /// Sets a weight based on the distance between two adjacent nodes
    /// </summary>
    /// <param name="from"></param>
    /// <param name="to"></param>
    protected int CalcDistanceWeight(Vector3 from, Vector3 to)
    {
        return (int)(from - to).magnitude;
    }
}
