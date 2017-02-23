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
public class CarAI : PooledObject
{
    public float MaxSpeed;
    public float CautionSpeed;
    public float Acceleration;
    public float CautionDistance;

    public float StopDistance;
    public float LookDistance;
    public LayerMask CollisionDetectionLayer;
    public LayerMask NodeDetectionLayer;

    private bool Yielding;
    private bool AlreadyYielded;
    private Vector3 lastPosition;
    private SplineWalker Walker;
    public CarPather Pather;

    // For Object Pooling
    void OnLevelWasLoaded()
    {
        ReturnToPool();
    }

    public void Init()
    {
        Walker = GetComponent<SplineWalker>();
        Pather = GetComponent<CarPather>();
        Walker.Mode = SplineWalkerMode.Once;




        // This is hardcoded temporarily.  In future will get a duration based on the speed limit of the edge were on
        Walker.Duration = MaxSpeed;
        Yielding = false;
        lastPosition = gameObject.transform.position;
    }

    


    /// <summary>
    /// Called every frame
    /// </summary>
    protected void Update()
    {
        if (!Pather.PathReady)
            return;

        if (Pather.CurrentPathIndex == Pather.Path.Count)
        {
            if (Pather.GoingForward)
            {
                if (Walker.Progress == 1f)
                {
                    AlreadyYielded = false;
                    Pather.CurrentPathIndex = 0;
                    ReturnToPool();
                }
            }
            else
            {
                if (Walker.Progress == 0f)
                {
                    AlreadyYielded = false;
                    Pather.CurrentPathIndex = 0;
                    ReturnToPool();
                }
            }


        }
        else
        {
            if (Pather.GoingForward)
            {
                RayCastFrontEdge();

                if(Walker.Progress > 0.8f && !AlreadyYielded)
                {
                    if (!Yielding)
                    {

                        StartCoroutine("YieldIntersection", UnityEngine.Random.Range(3f, 5f));
                    }
                }

                Walker.LaneMultiplier = 0.15f;
                if (Walker.Progress == 1f)
                {
                    AlreadyYielded = false;
                    SetNextEdge(Pather.CurrentPathIndex);
                }
            }
            else
            {
                RayCastBackEdge();

                if (Walker.Progress < 0.2f && !AlreadyYielded)
                {
                    if (!Yielding)
                    {
                        
                        StartCoroutine("YieldIntersection", UnityEngine.Random.Range(3f, 5f));
                    }
                }

                Walker.LaneMultiplier = -0.15f;
                if (Walker.Progress == 0f)
                {
                    AlreadyYielded = false;
                    SetNextEdge(Pather.CurrentPathIndex);
                }
            }
        }

        Vector3 moveDirection = gameObject.transform.position - lastPosition;
        if (moveDirection != Vector3.zero)
        {
            float angle = Mathf.Atan2(moveDirection.y, moveDirection.x) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.AngleAxis(angle - 90f, Vector3.forward);
        }
        lastPosition = gameObject.transform.position;

    }

 


    /// <summary>
    /// Sets the next edge
    /// </summary>
    /// <param name="currentNodeIndex"></param>
    public void SetNextEdge(int currentNodeIndex)
    {
        Pather.CurrentNode = Pather.Path[currentNodeIndex];

        if(currentNodeIndex < Pather.Path.Count - 1)
        {
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
        Pather.CurrentPathIndex++;

    }



    private void RayCastFrontEdge()
    {
        RaycastHit hit;
        
        if (Physics.Raycast(gameObject.transform.position, Walker.Forward(), out hit, LookDistance, CollisionDetectionLayer))
        {
            CarAI RaycastHitAI = hit.transform.gameObject.GetComponent<CarAI>();
            if(RaycastHitAI != this)
            {
                //Debug.DrawLine(gameObject.transform.position, RaycastHitAI.transform.position, Color.red, LookDistance);
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

                    if(RaycastHitAI.Walker.Halt)
                    {
                        Walker.Halt = true;
                    }
                    else
                    {
                        if (!Yielding)
                        {
                            Walker.Halt = false;
                        }
                    }
                }
            }
            else
            {
                if(!Yielding)
                {
                    Walker.Halt = false;
                }
                
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
            if (!Yielding)
            {
                Walker.Halt = false;
            }
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

    private void RayCastBackEdge()
    {
        RaycastHit hit;

        if (Physics.Raycast(gameObject.transform.position, Walker.Back(), out hit, LookDistance, CollisionDetectionLayer))
        {

            CarAI RaycastHitAI = hit.transform.gameObject.GetComponent<CarAI>();
            if (RaycastHitAI != this)
            {
                //Debug.DrawLine(gameObject.transform.position, RaycastHitAI.transform.position, Color.red, LookDistance);
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
                    if (RaycastHitAI.Walker.Halt)
                    {
                        Walker.Halt = true;
                    }
                    else
                    {
                        if (!Yielding)
                        {
                            Walker.Halt = false;
                        }
                    }
                }
            }
            else
            {
                if (!Yielding)
                {
                    Walker.Halt = false;
                }
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
            if (!Yielding)
            {
                Walker.Halt = false;
            }
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







    private IEnumerator YieldIntersection(float duration)
    {
        Yielding = true;
        Walker.Halt = true;
        //Debug.Log("Yielding for " + duration + " seconds");
        yield return new WaitForSeconds(duration);
        Yielding = false;
        Walker.Halt = false;
        AlreadyYielded = true;
        yield return null;
    }




}
