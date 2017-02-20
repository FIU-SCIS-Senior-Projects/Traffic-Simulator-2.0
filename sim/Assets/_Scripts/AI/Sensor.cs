using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Sensor : MonoBehaviour
{

    public bool SensorTrigger = false;

    public bool CheckFront(Vector3 forward)
    {
        return false;
    }

    public bool CheckBack(Vector3 back)
    {
        return false;
    }
}
