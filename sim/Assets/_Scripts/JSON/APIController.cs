using System.Collections;
using System.Collections.Generic;
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
       
        //Wait for request to complete
        yield return www;
        if (www.error != null)
        {
            string serviceData = www.text;
            //Data is in json format, we need to parse the Json.
            Debug.Log(serviceData);
        }
        else
        {
            Debug.Log(www.error);
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
        yield return www;
        Debug.Log("Data Submitted");
        if (www.error != null)
        {
            //Debug.Log("Printing API Errors");
            
            Debug.Log(www.error);
        }
        else
        {
            //Debug.Log("Printing API Response");
            //Debug.Log(www.text);
            callback();
        }
    }

    public void PostData(string json, string url, PostDataCallback callback, List<string> paths)
    {
        Hashtable headers = new Hashtable();
        headers.Add("Content-Type", "application/json");
        byte[] body = Encoding.UTF8.GetBytes(json);
        WWW www = new WWW(url, body, HashtableToDictionary<string, string>(headers));
        Debug.Log("Requesting data from Web Service");
        StartCoroutine(PostdataEnumerator(www, callback, paths));
    }

    private IEnumerator PostdataEnumerator(WWW www, PostDataCallback callback, List<string> paths)
    {
        yield return www;
        Debug.Log("Data Recieved from Web Service");
        if (www.error != null)
        {
            //Debug.Log("Printing API Errors");

            Debug.Log(www.error);
        }
        else
        {
            Debug.Log("Printing Web Service Response");
            Debug.Log(www.text);
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
