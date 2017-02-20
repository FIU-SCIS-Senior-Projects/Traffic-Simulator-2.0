using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Simple AI that moves through a list of waypoints until it reaches its final destination
/// Uses colliders to detect when it has reached a waypoint
/// For now I am manually setting a path of up to 10 waypoints, but in future these waypoints would come from the output of the pathfinding algorithm
/// </summary>
[RequireComponent(typeof(SplineWalker))]
[RequireComponent(typeof(CarPather))]
public class CarAI : MonoBehaviour
{
    public float MaxSpeed;
    public float Acceleration;
    public float CautionDistance;
    public float StopDistance;
    public float LookDistance;
    public LayerMask CollisionDetectionLayer;
    public LayerMask NodeDetectionLayer;


    private SplineWalker Walker;
    private CarPather Pather;
    private BoxCollider Collider;
    private bool shouldAccelerate;


    private void Init()
    {
        Walker = GetComponent<SplineWalker>();
        Pather = GetComponent<CarPather>();
        Collider = GetComponent<BoxCollider>();
        Walker.Mode = SplineWalkerMode.Once;

        // This is hardcoded temporarily.  In future will get a duration based on the speed limit of the edge were on
        Walker.Duration = MaxSpeed;
        SetNextEdge(Pather.CurrentPathIndex);
    }

    /// <summary>
    /// Called once after Awake()
    /// </summary>
    protected void Start()
    {
        Init();

    }

    /// <summary>
    /// Called every frame
    /// </summary>
    protected void Update()
    {
        if (!Pather.PathReady)
            return;

        if (Pather.CurrentPathIndex == Pather.Path.Count-1)
        {
            Pather.CurrentPathIndex = 0;
            transform.position = Pather.Path[Pather.CurrentPathIndex].gameObject.transform.position;
        }

        if(Pather.GoingForward)
        {
            RayCastFront();
            Walker.LaneMultiplier = 0.15f;
            if (Walker.Progress == 1f)
            {
                SetNextEdge(Pather.CurrentPathIndex);

                Pather.CurrentPathIndex++;
            }
        }
        else
        {
            RayCastBack();
            Walker.LaneMultiplier = -0.15f;
            if (Walker.Progress == 0f)
            {
                SetNextEdge(Pather.CurrentPathIndex);

                Pather.CurrentPathIndex++;
            }
        }

        

    }

 


    /// <summary>
    /// Sets the next edge
    /// </summary>
    /// <param name="currentNodeIndex"></param>
    public void SetNextEdge(int currentNodeIndex)
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

    }



    private void RayCastFront()
    {
        RaycastHit hit;
        
        if (Physics.Raycast(gameObject.transform.position, Walker.Forward(), out hit, LookDistance, CollisionDetectionLayer))
        {
            CarAI RaycastHitAI = hit.transform.gameObject.GetComponent<CarAI>();
            if(RaycastHitAI != this)
            {
                Debug.DrawLine(gameObject.transform.position, RaycastHitAI.transform.position, Color.red, LookDistance);
                if (Vector3.Distance(transform.position, RaycastHitAI.transform.position) < CautionDistance)
                {
                    if(Walker.Duration < RaycastHitAI.Walker.Duration)
                    {
                        Walker.Duration += Acceleration;
                    }
                    else
                    {
                        Walker.Duration = MaxSpeed;
                    }
                }
                if (Vector3.Distance(transform.position, RaycastHitAI.transform.position) < StopDistance)
                {
                    if (Walker.Duration < RaycastHitAI.Walker.Duration)
                    {
                        Walker.Duration = RaycastHitAI.Walker.Duration;
                    }
                }
            }
            else
            {
                if (Walker.Duration > MaxSpeed)
                {
                    Walker.Duration -= Acceleration;
                }
                else
                {
                    Walker.Duration = MaxSpeed;
                }
            }
        }
        else
        {
            if(Walker.Duration > MaxSpeed)
            {
                Walker.Duration -= Acceleration;
            }
            else
            {
                Walker.Duration = MaxSpeed;
            }
        }
    }

    private void RayCastBack()
    {
        RaycastHit hit;
        
        if (Physics.Raycast(gameObject.transform.position, Walker.Back(), out hit, LookDistance, CollisionDetectionLayer))
        {
            
            CarAI RaycastHitAI = hit.transform.gameObject.GetComponent<CarAI>();
            if (RaycastHitAI != this)
            {
                Debug.DrawLine(gameObject.transform.position, RaycastHitAI.transform.position, Color.red, LookDistance);
                if (Vector3.Distance(transform.position, RaycastHitAI.transform.position) < CautionDistance)
                {
                    if (Walker.Duration < RaycastHitAI.Walker.Duration)
                    {
                        Walker.Duration += Acceleration;
                    }
                    else
                    {
                        Walker.Duration = MaxSpeed;
                    }
                }
                if (Vector3.Distance(transform.position, RaycastHitAI.transform.position) < StopDistance)
                {
                    if (Walker.Duration < RaycastHitAI.Walker.Duration)
                    {
                        Walker.Duration = RaycastHitAI.Walker.Duration;
                    }
                }
            }
            else
            {
                if (Walker.Duration > MaxSpeed)
                {
                    Walker.Duration -= Acceleration;
                }
                else
                {
                    Walker.Duration = MaxSpeed;
                }
            }
        }
        else
        {
            if (Walker.Duration > MaxSpeed)
            {
                Walker.Duration -= Acceleration;
            }
            else
            {
                Walker.Duration = MaxSpeed;
            }
        }
    }





    
}
