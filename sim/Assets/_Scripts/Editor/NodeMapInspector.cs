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
/// A tool to allow a non-technical designer to easily edit a Node Map
/// </summary>
public class NodeMapInspectorWindow : EditorWindow 
{
    private NodeMap map;
    private Vector3 spawnPoint;
    private Vector3 spawnOffset;
    private Node selectedNode;
    private int selectedConnectionIndex = 0;
    private AnimBool showMoreOptions;

    [MenuItem("Window/NodeMap")]
    public static void ShowWindow()
    {
        EditorWindow.GetWindow(typeof(NodeMapInspector));
    }

    public void Init(NodeMap target)
    {
        map = target;
        map.Init();
        showMoreOptions = new AnimBool(true);
        showMoreOptions.valueChanged.AddListener(Repaint);
    }

    private void OnDestroy()
    {
        Debug.Log("Editor Window Destroyed");
        CreatePrefab();
    }

    public void CreatePrefab()
    {
        string localPath = "Assets/Prefabs/NodeMaps/" + map.gameObject.name + ".prefab";
        if (AssetDatabase.LoadAssetAtPath(localPath, typeof(GameObject)))
        {
            if (EditorUtility.DisplayDialog("Are you sure?",
                "The prefab already exists. Do you want to overwrite it?",
                "Yes",
                "No"))
            {
                Debug.Log("Creating Prefab");
                CreateNewPrefab(map.gameObject, localPath);
            }
        }
        else
        {
            Debug.Log(map.gameObject.name + " is not a prefab, will convert");
            CreateNewPrefab(map.gameObject, localPath);
        }
    }

    static void CreateNewPrefab(GameObject obj, string localPath)
    {
        Debug.Log("CreateNew: " + obj.name + " : " + localPath);
        Object prefab = PrefabUtility.CreateEmptyPrefab(localPath);
        PrefabUtility.ReplacePrefab(obj, prefab, ReplacePrefabOptions.ConnectToPrefab);
    }

    /// <summary>
    /// The GUI for the Node Map Editor
    /// </summary>
    private void OnGUI()
    {
        EditorGUILayout.Space();
        // The UI to add a node
        if (GUILayout.Button("Add Node"))
        {
            map.UpdateNodes();

            spawnPoint = map.transform.position;
            spawnOffset = new Vector3(5f, 0f, 0);

            Node newNode;

            // If the user is not selecting a node when adding a node then it will be neighbored to the last node added to the list
            if (!Selection.activeGameObject)
            {
                Debug.Log("An Object is not selected");
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
                Debug.Log("An Object is selected");
                // Try to get the node component of the selected object
                selectedNode = Selection.activeGameObject.GetComponent<Node>();

                // If selected object does not have a Node Map perform same action as if there was nothing selected
                if (selectedNode == null)
                {
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
                    // If the user is selecting a node when adding a node then make the new node the neighbor of the currently selected node
                    spawnPoint = selectedNode.transform.position;

                    newNode = map.AddNode(spawnPoint + spawnOffset);

                    map.AddNeighbor(newNode, selectedNode);
                }
            }
        }

        EditorGUILayout.Space();
        if (GUILayout.Button("Remove Node"))
        {
            map.UpdateNodes();

            // If the user is not selecting a node then remove the last node in the Node List
            if (!Selection.activeGameObject)
            {
                if (map.RemoveNode(map.NodeList[map.NodeList.Count - 1]))
                {
                    Debug.Log("Node " + map.NodeList.Count + " Removed");
                }

                return;
            }

            // Try to get the node component of the selected object
            Node selectedNode = (Selection.activeGameObject.GetComponent<Node>());

            // If selected object does not have a Node Map perform same action as if there was nothing selected
            if (selectedNode == null)
            {
                if (map.RemoveNode(map.NodeList[map.NodeList.Count - 1]))
                {
                    Debug.Log("Node " + map.NodeList.Count + " Removed");
                }
                return;
            }

            // If the user is selecting a node then remove the selected node from the Node List
            int index = map.NodeList.IndexOf(selectedNode);
            if (map.RemoveNode(selectedNode))
            {
                Debug.Log("Node " + index + " Removed");
            }
        }

        EditorGUILayout.Space();
        // UI to manually Update the Nodes (used after the user moves any node in the scene view
        // Could call this on Update(), but most of the time the user does not need to move a node.  So its better to just manually call when needed.
        // Note: Adding or removing nodes will always Update the Nodes, so no need to press this button after adding or removing nodes in scene view.
        if (GUILayout.Button("Update Nodes"))
        {
            map.UpdateNodes();
        }

        EditorGUILayout.Space();
        if (GUILayout.Button("Create Prefab"))
        {
            CreatePrefab();
        }

        EditorGUILayout.Space();
        if (GUILayout.Button("Generate Mesh"))
        {

            Vector2[] verts = new Vector2[]
            {
                new Vector2(-0.25f,0),
                new Vector2(0,0),
                new Vector2(0.25f,0),
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
                if(mf.sharedMesh == null)
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

        EditorGUILayout.Space();
        if (GUILayout.Button("Re-Init Nodes"))
        {
            foreach(Node n in map.NodeList)
            {
                n.Init();
            }
        }

        EditorGUILayout.Space();
        showMoreOptions.target = EditorGUILayout.ToggleLeft("Show More Options", showMoreOptions.target);
        //Extra block that can be toggled on and off.
        if (EditorGUILayout.BeginFadeGroup(showMoreOptions.faded))
        {
            EditorGUI.indentLevel++;
            string[] options = new string[map.NodeList.Count];


            for (int i = 0; i < map.NodeList.Count; i++)
            {
                if(map.NodeList[i] != null)
                {
                    options[i] = map.NodeList[i].gameObject.name;
                } 
            }



            selectedConnectionIndex = EditorGUILayout.Popup("Select a Node", selectedConnectionIndex, options);

            if (GUILayout.Button("Connect"))
            {
                if (!Selection.activeGameObject)
                {
                    Debug.Log("An Object is not selected");
                }
                else
                {
                    Debug.Log("An Object is selected");
                    // Try to get the node component of the selected object
                    selectedNode = Selection.activeGameObject.GetComponent<Node>();

                    // If selected object does not have a Node Map perform same action as if there was nothing selected
                    if (selectedNode == null)
                    {
                        Debug.Log("Selected Object is not a Node");
                    }
                    else
                    {
                        map.AddNeighbor(map.NodeList[selectedConnectionIndex], selectedNode);
                    }
                }
            }
            EditorGUI.indentLevel--;
        }

        EditorGUILayout.EndFadeGroup();
    }


}
