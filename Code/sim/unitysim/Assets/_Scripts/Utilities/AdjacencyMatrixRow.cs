using System;
using System.Collections.Generic;

[Serializable]
public class AdjacencyMatrixRow
{
    public List<float> row;

    public AdjacencyMatrixRow()
    {
        row = new List<float>();
    }
}