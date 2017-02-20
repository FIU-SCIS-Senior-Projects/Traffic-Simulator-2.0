using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using UnityEditor.AnimatedValues;

/// <summary>
/// Custom Inspector for Node Maps
/// </summary>
[CustomEditor(typeof(NodeMap))]
public class NodeMapInspector : Editor
{
    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();
        NodeMapInspectorWindow inspectorWindow = null;
        // Opens up the NodeMap Editor
        if (GUILayout.Button("Edit NodeMap"))
        {
            inspectorWindow = EditorWindow.GetWindow<NodeMapInspectorWindow>();
            inspectorWindow.Init((NodeMap)target);
        }
    }
}

/// <summary>
/// The Node Map editor
/// Custom Editor Window
/// A tool to allow a non-technical designer to easily create and edit node maps
/// TO DO: 
///     1. UpdateSelection on all event functions before performing action
///     2. Implenent UNDO
///         
/// </summary>
public class NodeMapInspectorWindow : EditorWindow 
{
    private NodeMap map;
    private Vector3 spawnPoint;
    private Vector3 spawnOffset;
    int GridOffset = 5;
    int GridRows = 5;
    int GridColumns = 5;

    private List<Node> selectedNodes;
    private List<Edge> selectedEdges;
    private int selectedConnectionIndex = 0;
    private AnimBool showMoreOptions;
    private string prefabName = "NodeMap1";

    [MenuItem("Window/NodeMap")]
    public static void ShowWindow()
    {
        EditorWindow.GetWindow(typeof(NodeMapInspector));
    }

    /// <summary>
    /// Initializes the nodemap and the GUI
    /// </summary>
    /// <param name="target"></param>
    public void Init(NodeMap target)
    {
        map = target;
        map.Init();
        showMoreOptions = new AnimBool(true);
        showMoreOptions.valueChanged.AddListener(Repaint);
        selectedNodes = new List<Node>();
        selectedEdges = new List<Edge>();
    }

    /// <summary>
    /// Called when the window is destroyed
    /// Prompts the user to save before destroying
    /// </summary>
    private void OnDestroy()
    {
        Debug.Log("Editor Window Destroyed");
        CreatePrefab(prefabName);
    }

    private void OnUpdateSelection()
    {
        
        if(GUILayout.Button("Update Selection"))
        {

            
            selectedNodes.Clear();
            selectedEdges.Clear();
            if (Selection.gameObjects != null)
            {
                
                if (Selection.gameObjects.Length > 0)
                {
                    foreach (GameObject go in Selection.gameObjects)
                    {
                        Node node = go.GetComponent<Node>();
                        Edge edge = go.GetComponent<Edge>();

                        if(edge != null)
                        {
                            selectedEdges.Add(edge);
                        }

                        if (node != null)
                        {
                            
                            selectedNodes.Add(node);
                        }
                    }
                }
            }   
        }
    }

    /// <summary>
    /// The GUI for the Node Map Editor
    /// </summary>
    private void OnGUI()
    {
        OnAddGrid();

        EditorGUILayout.Space();

        OnAddNode();

        EditorGUILayout.Space();

        OnRemoveNode();

        EditorGUILayout.Space();

        OnUpdateAllEdges();
        OnResetAllEdges();
        OnUpdateSelectedEdges();
        OnGenerateIntersections();


        EditorGUILayout.Space();

        OnGenerateMesh();

        EditorGUILayout.Space();

        OnShowMoreOptions();

        EditorGUILayout.EndFadeGroup();
    }

    /// <summary>
    /// Shows more GUI options
    /// </summary>
    private void OnShowMoreOptions()
    {
        showMoreOptions.target = EditorGUILayout.ToggleLeft("Show More Options", showMoreOptions.target);
        //Extra block that can be toggled on and off.
        if (EditorGUILayout.BeginFadeGroup(showMoreOptions.faded))
        {
            EditorGUI.indentLevel++;



            OnConnectNodes();

            EditorGUILayout.Space();

            OnDisconnectNodes();

            EditorGUILayout.Space();

            OnCreatePrefab();

            EditorGUILayout.Space();

            OnUpdateSelection();


            if (selectedNodes != null && selectedNodes.Count > 0)
            {
                string selectedNodeNames = "";
                int count = 0;
                foreach (Node n in selectedNodes)
                {

                    selectedNodeNames += n.name + ", ";

                    if (count > 3)
                    {
                        count = 0;
                        selectedNodeNames += "\n\t         ";
                    }
                    count++;
                }

                GUILayout.Label("Selecting Nodes: " + selectedNodeNames);
            }

            EditorGUI.indentLevel--;
        }
    }

    public void OnAddGrid()
    {
        GridRows = EditorGUILayout.IntField("Number of Rows: ", GridRows);
        GridColumns = EditorGUILayout.IntField("Number of Nodes Per Row: ", GridColumns);
        GridOffset = EditorGUILayout.IntSlider("Node Offset", GridOffset, 1, 10);

        List<Node> gridNodes = new List<Node>();

        if (GUILayout.Button("Add Grid"))
        {
            gridNodes = map.AddNodeGrid(GridColumns, GridRows, map.transform.position, GridOffset);
        }

        map.UpdateEdges(gridNodes, true);

    }

    /// <summary>
    /// Saves the Nodemap currently being edited with a specified name
    /// </summary>
    /// <param name="name"></param>
    public void CreatePrefab(string name)
    {
        string localPath = "Assets/Prefabs/NodeMaps/" + name + ".prefab";
        if (AssetDatabase.LoadAssetAtPath(localPath, typeof(GameObject)))
        {
            if (EditorUtility.DisplayDialog("Are you sure?",
                "The prefab already exists. Do you want to overwrite it?",
                "Yes",
                "No"))
            {
                Debug.Log("Creating Prefab");
                CreateNewPrefab(map.gameObject, name, localPath);
            }
        }
        else
        {
            Debug.Log(map.gameObject.name + " is not a prefab, will convert");
            CreateNewPrefab(map.gameObject, name, localPath);
        }
    }

    /// <summary>
    /// static helper method to save prefabs
    /// </summary>
    /// <param name="obj"></param>
    /// <param name="name"></param>
    /// <param name="localPath"></param>
    private static void CreateNewPrefab(GameObject obj, string name, string localPath)
    {
        Debug.Log("CreateNew: " + name + " : " + localPath);
        Object prefab = PrefabUtility.CreateEmptyPrefab(localPath);
        PrefabUtility.ReplacePrefab(obj, prefab, ReplacePrefabOptions.ConnectToPrefab);
    }



    /// <summary>
    /// Adds a node to the nodemap
    /// If no object is selected it adds it and makes it a neighbor of the last node in the map
    /// If an object is selected, but that object is not a node it does the same as above
    /// If an object is selected and it is a node it adds the node as a neighbor to the selected node
    /// </summary>
    private void OnAddNode()
    {
        if (GUILayout.Button("Add Node"))
        {
            map.UpdateAllNodes(false);

            spawnPoint = map.transform.position;
            spawnOffset = new Vector3(5f, 0f, 0);

            Node newNode;

            // If the user is not selecting a node when adding a node then it will be neighbored to the last node added to the list
            if (selectedNodes == null || selectedNodes.Count == 0)
            {
                Debug.Log("A node is not selected");
                if (map.NodeList.Count > 0)
                {
                    spawnPoint = map.NodeList[map.NodeList.Count - 1].transform.position;
                    newNode = map.AddNode(spawnPoint + spawnOffset);

                }
                else
                {
                    spawnPoint = map.transform.position;
                    newNode = map.AddNode(spawnPoint + spawnOffset);
                }

                if (map.NodeList.Count > 1)
                {
                    map.AddNeighbor(newNode, map.NodeList[map.NodeList.Count - 2]);
                }
            }
            else
            {
                Debug.Log("A node is selected");

                // If the user is selecting a node when adding a node then make the new node the neighbor of the currently selected node
                spawnPoint = selectedNodes[0].transform.position;

                newNode = map.AddNode(spawnPoint + spawnOffset);

                map.AddNeighbor(newNode, selectedNodes[0]);
            }
        }
    }

    /// <summary>
    /// Removes a node from the node map
    /// If no object is selected the last node in the node map is removed
    /// If an object is selected and it is not a node then the same action as above
    /// If an object is selected and it is a node then it removes the selected node
    /// All neighbors are updated according on removal
    /// </summary>
    private void OnRemoveNode()
    {
        if (GUILayout.Button("Remove Node"))
        {
            if (map.NodeList.Count == 0 || map.NodeList == null)
                return;

            map.UpdateAllNodes(false);

            // If the user is not selecting a node then remove the last node in the Node List
            if (selectedNodes == null || selectedNodes.Count == 0)
            {
                if (map.RemoveNode(map.NodeList[map.NodeList.Count - 1]))
                {
                    Debug.Log("Node " + map.NodeList.Count + " Removed");
                }

                return;
            }
            else
            {
                // If the user is selecting a node then remove the selected node from the Node List
                List<Node> selectedNodesToRemove = new List<Node>();
                foreach(Node n in selectedNodes)
                {
                    int index = map.NodeList.IndexOf(n);
                    string removedNode = map.NodeList[index].name;
                    if (map.RemoveNode(n))
                    {
                        Debug.Log("'" + removedNode + "' Removed");
                        selectedNodesToRemove.Add(n);
                    }
                }

                foreach(Node n in selectedNodesToRemove)
                {
                    selectedNodes.Remove(n);
                }

            }
        }
    }

    /// <summary>
    /// Creates a prefab of the nodemap and saves it in a pre determined folder
    /// </summary>
    private void OnCreatePrefab()
    {
        prefabName = EditorGUILayout.TextField("Prefab Name: ", prefabName);
        if (GUILayout.Button("Create Prefab"))
        {
            Debug.Log(prefabName);
            CreatePrefab(prefabName);
        }
    }

    private void OnGenerateIntersections()
    {
        if (GUILayout.Button("Generate Intersections"))
        {
            if (selectedEdges != null || selectedEdges.Count > 0)
            {
                map.GenerateIntersectionNodes(selectedEdges);
            }
        }
    }

    /// <summary>
    /// Updates all the nodes and edges in the map
    /// </summary>
    private void OnUpdateSelectedEdges()
    {
        if (GUILayout.Button("Update Selected Edges"))
        {
            if (selectedNodes != null || selectedNodes.Count > 0)
            {
                map.UpdateEdges(selectedNodes, false);
            }
        }
    }

    /// <summary>
    /// Updates all the nodes and edges in the map
    /// </summary>
    private void OnResetSelectedEdges()
    {
        if (GUILayout.Button("Update Selected Edges"))
        {
            if (selectedNodes != null || selectedNodes.Count > 0)
            {
                map.UpdateEdges(selectedNodes, true);
            }
        }
    }

    /// <summary>
    /// Updates all the nodes and edges in the map
    /// </summary>
    private void OnUpdateAllEdges()
    {
        if (GUILayout.Button("Update All Edges"))
        {
            map.UpdateAllNodes(false);
        }
    }

    /// <summary>
    /// Updates all the nodes and edges in the map
    /// </summary>
    private void OnResetAllEdges()
    {
        if (GUILayout.Button("Reset All Edges"))
        {
            map.UpdateAllNodes(true);
        }
    }

    /// <summary>
    /// Procedural generates a mesh from the edge spline
    /// Used to simulate roads
    /// </summary>
    private void OnGenerateMesh()
    {
        if (GUILayout.Button("Generate Mesh"))
        {

            Vector2[] verts = new Vector2[]
            {
                new Vector2(-0.5f,0),
                new Vector2(0,0),
                new Vector2(0.5f,0)
            };

            Vector2[] norms = new Vector2[]
            {
                Vector2.up,
                Vector2.up,
                Vector2.up
            };

            float[] uCoords = new float[]
            {
                0,
                1,
                0
            };

            ExtrudeShape shape = new ExtrudeShape(verts, norms, uCoords);

            foreach (Edge edge in map.EdgeList)
            {
                List<OrientedPoint> path = new List<OrientedPoint>();
                MeshFilter mf = edge.gameObject.GetComponent<MeshFilter>();
                if (mf.sharedMesh == null)
                {
                    mf.sharedMesh = new Mesh();
                }
                Mesh mesh = mf.sharedMesh;


                foreach (OrientedPoint p in edge.GeneratePath(1000f))
                {
                    path.Add(p);
                }

                edge.Extrude(mesh, shape, path.ToArray());
            }
        }

        EditorGUILayout.Space();
        if (GUILayout.Button("Clear Mesh"))
        {
            foreach (Edge edge in map.EdgeList)
            {
                MeshFilter mf = edge.gameObject.GetComponent<MeshFilter>();
                if (mf.sharedMesh == null)
                {
                    mf.sharedMesh = new Mesh();
                }
                Mesh mesh = mf.sharedMesh;

                mesh.Clear();
            }

        }
    }



    /// <summary>
    /// Connects two nodes
    /// User selects a node in the scene and selects a node to connect it to from a drop down menu
    /// TO DO: Add connections when more than 2 nodes are selected
    /// </summary>
    private void OnConnectNodes()
    {
        if (GUILayout.Button("Connect Nodes"))
        {
            if (selectedNodes != null && selectedNodes.Count != 0)
            {

                if (selectedNodes.Count < 2)
                {
                    Debug.Log("Please select at least two nodes to connect");
                    return;
                }

                if (selectedNodes.Count > 2)
                {

                    map.NearestNeighborsConnectNodes(selectedNodes);
                    
                }
                else
                {
                    map.AddNeighbor(selectedNodes[0], selectedNodes[1]);
                }
            }
        }
    }



    /// <summary>
    /// </summary>
    private void OnDisconnectNodes()
    {
        if (GUILayout.Button("Disconnect Nodes"))
        {
            if (selectedNodes != null && selectedNodes.Count != 0)
            {
                foreach(Node n in selectedNodes)
                {
                    map.RemoveAllNeighbors(n);
                }
            }
        }
    }




}
