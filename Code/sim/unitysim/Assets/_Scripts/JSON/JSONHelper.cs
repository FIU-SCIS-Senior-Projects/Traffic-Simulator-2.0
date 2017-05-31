using System;
using System.IO;
using UnityEngine;

/// <summary>
/// Helper class to make conversion to JSON easier
/// </summary>
public static class JSONHelper
{
    public static T[] FromJson<T>(string json)
    {
        Wrapper<T> wrapper = JsonUtility.FromJson<Wrapper<T>>(json);
        return wrapper.map;
    }

    public static string ToJson<T>(T[] array)
    {
        Wrapper<T> wrapper = new Wrapper<T>();
        wrapper.map = array;
        return JsonUtility.ToJson(wrapper);
    }

    public static string ToJson<T>(T[] array, bool prettyPrint)
    {
        Wrapper<T> wrapper = new Wrapper<T>();
        wrapper.map = array;
        return JsonUtility.ToJson(wrapper, prettyPrint);
    }

    public static void SaveJsonFile(string json)
    {
        string path = null;
#if UNITY_EDITOR
        path = "Assets/Resources/AdjacencyMatrix.json";
#endif
#if UNITY_STANDALONE
        // You cannot add a subfolder, at least it does not work for me
        path = "Assets/Resources/AdjacencyMatrix.json";
#endif

        using (FileStream fs = new FileStream(path, FileMode.Create))
        {
            using (StreamWriter writer = new StreamWriter(fs))
            {
                writer.Write(json);
            }
        }
#if UNITY_EDITOR
        UnityEditor.AssetDatabase.Refresh();
#endif
    }

    [Serializable]
    private class Wrapper<T>
    {
        public T[] map;
    }
}