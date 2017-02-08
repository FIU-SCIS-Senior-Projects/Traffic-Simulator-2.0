using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UniqueMesh : MonoBehaviour
{
    [HideInInspector]
    public int OwnerID;

    private MeshFilter _mf;
    private MeshFilter mf
    {
        get
        {
            _mf = _mf == null ? GetComponent<MeshFilter>() : _mf;
            _mf = _mf == null ? gameObject.AddComponent<MeshFilter>() : _mf;
            return _mf;
        }
    }
    Mesh _mesh;
    public Mesh mesh
    {
        get
        {
            bool isOwner = OwnerID == gameObject.GetInstanceID();
            if(mf.sharedMesh == null || !isOwner)
            {
                mf.sharedMesh = _mesh = new Mesh();
                OwnerID = gameObject.GetInstanceID();
                _mesh.name = "Mesh [" + OwnerID + "]";
            }
            return _mesh;
        }
    }
}
