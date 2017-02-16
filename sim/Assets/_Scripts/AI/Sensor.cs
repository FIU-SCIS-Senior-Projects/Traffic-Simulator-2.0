using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Sensor : MonoBehaviour
{

    public bool SensorTrigger = false;

    private void OnTriggerEnter(Collider other)
    {
        SensorTrigger = true;
    }

    private void OnTriggerExit(Collider other)
    {
        SensorTrigger = false;
    }
}
