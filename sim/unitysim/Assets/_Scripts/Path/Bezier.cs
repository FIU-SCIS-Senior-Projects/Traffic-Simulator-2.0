using UnityEngine;

/// <summary>
/// Static Bezier class to handle common Bezier functions
/// </summary>
public static class Bezier
{
    public static Vector3 GetPoint(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t)
    {
        t = Mathf.Clamp01(t);
        float oneMinusT = 1f - t;
        return
            oneMinusT * oneMinusT * oneMinusT * p0 +
            3f * oneMinusT * oneMinusT * t * p1 +
            3f * oneMinusT * t * t * p2 +
            t * t * t * p3;
    }

    public static Vector3 GetPoint(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t,
                            out Vector3 tangent, out Vector3 normal, out Quaternion orientation)
    {
        t = Mathf.Clamp01(t);
        float oneMinusT = 1f - t;


        tangent = GetFirstDerivative(p0, p1, p2, p3, t);
        normal = GetNormal3D(p0, p1, p2, p3, t, new Vector3(0,0,-1));
        orientation = Quaternion.LookRotation(tangent, normal);

        return
            oneMinusT * oneMinusT * oneMinusT * p0 +
            3f * oneMinusT * oneMinusT * t * p1 +
            3f * oneMinusT * t * t * p2 +
            t * t * t * p3;
    }


    public static Vector3 GetFirstDerivative(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t)
    {
        t = Mathf.Clamp01(t);
        float oneMinusT = 1f - t;
        return
            3f * oneMinusT * oneMinusT * (p1 - p0) +
            6f * oneMinusT * t * (p2 - p1) +
            3f * t * t * (p3 - p2);
    }

    public static Vector3 GetNormal3D(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t, Vector3 up)
    {
        Vector3 tangent = GetFirstDerivative(p0, p1, p2, p3, t);
        Vector3 bNorm = Vector3.Cross(up, tangent);
        return Vector3.Cross(tangent, bNorm);
    }

    public static Quaternion GetOrientation3D(Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float t, Vector3 up)
    {
        Vector3 tangent = GetFirstDerivative(p0, p1, p2, p3, t);
        Vector3 normal = GetNormal3D(p0, p1, p2, p3, t, up);
        return Quaternion.LookRotation(tangent, normal);
    }
}