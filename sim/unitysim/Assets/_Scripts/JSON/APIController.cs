using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using UnityEngine;

/// <summary>
/// Callback delegate
/// </summary>
public delegate void PostDataCallback();

/// <summary>
/// Class to make API calls
/// </summary>
public class APIController : MonoBehaviour
{



    //Invoke this function where to want to make request.
    public void GetData(string url)
    {
        //sending the request to url
        WWW www = new WWW(url);
        
        StartCoroutine("GetdataEnumerator", www);
    }

    private IEnumerator GetdataEnumerator(WWW www)
    {
        Stopwatch stopwatch = new Stopwatch();
        stopwatch.Start();
        //Wait for request to complete
        yield return www;
        stopwatch.Stop();
        UnityEngine.Debug.Log("Post request completed" + "\nCompleted in " + stopwatch.ElapsedMilliseconds + "ms.");
        if (www.error != null)
        {
            string serviceData = www.text;
            //Data is in json format, we need to parse the Json.
            UnityEngine.Debug.Log(serviceData);
        }
        else
        {
            UnityEngine.Debug.Log(www.error);
        }
    }

    public void PostData(string json, string url, PostDataCallback callback)
    {
        Hashtable headers = new Hashtable();
        headers.Add("Content-Type", "application/json");
        byte[] body = Encoding.UTF8.GetBytes(json);
        WWW www = new WWW(url, body, HashtableToDictionary<string, string>(headers));
        StartCoroutine(PostdataEnumerator(www, callback));
    }

    private IEnumerator PostdataEnumerator(WWW www, PostDataCallback callback)
    {
        Stopwatch stopwatch = new Stopwatch();
        stopwatch.Start();
        yield return www;
        
        stopwatch.Stop();
        UnityEngine.Debug.Log("Post request completed" + "\nCompleted in " + stopwatch.ElapsedMilliseconds + "ms.");
        if (www.error != null)
        {
            UnityEngine.Debug.Log("Error returned from API: \n" + www.error + "\nCompleted in ");
        }
        else
        {
            UnityEngine.Debug.Log("Response returned from API: \n" + www.text);
            callback();
        }
    }

    public void PostData(string json, string url, PostDataCallback callback, List<string> paths)
    {
        Hashtable headers = new Hashtable();
        headers.Add("Content-Type", "application/json");
        byte[] body = Encoding.UTF8.GetBytes(json);
        WWW www = new WWW(url, body, HashtableToDictionary<string, string>(headers));
        StartCoroutine(PostdataEnumerator(www, callback, paths));
    }

    private IEnumerator PostdataEnumerator(WWW www, PostDataCallback callback, List<string> paths)
    {
        Stopwatch stopwatch = new Stopwatch();
        stopwatch.Start();
        yield return www;
        stopwatch.Stop();
        UnityEngine.Debug.Log("Post request completed" + "\nCompleted in " + stopwatch.ElapsedMilliseconds + "ms.");
        if (www.error != null)
        {
            
            UnityEngine.Debug.Log("Error returned from API: \n" + www.error + "\nCompleted in ");
        }
        else
        {
            UnityEngine.Debug.Log("Response returned from API: \n" + www.text + "\nCompleted in ");

            paths.Add(www.text);
            callback();
        }
    }

    public static Dictionary<K, V> HashtableToDictionary<K, V>(Hashtable table)
    {
        return table
        .Cast<DictionaryEntry>()
        .ToDictionary(kvp => (K)kvp.Key, kvp => (V)kvp.Value);
    }

}
