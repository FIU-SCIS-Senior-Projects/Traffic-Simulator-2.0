using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;



/// <summary>
/// Class to handle collecting and calculating statistic from the Simulation
/// </summary>
public class SimulationStats : MonoBehaviour
{
    public int TotalCarsRouted;
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
        TotalCarsRouted = 0;
        EdgeCounts = new Dictionary<Edge, int>();
        foreach(Edge e in edges)
        {
            EdgeCounts.Add(e, 1);
        }
        Map = map;
    }

    private void Update()
    {
        TintCars();
    }

    private void TintCars()
    {
        TotalCarsRouted = 0;

        foreach (Edge key in EdgeCounts.Keys.ToList())
            EdgeCounts[key] = 1;

        CurrentCars = GameObject.FindObjectsOfType<CarAI>();

        foreach (CarAI car in CurrentCars)
        {


            if (car.Pather.Map == Map)
            {
                Edge currentedge = car.Walker.Spline;
                EdgeCounts[currentedge]++;
                Material mat = car.GetComponent<MeshRenderer>().material;
                if (mat != null)
                {
                    if (!car.NonAPICar)
                    {
                        TotalCarsRouted++;

                        if (EdgeCounts[currentedge] > 6)
                        {
                            mat.SetColor("_Color", new Color(1f, 0.4f, 0.1f, 1));
                        }
                        else if (EdgeCounts[currentedge] > 5)
                        {
                            mat.SetColor("_Color", new Color(0.8f, 0.4f, 0.1f, 1));
                        }
                        else if (EdgeCounts[currentedge] > 4)
                        {
                            mat.SetColor("_Color", new Color(0.5f, 0.5f, 0.1f, 1));
                        }
                        else if (EdgeCounts[currentedge] > 3)
                        {
                            mat.SetColor("_Color", new Color(0.4f, 0.6f, 0.1f, 1));
                        }
                        else if (EdgeCounts[currentedge] > 2)
                        {
                            mat.SetColor("_Color", new Color(0.4f, 0.8f, 0.1f, 1));
                        }
                        else
                        {
                            mat.SetColor("_Color", new Color(0.4f, 1f, 0.1f, 1));
                        }
                    }

                }
            }
        }
    }

    /// <summary>
    /// Counts the number of cars on each edge and updates the counts in the dictionary
    /// Updates the Adjacency Matrix in NodeMap
    /// This gets called when the Sim Controller calls Set Graph so the adj matrix is always up to date when an API call is made
    /// </summary>
    public void CalcEdgeWeights()
    {
        foreach (Edge key in EdgeCounts.Keys.ToList())
            EdgeCounts[key] = 1;

        CurrentCars = GameObject.FindObjectsOfType<CarAI>();

        foreach(CarAI car in CurrentCars)
        {
            if(car.Pather.Map == Map)
            {
                Edge currentedge = car.Walker.Spline;
                EdgeCounts[currentedge]++;
            }
        }

        foreach (var key in EdgeCounts.Keys)
        {
            Node n0 = key.Nodes[0];
            Node n1 = key.Nodes[1];

            int index0 = Map.NodeList.IndexOf(n0);
            int index1 = Map.NodeList.IndexOf(n1);


            Map.AdjMatrix[index0, index1] = (float)EdgeCounts[key] + Vector3.Distance(n0.transform.position, n1.transform.position);
            Map.AdjMatrix[index1, index0] = (float)EdgeCounts[key] + Vector3.Distance(n0.transform.position, n1.transform.position);
        }
        //Debug.Log("Updated Matrix");
        Map.PrintMatrixFormatted();
    }
}
