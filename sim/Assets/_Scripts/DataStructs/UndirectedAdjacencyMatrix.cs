using System.Collections;
using System.Collections.Specialized;
using UnityEngine;

/// <summary>
/// Class to represent an undirected(symmetric) adjacency matrix
/// </summary>
public class UndirectedAdjacencyMatrix
{
    // Uses a 1D vector to represent 1 half of the matrix (since its symmetric)
    protected int[] _matrixVector;

    /// <summary>
    /// Constructor
    /// </summary>
    public UndirectedAdjacencyMatrix(int N)
    {
        // Size of the 1D representation of the 2D matrix is (N*N-N)/2+N.
        int size1D = (N * N - N) / 2 + N;

        _matrixVector = new int[size1D];
    }

    /// <summary>
    /// Return the size of the MatrixVector
    /// </summary>
    /// <returns></returns>
    public int GetSize()
    {
        return _matrixVector.Length;
    }

    public void SetIndex(int index, int value)
    {
        _matrixVector[index] = value;
    }

    public int GetIndex(int index)
    {
        return _matrixVector[index];
    }

    /// <summary>
    /// Converts a 2D matrix index to a 1D vector index
    /// </summary>
    /// <param name="row"></param>
    /// <param name="col"></param>
    /// <param name="N"></param>
    /// <returns></returns>
    public int MatrixToVectorIndex(int row, int col, int N)
    {
        if (row <= col)
            return row * N - (row - 1) * ((row - 1) + 1) / 2 + col - row;


        return col * N - (col - 1) * ((col - 1) + 1) / 2 + row - col;
    }
}
