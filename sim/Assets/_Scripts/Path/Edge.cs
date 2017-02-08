using System.Collections;
using System.Collections.Generic;
using System;
using UnityEngine;


[Serializable]
public class Edge : MonoBehaviour
{
    [SerializeField]
    public int LineSteps = 10;

    [SerializeField]
    public float DirectionScale = 2f;

    [SerializeField]
    private Vector3[] points;

    [SerializeField]
    float[] sampledLengths;

    [SerializeField]
    private BezierControlPointMode[] modes;

    [SerializeField]
    private bool loop;

    [SerializeField]
    public List<Node> Nodes;

    public void Init()
    {
        Nodes = new List<Node>();
        GenerateSamples();
    }



    void GenerateSamples()
    {
        Vector3 prevPoint = points[0];
        Vector3 pt;
        float total = 0;

        List<float> samples = new List<float>(10);
        float step = 1.0f / 10.0f;
        for (float f = step; f < 1.0f; f += step)
        {
            pt = GetPoint(f);
            total += (pt - prevPoint).magnitude;

            if(total > 0)
            {
                samples.Add(total);
            }
            

            prevPoint = pt;
        }

        pt = GetPoint(1);
        samples.Add(total + (pt - prevPoint).magnitude);

        sampledLengths = samples.ToArray();
    }


    public bool Loop
    {
        get
        {
            return loop;
        }
        set
        {
            loop = value;
            if (value == true)
            {
                modes[modes.Length - 1] = modes[0];
                SetControlPoint(0, points[0]);
            }
        }
    }

    public int ControlPointCount
    {
        get
        {
            return points.Length;
        }
    }

    public Vector3 GetControlPoint(int index)
    {
        return points[index];
    }

    public void SetControlPoint(int index, Vector3 point)
    {
        if (index % 3 == 0)
        {
            Vector3 delta = point - points[index];
            if (loop)
            {
                if (index == 0)
                {
                    points[1] += delta;
                    points[points.Length - 2] += delta;
                    points[points.Length - 1] = point;
                }
                else if (index == points.Length - 1)
                {
                    points[0] = point;
                    points[1] += delta;
                    points[index - 1] += delta;
                }
                else
                {
                    points[index - 1] += delta;
                    points[index + 1] += delta;
                }
            }
            else
            {
                if (index > 0)
                {
                    points[index - 1] += delta;
                }
                if (index + 1 < points.Length)
                {
                    points[index + 1] += delta;
                }
            }
        }
        points[index] = point;
        EnforceMode(index);
    }

    public BezierControlPointMode GetControlPointMode(int index)
    {
        return modes[(index + 1) / 3];
    }

    public void SetControlPointMode(int index, BezierControlPointMode mode)
    {
        int modeIndex = (index + 1) / 3;
        modes[modeIndex] = mode;
        if (loop)
        {
            if (modeIndex == 0)
            {
                modes[modes.Length - 1] = mode;
            }
            else if (modeIndex == modes.Length - 1)
            {
                modes[0] = mode;
            }
        }
        EnforceMode(index);
    }

    private void EnforceMode(int index)
    {
        int modeIndex = (index + 1) / 3;
        BezierControlPointMode mode = modes[modeIndex];
        if (mode == BezierControlPointMode.Free || !loop && (modeIndex == 0 || modeIndex == modes.Length - 1))
        {
            return;
        }

        int middleIndex = modeIndex * 3;
        int fixedIndex, enforcedIndex;
        if (index <= middleIndex)
        {
            fixedIndex = middleIndex - 1;
            if (fixedIndex < 0)
            {
                fixedIndex = points.Length - 2;
            }
            enforcedIndex = middleIndex + 1;
            if (enforcedIndex >= points.Length)
            {
                enforcedIndex = 1;
            }
        }
        else
        {
            fixedIndex = middleIndex + 1;
            if (fixedIndex >= points.Length)
            {
                fixedIndex = 1;
            }
            enforcedIndex = middleIndex - 1;
            if (enforcedIndex < 0)
            {
                enforcedIndex = points.Length - 2;
            }
        }

        Vector3 middle = points[middleIndex];
        Vector3 enforcedTangent = middle - points[fixedIndex];
        if (mode == BezierControlPointMode.Aligned)
        {
            enforcedTangent = enforcedTangent.normalized * Vector3.Distance(middle, points[enforcedIndex]);
        }
        points[enforcedIndex] = middle + enforcedTangent;
    }

    public Vector3 GetPoint(float t)
    {
        int i;
        if (t >= 1f)
        {
            t = 1f;
            i = points.Length - 4;
        }
        else
        {
            t = Mathf.Clamp01(t) * CurveCount;
            i = (int)t;
            t -= i;
            i *= 3;
        }
        return transform.TransformPoint(Bezier.GetPoint(
            points[i], points[i + 1], points[i + 2], points[i + 3], t));
    }

    public OrientedPoint GetOrientedPoint(float t)
    {
        Vector3 tangent, normal;
        Quaternion orientation;

        int i;
        if (t >= 1f)
        {
            t = 1f;
            i = points.Length - 4;
        }
        else
        {
            t = Mathf.Clamp01(t) * CurveCount;
            i = (int)t;
            t -= i;
            i *= 3;
        }

        Vector3 point =  Bezier.GetPoint(
            points[i], points[i + 1], points[i + 2], points[i + 3], t, out tangent, out normal, out orientation);

        return new OrientedPoint(point, orientation, sampledLengths.Sample(t));
    }

    public Vector3 GetVelocity(float t)
    {
        int i;
        if (t >= 1f)
        {
            t = 1f;
            i = points.Length - 4;
        }
        else
        {
            t = Mathf.Clamp01(t) * CurveCount;
            i = (int)t;
            t -= i;
            i *= 3;
        }
        return transform.TransformPoint(Bezier.GetFirstDerivative(
            points[i], points[i + 1], points[i + 2], points[i + 3], t)) - transform.position;
    }

    public Vector3 GetDirection(float t)
    {
        return GetVelocity(t).normalized;
    }

    public void Reset()
    {
        points = new Vector3[] {
            new Vector3(1f, 0f, 0f),
            new Vector3(2f, 0f, 0f),
            new Vector3(3f, 0f, 0f),
            new Vector3(4f, 0f, 0f)
        };

        modes = new BezierControlPointMode[] {
            BezierControlPointMode.Free,
            BezierControlPointMode.Free
        };
    }

    public void AddCurve()
    {
        Vector3 point = points[points.Length - 1];
        Array.Resize(ref points, points.Length + 3);
        point.x += 1f;
        points[points.Length - 3] = point;
        point.x += 1f;
        points[points.Length - 2] = point;
        point.x += 1f;
        points[points.Length - 1] = point;

        Array.Resize(ref modes, modes.Length + 1);
        modes[modes.Length - 1] = modes[modes.Length - 2];
        EnforceMode(points.Length - 4);

        if (loop)
        {
            points[points.Length - 1] = points[0];
            modes[modes.Length - 1] = modes[0];
            EnforceMode(0);
        }
    }

    public int CurveCount
    {
        get
        {
            return (points.Length - 1) / 3;
        }
    }

    public IEnumerable<OrientedPoint> GeneratePath(float subDivisions)
    {
        float step = 1.0f / subDivisions;

        GenerateSamples();

        for (float f = 0; f < 1; f += step)
        {
            yield return GetOrientedPoint(f);
        }

        yield return GetOrientedPoint(1);
    }

    public void Extrude(Mesh mesh, ExtrudeShape shape, OrientedPoint[] path)
    {
        int vertsInShape = shape.Verts.Length;
        int segments = path.Length - 1;
        int edgeLoops = path.Length;
        int vertCount = vertsInShape * edgeLoops;
        int triCount = shape.Lines.Length * segments * 2;
        int triIndexCount = triCount * 3;

        int[] triangleIndices = new int[triIndexCount];
        Vector3[] vertices = new Vector3[vertCount];
        Vector3[] normals = new Vector3[vertCount];
        Vector2[] uvs = new Vector2[vertCount];

        // Generate all of the vertices and normals
        for (int i = 0; i < path.Length; i++)
        {
            int offset = i * vertsInShape;
            for (int j = 0; j < vertsInShape; j++)
            {
                int id = offset + j;
                vertices[id] = path[i].LocalToWorld(shape.Verts[j]);
                normals[id] = path[i].LocalToWorldDirection(shape.Normals[j]);
                uvs[id] = new Vector2(shape.UCoords[j], path[i].vCoordinate);
            }
        }

        // Generate all of the triangles
        int ti = 0;
        for (int i = 0; i < segments; i++)
        {
            int offset = i * vertsInShape;
            for (int l = 0; l < shape.Lines.Length; l += 2)
            {
                int a = offset + shape.Lines[l];
                int b = offset + shape.Lines[l] + vertsInShape;
                int c = offset + shape.Lines[l + 1] + vertsInShape;
                int d = offset + shape.Lines[l + 1];
                triangleIndices[ti++] = a;
                triangleIndices[ti++] = b;
                triangleIndices[ti++] = c;
                triangleIndices[ti++] = c;
                triangleIndices[ti++] = d;
                triangleIndices[ti++] = a;
            }
        }

        mesh.Clear();
        mesh.vertices = vertices;
        mesh.normals = normals;
        mesh.uv = uvs;
        mesh.triangles = triangleIndices;

        
    }
}




