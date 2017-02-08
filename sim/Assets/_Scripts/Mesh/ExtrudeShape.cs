using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ExtrudeShape
{
    public Vector2[] Verts;
    public Vector2[] Normals;
    public float[] UCoords;

    public ExtrudeShape(Vector2[] verts, Vector2[] normals, float[] uCoords)
    {
        Verts = verts;
        Normals = normals;
        UCoords = uCoords;
    }

    IEnumerable<int> LineSegment(int i)
    {
        yield return i;
        yield return i + 1;
    }

    int[] lines;
    public int[] Lines
    {
        get
        {
            if (lines == null)
            {
                lines = Enumerable.Range(0, Verts.Length - 1)
                    .SelectMany(i => LineSegment(i))
                    .ToArray();
            }

            return lines;
        }
    }
};