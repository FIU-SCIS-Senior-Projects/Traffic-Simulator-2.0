using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Class to drive a gameobject along a spline based path
/// </summary>
public class SplineWalker : MonoBehaviour
{
    public Edge Spline;
    public SplineWalkerMode Mode;

    public bool LookForward;

    public float Duration;
    public float Progress;

    public Vector3 CurrentDirection;

    public bool GoingForward = true;

    /// <summary>
    /// Each step of the path
    /// </summary>
    protected void Step()
    {
        if (GoingForward)
        {
            Progress += Time.deltaTime / Duration;
            if (Progress > 1f)
            {
                if (Mode == SplineWalkerMode.Once)
                {
                    Progress = 1f;
                }
                else if (Mode == SplineWalkerMode.Loop)
                {
                    Progress -= 1f;
                }
                else
                {
                    Progress = 2f - Progress;
                    GoingForward = false;
                }
            }
        }
        else
        {
            Progress -= Time.deltaTime / Duration;
            if (Progress < 0f)
            {
                Progress = 0;
            }
        }

        Vector3 position = Spline.GetPoint(Progress);
        position = new Vector3(position.x, position.y, 0); // for 2D
        transform.position = position;

        CurrentDirection = Spline.GetDirection(Progress);
        CurrentDirection = new Vector3(CurrentDirection.x, CurrentDirection.y, 0);

        Debug.DrawRay(transform.position, CurrentDirection);

        if (LookForward)
        {
            if(GoingForward)
            {
                Vector2 dir = Spline.GetDirection(Progress);
                float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
                transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);
            }
            else
            {
                Vector2 dir = Spline.GetDirection(Progress);
                dir = dir - 2 * dir;
                float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
                transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);
            }


        }
    }

    private void Update()
    {
        Step();
    }
}
