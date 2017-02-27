﻿using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Controls all simulation options and routines
/// </summary>
[RequireComponent(typeof(SimulationStats))]
[RequireComponent(typeof(APIController))]
public class SimulationController : MonoBehaviour
{
    public CarAI[] CarPrefabs;
    public FloatRange TimeBetweenSpawns;
    public FloatRange RushHourTimeBetweenSpawns;
    public int Algorithm;
    public int TotalPaths;
    public float SetGraphInterval;
    public float FullSimInterval;
    public float RushHourStartTime;
    public float RushHourEndTime;
    private float CurrentSimTime;
    public List<Node> StartNodes;
    public List<Node> EndNodes;

    private float timeSinceLastSpawn;
    private float currentSpawnDelay;
    private NodeMap Map;
    private List<CarAI> Cars;
    private List<Node> Nodes;
    private List<string> JsonPaths;
    private GameObject CarObjectPool;
    private APIController API;
    private int GetPathCount;
    private SimulationStats stats;

    /// <summary>
    /// Initializes simulation variables
    /// </summary>
    private void Init()
    {
        Map = GameObject.FindObjectOfType<NodeMap>();
        stats = GetComponent<SimulationStats>();
        stats.Init(Map, Map.EdgeList.ToArray());

        if (Map != null)
        {
            Nodes = Map.NodeList;
        }

        JSONHelper.SaveJsonFile(AdjMatrixToJSON());
        API = GetComponent<APIController>();
        GetPathCount = 0;
        JsonPaths = new List<string>();
    }

    /// <summary>
    /// Called first and once
    /// </summary>
    private void Awake()
    {
        Init();
    }

    /// <summary>
    /// Called after Awake()
    /// </summary>
    private void Start()
    {
        StartCoroutine(SetGraph());

    }

    /// <summary>
    /// Called once per frame
    /// </summary>
    private void Update()
    {
        CurrentSimTime += Time.deltaTime;
        if (CurrentSimTime > FullSimInterval)
        {
            CurrentSimTime = 0;
        }

    }


    /// <summary>
    /// Called every fixed framerate frame
    /// </summary>
    private void FixedUpdate()
    {
        if(GetPathCount == TotalPaths)
        {
            timeSinceLastSpawn += Time.deltaTime;
            if (timeSinceLastSpawn >= currentSpawnDelay)
            {
                timeSinceLastSpawn -= currentSpawnDelay;
                if(CurrentSimTime < RushHourStartTime || CurrentSimTime > RushHourEndTime)
                {
                    currentSpawnDelay = TimeBetweenSpawns.RandomInRange;
                }
                else
                {
                    currentSpawnDelay = RushHourTimeBetweenSpawns.RandomInRange;
                }
                
                SpawnCar(JsonPaths[UnityEngine.Random.Range(0, JsonPaths.Count)]);
            }
        }
    }

    /// <summary>
    /// Instantiates a CarAI object and sets its path
    /// </summary>
    /// <param name="jsonPath"></param>
    private void SpawnCar(string jsonPath)
    {
        CarAI car = CarPrefabs[UnityEngine.Random.Range(0, CarPrefabs.Length)].GetPooledInstance<CarAI>();
        car.transform.localScale.Set(0.25f, 0.15f, 0.25f);

        car.Init();

        List<Node> path = PathFromJSON(jsonPath);

        car.Pather.Map = Map;
        car.Pather.Path = path;
        car.SetNextEdge(0);
        car.Pather.PathReady = true;
    }

    /// <summary>
    /// Used to Set/Update the graph and make an API call to update the Adj Matrix
    /// </summary>
    /// <returns></returns>
    private IEnumerator SetGraph()
    {
        while(true)
        {
            string url = "localhost:5000/init_graph_unity";
            string inputJson = AdjMatrixToJSON();

            PostDataCallback callback = StartGetPaths;
            Debug.Log(inputJson);
            API.PostData(inputJson, url, callback);

            yield return new WaitForSeconds(SetGraphInterval);
        }
    }

    /// <summary>
    /// Helper to start the get path routine
    /// </summary>
    public void StartGetPaths()
    {
        //Debug.Log("callback fired");
        GetPaths();
    }

    /// <summary>
    /// Gets a path from the set of start nodes to the set of end nodes
    /// </summary>
    public void GetPaths()
    {
        GetPathCount = 0;
        JsonPaths.Clear();

        for (int i = 0; i < TotalPaths; i++)
        {
            int startIndex;
            int endIndex;
            Node startNode;
            Node endNode;

            do
            {
                startNode = StartNodes[UnityEngine.Random.Range(0, StartNodes.Count)];
                endNode = EndNodes[UnityEngine.Random.Range(0, EndNodes.Count)];
            }
            while (startNode == endNode);

            startIndex = Nodes.IndexOf(startNode);
            endIndex = Nodes.IndexOf(endNode);

            float coinToss = UnityEngine.Random.Range(0f,1f);

            if(coinToss > 0.5f)
            {
                GetPath(startIndex, endIndex, Algorithm);
            }
            else
            {
                GetPath(endIndex, startIndex, Algorithm);
            }
        }
    }

    /// <summary>
    /// Makes the API call to get a path given a start node, end node, and algorithm to use
    /// </summary>
    /// <param name="startIndex"></param>
    /// <param name="endIndex"></param>
    /// <param name="algo"></param>
    private void GetPath(int startIndex, int endIndex, int algo)
    {
        string url = "localhost:5000/get_path";
        string inputJson = "{\"algorithm\":" + algo.ToString() + ",\"source\":" + startIndex.ToString() + ",\"target\":" + endIndex.ToString() + "}";

        PostDataCallback callback = OnGetPathComplete;
        API.PostData(inputJson, url, callback, JsonPaths);
    }

    /// <summary>
    /// Callback fired when path is recieved from the API
    /// </summary>
    public void OnGetPathComplete()
    {
        GetPathCount++;
    }

    /// <summary>
    /// Converts an Adjacency Matrix to Json
    /// </summary>
    /// <returns></returns>
    private string AdjMatrixToJSON()
    {
        NodeMap map = FindObjectOfType<NodeMap>();
        map.UpdateAllNodes(false);
        map.UpdateAdjMatrix();

        stats.CalcEdgeWeights();

        AdjacencyMatrixRow[] Matrix = new AdjacencyMatrixRow[map.NodeList.Count];

        for(int i = 0; i < map.NodeList.Count; i++)
        {
            List<float> row = new List<float>();
            for(int j = 0; j < map.NodeList.Count; j++)
            {
                row.Add(map.AdjMatrix[i,j]);
            }
            Matrix[i] = new AdjacencyMatrixRow();
            Matrix[i].row = row;
        }

        return JSONHelper.ToJson(Matrix, true);
    }

    /// <summary>
    /// Converts a Json Path to a List of Nodes
    /// </summary>
    /// <param name="json"></param>
    /// <returns></returns>
    private List<Node> PathFromJSON(string json)
    {
        List<Node> path = new List<Node>();

        int[] pathArray;

        pathArray = JSONHelper.FromJson<int>(json);

        foreach (int f in pathArray)
        {
            path.Add(Nodes[f]);
        }

        return path;
    }

    
}


