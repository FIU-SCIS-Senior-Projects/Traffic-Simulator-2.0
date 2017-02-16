using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Simple AI that moves through a list of waypoints until it reaches its final destination
/// Uses colliders to detect when it has reached a waypoint
/// For now I am manually setting a path of up to 10 waypoints, but in future these waypoints would come from the output of the pathfinding algorithm
/// </summary>
[RequireComponent(typeof(SplineWalker))]
public class CarAI : MonoBehaviour
{
    public float MaxSpeed;
    public float SlowSpeed;
    public NodeMap Map;
    public Sensor FrontSensor;
    public Sensor RearSensor;

    public List<Node> Path;
    private SplineWalker Walker;
    private Node[] AvailableNodes;
    private Edge[] AvailableEdges;
    public Node NextNode;
    public Node CurrentNode;
    private int CurrentPathIndex;

    private List<Node> potentialNextNodes = new List<Node>();

    private bool PathReady = false;
    private bool GoingForward = true;

    /// <summary>
    /// Called once after Awake()
    /// </summary>
    protected void Start()
    {
        CurrentPathIndex = 0;
        Path = new List<Node>();
        Walker = GetComponent<SplineWalker>();
        Walker.Mode = SplineWalkerMode.Once;

        // This is hardcoded temporarily.  In future will get a duration based on our speed and the arclength of the bezier spline (see bezier spline class)
        Walker.Duration = MaxSpeed;
        GetPath(20);

        SetNextEdge(CurrentPathIndex);
        CurrentPathIndex++;
    }

    /// <summary>
    /// Called every frame
    /// </summary>
    protected void Update()
    {
        if (!PathReady)
            return;

        if (CurrentPathIndex == Path.Count-1)
        {
            CurrentPathIndex = 0;
            transform.position = Path[CurrentPathIndex].gameObject.transform.position;
        }

        if(GoingForward)
        {
            Walker.LaneMultiplier = 0.15f;
            if (Walker.Progress == 1f)
            {
                SetNextEdge(CurrentPathIndex);
                
                CurrentPathIndex++;
            }
        }
        else
        {
            Walker.LaneMultiplier = -0.15f;
            if (Walker.Progress == 0f)
            {
                SetNextEdge(CurrentPathIndex);
                
                CurrentPathIndex++;
            }
        }

        CheckFront();
    }

    private void CheckFront()
    {
        if(FrontSensor.SensorTrigger)
        {
            Walker.Duration = SlowSpeed;
        }
        else
        {
            Walker.Duration = MaxSpeed;
        }
    }

    private void CheckRear()
    {
        if (RearSensor.SensorTrigger)
        {
            if(!FrontSensor.SensorTrigger)
            {
                Walker.Duration = MaxSpeed;
            }
        }
    }

    /// <summary>
    /// Test method to get a random path
    /// Later we will get a path from an algorithm
    /// </summary>
    protected void GetPath(int size)
    {
        int randomNodeIndex = Random.Range(0, Map.NodeList.Count-1);
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
    protected Edge GetNextEdge()
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

    /// <summary>
    /// Sets the next edge
    /// </summary>
    /// <param name="currentNodeIndex"></param>
    protected void SetNextEdge(int currentNodeIndex)
    {
        CurrentNode = Path[currentNodeIndex];
        NextNode = Path[currentNodeIndex + 1];

        Walker.Spline = GetNextEdge();
        Walker.GoingForward = this.GoingForward;
        if(GoingForward)
        {
            Walker.Progress = 0f;
        }
        else
        {
            Walker.Progress = 1f;
        }

    }
}
