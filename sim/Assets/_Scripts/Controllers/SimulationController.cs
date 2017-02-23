using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;


[RequireComponent(typeof(SimulationStats))]
[RequireComponent(typeof(APIController))]
public class SimulationController : MonoBehaviour
{
    public CarAI[] CarPrefabs;
    public FloatRange TimeBetweenSpawns;
    public int Algorithm;
    public int TotalPaths;

    private float timeSinceLastSpawn;
    private float currentSpawnDelay;
    private NodeMap Map;
    private List<CarAI> Cars;
    private List<Node> Nodes;
    private List<string> JsonPaths;
    private GameObject CarObjectPool;
    private APIController API;
    private int GetPathCount;


    private void Awake()
    {
        Map = GameObject.FindObjectOfType<NodeMap>();

        if(Map != null)
        {
            Nodes = Map.NodeList;
        }

        JSONHelper.SaveJsonFile(AdjMatrixToJSON());
        API = GetComponent<APIController>();
        GetPathCount = 0;
        JsonPaths = new List<string>();
    }

    private void Start()
    {
        SetGraph();
    }

    private void FixedUpdate()
    {
        if(GetPathCount == TotalPaths)
        {

            timeSinceLastSpawn += Time.deltaTime;
            if (timeSinceLastSpawn >= currentSpawnDelay)
            {
                timeSinceLastSpawn -= currentSpawnDelay;
                currentSpawnDelay = TimeBetweenSpawns.RandomInRange;
                SpawnCar(JsonPaths[UnityEngine.Random.Range(0, JsonPaths.Count)]);
            }
        }


    }

    private void SpawnCar(string jsonPath)
    {
        CarAI car = CarPrefabs[UnityEngine.Random.Range(0, CarPrefabs.Length)].GetPooledInstance<CarAI>();
        car.transform.localScale.Set(0.25f, 0.15f, 0.25f);

        car.Init();

        // testing json
        //string JsonArraystring1 = "{\"Map\":[0,1,2,7,12]}";
        //string JsonArraystring2 = "{\"Map\":[0,1,6,7,12]}";
        //string JsonArraystring3 = "{\"Map\":[12,7,6,1,0]}";
        //string JsonArraystring4 = "{\"Map\":[12,7,2,1,0]}";

        //string[] paths = new string[4];
        //paths[0] = JsonArraystring1;
        //paths[1] = JsonArraystring2;
        //paths[2] = JsonArraystring3;
        //paths[3] = JsonArraystring4;


        //GetPath(Nodes.IndexOf(startNode), Nodes.IndexOf(endNode), 0);

        List<Node> path = PathFromJSON(jsonPath);

        car.Pather.Map = Map;
        car.Pather.Path = path;
        car.SetNextEdge(0);
        car.Pather.PathReady = true;
    }


    private void SetGraph()
    {
        string url = "localhost:5000/init_graph_unity";
        string inputJson = AdjMatrixToJSON();
        PostDataCallback callback = StartGetPaths;
        Debug.Log(inputJson);
        API.PostData(inputJson, url, callback);
    }

    public void StartGetPaths()
    {
        //Debug.Log("callback fired");
        GetPaths();
    }

    public void GetPaths()
    {
        GetPathCount = 0;
        for (int i = 0; i < TotalPaths; i++)
        {
            int startNode;
            int endNode;
            do
            {
                startNode = UnityEngine.Random.Range(0, Nodes.Count);
                endNode = UnityEngine.Random.Range(0, Nodes.Count);
            }
            while (startNode == endNode);


            GetPath(startNode, endNode, Algorithm);
        }
    }

    private void GetPath(int startIndex, int endIndex, int algo)
    {
        string url = "localhost:5000/get_path";
        string inputJson = "{\"algorithm\":" + algo.ToString() + ",\"source\":" + startIndex.ToString() + ",\"target\":" + endIndex.ToString() + "}";
        PostDataCallback callback = OnGetPathComplete;
        //string inputJson = "{\n\t\"algorithm\":0,\n\t\"source\":0,\n\t\"target\":2\n}";
        //Debug.Log(inputJson);
        API.PostData(inputJson, url, callback, JsonPaths);
        // List<Node> path = PathFromJSON(json);
    }

    public void OnGetPathComplete()
    {
        GetPathCount++;
    }

    private string AdjMatrixToJSON()
    {
        NodeMap map = FindObjectOfType<NodeMap>();
        map.UpdateAllNodes(false);
        map.UpdateAdjMatrix();

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


