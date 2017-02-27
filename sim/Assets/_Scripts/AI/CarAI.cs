using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Simple AI that moves through a list of waypoints until it reaches its final destination
/// </summary>
[RequireComponent(typeof(SplineWalker))]
[RequireComponent(typeof(CarPather))]
public class CarAI : PooledObject
{
    public float MaxSpeed;
    public float CautionSpeed;
    public float Acceleration;
    public float CautionDistance;
    public float CollisionDistance;
    public float LaneOffset;
    public float StopDistance;
    public float LookDistance;
    public LayerMask CollisionDetectionLayer;
    public LayerMask NodeDetectionLayer;
    public SplineWalker Walker;
    public CarPather Pather;
    public bool NonAPICar;

    private Vector3 lastPosition;
    private bool CheckingCollisions;

    public void Init()
    {
        Walker = GetComponent<SplineWalker>();
        Pather = GetComponent<CarPather>();

        Walker.Mode = SplineWalkerMode.Once;
        Pather.Init();

        Walker.Duration = MaxSpeed;
        lastPosition = gameObject.transform.position;

        Material mat = GetComponent<MeshRenderer>().material;
        if (NonAPICar)
        {
            mat.SetColor("_Color", Color.black);
        }

    }

    // For Object Pooling
    void OnLevelWasLoaded()
    {
        ReturnToPool();
    }

    /// <summary>
    /// Called every frame
    /// </summary>
    protected void Update()
    {
        if(Pather.Path == null)
        {
            return;
        }

        if(Walker.GoingForward)
        {
            Walker.LaneMultiplier = LaneOffset;

            if(Walker.Progress == 1f)
            {
                SetNextEdge(Pather.CurrentPathIndex);
            }
        }
        else
        {
            Walker.LaneMultiplier = -LaneOffset;

            if (Walker.Progress == 0f)
            {
                SetNextEdge(Pather.CurrentPathIndex);
            }
        }

        LookForward();
    }

    /// <summary>
    /// Forces the AI to look in the direction its moving
    /// </summary>
    private void LookForward()
    {
        Vector3 moveDirection = gameObject.transform.position - lastPosition;

        if (moveDirection != Vector3.zero)
        {
            float angle = Mathf.Atan2(moveDirection.y, moveDirection.x) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.AngleAxis(angle - 90f, Vector3.forward);
        }

        lastPosition = gameObject.transform.position;
    }


    /// <summary>
    /// Sets the next edge in the path
    /// </summary>
    /// <param name="currentNodeIndex"></param>
    public void SetNextEdge(int currentNodeIndex)
    {
        if (currentNodeIndex < Pather.Path.Count - 1)
        {
            Pather.CurrentNode = Pather.Path[currentNodeIndex];
            Pather.NextNode = Pather.Path[currentNodeIndex + 1];

            Walker.Spline = Pather.GetNextEdge();
            Walker.GoingForward = Pather.GoingForward;
            if (Pather.GoingForward)
            {
                Walker.Progress = 0f;
            }
            else
            {
                Walker.Progress = 1f;
            }
            Pather.CurrentPathIndex++;
        }
        else
        {
            ReturnToPool();
        }
    }
}
