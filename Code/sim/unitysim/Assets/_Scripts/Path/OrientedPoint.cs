﻿using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Class to represent a point with an orientation
/// </summary>
public class OrientedPoint
{
    public Vector3 position;
    public Quaternion rotation;
    public float vCoordinate;

    public OrientedPoint(Vector3 position, Quaternion rotation, float vCoordinate = 0)
    {
        this.position = position;
        this.rotation = rotation;
        this.vCoordinate = vCoordinate;
    }

    public Vector3 LocalToWorld(Vector3 point)
    {
        return position + rotation * point;
    }

    public Vector3 WorldToLocal(Vector3 point)
    {
        return Quaternion.Inverse(rotation) * (point - position);
    }

    public Vector3 LocalToWorldDirection(Vector3 dir)
    {
        return rotation * dir;
    }

}
