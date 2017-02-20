using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;



[Serializable]
public class AdjacencyMatrixRow
{
    public List<float> Row;

    public AdjacencyMatrixRow()
    {
        Row = new List<float>();
    }
}

[Serializable]
public class PathElements
{
    public float[] elements;
}

public class SimulationController : MonoBehaviour
{
    

    private void Start()
    {
        
        Debug.Log(AdjMatrixToJSON());

        List<float> Path = PathFromJSON();

        Debug.Log(Path);
        
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
            Matrix[i].Row = row;
        }

        return JSONHelper.ToJson(Matrix, true);
    }

    private List<float> PathFromJSON()
    {
        List<float> path = new List<float>();

        //testing

        float[] pathArray;

        string JsonArraystring = "{\"Map\":[0,1,2,3]}";


        pathArray = JSONHelper.FromJson<float>(JsonArraystring);

        foreach (float f in pathArray)
        {
            path.Add(f);
        }

        return path;
    }

    ////Invoke this function where to want to make request.
    //void GetData()
    //{
    //    //sending the request to url
    //    WWW www = new WWW(Url);
    //    StartCoroutine("GetdataEnumerator", Url);
    //}

    //IEnumerator GetdataEnumerator(WWW www)
    //{
    //    //Wait for request to complete
    //    yield return www;
    //    if (www.error != null)
    //    {
    //        string serviceData = www.text;
    //        //Data is in json format, we need to parse the Json.
    //        Debug.Log(serviceData);
    //    }
    //    else
    //    {
    //        Debug.Log(www.error);
    //    }
    //}

    //void PostData()
    //{
    //    string JsonArraystring = "{\"Persons\": [{\"Id\":\"101\",\"Name\":\"Unity4.6\"},{\"Id\":\"102\",\"Name\":\"Unity5\"}]}";
    //    Hashtable headers = new Hashtable();
    //    headers.Add("Content-Type", "application/json");
    //    byte[] body = Encoding.UTF8.GetBytes(JsonArraystring);
    //    WWW www = new WWW(Url, body, headers);
    //    StartCoroutine("PostdataEnumerator", www);
    //}

    //IEnumerator PostdataEnumerator(WWW www)
    //{
    //    yield return www;
    //    if (www.error != null)
    //    {
    //        Debug.Log("Data Submitted");
    //    }
    //    else
    //    {
    //        Debug.Log(www.error);
    //    }
    //}
}


