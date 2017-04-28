using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

/// <summary>
/// Class to represent a position node or position in a graph
/// </summary>
[Serializable]
public class Node : MonoBehaviour
{
    [SerializeField]
    public List<Node> Neighbors;

    public void Init()
    {
        Neighbors = new List<Node>();
    }

}
