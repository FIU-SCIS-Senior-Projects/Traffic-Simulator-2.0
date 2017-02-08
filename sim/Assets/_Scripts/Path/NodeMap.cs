using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using System;

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

    private int[,] AdjMatrix;

    /// <summary>
    /// Inits the Node Map, only called once
    /// </summary>
    public void Init()
    {
        NodeList = new List<Node>();
        EdgeList = new List<Edge>();
        NodeObjList = new List<GameObject>();
        UpdateNodes();
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
        nodeObj.transform.parent = transform;
        Node newNode = nodeObj.AddComponent<Node>();
        newNode.Init();
        UpdateNodes();
        return newNode;
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
        node.Neighbors.Add(neighbor);
        neighbor.Neighbors.Add(node);

        GameObject edgeObj1 = Instantiate(EdgePrefab, node.gameObject.transform.position, Quaternion.identity);

        edgeObj1.transform.parent = node.gameObject.transform;

        Edge newEdge1 = edgeObj1.AddComponent<Edge>();

        newEdge1.Init();

        newEdge1.Nodes.Add(node);
        newEdge1.Nodes.Add(neighbor);


        UpdateNodes();
    }

    /// <summary>
    /// Updates the Node Map, called when needed
    /// Calls UpdateAdjMatrix()
    /// Calls UpdateEdges()
    /// </summary>
    public void UpdateNodes()
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
        UpdateAdjMatrix();
        UpdateEdges();
    }


    /// <summary>
    /// Updates all edges by setting their control points to the location of thair Nodes
    /// Calls CleanUpEdges()
    /// </summary>
    /// <param name="node"></param>
    public void UpdateEdges()
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
            e.SetControlPoint(0, Vector3.zero);
            e.SetControlPoint(3, (e.Nodes[1].gameObject.transform.localPosition - e.Nodes[0].gameObject.transform.localPosition));
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

        // Update the neighbors
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
        UpdateNodes();
        return result;
    }

    /// <summary>
    /// Update the weight values stored in the adj matrix
    /// Always inits a new 2d array and populates it with the calculated edge values between each node
    /// Calls PrintMatrixFormatted()
    /// </summary>
    public void UpdateAdjMatrix()
    {
        AdjMatrix = new int[NodeList.Count, NodeList.Count];

        for (int i = 0; i < AdjMatrix.GetLength(0); i++)
            for (int j = 0; j < AdjMatrix.GetLength(1); j++)
                AdjMatrix[i,j] = CalcDistanceWeight(NodeList[i].transform.position, NodeList[j].transform.position);

        Debug.Log("Matrix has been updated");
        PrintMatrixFormatted();
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
            //Debug.Log("Adjacency matrix is empty.  Try adding some nodes.");
            return;
        }

        //Debug.Log("Printing Adjacency Matrix");
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
