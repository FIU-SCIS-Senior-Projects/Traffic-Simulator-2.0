using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Class to handle collecting and calculating statistic from the Simulation
/// </summary>
public class SimulationStats : MonoBehaviour
{
    private Dictionary<Edge, int> EdgeCounts;
    private CarAI[] CurrentCars;
    private NodeMap Map;

    /// <summary>
    /// Initializes the map and edge counts
    /// </summary>
    /// <param name="map"></param>
    /// <param name="edges"></param>
    public void Init(NodeMap map, Edge[] edges)
    {
        EdgeCounts = new Dictionary<Edge, int>();
        foreach(Edge e in edges)
        {
            EdgeCounts.Add(e, 1);
        }
        Map = map;
    }

    /// <summary>
    /// Counts the number of cars on each edge and updates the counts in the dictionary
    /// Updates the Adjacency Matrix in NodeMap
    /// This gets called when the Sim Controller calls Set Graph so the adj matrix is always up to date when an API call is made
    /// </summary>
    public void CalcEdgeWeights()
    {
        CurrentCars = GameObject.FindObjectsOfType<CarAI>();

        foreach(CarAI car in CurrentCars)
        {
            Edge currentedge = car.Walker.Spline;
            EdgeCounts[currentedge]++;
        }

        foreach (var key in EdgeCounts.Keys)
        {
            Node n0 = key.Nodes[0];
            Node n1 = key.Nodes[1];

            int index0 = Map.NodeList.IndexOf(n0);
            int index1 = Map.NodeList.IndexOf(n1);



            Map.AdjMatrix[index0, index1] = (float)EdgeCounts[key];
            Map.AdjMatrix[index1, index0] = (float)EdgeCounts[key];
        }
        Debug.Log("Updated Matrix");
        Map.PrintMatrixFormatted();
    }
}
